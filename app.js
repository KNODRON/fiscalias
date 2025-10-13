// app.js — versión con normalización de teléfonos y botones extra
<!-- FILE: app.js -->
// app.js — versión con normalización de teléfonos y botones extra


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
if(resp && resp.ok){ data = await resp.json(); console.log('Loaded data/fiscalias.json', Array.isArray(data) ? data.length : 'not array'); }
else throw new Error('data file not found or not OK');
}catch(err){
console.warn('Could not load data/fiscalias.json, falling back to sampleData:', err);
data = sampleData;
}


// Normalizar teléfonos y crear campos auxiliares
data = data.map(rec => {
const raw = rec.telefono || '';
const digits = String(raw).replace(/[^0-9]/g,'');
let wa = '';
if(digits.startsWith('56')) wa = digits; // already with country code
else if(digits.startsWith('9')) wa = '56' + digits; // mobile without country code
else if(digits.startsWith('0')) wa = '56' + digits.replace(/^0+/, '');
else if(digits.length >= 8 && digits.length <= 11) wa = digits; // fallback
// store normalized
return Object.assign({}, rec, { telefono_raw: raw, telefono_clean: digits, telefono_wa: wa });
});


if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();


// Mapa
let map, markers = [];
function initMap(){ map = L.map('map').setView([-33.45, -70.667], 10); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom:19, attribution:'&copy; OSM'}).addTo(map); }
function clearMarkers(){ markers.forEach(m=>{ try{ map.removeLayer(m); }catch(e){} }); markers = []; }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&"'<>]/g, c=>({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[c])); }


function createPopupHtml(item){

function populateComunas(){ const set = new Set((data || []).map(d=>d.comuna).filter(Boolean)); const sel = document.getElementById('comunaFilter'); sel.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove()); Array.from(set).sort().forEach(c=>{ const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt); }); }


function applyFilters(){
const q = (document.getElementById('search').value || '').toLowerCase().trim();
const comuna = document.getElementById('comunaFilter').value;
const filtered = (data || []).filter(d=>{ const matchQ = !q || ((d.fiscalia||'').toLowerCase().includes(q) || (d.fiscal||'').toLowerCase().includes(q) || (d.comuna||'').toLowerCase().includes(q)); const matchComuna = !comuna || d.comuna === comuna; return matchQ && matchComuna; });


const listMode = document.getElementById('tabList').classList.contains('active');
if(listMode){ renderList(filtered); setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} const coords = (filtered || []).filter(f=> f && f.lat != null && f.lng != null).map(f=>[f.lat, f.lng]); if(coords.length){ try{ map.fitBounds(coords, { maxZoom: 14 }); }catch(e){ console.warn('fitBounds failed', e); map.setView([-33.45, -70.667], 10); } } else { map.setView([-33.45, -70.667], 10); } }, 80); }
else { renderMarkers(filtered); const coords = (filtered || []).filter(f=> f && f.lat != null && f.lng != null).map(f=>[f.lat, f.lng]); if(coords.length){ try{ map.fitBounds(coords, { maxZoom: 14 }); }catch(e){ console.warn('fitBounds failed', e); map.setView([-33.45, -70.667], 10); } } else { map.setView([-33.45, -70.667], 10); } }


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
document.getElementById('downloadJson').addEventListener('click', ()=>{ const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'fiscalias_rm.json'; a.click(); URL.revokeObjectURL(url); });


document.getElementById('tabList').addEventListener('click', ()=>{ document.getElementById('tabList').classList.add('active'); document.getElementById('tabMap').classList.remove('active'); applyFilters(); });
document.getElementById('tabMap').addEventListener('click', ()=>{ document.getElementById('tabMap').classList.add('active'); document.getElementById('tabList').classList.remove('active'); applyFilters(); });


// attach copy handler when a popup opens
map.on('popupopen', function(e){
try{
const node = e.popup.getElement ? e.popup.getElement() : e.popup._contentNode; // compatibility
if(!node) return;
const btn = node.querySelector('.copy-phone');
if(btn){ btn.addEventListener('click', function(ev){ ev.preventDefault(); const phone = this.getAttribute('data-phone'); if(phone){ navigator.clipboard.writeText(phone).then(()=>{ alert('Teléfono copiado: '+phone); }).catch(()=>{ alert('No se pudo copiar'); }); } }); }
}catch(err){ console.warn('popupopen handler error', err); }
});


// initial view bounds
const initialCoords = (data || []).filter(f=> f && f.lat != null && f.lng != null).map(f=>[f.lat, f.lng]);
if(initialCoords.length){ try{ map.fitBounds(initialCoords, { maxZoom: 12 }); }catch(e){ map.setView([-33.45, -70.667], 10); } } else map.setView([-33.45, -70.667], 10);
}




<!-- FILE: data/fiscalias.json -->
[
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
]
