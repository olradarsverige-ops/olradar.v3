
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request){
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;
  const sort = searchParams.get('sort') || 'cheapest';

  let vq = supabase.from('venues').select('id,name,city,address').order('name');
  if(city) vq = vq.eq('city', city);
  const { data: venues, error: ve } = await vq;
  if(ve) return NextResponse.json({ error: ve.message }, { status: 500 });
  if(!venues) return NextResponse.json([]);

  const results:any[] = [];
  for(const v of venues){
    const { data: prices } = await supabase
      .from('prices')
      .select('price_sek, rating, verified, photo_url, created_at, beers(name,style)')
      .eq('venue_id', v.id)
      .order('created_at', { ascending: false })
      .limit(3);
    const deals = (prices||[]).map(p => ({
      beer: (p as any).beers?.name,
      style: (p as any).beers?.style,
      price: p.price_sek,
      rating: p.rating ?? 0,
      verified: p.verified,
      updatedAt: p.created_at,
      photo_url: (p as any).photo_url ?? null
    }));
    results.push({ ...v, deals });
  }

  if(sort === 'cheapest'){
    results.sort((a,b)=>{
      const aa = Math.min(...(a.deals?.length? a.deals.map((d:any)=>d.price) : [Infinity]));
      const bb = Math.min(...(b.deals?.length? b.deals.map((d:any)=>d.price) : [Infinity]));
      return aa - bb;
    });
  }
  return NextResponse.json(results);
}
