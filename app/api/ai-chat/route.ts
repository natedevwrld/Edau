import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';
import AIUsageLog from '@/lib/models/AIUsageLog';
import { normalizeProductPayload } from '@/lib/utils';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are Edau, the personal AI shopping and support assistant for Edau Farm — a sustainable family farm in West Pokot, Kenya that sells premium honey, fresh fruit, livestock, poultry, and farm produce.

You are an intelligent, one-on-one assistant (NOT a static help page and NOT a "contact us" form). You talk directly with the shopper like a knowledgeable farm concierge. Be warm, friendly, concise, and genuinely helpful. You can:
- Recommend products based on what the customer wants, their budget, or the occasion.
- Search the live catalogue, check categories, and surface current bestsellers using your tools.
- Answer questions about products, farming practices, delivery, payments, and orders.
- Help the customer find the best deal or the right quantity.

When you use a tool to fetch products, present 2-4 relevant options in a friendly way and invite a follow-up. Never invent product names or prices that were not returned by a tool. If you are unsure, ask a short clarifying question. Keep replies short and scannable, and use emojis sparingly.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search the live Edau Farm product catalogue by keyword and optional category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: { type: 'STRING', description: 'Free-text search term, e.g. "honey", "chicken", "avocado".' },
            category: { type: 'STRING', description: 'Optional category name to narrow results.' },
            limit: { type: 'NUMBER', description: 'Max number of products to return (default 6).' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_categories',
        description: 'List the product categories available at Edau Farm.',
        parameters: { type: 'OBJECT', properties: {} },
      },
      {
        name: 'get_bestsellers',
        description: 'Return the current top-rated / most popular products.',
        parameters: {
          type: 'OBJECT',
          properties: { limit: { type: 'NUMBER', description: 'Max products to return (default 6).' } },
        },
      },
    ],
  },
];

function geminiContents(messages: ChatMessage[]) {
  const parts: any[] = [];
  for (const m of messages) {
    if (m.role === 'system') continue;
    parts.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }
  return parts;
}

async function searchProducts(query: string, category?: string, limit = 6) {
  await dbConnect();
  let q: any = Product.find({ is_in_stock: true });
  const term = (query || '').trim();
  if (term) {
    q = q.where({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { tags: { $in: [term] } },
      ],
    });
  }
  if (category && category !== 'All') {
    q = q.where('category').equals(category);
  }
  const products = await q.sort({ rating_count: -1 }).limit(limit).lean();
  return (products || []).map((p: any) => normalizeProductPayload(p));
}

async function getCategories() {
  await dbConnect();
  const cats = await Category.find({ is_active: true }).sort({ display_order: 1 }).lean();
  const names = (cats || []).map((c: any) => c.name);
  return names.length ? names : ['Honey', 'Fruits', 'Livestock', 'Poultry', 'Vegetables', 'Dairy'];
}

async function getBestsellers(limit = 6) {
  await dbConnect();
  const products = await Product.find({ is_in_stock: true })
    .sort({ rating_count: -1, rating_avg: -1 })
    .limit(limit)
    .lean();
  return (products || []).map((p: any) => normalizeProductPayload(p));
}

async function callGemini(contents: any[]) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents,
      tools: TOOLS,
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${err}`);
  }
  return res.json();
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body.messages) ? body.messages : [];
    const sessionId: string = body.sessionId || 'anonymous';

    if (!messages.length || !messages[messages.length - 1].content?.trim()) {
      return NextResponse.json({ error: 'A message is required.' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;

    let contents = geminiContents(messages);
    let replyText = '';
    const productResults: any[] = [];
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    // Agentic loop: allow up to 4 tool round-trips.
    for (let turn = 0; turn < 4; turn++) {
      const data = await callGemini(contents);
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      if (data.usageMetadata) {
        usage = {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata.totalTokenCount || 0,
        };
      }

      const functionCall = parts.find((p: any) => p.functionCall);
      if (!functionCall) {
        replyText = parts.map((p: any) => p.text || '').join('').trim();
        break;
      }

      const { name, args } = functionCall.functionCall;
      let toolOutput: any = {};
      try {
        if (name === 'search_products') {
          const result = await searchProducts(args.query, args.category, Number(args.limit) || 6);
          toolOutput = { count: result.length, products: result };
          productResults.push(...result);
        } else if (name === 'get_categories') {
          toolOutput = { categories: await getCategories() };
        } else if (name === 'get_bestsellers') {
          const result = await getBestsellers(Number(args.limit) || 6);
          toolOutput = { count: result.length, products: result };
          productResults.push(...result);
        } else {
          toolOutput = { error: 'Unknown tool.' };
        }
      } catch (toolErr: any) {
        toolOutput = { error: toolErr.message || 'Tool failed.' };
      }

      contents.push({ role: 'model', parts: [functionCall] });
      contents.push({
        role: 'function',
        parts: [{ functionResponse: { name, response: toolOutput } }],
      });
    }

    if (!replyText) {
      replyText =
        'I can help you find products, check what’s in season, or answer questions about Edau Farm. What are you looking for today?';
    }

    // Deduplicate product results by id.
    const seen = new Set();
    const uniqueProducts = productResults.filter((p: any) => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    try {
      await dbConnect();
      await AIUsageLog.create({
        userId,
        sessionId,
        feature: 'chat',
        aiModel: MODEL,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
      });
    } catch (logErr) {
      console.error('Failed to log AI usage:', logErr);
    }

    return NextResponse.json({ reply: replyText, products: uniqueProducts.slice(0, 8) });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'I had trouble responding just now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
