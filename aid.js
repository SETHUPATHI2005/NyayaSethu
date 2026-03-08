const API = window.NYAYASETHU_API || '';

document.querySelector('.nav')?.classList.add('solid');

const DEMO = [
  { type:'legal_aid', name:'District Legal Services Authority', addr:'Court Complex, Civil Lines', hours:'Mon–Sat, 10am–5pm', extra:'Free Services', phone:'15100', dist:'2.1 km' },
  { type:'women',     name:'One Stop Centre (Sakhi)',           addr:'Government Hospital Premises', hours:'24 × 7', extra:'Free · Confidential', phone:'181', dist:'1.2 km' },
  { type:'labour',    name:'Office of Labour Commissioner',     addr:'Industrial Area, Sector 4', hours:'Mon–Fri, 9:30am–5:30pm', extra:'Labour Disputes · Wage Claims', phone:'14567', dist:'3.4 km' },
  { type:'consumer',  name:'District Consumer Disputes Redressal Commission', addr:'Near Civil Court, Main Road', hours:'Mon–Sat, 10am–4pm', extra:'₹200 filing fee', phone:'1800114000', dist:'4.8 km' },
  { type:'police',    name:'District Police Headquarters',      addr:'Police Lines, Main Road', hours:'24 × 7', extra:'Emergency Response', phone:'100', dist:'5.0 km' },
  { type:'legal_aid', name:'Taluka Legal Services Committee',   addr:'Taluka Court Complex', hours:'Mon–Sat, 10am–4pm', extra:'Free Services', phone:'15100', dist:'6.3 km' }
];

let currentFilter = 'all';

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.type;
    renderCards(DEMO.filter(r => currentFilter === 'all' || r.type === currentFilter));
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
  const filtered = DEMO.filter(r => currentFilter === 'all' || r.type === currentFilter);
  if (e.target.value === 'distance') renderCards(filtered);
  else renderCards([...filtered].sort((a,b) => (a.name > b.name ? 1 : -1)));
});

async function doSearch() {
  const loc = document.getElementById('locationInput')?.value.trim();
  if (!loc) return;
  try {
    const res = await fetch(`${API}/api/legal-aid/search?location=${encodeURIComponent(loc)}&type=${currentFilter}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderCards(data.results);
  } catch {
    renderCards(DEMO.filter(r => currentFilter === 'all' || r.type === currentFilter));
  }
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
  return { legal_aid:'Legal Aid', labour:'Labour Office', consumer:'Consumer Court', women:'Women Helpdesk', police:'Police Station' }[type] || type;
}

function openDirections(target) {
  let query = '';
  if (typeof target === 'string') {
    query = target;
  } else if (target && target.closest) {
    query = target.closest('.aid-card')?.querySelector('h3')?.textContent || '';
  }
  if (!query) return;
  window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}`, '_blank');
}

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Initial render
renderCards(DEMO);
