import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch all profiles, optionally filter by role
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    
    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, email, friction_capacity } = body;

    if (!role || !name || !email) {
      return NextResponse.json({ error: 'Missing required fields: role, name, email' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ role, name, email, friction_capacity: friction_capacity || 0 }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
