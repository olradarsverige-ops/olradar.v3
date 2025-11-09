
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request){
  try{
    const form = await req.formData();
    const venueId = String(form.get('venueId') || '');
    const beer = String(form.get('beer') || '');
    const style = String(form.get('style') || '');
    const price = Number(form.get('price') || 0);
    const rating = Number(form.get('rating') || 0);
    const verified = String(form.get('verified') || '0') === '1';
    const file = form.get('photo') as File | null;

    if(!venueId || !beer || !price) return NextResponse.json({ error:'Missing fields' }, { status: 400 });

    const beerId = 'beer-' + beer.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    await supabase.from('beers').upsert({ id: beerId, name: beer, style });

    let photo_url: string | null = null;
    if(file && file.size > 0){
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'photos';
      const arrayBuffer = await file.arrayBuffer();
      const filename = `${venueId}/${Date.now()}-${file.name.replace(/[^a-z0-9\.\-]/gi,'_')}`;
      const { data: up, error: upErr } = await (supabase.storage.from(bucket).upload(filename, Buffer.from(arrayBuffer), {
        contentType: file.type, upsert: true
      }) as any);
      if(!upErr){
        const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
        photo_url = data.publicUrl;
      }
    }

    const priceId = 'price-' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
    const { error: insErr } = await supabase.from('prices').insert({
      id: priceId,
      venue_id: venueId,
      beer_id: beerId,
      price_original: price,
      currency: 'SEK',
      price_sek: price,
      rating,
      verified,
      photo_url: photo_url
    });
    if(insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, photo_url });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 });
  }
}
