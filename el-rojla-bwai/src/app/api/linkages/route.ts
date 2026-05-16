import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all linkages with joined profile names
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('linkages')
      .select(`
        id,
        programme_id,
        entity_a_id,
        entity_b_id,
        status,
        friction_allocation,
        dna_fingerprint,
        health_score,
        success_score,
        grant_lock_status,
        created_at,
        updated_at,
        entity_a:profiles!linkages_entity_a_id_fkey(id, name, role, email, friction_capacity),
        entity_b:profiles!linkages_entity_b_id_fkey(id, name, role, email, friction_capacity)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Clear all linkages (for demo reset)
export async function DELETE() {
  try {
    const { error } = await supabase
      .from('linkages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'All linkages cleared.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
