import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;

  let q = supabase.from('venues').select('id,name,address,city').order('name');
  if (city) q = q.eq('city', city);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
