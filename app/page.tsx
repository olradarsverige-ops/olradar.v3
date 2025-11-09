'use client';
import { useEffect, useMemo, useState } from 'react';

type Deal = { beer:string; style:string; price:number; rating:number; updatedAt?:string; verified?:boolean; photo_url?:string|null };
type Venue = { id:string; name:string; city:string; address?:string|null; lat?:number|null; lng?:number|null; open_now?:boolean; deals?:Deal[] };

const UI = {
  page:{ background:'#f3f5f7', minHeight:'100dvh', color:'#111827' as const },
  shell:{ maxWidth:980, margin:'0 auto', padding:'20px 12px' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12 },
  select:{ background:'#fff', color:'#111827', border:'1px solid #d1d5db', padding:'10px 12px', borderRadius:12 } as React.CSSProperties,
  input:{ background:'#fff', color:'#111827', border:'1px solid #d1d5db', padding:'12px 14px', borderRadius:12, width:'100%' } as React.CSSProperties,
  card:{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:14, padding:12, boxShadow:'0 1px 2px rgba(0,0,0,.04)' } as React.CSSProperties,
  tag:{ padding:'2px 8px', borderRadius:999, background:'#eef6ff', border:'1px solid #bfdbfe', fontSize:12, color:'#1e40af' }
};

const CITIES = ['Helsingborg','Stockholm','Göteborg','Malmö'] as const;
type SortMode = 'standard' | 'cheapest';

