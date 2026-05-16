import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST: JSON response for inline dashboard updates
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linkage_id, status } = body;

    if (!linkage_id || !status) {
      return NextResponse.json({ error: 'Missing linkage_id or status' }, { status: 400 });
    }

    if (!['green', 'yellow', 'red'].includes(status)) {
      return NextResponse.json({ error: 'Status must be green, yellow, or red' }, { status: 400 });
    }

    // 1. Fetch current linkage
    const { data: linkage, error: fetchErr } = await supabase
      .from('linkages')
      .select('health_score, grant_lock_status')
      .eq('id', linkage_id)
      .single();

    if (fetchErr || !linkage) {
      return NextResponse.json({ error: 'Linkage not found' }, { status: 404 });
    }

    // 2. Adjust health score based on pulse
    let currentHealth = linkage.health_score;
    if (status === 'green') currentHealth = Math.min(100, currentHealth + 5);
    if (status === 'yellow') currentHealth = Math.max(0, currentHealth - 10);
    if (status === 'red') currentHealth = Math.max(0, currentHealth - 20);

    // 3. Autonomous Governance — Cradle Grant Lock
    const isLocked = currentHealth < 50;

    // 4. Determine linkage lifecycle status
    let linkageStatus = 'active';
    if (currentHealth < 30) linkageStatus = 'flagged';
    if (currentHealth === 0) linkageStatus = 'failed';

    // 5. Update in database
    const { data: updated, error: updateErr } = await supabase
      .from('linkages')
      .update({
        health_score: currentHealth,
        grant_lock_status: isLocked,
        status: linkageStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkage_id)
      .select(`
        id,
        health_score,
        grant_lock_status,
        status,
        friction_allocation,
        entity_a:profiles!linkages_entity_a_id_fkey(name),
        entity_b:profiles!linkages_entity_b_id_fkey(name)
      `)
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      data: updated,
      governance: {
        health_score: currentHealth,
        grant_locked: isLocked,
        status: linkageStatus,
      },
    });
  } catch (error: any) {
    console.error("Pulse Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: HTML response for email 1-click links (no login required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const linkageId = searchParams.get('linkage_id');
    const status = searchParams.get('status');

    if (!linkageId || !status) {
      return new NextResponse('Missing parameters: linkage_id and status required', { status: 400 });
    }

    // Fetch current health
    const { data: linkage, error: fetchErr } = await supabase
      .from('linkages')
      .select('health_score')
      .eq('id', linkageId)
      .single();

    if (fetchErr || !linkage) {
      return new NextResponse('Linkage not found', { status: 404 });
    }

    let currentHealth = linkage.health_score;
    if (status === 'green') currentHealth = Math.min(100, currentHealth + 5);
    if (status === 'yellow') currentHealth = Math.max(0, currentHealth - 10);
    if (status === 'red') currentHealth = Math.max(0, currentHealth - 20);

    const isLocked = currentHealth < 50;

    await supabase
      .from('linkages')
      .update({
        health_score: currentHealth,
        grant_lock_status: isLocked,
        status: currentHealth < 30 ? 'flagged' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', linkageId);

    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Pulse Recorded — El-Rojla-Bwai</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0a0a0a; color: white; }
            .card { background: #171717; padding: 3rem 2rem; border-radius: 16px; border: 1px solid #262626; max-width: 420px; text-align: center; }
            h1 { color: #10b981; font-size: 1.5rem; margin-bottom: 1rem; }
            .health { font-size: 3rem; font-weight: bold; margin: 1rem 0; }
            .health.good { color: #10b981; }
            .health.warning { color: #fbbf24; }
            .health.critical { color: #f43f5e; }
            p { color: #a3a3a3; line-height: 1.6; }
            .alert { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); color: #f43f5e; padding: 1rem; border-radius: 8px; margin-top: 1.5rem; font-size: 0.85rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✓ Feedback Recorded</h1>
            <p>Your pulse check has been securely recorded.</p>
            <div class="health ${currentHealth >= 80 ? 'good' : currentHealth >= 50 ? 'warning' : 'critical'}">
              ${currentHealth}%
            </div>
            <p>Current Linkage Health Score</p>
            ${isLocked ? '<div class="alert">⚠️ ALERT: Cradle Grant Tranche has been <strong>automatically paused</strong> due to critical health score (&lt;50%).</div>' : ''}
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    console.error("Pulse GET Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
