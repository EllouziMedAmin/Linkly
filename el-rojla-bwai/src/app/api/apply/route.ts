import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { sendApplicationEmail } from '@/lib/email';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST: Submit a new application
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { team_name, contact_email, team_size, linkedin_url, founder_experience, pitch_text, custom_responses, programme_id } = body;

    if (!team_name || !contact_email || !pitch_text) {
      return NextResponse.json({
        error: 'Missing required fields: team_name, contact_email, pitch_text'
      }, { status: 400 });
    }

    // 1. Check if programme exists and has capacity
    let progId = programme_id;
    let programmeRequirements = '';
    let approvalMode = 'auto';
    let customFieldsDef: any[] = [];
    if (progId) {
      const { data: prog, error: progErr } = await supabase
        .from('programmes')
        .select('id, name, capacity, requirements, approval_mode, custom_fields')
        .eq('id', progId)
        .single();

      if (progErr || !prog) {
        return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
      }

      if (prog.requirements) {
        programmeRequirements = prog.requirements;
      }
      if (prog.approval_mode) {
        approvalMode = prog.approval_mode;
      }
      if (prog.custom_fields) {
        customFieldsDef = prog.custom_fields;
      }

      // Check capacity
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('programme_id', progId)
        .eq('status', 'accepted');

      if (count !== null && prog.capacity && count >= prog.capacity) {
        return NextResponse.json({
          success: false,
          error: `Programme "${prog.name}" is full (${prog.capacity}/${prog.capacity} accepted).`,
          status_message: 'Programme has reached maximum capacity.'
        }, { status: 409 });
      }
    }

    // 2. Check for duplicate application
    const dupQuery = supabase
      .from('applications')
      .select('id, status')
      .eq('contact_email', contact_email.toLowerCase().trim());
    
    if (progId) dupQuery.eq('programme_id', progId);

    const { data: existing } = await dupQuery.limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: `You have already applied with this email. Your current status: ${existing[0].status.toUpperCase()}.`,
        application_id: existing[0].id,
        status: existing[0].status,
      }, { status: 409 });
    }

    // 3. AI Evaluation with Gemini
    console.log(`🧠 AI screening application from ${team_name}...`);

    // Format custom responses for the prompt and database
    let formattedCustomResponses = '';
    let dbCustomResponses: Record<string, string> = {};
    if (custom_responses && Object.keys(custom_responses).length > 0 && customFieldsDef.length > 0) {
      formattedCustomResponses = '\\n--- Custom Form Responses ---\\n';
      customFieldsDef.forEach(field => {
        const val = custom_responses[field.id];
        if (val) {
          formattedCustomResponses += `${field.label}: "${val}"\\n`;
          dbCustomResponses[field.label] = val; // Use label for admin readability
        }
      });
    }

    const prompt = `
      You are the El-Rojla-Bwai AI Screening Agent for a tech accelerator competition.
      Evaluate the following application and provide a structured assessment.

      Team Name: "${team_name}"
      Team Size: ${team_size || 'Not specified'}
      LinkedIn Profile: "${linkedin_url || 'Not provided'}"
      Founder Experience/CV: "${founder_experience || 'Not provided'}"
      
      Application/Pitch Text:
      "${pitch_text}"
      ${formattedCustomResponses}

      ${programmeRequirements ? `CRITICAL PROGRAMME REQUIREMENTS:
      The applicant MUST meet the following specific requirements for this programme:
      """
      ${programmeRequirements}
      """
      If the pitch does NOT clearly meet these requirements, you must penalize the ai_score heavily (score below 40) and state why in your reasoning.` : ''}

      Evaluate based on:
      1. Clarity and quality of the idea/pitch (is it well-structured?)
      2. Team readiness (does the size/approach seem reasonable?)
      3. Innovation potential (is this original or generic?)
      4. Feasibility (can they actually build this?)
      5. Market relevance (does this solve a real problem?)

      Respond ONLY with a valid JSON object, no markdown or extra text:
      {
        "ai_score": 75,
        "friction_score": 4,
        "tags": ["FinTech", "AI", "B2B"],
        "strengths": ["Clear value proposition", "Strong team background"],
        "weaknesses": ["No revenue model mentioned", "Unclear timeline"],
        "reasoning": "A 2-3 sentence summary of the overall quality and recommendation.",
        "auto_decision": "accept"
      }

      RULES for ai_score (0-100):
      - 80-100: Exceptional, auto-accept recommended
      - 60-79: Good, manual review recommended  
      - 40-59: Average, likely waitlist
      - 0-39: Below standard, likely reject

      For auto_decision: "accept" if score >= 80, "review" if 60-79, "waitlist" if 40-59, "reject" if < 40
    `;

    let aiResult = {
      ai_score: 50,
      friction_score: 5,
      tags: [],
      strengths: [],
      weaknesses: [],
      reasoning: 'AI evaluation pending.',
      auto_decision: 'review',
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let text = response.text || '{}';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      aiResult = JSON.parse(text);
    } catch (parseErr) {
      console.error('AI parse error, using defaults:', parseErr);
    }

    // 4. Determine initial status based on AI score
    let autoStatus: string = 'pending';
    if (approvalMode === 'auto') {
      if (aiResult.ai_score >= 80) autoStatus = 'accepted';
      else if (aiResult.ai_score < 40) autoStatus = 'rejected';
    }

    // 5. Insert application
    const { data: application, error: insertErr } = await supabase
      .from('applications')
      .insert([{
        programme_id: progId || null,
        team_name: team_name.trim(),
        contact_email: contact_email.toLowerCase().trim(),
        team_size: team_size || 1,
        linkedin_url: linkedin_url?.trim() || '',
        founder_experience: founder_experience?.trim() || '',
        pitch_text: pitch_text.trim(),
        custom_responses: dbCustomResponses,
        ai_score: aiResult.ai_score,
        ai_reasoning: aiResult.reasoning,
        friction_score: aiResult.friction_score,
        ai_tags: aiResult.tags || [],
        status: autoStatus,
        reviewed_at: autoStatus !== 'pending' ? new Date().toISOString() : null,
      }])
      .select()
      .single();

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to save application: ' + insertErr.message }, { status: 500 });
    }

    // --- SEND EMAILS ---
    // 1. Send receipt email
    await sendApplicationEmail(contact_email, team_name, 'received');

    // 2. If auto-decided by AI, send the decision email right away
    if (autoStatus !== 'pending') {
      await sendApplicationEmail(contact_email, team_name, autoStatus as any, aiResult.ai_score, aiResult.reasoning);
    }
    // -------------------

    // 6. If accepted, also create a profile so they can be matched
    if (autoStatus === 'accepted') {
      await supabase
        .from('profiles')
        .insert([{
          role: 'company',
          name: team_name.trim(),
          email: contact_email.toLowerCase().trim(),
          friction_capacity: aiResult.friction_score,
        }]);
    }

    return NextResponse.json({
      success: true,
      application_id: application.id,
      status: autoStatus,
      ai_evaluation: {
        score: aiResult.ai_score,
        reasoning: aiResult.reasoning,
        tags: aiResult.tags,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        decision: autoStatus,
      },
      message: autoStatus === 'accepted'
        ? '🎉 Congratulations! Your application has been automatically accepted based on AI evaluation.'
        : autoStatus === 'rejected'
        ? 'Unfortunately, your application did not meet the minimum requirements. You may re-apply with a stronger pitch.'
        : 'Your application is under review. Check back soon for updates.',
    });

  } catch (error: any) {
    console.error('Apply Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: List all applications (for admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const programmeId = searchParams.get('programme_id');

    let query = supabase
      .from('applications')
      .select('*')
      .order('ai_score', { ascending: false });

    if (status) query = query.eq('status', status);
    if (programmeId) query = query.eq('programme_id', programmeId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
