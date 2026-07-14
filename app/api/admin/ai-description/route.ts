import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini, GeminiError } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
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

    let description: string;
    try {
      description = await generateWithGemini({ prompt, temperature: 0.7, maxOutputTokens: 256 });
    } catch (geminiErr: any) {
      if (geminiErr instanceof GeminiError) {
        return NextResponse.json(
          { error: `AI generation failed: ${geminiErr.message}`, description: fallbackDescription(productName) },
          { status: geminiErr.status >= 400 && geminiErr.status < 500 ? 400 : 502 }
        );
      }
      return NextResponse.json({ description: fallbackDescription(productName) });
    }

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error('AI description error:', error);
    return NextResponse.json({ description: fallbackDescription('this product') });
  }
}

function fallbackDescription(productName: string): string {
  return `Crafted with care at Edau Farm, ${productName} is a quality choice for customers who value freshness, reliability, and farm-to-table goodness.`;
}
