import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: List all programmes
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('programmes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new programme
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, status: progStatus, requirements, capacity, approval_mode, custom_fields } = body;

    if (!name) {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('programmes')
      .insert([{ 
        name, 
        status: progStatus || 'active',
        requirements: requirements || '',
        capacity: capacity || 100,
        approval_mode: approval_mode || 'auto',
        custom_fields: custom_fields || []
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
