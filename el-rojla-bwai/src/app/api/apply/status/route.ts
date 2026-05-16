import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Check application status by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: applications, error } = await supabase
      .from('applications')
      .select('id, team_name, status, ai_score, ai_reasoning, ai_tags, created_at, reviewed_at, programme_id')
      .eq('contact_email', email.toLowerCase().trim())
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!applications || applications.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No application found with this email address.',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      applications: applications.map(app => ({
        id: app.id,
        team_name: app.team_name,
        status: app.status,
        score: app.ai_score,
        reasoning: app.ai_reasoning,
        tags: app.ai_tags,
        applied_at: app.created_at,
        reviewed_at: app.reviewed_at,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
