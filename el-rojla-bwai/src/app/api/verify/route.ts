import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { companyName, pitchDeckText } = await request.json();

    if (!companyName || !pitchDeckText) {
      return NextResponse.json({ error: 'Missing companyName or pitchDeckText' }, { status: 400 });
    }

    console.log(`🧠 Verifying application for ${companyName}...`);

    const prompt = `
      You are the El-Rojla-Bwai Autonomous Verification Agent.
      Analyze the following text extracted from a startup's pitch deck.
      
      Your job is to:
      1. Verify the clarity of the business model.
      2. Assess the realism of their milestones.
      3. Identify the startup's core industry and needs.
      4. Assign a "Friction Score" from 1 to 10 (1 = extremely clear and organized, 10 = highly chaotic and confusing).
      
      Pitch Deck Text:
      "${pitchDeckText}"

      Respond ONLY with a valid JSON object in this exact format, no extra text or markdown:
      {
        "friction_score": 5,
        "industry": "FinTech",
        "core_needs": ["Fundraising", "Product Development"],
        "analysis_summary": "A short 2-sentence explanation of why they received this friction score and what they need."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let verificationResult;
    try {
      verificationResult = JSON.parse(text);
    } catch {
      console.error("Failed to parse Gemini response:", text);
      verificationResult = {
        friction_score: 5,
        industry: "Unknown",
        core_needs: [],
        analysis_summary: "AI analysis could not be parsed. Default friction score assigned."
      };
    }

    // Check for duplicate email
    const email = `${companyName.replace(/\s+/g, '').toLowerCase()}@ecosystem.ai`;
    
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Company "${companyName}" is already registered.`,
        ai_verification: verificationResult,
      }, { status: 409 });
    }

    // Save the new company to Supabase
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert([
        {
          role: 'company',
          name: companyName,
          email,
          friction_capacity: verificationResult.friction_score,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Insert Error:", error);
      return NextResponse.json({ error: 'Failed to save profile to database: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newProfile,
      ai_verification: verificationResult,
    });

  } catch (error: any) {
    console.error('Verification Agent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
