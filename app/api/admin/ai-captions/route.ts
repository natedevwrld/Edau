import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import CaptionHistory from '@/lib/models/CaptionHistory';
import Profile from '@/lib/models/Profile';
import { generateWithGemini, GeminiError, GEMINI_MODEL } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

// GET: return saved caption history, latest first, so admins can reuse
// previous generations instead of re-calling the model (saves tokens).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const profile = await Profile.findOne({ id: session.user.id }).lean();
    if ((profile as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const history = await CaptionHistory.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      history: (history || []).map((h: any) => ({
        _id: h._id,
        productName: h.productName,
        productDescription: h.productDescription,
        style: h.style,
        audience: h.audience,
        additionalNotes: h.additionalNotes,
        captions: h.captions,
        aiModel: h.aiModel,
        createdAt: h.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to load caption history', message: error.message },
      { status: 500 }
    );
  }
}

const stylePrompts: Record<string, string> = {
  market: 'Create an inviting market-day caption that makes customers want to buy right now. Focus on freshness and availability.',
  story: 'Tell a compelling story about the product journey from farm to table. Emphasize the care and traditional methods used.',
  seasonal: 'Highlight the seasonal nature of the product. Create urgency around limited availability during this harvest season.',
  benefit: 'Focus on health benefits, nutritional value, and wellness aspects. Appeal to health-conscious buyers.',
  tradition: 'Emphasize heritage farming practices, cultural significance, and traditional methods passed down through generations.',
};

const audiencePrompts: Record<string, string> = {
  families: 'Target health-conscious parents and families who want quality, safe, and nutritious food for their children.',
  chefs: 'Target professional chefs and restaurants looking for premium quality ingredients and unique local products.',
  farmers: 'Target fellow farmers and agricultural enthusiasts interested in breeding stock, farming methods, and quality livestock.',
  wholesale: 'Target bulk buyers, distributors, and businesses looking for reliable supply and competitive pricing.',
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productName, productDescription, style, audience, additionalNotes } = body;

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    const stylePrompt = stylePrompts[style] || stylePrompts.market;
    const audiencePrompt = audiencePrompts[audience] || audiencePrompts.families;

    const prompt = `You are a marketing expert for Edau Farm, a sustainable farm in West Pokot, Kenya that produces premium honey, fresh fruits, livestock, and poultry. The farm was established in 2015 and practices traditional, sustainable farming methods.

Generate 3 unique marketing captions for the following product. Each caption should be compelling, authentic, and suitable for social media (Facebook, WhatsApp status, or Instagram).

Product: ${productName}
${productDescription ? `Description: ${productDescription}` : ''}
Style: ${stylePrompt}
Target Audience: ${audiencePrompt}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

Guidelines:
- Keep captions between 100-200 characters for best social media visibility
- Use authentic, warm language that reflects a family farm
- Include relevant emojis where natural (honey, fruits, vegetables, livestock, farm)
- Avoid excessive exclamation marks or hype
- Make it relatable to Kenyan customers
- Include 3-5 relevant hashtags at the end

Return the response as a JSON array with 3 objects, each containing:
{
  "caption": "the marketing caption text",
  "hashtags": ["array", "of", "hashtags"]
}

Only return the JSON array, no other text.`;

    let textResponse: string;
    try {
      textResponse = await generateWithGemini({ prompt, temperature: 0.8, maxOutputTokens: 1024 });
    } catch (geminiErr: any) {
      if (geminiErr instanceof GeminiError) {
        return NextResponse.json(
          { error: `AI generation failed: ${geminiErr.message}` },
          { status: geminiErr.status >= 400 && geminiErr.status < 500 ? 400 : 502 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to generate captions. Please try again.' },
        { status: 500 }
      );
    }

    let captions: { caption: string; hashtags: string[] }[] = [];
    try {
      const cleanedResponse = textResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsed = JSON.parse(cleanedResponse);
      captions = Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', textResponse);
      captions = [
        {
          caption: `${productName} is freshly harvested and ready to delight your customers.`,
          hashtags: ['#EdauFarm', '#FreshFromFarm', '#KenyaFarm'],
        },
        {
          caption: `Bring home ${productName} from Edau Farm and enjoy quality you can taste and trust.`,
          hashtags: ['#FarmToTable', '#SustainableFarming', '#EdauFarm'],
        },
        {
          caption: `Choose ${productName} for a premium farm experience rooted in care, quality, and tradition.`,
          hashtags: ['#WestPokot', '#LocalProduce', '#FreshProduce'],
        },
      ];
    }

    return NextResponse.json({ captions, historyId: await saveHistory({
      userId: session.user.id,
      productName,
      productDescription,
      style: style || 'market',
      audience: audience || 'families',
      additionalNotes,
      captions,
    }) });
  } catch (error: any) {
    console.error('AI captions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate captions. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}

async function saveHistory(entry: {
  userId: string;
  productName: string;
  productDescription?: string;
  style: string;
  audience: string;
  additionalNotes?: string;
  captions: { caption: string; hashtags: string[] }[];
}): Promise<string | null> {
  try {
    await dbConnect();
    const doc = await CaptionHistory.create({ ...entry, aiModel: GEMINI_MODEL });
    return doc._id?.toString() || null;
  } catch (err) {
    console.error('Failed to persist caption history:', err);
    return null;
  }
}
