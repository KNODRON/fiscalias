// app.js — Fiscales RM + Agendamientos

let data = [];
let agendamientos = [];
let map, markers = [];

(async function(){
  try {
    const resp = await fetch('data/fiscalias.json');
    data = (resp.ok) ? await resp.json() : [];
  } catch {
    console.warn('⚠️ Error al cargar fiscalias.json');
  }

  try {
    const resp2 = await fetch('data/agendamientos.json');
    agendamientos = (resp2.ok) ? await resp2.json() : [];
  } catch {
    console.warn('⚠️ Error al cargar agendamientos.json');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();

function init() {
  initMap();
  populateFiscalias();
  renderList(data);
  renderMarkers(data);
  renderAgendamientos();

  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('fiscaliaFilter').addEventListener('change', applyFilters);
  document.getElementById('tabList').addEventListener('click', showListMode);
  document.getElementById('tabMap').addEventListener('click', showMapMode);
  document.getElementById('tabAgend').addEventListener('click', showAgendMode);
  showListMode();
}

// ===== MAPA =====
function initMap() {
  map = L.map('map').setView([-33.45, -70.667], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
}
function clearMarkers(){ markers.forEach(m=>map.removeLayer(m)); markers=[]; }

// ===== FILTROS =====
function populateFiscalias(){
  const set = new Set(data.map(d => d.fiscalia).filter(Boolean));
  const sel = document.getElementById('fiscaliaFilter');
  sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());
  Array.from(set).sort().forEach(f=>{
    const opt=document.createElement('option'); opt.value=f; opt.textContent=f; sel.appendChild(opt);
  });
}
function applyFilters(){
  const q=(document.getElementById('search').value||'').toLowerCase().trim();
  const fiscalia=document.getElementById('fiscaliaFilter').value;
  const filtered=data.filter(d=>{
    const mq=!q||((d.fiscalia||'').toLowerCase().includes(q)||(d.fiscal||'').toLowerCase().includes(q));
    const mf=!fiscalia||d.fiscalia===fiscalia;
    return mq&&mf;
  });
  renderList(filtered); renderMarkers(filtered);
}

// ===== LISTADO =====
function renderList(arr){
  const list=document.getElementById('list');
  list.innerHTML='';
  if(!arr.length){ list.innerHTML='<div class="small">No se encontraron resultados</div>'; return;}
  arr.sort((a,b)=>a.fiscalia.localeCompare(b.fiscalia));
  arr.forEach(i=>{
    const el=document.createElement('div');
    el.className='item';
    el.innerHTML=`<h3>${i.fiscalia}</h3>
      <p><strong>Fiscal:</strong> ${i.fiscal||'—'}</p>
      <p><strong>Teléfono:</strong> ${i.telefono||'—'} • <a href="mailto:${i.email}">${i.email||'—'}</a></p>`;
    list.appendChild(el);
  });
}

// ===== MARCADORES MAPA =====
function renderMarkers(arr){
  clearMarkers();
  arr.forEach(i=>{
    if(!i.lat||!i.lng)return;
    const m=L.marker([i.lat,i.lng]).addTo(map);
    m.bindPopup(`<strong>${i.fiscalia}</strong><br>${i.fiscal||'—'}<br><a href="mailto:${i.email}">${i.email||''}</a>`);
    markers.push(m);
  });
}

// ===== AGENDAMIENTOS =====
function renderAgendamientos(){
  const cont=document.getElementById('agendList');
  cont.innerHTML='';
  if(!agendamientos.length){ cont.innerHTML='<div class="small">No hay datos de agendamientos</div>'; return; }

  agendamientos.forEach(f=>{
    const div=document.createElement('div');
    div.className='agend-item';
    div.innerHTML=`<h3>${f.fiscalia}</h3>`;
    const chips=document.createElement('div'); chips.className='chips';
    f.contactos.forEach(c=>{
      const a=document.createElement('a');
      a.href=`mailto:${c.email}`;
      a.className='chip';
      a.textContent=c.nombre ? `${c.nombre} — ${c.email}` : c.email;
      chips.appendChild(a);
    });
    div.appendChild(chips);
    cont.appendChild(div);
  });
}

// ===== MODOS =====
function showListMode(){
  toggleTabs('tabList','leftPane');
}
function showMapMode(){
  toggleTabs('tabMap','mapPane');
  setTimeout(()=>map.invalidateSize(),150);
}
function showAgendMode(){
  toggleTabs('tabAgend','agendamientosPane');
}
function toggleTabs(activeId, paneId){
  ['tabList','tabMap','tabAgend'].forEach(id=>document.getElementById(id).classList.remove('active'));
  ['leftPane','mapPane','agendamientosPane'].forEach(id=>document.getElementById(id).classList.add('collapsed'));
  document.getElementById(activeId).classList.add('active');
  document.getElementById(paneId).classList.remove('collapsed');
}
