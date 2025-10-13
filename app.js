// app.js — list-first behavior, per-user requirements

const sampleData = [
  { "fiscal": "NELSON CAJAS", "fiscalia": "MELIPILLA", "telefono": "+56 9 9456 1658", "email": "NCAJAS@MINPUBLICO.CL", "lat": -33.69125249814863, "lng": -71.21412774386494 },
  { "fiscal": "JOSE MANUEL MACNAMARA", "fiscalia": "SAN MIGUEL", "telefono": "+56990473445", "email": "", "lat": -33.489214312077706, "lng": -70.6507789557856 },
  { "fiscal": "RODRIGO TALA MASAFIERRO", "fiscalia": "CENTRO NORTE", "telefono": "+56995552458", "email": "", "lat": -33.47335075577229, "lng": -70.65679515038968 },
  { "fiscal": "MARCO NUÑEZ", "fiscalia": "SUR", "telefono": "+56990473601", "email": "", "lat": -33.50158481526036, "lng": -70.65413225431585 },
  { "fiscal": "MARIA JOSE PAREDES", "fiscalia": "SUR", "telefono": "+56944985690", "email": "", "lat": -33.50158481526036, "lng": -70.65413225431585 },
  { "fiscal": "ERNESTO GONZALEZ DURAN", "fiscalia": "SACFI, CENTRO NORTE", "telefono": "+56959659499", "email": "", "lat": -33.47335075577229, "lng": -70.65679515038968 },
  { "fiscal": "MANUEL ZUÑIGA RODRIGUEZ", "fiscalia": "CENTRO NORTE", "telefono": "+56991599354", "email": "", "lat": -33.47335075577229, "lng": -70.65679515038968 },
  { "fiscal": "ARTURO RODRIGUEZ", "fiscalia": "TALAGANTE", "telefono": "+56994839723", "email": "", "lat": -33.669774037815756, "lng": -70.93925979416282 },
  { "fiscal": "OSCAR BERMUDEZ", "fiscalia": "CENTRO NORTE", "telefono": "+56996192125", "email": "", "lat": -33.47335075577229, "lng": -70.65679515038968 },
  { "fiscal": "PATRICIO ROSAS", "fiscalia": "OCCIDENTE", "telefono": "+56992177962", "email": "", "lat": -33.44586120921946, "lng": -70.74101625497043 },
  { "fiscal": "JAVIERA INOSTROZA D", "fiscalia": "SAN BERNARDO", "telefono": "+56229656135", "email": "JINOSTROZAD@MINPUBLICO.CL", "lat": -33.59544104254351, "lng": -70.71009133344263 }
];

let data = [];

