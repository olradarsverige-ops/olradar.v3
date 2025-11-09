import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city') || undefined;
  const sort = searchParams.get('sort') || 'standard';

  let q = supabase.from('vw_nearby').select('*');
  if (city) q = q.eq('city', city);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const shaped = (data || []).map((row: any) => {
    const deals = Array.isArray(row.deals) ? row.deals.slice(0,3).map((d:any)=> ({
      beer: d.beer,
      style: d.style,
      price: Number(d.price),
      rating: Number(d.rating ?? 0),
      updatedAt: d.updatedAt,
      verified: d.verified ?? false,
      photo_url: d.photo_url ?? null
    })) : [];
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      address: row.address ?? null,
      open_now: row.openNow ?? true,
      deals
    };
  });

  if (sort === 'cheapest') {
    shaped.sort((a:any,b:any)=>{
      const ap = a.deals?.length ? Math.min(...a.deals.map((d:any)=>d.price)) : Number.POSITIVE_INFINITY;
      const bp = b.deals?.length ? Math.min(...b.deals.map((d:any)=>d.price)) : Number.POSITIVE_INFINITY;
      return ap - bp;
    });
  }

  return NextResponse.json(shaped);
}
