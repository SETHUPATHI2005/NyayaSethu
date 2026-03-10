const API_CONFIG_KEY = 'nyayamithra_api_url';

function apiBase() {
  return String(window.NYAYAMITHRA_API || '').replace(/\/+$/, '');
}

function localFallbackApi() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
  return isLocal ? 'http://127.0.0.1:8000' : '';
}

function fallbackApi() {
  return String(window.NYAYAMITHRA_DEFAULT_API || localFallbackApi() || '').replace(/\/+$/, '');
}

function persistApiBase(url) {
  if (typeof window.setNyayaMithraApi === 'function') {
    window.setNyayaMithraApi(url);
    return;
  }
  if (!url) {
    localStorage.removeItem(API_CONFIG_KEY);
  } else {
    localStorage.setItem(API_CONFIG_KEY, url);
  }
  window.NYAYAMITHRA_API = url;
}

async function fetchApi(path, init) {
  const primary = apiBase();
  try {
    return await fetch(`${primary}${path}`, init);
  } catch (err) {
    const fallback = fallbackApi();
    if (!fallback || fallback === primary) throw err;
    persistApiBase(fallback);
    return await fetch(`${fallback}${path}`, init);
  }
}

document.querySelector('.nav')?.classList.add('solid');

const DEMO = [
  { type:'legal_aid', name:'District Legal Services Authority', addr:'Court Complex, Civil Lines', hours:'Mon–Sat, 10am–5pm', extra:'Free Services', phone:'15100', dist:'2.1 km' },
  { type:'women',     name:'One Stop Centre (Sakhi)',           addr:'Government Hospital Premises', hours:'24 × 7', extra:'Free · Confidential', phone:'181', dist:'1.2 km' },
  { type:'labour',    name:'Office of Labour Commissioner',     addr:'Industrial Area, Sector 4', hours:'Mon–Fri, 9:30am–5:30pm', extra:'Labour Disputes · Wage Claims', phone:'14567', dist:'3.4 km' },
  { type:'consumer',  name:'District Consumer Disputes Redressal Commission', addr:'Near Civil Court, Main Road', hours:'Mon–Sat, 10am–4pm', extra:'₹200 filing fee', phone:'1800114000', dist:'4.8 km' },
  { type:'police',    name:'District Police Headquarters',      addr:'Police Lines, Main Road', hours:'24 × 7', extra:'Emergency Response', phone:'100', dist:'5.0 km' },
  { type:'legal_aid', name:'Taluka Legal Services Committee',   addr:'Taluka Court Complex', hours:'Mon–Sat, 10am–4pm', extra:'Free Services', phone:'15100', dist:'6.3 km' }
];

const TYPE_META = {
  legal_aid: {
    label: 'Legal Aid',
    aliases: ['legal_aid', 'legal aid', 'legalaid', 'dlsa', 'taluka legal services']
  },
  labour: {
    label: 'Labour Office',
    aliases: ['labour', 'labor', 'labour office', 'labour_office', 'labor_office']
  },
  consumer: {
    label: 'Consumer Court',
    aliases: ['consumer', 'consumer court', 'consumer_court']
  },
  women: {
    label: 'Women Helpdesk',
    aliases: ['women', 'women helpdesk', 'women_helpdesk', 'women helpline']
  },
  police: {
    label: 'Police Station',
    aliases: ['police', 'police station', 'police_station']
  }
};

function normalizeType(type) {
  const raw = String(type || '').trim().toLowerCase();
  if (!raw) return 'legal_aid';
  const key = raw.replace(/\s+/g, '_');
  for (const canonical of Object.keys(TYPE_META)) {
    const aliases = TYPE_META[canonical].aliases || [];
    if (canonical === key || aliases.includes(raw) || aliases.includes(key)) {
      return canonical;
    }
  }
  return 'legal_aid';
}

function normalizeResults(list) {
  return (Array.isArray(list) ? list : []).map((item) => ({
    ...item,
    type: normalizeType(item.type)
  }));
}

let currentFilter = 'all';
let allResults = [...DEMO];
let activeResults = [...DEMO];
let activeLocation = '';

const mapPlaceholder = document.getElementById('mapPlaceholder');
const mapContainer = document.getElementById('mapContainer');
let map = null;
let markersLayer = null;
let mapDataByName = new Map();
const geocodeCache = new Map();