(async function(){
  try{
    const resp = await fetch('data/fiscalias.json');
    if(resp && resp.ok){
      data = await resp.json();
      console.log('Loaded data/fiscalias.json ->', Array.isArray(data) ? data.length : 'not array');
    } else throw new Error('data file not found or not OK');
  } catch(err){
    console.warn('Using sampleData due to load error:', err);
    data = sampleData;
  }

  // normalize phone fields
  data = (data || []).map(rec => {
    const raw = rec.telefono || '';
    const digits = String(raw).replace(/[^0-9]/g,'');
    let wa = '';
    if(digits.startsWith('56')) wa = digits;
    else if(digits.startsWith('9')) wa = '56' + digits;
    else if(digits.startsWith('0')) wa = '56' + digits.replace(/^0+/, '');
    else if(digits.length >= 8 && digits.length <= 11) wa = digits;
    return Object.assign({}, rec, { telefono_raw: raw, telefono_clean: digits, telefono_wa: wa });
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// map
let map, markers = [];
function initMap(){
  map = L.map('map').setView([-33.45, -70.667], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OSM' }).addTo(map);
}
function clearMarkers(){ markers.forEach(m=>{ try{ map.removeLayer(m); }catch(e){} }); markers = []; }

// helpers
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c])); }
function formatDisplayPhone(clean){
  if(!clean) return '';
  if(clean.startsWith('56')){
    const rest = clean.slice(2);
    if(rest.length === 9 && rest.startsWith('9')) return '+56 '+rest.slice(0,1)+' '+rest.slice(1,5)+' '+rest.slice(5);
    if(rest.length === 8) return '+56 '+rest.slice(0,1)+' '+rest.slice(1,4)+' '+rest.slice(4);
    return '+'+clean;
  } else if(clean.length === 9 && clean.startsWith('9')){
    return '+56 '+clean.slice(0,1)+' '+clean.slice(1,5)+' '+clean.slice(5);
  }
  return '+'+clean;
}
function sortByFiscalia(arr){ return (arr || []).slice().sort((a,b)=>{ const A=(a.fiscalia||'').toLowerCase(); const B=(b.fiscalia||'').toLowerCase(); return A < B ? -1 : (A > B ? 1 : 0); }); }

// render list with actions (all entries included; duplicates shown)
function createListItem(item){
  const li = document.createElement('div'); li.className = 'item';
  const title = '<h3>'+escapeHtml(item.fiscalia)+'</h3>';
  const fiscal = '<p><strong>Fiscal:</strong> '+escapeHtml(item.fiscal || '')+'</p>';
  const comuna = '<strong>Comuna:</strong> '+escapeHtml(item.comuna || '—');
  const telefonoText = item.telefono_clean ? '<strong>Teléfono:</strong> '+formatDisplayPhone(item.telefono_clean) : '<strong>Teléfono:</strong> —';
  const emailHtml = item.email ? ' • <a href="mailto:'+escapeHtml(item.email)+'">'+escapeHtml(item.email)+'</a>' : '';
  // actions
  const wa = item.telefono_wa ? '<a class="wa" href="https://wa.me/'+item.telefono_wa+'?text='+encodeURIComponent('Hola '+(item.fiscal||''))+'" target="_blank">WhatsApp</a>' : '';
  const mail = item.email ? '<a href="mailto:'+escapeHtml(item.email)+'">Correo</a>' : '';
  const maps = (item.lat!=null && item.lng!=null) ? '<a href="https://www.google.com/maps/search/?api=1&query='+item.lat+','+item.lng+'" target="_blank">Google Maps</a>' : '';
  const copy = item.telefono_clean ? '<a class="copy-phone" href="#" data-phone="'+item.telefono_clean+'">Copiar teléfono</a>' : '';
  const actions = '<div class="list-actions">'+[wa, mail, maps, copy].filter(Boolean).join(' ')+'</div>';

  li.innerHTML = title + fiscal + '<p>'+comuna+' • '+telefonoText+emailHtml+'</p>' + actions;
  // clicking the item centers map if coords exist
  li.addEventListener('click', (ev)=>{
    // avoid triggering when clicking action links
    if(ev.target && (ev.target.tagName === 'A' || ev.target.closest('a'))) return;
    if(item.lat != null && item.lng != null){
      // ensure map visible briefly then set view
      // if map is hidden, show map, center, then hide again after (or keep hidden per UX)
      // We'll center map but not toggle visibility here
      try{ map.setView([item.lat, item.lng], 14); }catch(e){ console.warn('map.setView failed', e); }
    }
  });
  return li;
}

function renderList(filtered){
  const list = document.getElementById('list'); list.innerHTML = '';
  if(!filtered || !filtered.length){ list.innerHTML = '<div class="small">No se encontraron resultados</div>'; return; }
  const sorted = sortByFiscalia(filtered);
  sorted.forEach(item => {
    const el = createListItem(item);
    list.appendChild(el);
  });
}

function renderMarkers(filtered){
  clearMarkers();
  (filtered || []).forEach(item=>{
    if(item && item.lat != null && item.lng != null){
      try{
        const m = L.marker([item.lat, item.lng]).addTo(map);
        // reuse popup html from list actions (but simpler)
        const wa = item.telefono_wa ? '<a class="wa" href="https://wa.me/'+item.telefono_wa+'?text='+encodeURIComponent('Hola '+(item.fiscal||''))+'" target="_blank">WhatsApp</a>' : '';
        const mail = item.email ? '<a href="mailto:'+escapeHtml(item.email)+'">Correo</a>' : '';
        const maps = '<a href="https://www.google.com/maps/search/?api=1&query='+item.lat+','+item.lng+'" target="_blank">Google Maps</a>';
        const copy = item.telefono_clean ? '<a class="copy-phone" href="#" data-phone="'+item.telefono_clean+'">Copiar teléfono</a>' : '';
        const html = '<div style="min-width:200px"><strong>'+escapeHtml(item.fiscalia)+'</strong><div><strong>Fiscal:</strong> '+escapeHtml(item.fiscal||'—')+'</div><div class="popup-actions">'+[wa, mail, maps, copy].filter(Boolean).join(' ')+'</div></div>';
        m.bindPopup(html);
        markers.push(m);
      }catch(e){ console.warn('marker failed', e, item); }
    }
  });
}

function populateComunas(){
  const set = new Set((data || []).map(d => d.comuna).filter(Boolean));
  const sel = document.getElementById('comunaFilter');
  sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
  Array.from(set).sort().forEach(c=>{ const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt); });
}

