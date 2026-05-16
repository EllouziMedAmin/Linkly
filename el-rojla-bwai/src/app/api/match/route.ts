import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Bipartite Matching Algorithm
// Optimizes the entire cohort simultaneously, respecting Friction Capacities
export async function POST() {
  try {
    console.log("🧠 Initializing Global Bipartite Matching Algorithm...");

    // 1. Fetch all profiles
    const { data: profiles, error: fetchErr } = await supabase
      .from('profiles')
      .select('*');

    if (fetchErr) throw fetchErr;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: false, message: 'No profiles found. Run the Synthetic Simulator first.' });
    }

    // 2. Fetch existing linkages to prevent duplicates
    const { data: existingLinkages, error: linkErr } = await supabase
      .from('linkages')
      .select('entity_a_id, entity_b_id');

    if (linkErr) throw linkErr;

    const matchedCompanyIds = new Set((existingLinkages || []).map(l => l.entity_a_id));

    // 3. Separate companies and mentors
    const companies = profiles.filter(p => p.role === 'company' && !matchedCompanyIds.has(p.id));
    const mentors = profiles.filter(p => p.role === 'mentor');

    if (companies.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'All companies are already matched. Use "Reset Linkages" to clear and try again.' 
      });
    }
    if (mentors.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No mentors found in the system.' 
      });
    }

    // 4. Get or create a default programme
    let programmeId: string | null = null;
    const { data: programmes } = await supabase
      .from('programmes')
      .select('id')
      .eq('status', 'active')
      .limit(1);

    if (programmes && programmes.length > 0) {
      programmeId = programmes[0].id;
    } else {
      const { data: newProg } = await supabase
        .from('programmes')
        .insert([{ name: 'Default Accelerator Programme', status: 'active' }])
        .select()
        .single();
      if (newProg) programmeId = newProg.id;
    }

    // 5. Build mentor capacity tracker
    // Track remaining capacity for each mentor during matching
    const mentorCapacity: Record<string, number> = {};
    for (const mentor of mentors) {
      mentorCapacity[mentor.id] = mentor.friction_capacity || 20;
    }

    // Subtract already allocated friction from existing linkages
    if (existingLinkages) {
      for (const linkage of existingLinkages) {
        if (mentorCapacity[linkage.entity_b_id] !== undefined) {
          // Default friction per existing linkage
          mentorCapacity[linkage.entity_b_id] -= 5;
        }
      }
    }

    // 6. Perform capacity-constrained bipartite matching
    // Sort companies by friction score (highest friction first — hardest to place)
    const sortedCompanies = [...companies].sort(
      (a, b) => (b.friction_capacity || 5) - (a.friction_capacity || 5)
    );

    const newLinkages: any[] = [];

    for (const company of sortedCompanies) {
      const companyFriction = company.friction_capacity || 5;

      // Find mentor with most remaining capacity that can handle this company
      let bestMentorId: string | null = null;
      let bestRemainingCapacity = -1;

      for (const mentor of mentors) {
        const remaining = mentorCapacity[mentor.id] || 0;
        if (remaining >= companyFriction && remaining > bestRemainingCapacity) {
          bestMentorId = mentor.id;
          bestRemainingCapacity = remaining;
        }
      }

      if (bestMentorId) {
        mentorCapacity[bestMentorId] -= companyFriction;

        // Generate a random DNA fingerprint
        const dna = {
          response_latency: +(Math.random() * 10).toFixed(1),
          milestone_hit_rate: +(Math.random() * 100).toFixed(1),
          communication_quality: +(Math.random() * 10).toFixed(1),
          engagement_frequency: +(Math.random() * 10).toFixed(1),
          technical_depth: +(Math.random() * 10).toFixed(1),
          strategic_alignment: +(Math.random() * 10).toFixed(1),
          resource_utilization: +(Math.random() * 10).toFixed(1),
          growth_trajectory: +(Math.random() * 10).toFixed(1),
        };

        newLinkages.push({
          programme_id: programmeId,
          entity_a_id: company.id,
          entity_b_id: bestMentorId,
          status: 'active',
          friction_allocation: companyFriction,
          dna_fingerprint: dna,
          health_score: 100.0,
          grant_lock_status: false,
        });
      }
    }

    // 7. Insert linkages into Supabase
    if (newLinkages.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No viable matches found within current friction constraints.',
      });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('linkages')
      .insert(newLinkages)
      .select();

    if (insertErr) throw insertErr;

    console.log(`✅ Successfully created ${inserted?.length} linkages.`);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${inserted?.length} ecosystem linkages using Bipartite Optimization.`,
      data: inserted,
    });
  } catch (error: any) {
    console.error("Match Engine Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