export default function Page(){
  const [city, setCity] = useState<string>('Helsingborg');
  const [sort, setSort] = useState<SortMode>('cheapest');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  async function load(){
    setLoading(true);
    const url = new URL('/api/nearby', window.location.origin);
    url.searchParams.set('sort', sort === 'cheapest' ? 'cheapest' : 'standard');
    if(city) url.searchParams.set('city', city);
    const res = await fetch(url.toString(), { cache:'no-store' });
    const data = await res.json();
    setVenues(data || []);
    setLoading(false);
  }

  useEffect(()=>{ load(); }, [city, sort]);

  const filtered = useMemo(()=>{
    const t = q.trim().toLowerCase();
    if(!t) return venues;
    return venues.filter(v => (v.name + ' ' + (v.address||'')).toLowerCase().includes(t));
  }, [venues, q]);

  return (
    <div style={UI.page}>
      <div style={UI.shell}>
        <div style={UI.header}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <img src="/beer/foam-1.png" alt="Öl" width={36} height={36} style={{borderRadius:10, objectFit:'cover'}} />
            <div>
              <div style={{fontWeight:700}}>Ölradar</div>
              <div style={{fontSize:12, color:'#6b7280'}}>Billigast först · {city}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <select value={city} onChange={e=>setCity(e.target.value)} style={UI.select}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={e=>setSort(e.target.value as SortMode)} style={UI.select}>
              <option value="standard">Standard</option>
              <option value="cheapest">Billigast</option>
            </select>
            <button onClick={()=>setOpen(true)} style={{padding:'10px 14px', borderRadius:12, background:'#065f46', color:'#fff', border:'none', fontWeight:600}}>+ Logga öl</button>
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <input placeholder="Sök ställe eller stad" value={q} onChange={e=>setQ(e.target.value)} style={UI.input} />
        </div>

        {loading && <div style={{opacity:.7}}>Laddar…</div>}

        <div style={{display:'grid', gap:12}}>
          {filtered.map(v => (
            <div key={v.id} style={UI.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                <div>
                  <div style={{fontWeight:600}}>{v.name}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>{v.city}{v.address ? ' · ' + v.address : ''}</div>
                </div>
                {!!v.deals?.length && (
                  <div style={{fontWeight:700, color:'#0ea5e9'}}>
                    {Math.min(...v.deals.map(d=>d.price))} kr
                  </div>
                )}
              </div>
              {v.deals && v.deals.length>0 && (
                <div style={{display:'flex', gap:8, overflowX:'auto', marginTop:10, paddingBottom:4}}>
                  {v.deals.map((d, i) => (
                    <div key={i} style={{minWidth:220, border:'1px solid #e5e7eb', borderRadius:10, padding:8, display:'grid', gridTemplateColumns:'56px 1fr', gap:8}}>
                      <img src={(d as any).photo_url ?? '/beer-fallback.png'} alt="beer" width={56} height={56} style={{borderRadius:8, objectFit:'cover'}} />
                      <div>
                        <div style={{fontWeight:600}}>{d.beer}</div>
                        <div style={{fontSize:12, color:'#6b7280'}}>{d.style}</div>
                        <div style={{marginTop:4, fontWeight:700}}>{d.price} kr</div>
                        <div style={{fontSize:12}}>⭐ {d.rating ?? 0}</div>
                        {(d as any).verified && <span style={{...UI.tag, marginTop:6, display:'inline-block'}}>Verifierad</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!filtered.length && !loading && <div style={{opacity:.7}}>Inga fynd ännu. Gör första loggen!</div>}
        </div>

        <div style={{textAlign:'center', fontSize:12, color:'#6b7280', padding:'32px 0'}}>© 2025 Ölradar</div>
      </div>

      {open && <LogModal city={city} onClose={()=>setOpen(false)} onSaved={()=>{ setOpen(false); load(); }} />}
    </div>
  );
}

function LogModal({ city, onClose, onSaved }:{ city:string; onClose:()=>void; onSaved:()=>void }){
  const [venues, setVenues] = useState<{id:string;name:string;}[]>([]);
  const [venueId, setVenueId] = useState<string>('');
  const [beer, setBeer] = useState('');
  const [style, setStyle] = useState('Lager');
  const [price, setPrice] = useState<number>(59);
  const [rating, setRating] = useState<number>(4);
  const [verified, setVerified] = useState<boolean>(false);
  const [photo, setPhoto] = useState<File|null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    (async()=>{
      const url = new URL('/api/venues', window.location.origin);
      url.searchParams.set('city', city);
      const res = await fetch(url.toString());
      const data = await res.json();
      setVenues(data || []);
      if (data?.[0]?.id) setVenueId(data[0].id);
    })();
  },[city]);

  async function save(){
    setSaving(true);
    const body = new FormData();
    body.append('venueId', venueId);
    body.append('beer', beer);
    body.append('style', style);
    body.append('price', String(price));
    body.append('rating', String(rating));
    body.append('verified', verified ? '1':'0');
    if (photo) body.append('photo', photo);
    const res = await fetch('/api/log', { method:'POST', body });
    setSaving(false);
    if (res.ok) onSaved();
    else alert('Kunde inte spara.');
  }

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,.35)', display:'grid', placeItems:'center', padding:12, zIndex:50}}>
      <div style={{width:'100%', maxWidth:640, background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div style={{fontWeight:700}}>Logga en öl</div>
          <button onClick={onClose} aria-label="Stäng" style={{border:'none', background:'transparent', fontSize:18}}>×</button>
        </div>

        <div style={{display:'grid', gap:10}}>
          <select value={venueId} onChange={e=>setVenueId(e.target.value)} style={UI.select}>
            {venues.map((v:any)=> <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input placeholder="Ölnamn (ex. Mariestads)" value={beer} onChange={e=>setBeer(e.target.value)} style={UI.input} />
          <select value={style} onChange={e=>setStyle(e.target.value)} style={UI.select}>
            {['Lager','IPA','Pilsner','Stout','Wheat','Pale Ale'].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input type="number" min={20} max={200} value={price} onChange={e=>setPrice(parseInt(e.target.value||'0'))} style={{...UI.input, width:120}} />
            <div>kr</div>
            <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:6}}>
              <span>⭐</span>
              <input type="range" min={0} max={5} step={0.5} value={rating} onChange={e=>setRating(parseFloat(e.target.value))} />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>
          <div onDragOver={e=>{e.preventDefault();}} onDrop={e=>{e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setPhoto(f);}} style={{padding:12, border:'1px dashed #9ca3af', borderRadius:10}}>
            <input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0] || null)} />
            <div style={{fontSize:12, color:'#6b7280'}}>Tips: dra & släpp en bild här – vi nedsamplar i backend.</div>
          </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:12}}>
          <button onClick={onClose} style={{padding:'10px 12px', borderRadius:10, border:'1px solid #d1d5db', background:'#fff'}}>Avbryt</button>
          <button onClick={save} disabled={saving} style={{padding:'10px 14px', borderRadius:10, background:'#065f46', color:'#fff', border:'none', fontWeight:700}}>{saving?'Sparar…':'Spara'}</button>
        </div>
      </div>
    </div>
  );
}