function applyFilters(){
  const q = (document.getElementById('search').value || '').toLowerCase().trim();
  const comuna = document.getElementById('comunaFilter').value;
  const filtered = (data || []).filter(d=>{
    const matchQ = !q || ((d.fiscalia||'').toLowerCase().includes(q) || (d.fiscal||'').toLowerCase().includes(q) || (d.comuna||'').toLowerCase().includes(q));
    const matchComuna = !comuna || d.comuna === comuna;
    return matchQ && matchComuna;
  });

  const isListMode = document.getElementById('tabList').classList.contains('active');
  if(isListMode){
    renderList(filtered);
    // keep markers updated but do not show map (mapPane may be hidden)
    renderMarkers(filtered);
  } else {
    // show map mode -> render markers and fit bounds
    renderMarkers(filtered);
    const coords = (filtered || []).filter(f=>f && f.lat!=null && f.lng!=null).map(f=>[f.lat,f.lng]);
    if(coords.length){
      try{ map.fitBounds(coords, { maxZoom: 14 }); } catch(e){ console.warn('fitBounds failed', e); map.setView([-33.45,-70.667], 10); }
    } else map.setView([-33.45,-70.667], 10);
  }
}

// UI toggles: show/hide panes
function showListMode(){
  document.getElementById('tabList').classList.add('active');
  document.getElementById('tabMap').classList.remove('active');
  document.getElementById('leftPane').classList.remove('collapsed');
  document.getElementById('mapPane').classList.add('collapsed');
  // refresh list & ensure markers are prepared (but map hidden)
  applyFilters();
}
function showMapMode(){
  document.getElementById('tabMap').classList.add('active');
  document.getElementById('tabList').classList.remove('active');
  document.getElementById('leftPane').classList.add('collapsed');
  document.getElementById('mapPane').classList.remove('collapsed');
  setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} applyFilters(); }, 120);
}

function init(){
  // map init but keep mapPane hidden initially
  initMap();

  if(!data || !data.length) data = sampleData;
  populateComunas();
  renderList(data);
  renderMarkers(data);

  // events
  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('comunaFilter').addEventListener('change', applyFilters);

  document.getElementById('tabList').addEventListener('click', showListMode);
  document.getElementById('tabMap').addEventListener('click', showMapMode);

  // default: show list only
  showListMode();

  // copy handler for 'copy-phone' links both in list and popups
  document.addEventListener('click', function(e){
    const el = e.target.closest && e.target.closest('.copy-phone');
    if(!el) return;
    e.preventDefault();
    const phone = el.getAttribute('data-phone');
    if(!phone) return;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(phone).then(()=>{ alert('Teléfono copiado: '+phone); }).catch(()=>{ alert('No se pudo copiar'); });
    } else {
      // fallback
      const ta = document.createElement('textarea'); ta.value = phone; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); alert('Teléfono copiado: '+phone); }catch(e){ alert('No se pudo copiar'); }
      document.body.removeChild(ta);
    }
  });

  // initial map view bounds (if any coords)
  const initialCoords = (data || []).filter(f=> f && f.lat != null && f.lng != null).map(f=>[f.lat,f.lng]);
  if(initialCoords.length){
    try{ map.fitBounds(initialCoords, { maxZoom: 12 }); }catch(e){ map.setView([-33.45, -70.667], 10); }
  } else map.setView([-33.45, -70.667], 10);
}