function initMap() {
  if (map || typeof L === 'undefined' || !mapContainer) return;
  map = L.map(mapContainer, { zoomControl: true }).setView([20.5937, 78.9629], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function showMap() {
  if (!mapContainer) return;
  mapPlaceholder?.classList.add('hidden');
  mapContainer.classList.remove('hidden');
}

function colorForType(type) {
  return {
    legal_aid: '#A78BFA',
    labour: '#FF6B00',
    consumer: '#00C8A8',
    women: '#F472B6',
    police: '#34D399'
  }[type] || '#E8A020';
}

function markerIcon(type) {
  const color = colorForType(type);
  return L.divIcon({
    className: 'aid-marker-wrap',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #0a0f1f;box-shadow:0 0 0 3px ${color}55;"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function parseLatLng(text) {
  const m = String(text || '').trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  return { lat: Number(m[1]), lon: Number(m[2]) };
}

async function geocodeQuery(query) {
  const key = String(query || '').trim().toLowerCase();
  if (!key) return null;
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    const point = first ? { lat: Number(first.lat), lon: Number(first.lon) } : null;
    geocodeCache.set(key, point);
    return point;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

async function enrichForMap(list, locationLabel) {
  const locPoint = parseLatLng(locationLabel) || await geocodeQuery(locationLabel || 'India');
  const enriched = await Promise.all(
    list.map(async (item) => {
      const q = `${item.name}, ${item.addr}, ${locationLabel || 'India'}`;
      const coord = await geocodeQuery(q);
      return { ...item, _coord: coord };
    })
  );
  return { locationPoint: locPoint, items: enriched };
}

async function updateMap(list, locationLabel) {
  initMap();
  if (!map || !markersLayer) return;

  const { locationPoint, items } = await enrichForMap(list, locationLabel);
  showMap();
  markersLayer.clearLayers();
  mapDataByName = new Map();

  const bounds = [];

  if (locationPoint) {
    const u = L.marker([locationPoint.lat, locationPoint.lon], {
      icon: L.divIcon({
        className: 'aid-user-marker',
        html: '<div style="width:16px;height:16px;border-radius:50%;background:#f8f2e8;border:2px solid #0b1324;box-shadow:0 0 0 4px rgba(248,242,232,0.25);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(markersLayer);
    u.bindPopup(`<strong>Your search area</strong><br>${esc(locationLabel || 'Selected location')}`);
    bounds.push([locationPoint.lat, locationPoint.lon]);
  }

  items.forEach((item) => {
    if (!item._coord) return;
    const m = L.marker([item._coord.lat, item._coord.lon], { icon: markerIcon(item.type) }).addTo(markersLayer);
    m.bindPopup(`<strong>${esc(item.name)}</strong><br>${esc(item.addr)}<br>${esc(item.hours || '')}`);
    mapDataByName.set(item.name, m);
    bounds.push([item._coord.lat, item._coord.lon]);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [30, 30] });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 13);
  } else {
    map.setView([20.5937, 78.9629], 5);
  }

  setTimeout(() => map.invalidateSize(), 80);
}

function applyFiltersAndSort() {
  let list = allResults.filter((r) => currentFilter === 'all' || r.type === currentFilter);
  const sortValue = document.getElementById('sortSelect')?.value || 'distance';
  if (sortValue !== 'distance') {
    list = [...list].sort((a, b) => (a.name > b.name ? 1 : -1));
  }
  activeResults = list;
  renderCards(activeResults);
  updateMap(activeResults, activeLocation || document.getElementById('locationInput')?.value.trim() || 'India');
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.type;
    applyFiltersAndSort();
  });
});

// Search
document.getElementById('searchAidBtn')?.addEventListener('click', doSearch);
document.getElementById('locationInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

// Locate
document.getElementById('locateBtn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return alert('Geolocation not supported in this browser.');
  navigator.geolocation.getCurrentPosition(
    pos => {
      document.getElementById('locationInput').value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      doSearch();
    },
    () => alert('Could not get your location. Please enter it manually.')
  );
});

// Sort
document.getElementById('sortSelect')?.addEventListener('change', e => {
  applyFiltersAndSort();
});

async function doSearch() {
  const loc = document.getElementById('locationInput')?.value.trim();
  if (!loc) return;
  activeLocation = loc;
  try {
    const res = await fetchApi(`/api/legal-aid/search?location=${encodeURIComponent(loc)}&type=${currentFilter}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    allResults = normalizeResults(data.results);
  } catch {
    allResults = normalizeResults(DEMO);
  }
  applyFiltersAndSort();
}

function renderCards(list) {
  const container = document.getElementById('aidResults');
  if (!container) return;
  const count = document.getElementById('resultsCount');
  if (count) count.innerHTML = `Showing <strong>${list.length}</strong> result${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-size:14px">No results found. Try a different filter or location.</div>`;
    return;
  }

  container.innerHTML = list.map(r => `
    <div class="aid-card" data-type="${r.type}">
      <div class="aid-card-header">
        <div class="aid-type-badge ${r.type}">${label(r.type)}</div>
        ${r.dist ? `<div class="aid-distance">${r.dist}</div>` : ''}
      </div>
      <h3>${esc(r.name)}</h3>
      <div class="aid-meta">
        <span>📍 ${esc(r.addr)}</span>
        <span>⏰ ${esc(r.hours)}</span>
        ${r.extra ? `<span>${r.extra.includes('Free') || r.extra.includes('free') ? '✅' : 'ℹ️'} ${esc(r.extra)}</span>` : ''}
      </div>
      <div class="aid-card-actions">
        <a href="tel:${r.phone}" class="aid-btn call">📞 ${esc(r.phone)}</a>
        <button class="aid-btn directions" onclick="openDirections('${esc(r.name).replace(/'/g,"\\'")}')">🗺 Directions</button>
        <button class="aid-btn chat-ref" onclick="window.location='chat.html'">💬 Ask AI First</button>
      </div>
    </div>`).join('');
}

function label(type) {
  const canonical = normalizeType(type);
  return TYPE_META[canonical]?.label || 'Legal Aid';
}

function openDirections(target) {
  let query = '';
  if (typeof target === 'string') {
    query = target;
  } else if (target && target.closest) {
    query = target.closest('.aid-card')?.querySelector('h3')?.textContent || '';
  }
  if (!query) return;
  const marker = mapDataByName.get(query);
  if (marker && map) {
    map.flyTo(marker.getLatLng(), 14, { duration: 0.7 });
    marker.openPopup();
    return;
  }
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
}

window.openDirections = openDirections;

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Initial render
allResults = normalizeResults(DEMO);
activeResults = [...allResults];
renderCards(activeResults);
updateMap(activeResults, 'India');
