// app.js
// Lógica principal de la PWA Fiscales RM

// Datos de ejemplo (fallback)
const sampleData = [
  { "fiscalia": "Fiscalía La Florida / Peñalolén / Macul", "comuna": "La Florida", "fiscal": "Christian Zapata Godoy", "email": "czapata@minpublico.cl", "telefono": "", "lat": -33.47, "lng": -70.599 },
  { "fiscalia": "Fiscalía San Bernardo", "comuna": "San Bernardo", "fiscal": "Erwin Turra Soto", "email": "eturra@minpublico.cl", "telefono": "", "lat": -33.604, "lng": -70.848 }
];

let data = [];

// Carga de data: intenta 'data/fiscalias.json' (ruta relativa) y si falla usar sampleData
(async function(){
  try{
    const resp = await fetch('data/fiscalias.json');
    if(resp && resp.ok){
      data = await resp.json();
      console.log('Loaded data/fiscalias.json', Array.isArray(data) ? data.length : 'not array');
    } else {
      throw new Error('data file not found or not OK');
    }
  } catch(err) {
    console.warn('Could not load data/fiscalias.json, falling back to sampleData:', err);
    data = sampleData;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Mapa y utilidades
let map, markers = [];

function initMap(){
  map = L.map('map').setView([-33.45, -70.667], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '&copy; OSM'}).addTo(map);
}

function clearMarkers(){
  markers.forEach(m => {
    try{ map.removeLayer(m); }catch(e){}
  });
  markers = [];
}

function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&"'<>]/g, c => ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'}[c]));
}

function createPopupHtml(item){
  const email = item.email ? '<a href="mailto:'+escapeHtml(item.email)+'">Enviar correo</a>' : '';
  const cleanPhone = (item.telefono || '').replace(/[^0-9]/g,'');
  const waPart = cleanPhone ? '<a class="wa" href="https://wa.me/'+cleanPhone+'?text='+encodeURIComponent('Hola '+(item.fiscal||''))+'" target="_blank">WhatsApp</a>' : '';
  const html = '<div style="min-width:180px"><strong>'+escapeHtml(item.fiscalia)+'</strong>'+
               '<div><strong>Fiscal:</strong> '+escapeHtml(item.fiscal || '—')+'</div>'+
               '<div><strong>Comuna:</strong> '+escapeHtml(item.comuna || '—')+'</div>'+
               '<div>'+email+'</div>'+
               '<div class="popup-actions">'+waPart+'</div></div>';
  return html;
}

function renderList(filtered){
  const list = document.getElementById('list');
  list.innerHTML = '';
  if(!filtered || !filtered.length){ list.innerHTML = '<div class="small">No se encontraron resultados</div>'; return; }
  filtered.forEach(item => {
    const div = document.createElement('div'); div.className = 'item';
    const cleanPhone = (item.telefono || '').replace(/[^0-9]/g,'');
    const phoneHtml = cleanPhone ? ' • <a href="https://wa.me/'+cleanPhone+'" target="_blank">WhatsApp</a>' : '';
    div.innerHTML = '<h3>'+escapeHtml(item.fiscalia)+'</h3><p><strong>Fiscal:</strong> '+escapeHtml(item.fiscal || '')+'</p>'+
                    '<p><strong>Comuna:</strong> '+escapeHtml(item.comuna || '')+' • <a href="mailto:'+escapeHtml(item.email || '')+'">'+escapeHtml(item.email || '')+'</a>'+phoneHtml+'</p>';
    div.addEventListener('click', ()=>{ if(item.lat != null && item.lng != null) map.setView([item.lat, item.lng], 14); });
    list.appendChild(div);
  });
}

function renderMarkers(filtered){
  clearMarkers();
  (filtered || []).forEach(item => {
    if(item && item.lat != null && item.lng != null){
      try{
        const m = L.marker([item.lat, item.lng]).addTo(map);
        m.bindPopup(createPopupHtml(item));
        markers.push(m);
      }catch(e){
        console.warn('marker creation failed', e, item);
      }
    }
  });
}

function populateComunas(){
  const set = new Set((data || []).map(d => d.comuna).filter(Boolean));
  const sel = document.getElementById('comunaFilter');
  sel.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
  Array.from(set).sort().forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt); });
}

function applyFilters(){
  const q = (document.getElementById('search').value || '').toLowerCase().trim();
  const comuna = document.getElementById('comunaFilter').value;
  const filtered = (data || []).filter(d => {
    const matchQ = !q || ((d.fiscalia||'').toLowerCase().includes(q) || (d.fiscal||'').toLowerCase().includes(q) || (d.comuna||'').toLowerCase().includes(q));
    const matchComuna = !comuna || d.comuna === comuna;
    return matchQ && matchComuna;
  });

  const listMode = document.getElementById('tabList').classList.contains('active');
  if(listMode){
    renderList(filtered);
    // small delay so map may have been resized if hidden
    setTimeout(()=> {
      try{ map.invalidateSize(); }catch(e){}
      const coords = (filtered || []).filter(f => f && f.lat != null && f.lng != null).map(f => [f.lat, f.lng]);
      if(coords.length){
        try{ map.fitBounds(coords, { maxZoom: 14 }); }
        catch(e){ console.warn('fitBounds failed', e); map.setView([-33.45, -70.667], 10); }
      } else {
        map.setView([-33.45, -70.667], 10);
      }
    }, 80);
  } else {
    renderMarkers(filtered);
    const coords = (filtered || []).filter(f => f && f.lat != null && f.lng != null).map(f => [f.lat, f.lng]);
    if(coords.length){ try{ map.fitBounds(coords, { maxZoom: 14 }); } catch(e){ console.warn('fitBounds failed', e); map.setView([-33.45, -70.667], 10); } }
    else { map.setView([-33.45, -70.667], 10); }
  }

  // ensure markers match list
  renderMarkers(filtered);
}

function init(){
  initMap();
  if(!data || !data.length) data = sampleData;
  populateComunas();
  renderList(data);
  renderMarkers(data);

  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('comunaFilter').addEventListener('change', applyFilters);
  document.getElementById('downloadJson').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fiscalias_rm.json'; a.click(); URL.revokeObjectURL(url);
  });

  document.getElementById('tabList').addEventListener('click', ()=>{ document.getElementById('tabList').classList.add('active'); document.getElementById('tabMap').classList.remove('active'); applyFilters(); });
  document.getElementById('tabMap').addEventListener('click', ()=>{ document.getElementById('tabMap').classList.add('active'); document.getElementById('tabList').classList.remove('active'); applyFilters(); });

  // initial view
  const initialCoords = (data || []).filter(f => f && f.lat != null && f.lng != null).map(f => [f.lat, f.lng]);
  if(initialCoords.length){ try{ map.fitBounds(initialCoords, { maxZoom: 12 }); } catch(e){ map.setView([-33.45, -70.667], 10); } }
  else map.setView([-33.45, -70.667], 10);
}
