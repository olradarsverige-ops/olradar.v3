import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

function slugify(s: string){
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    let venueId = String(form.get('venueId') || '');
    const venueName = String(form.get('venueName') || '');
    const city = String(form.get('city') || '');
    const beer = String(form.get('beer') || '');
    const style = String(form.get('style') || '');
    const price = Number(form.get('price') || 0);
    const rating = Number(form.get('rating') || 0);
    const verified = String(form.get('verified') || '0') === '1';
    const photo = form.get('photo') as File | null;

    if (!venueId && !venueName) {
      return NextResponse.json({ error: 'venueId or venueName required' }, { status: 400 });
    }
    if (!beer || !price) {
      return NextResponse.json({ error: 'beer and price required' }, { status: 400 });
    }

    // Create venue if user typed a new one
    if (!venueId && venueName) {
      const newId = 'user-' + slugify(venueName).slice(0,40);
      const { data: vData, error: vErr } = await supabase
        .from('venues')
        .upsert({ id: newId, name: venueName, city, country: 'SE', open_now: true })
        .select('id')
        .single();
      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });
      venueId = vData.id;
    }

    // Ensure beer exists (unique name)
    const beerId = 'beer-' + slugify(beer).slice(0,48);
    const { error: bErr } = await supabase
      .from('beers')
      .upsert({ id: beerId, name: beer, style });
    if (bErr && !String(bErr.message).includes('duplicate')) {
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    // Optional photo upload to 'photos' bucket
    let photo_url: string | null = null;
    if (photo && photo.size > 0) {
      const ext = (photo.type && photo.type.includes('png')) ? 'png'
        : (photo.type && photo.type.includes('webp')) ? 'webp'
        : 'jpg';
      const path = `${venueId}/${Date.now()}-${slugify(beer)}.${ext}`;
      const ab = await photo.arrayBuffer();
      const { error: upErr } = await supabase.storage.from('photos').upload(path, new Uint8Array(ab), {
        contentType: photo.type || 'image/jpeg',
        upsert: false
      });
      if (!upErr) {
        const { data: pub } = supabase.storage.from('photos').getPublicUrl(path);
        photo_url = pub?.publicUrl || null;
      }
    }

    // Insert price
    const priceId = 'p_' + Math.random().toString(36).slice(2, 10);
    const { error: pErr } = await supabase.from('prices').insert({
      id: priceId,
      venue_id: venueId,
      beer_id: beerId,
      price_original: price,
      price_sek: price,
      currency: 'SEK',
      rating,
      verified,
      photo_url
    });
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, id: priceId, photo_url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 });
  }
}
