import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { productName, category, originFarm, unitType } = body;

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const prompt = `You are an ecommerce copywriter for Edau Farm, a sustainable farm in West Pokot, Kenya. Write one polished product description in a warm, customer-friendly tone for a product listing. The description should be 2-4 sentences, mention the product type, quality, and the farm origin naturally, and sound authentic for Kenyan buyers. Keep it concise and suitable for an online store.

Product Name: ${productName}
Category: ${category || 'General'}
Origin Farm: ${originFarm || 'Edau Farm'}
Unit Type: ${unitType || 'piece'}

Return only the description text, no bullets, and no extra commentary.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!textResponse) {
      throw new Error('No description generated');
    }

    return NextResponse.json({ description: textResponse });
  } catch (error) {
    const fallback = `Crafted with care at Edau Farm, this product is a quality choice for customers who value freshness, reliability, and farm-to-table goodness.`;
    return NextResponse.json({ description: fallback });
  }
}
