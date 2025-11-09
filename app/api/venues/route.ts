
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;
  let query = supabase.from('venues').select('id,name,city,address').order('name');
  if(city) query = query.eq('city', city);
  const { data, error } = await query;
  if(error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
