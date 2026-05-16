import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendApplicationEmail } from '@/lib/email';

// PATCH: Admin accepts/rejects/waitlists an application
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { application_id, decision } = body;

    if (!application_id || !decision) {
      return NextResponse.json({ error: 'Missing application_id or decision' }, { status: 400 });
    }

    if (!['accepted', 'rejected', 'waitlisted'].includes(decision)) {
      return NextResponse.json({ error: 'Decision must be: accepted, rejected, or waitlisted' }, { status: 400 });
    }

    // 1. Fetch the application
    const { data: app, error: fetchErr } = await supabase
      .from('applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 2. Update status
    const { data: updated, error: updateErr } = await supabase
      .from('applications')
      .update({
        status: decision,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', application_id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 3. If accepted, create a profile (if not already exists)
    if (decision === 'accepted') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', app.contact_email)
        .limit(1);

      if (!existingProfile || existingProfile.length === 0) {
        await supabase.from('profiles').insert([{
          role: 'company',
          name: app.team_name,
          email: app.contact_email,
          friction_capacity: app.friction_score || 5,
        }]);
      }
    }

    // 4. If rejected/waitlisted, remove profile if it was auto-created
    if (decision === 'rejected') {
      await supabase.from('profiles').delete().eq('email', app.contact_email);
    }

    // 5. Send Email
    await sendApplicationEmail(app.contact_email, app.team_name, decision as any, app.ai_score, app.ai_reasoning);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Application ${decision} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
