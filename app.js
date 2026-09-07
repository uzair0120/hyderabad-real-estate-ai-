/* ============================================================
   HYDERABAD ESTATE VIP — Main App JS
   ============================================================ */

// ---- STATE ----
let allSocieties = [];
let allBrokers = [];
let allListings = [];
let allHousing = [];
let chatHistory = [];
let chatOpen = false;
let mapInstance = null;
let activeFlatTab = 'all'; // 'all' | 'rent' | 'sale'

// ---- AUTH STATE ----
let currentUser = null;
const token = () => localStorage.getItem('he_token');

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in
  const t = token();
  if (t) {
    try {
      const res = await fetch('/api/auth/verify', { headers: { Authorization: 'Bearer ' + t } });
      const data = await res.json();
      if (data.user) {
        currentUser = data.user;
        openGate(); // User is authenticated, open the gate
        updateNavAuth();
        return;
      }
    } catch {}
  }
  // Show auth gate (user must login/register)
  document.getElementById('authGate').classList.remove('hidden');
});

// ============================================================
// AUTH GATE FUNCTIONS
// ============================================================
function openGate() {
  const gate = document.getElementById('authGate');
  gate.style.transition = 'opacity 0.4s';
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.classList.add('hidden');
    document.getElementById('mainContent').style.display = '';
    // Show ambient music button
    const ambBtn = document.getElementById('ambientTopBtn');
    if (ambBtn) ambBtn.style.display = 'flex';
    // Setup ambient auto-play
    setupAmbientAutoPlay();
    // Load all data
    loadSocieties(); loadBrokers(); loadListings(); loadHousing();
    renderFeatured();
    buildRatingTicker();
    buildShowcase4D();
    setTimeout(initBg3D, 500);
  }, 400);
}

function showGateRegister() {
  document.getElementById('gateLoginForm').style.display = 'none';
  document.getElementById('gateRegisterForm').style.display = 'block';
}

function showGateLogin() {
  document.getElementById('gateRegisterForm').style.display = 'none';
  document.getElementById('gateLoginForm').style.display = 'block';
}

async function doGateLogin() {
  const email = document.getElementById('gateLoginEmail').value;
  const password = document.getElementById('gateLoginPassword').value;
  const errEl = document.getElementById('gateLoginError');
  errEl.style.display = 'none';
  if (!email || !password) { errEl.textContent = 'Please fill in all fields'; errEl.style.display = 'block'; return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; return; }
    localStorage.setItem('he_token', data.token);
    currentUser = data.user;
    updateNavAuth();
    openGate();
  } catch { errEl.textContent = 'Connection error. Please try again.'; errEl.style.display = 'block'; }
}

async function doGateRegister() {
  const name = document.getElementById('gateRegName').value;
  const email = document.getElementById('gateRegEmail').value;
  const phone = document.getElementById('gateRegPhone').value;
  const password = document.getElementById('gateRegPassword').value;
  const errEl = document.getElementById('gateRegError');
  errEl.style.display = 'none';
  if (!name || !email || !password) { errEl.textContent = 'Please fill in required fields'; errEl.style.display = 'block'; return; }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Registration failed'; errEl.style.display = 'block'; return; }
    localStorage.setItem('he_token', data.token);
    currentUser = data.user;
    updateNavAuth();
    openGate();
  } catch { errEl.textContent = 'Connection error. Please try again.'; errEl.style.display = 'block'; }
}

// ============================================================
// AUTH
// ============================================================
function checkAuth() {
  const t = token();
  if (!t) return;
  fetch('/api/auth/verify', { headers: { Authorization: 'Bearer ' + t } })
    .then(r => r.json())
    .then(data => {
      if (data.user) { currentUser = data.user; updateNavAuth(); }
    }).catch(() => {});
}

function updateNavAuth() {
  if (currentUser) {
    document.getElementById('navAuth').style.display = 'none';
    const nu = document.getElementById('navUser');
    nu.style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name[0].toUpperCase();
  } else {
    document.getElementById('navAuth').style.display = 'flex';
    document.getElementById('navUser').style.display = 'none';
  }
}

function openModal(type) {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
  document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('regError').style.display = 'none';
}

function closeAuthModal(e) {
  if (!e || e.target === document.getElementById('authModal')) {
    document.getElementById('authModal').classList.remove('open');
  }
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
    localStorage.setItem('he_token', data.token);
    currentUser = data.user;
    updateNavAuth();
    closeAuthModal();
    showToast('✓ Login successful! Welcome back, ' + data.user.name);
  } catch { errEl.textContent = 'Connection error'; errEl.style.display = 'block'; }
}

async function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('regError');
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; errEl.style.display = 'block'; return; }
    localStorage.setItem('he_token', data.token);
    currentUser = data.user;
    updateNavAuth();
    closeAuthModal();
    showToast('✓ Account created! Welcome, ' + data.user.name);
  } catch { errEl.textContent = 'Connection error'; errEl.style.display = 'block'; }
}

function logout() {
  localStorage.removeItem('he_token');
  currentUser = null;
  updateNavAuth();
  // Stop ambient music
  const audio = getAmbientAudio();
  if (audio) { audio.pause(); audio.currentTime = 0; }
  ambientPlaying = false;
  ambientInitialized = false;
  const ambBtn = document.getElementById('ambientTopBtn');
  if (ambBtn) { ambBtn.style.display = 'none'; ambBtn.classList.remove('playing'); }
  // Show auth gate again
  document.getElementById('mainContent').style.display = 'none';
  const gate = document.getElementById('authGate');
  gate.classList.remove('hidden');
  gate.style.opacity = '1';
  showToast('Logged out successfully');
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadSocieties() {
  const data = await fetch('/api/societies').then(r => r.json());
  allSocieties = data;
  document.getElementById('statSocieties').textContent = data.length;
  document.getElementById('societyCount').textContent = data.length + ' buildings';
}

async function loadBrokers() {
  const data = await fetch('/api/brokers').then(r => r.json());
  allBrokers = data;
  document.getElementById('statBrokers').textContent = data.length;
}

async function loadListings() {
  const data = await fetch('/api/listings').then(r => r.json());
  allListings = data;
  document.getElementById('statListings').textContent = data.length + '+';
}

async function loadHousing() {
  try {
    const data = await fetch('/api/housing').then(r => r.json());
    allHousing = data;
    const el = document.getElementById('housingCount');
    if (el) el.textContent = data.length + ' societies';
  } catch (e) { allHousing = []; }
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name) {
  // Hide all content sections
  document.getElementById('sectionHome').style.display = 'none';
  document.getElementById('sectionFeatured').style.display = 'none';
  document.getElementById('sectionSocieties').style.display = 'none';
  document.getElementById('sectionFlats').style.display = 'none';
  document.getElementById('sectionHousing').style.display = 'none';
  document.getElementById('sectionBrokers').style.display = 'none';
  document.getElementById('sectionMap').style.display = 'none';
  // Always hide 4D showcase
  document.getElementById('showcase4d').style.display = 'none';

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (name === 'home') {
    document.getElementById('sectionHome').style.display = '';
    document.getElementById('sectionFeatured').style.display = '';
    document.querySelector('[onclick="showSection(\'home\')"]').classList.add('active');
  } else if (name === 'societies') {
    document.getElementById('sectionSocieties').style.display = '';
    renderSocieties(allSocieties);
    document.querySelector('[onclick="showSection(\'societies\')"]').classList.add('active');
  } else if (name === 'flats') {
    document.getElementById('sectionFlats').style.display = '';
    document.getElementById('showcase4d').style.display = '';  // Show 4D only for flats
    activeFlatTab = 'all';
    resetFlatTabs();
    applyFlatFilters();
    document.querySelector('[onclick="showSection(\'flats\')"]').classList.add('active');
  } else if (name === 'housing') {
    document.getElementById('sectionHousing').style.display = '';
    renderHousing(allHousing);
    document.querySelector('[onclick="showSection(\'housing\')"]').classList.add('active');
  } else if (name === 'brokers') {
    document.getElementById('sectionBrokers').style.display = '';
    renderBrokers(allBrokers);
    document.querySelector('[onclick="showSection(\'brokers\')"]').classList.add('active');
  } else if (name === 'map') {
    document.getElementById('sectionMap').style.display = '';
    document.querySelector('[onclick="showSection(\'map\')"]').classList.add('active');
    setTimeout(initMap, 100);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('navLinks').classList.toggle('open');
}

// ============================================================
// SEARCH
// ============================================================
function doSearch() {
  const type = document.getElementById('hsType').value;
  const beds = document.getElementById('hsBeds').value;
  // Navigate to Flats section
  showSection('flats');
  setTimeout(() => {
    // Set tab
    if (type) {
      activeFlatTab = type;
      resetFlatTabs();
    }
    // Set bed filter
    if (beds) document.getElementById('flatBedFilter').value = beds;
    applyFlatFilters();
  }, 80);
}

// ---- Flat tab switch ----
function switchFlatTab(tab) {
  activeFlatTab = tab;
  resetFlatTabs();
  applyFlatFilters();
}

function resetFlatTabs() {
  ['tabAll', 'tabRent', 'tabSale'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });
  const map = { all: 'tabAll', rent: 'tabRent', sale: 'tabSale' };
  const target = document.getElementById(map[activeFlatTab]);
  if (target) target.classList.add('active');
}

// ---- Flat filters (tab + dropdowns + search text) ----
function applyFlatFilters() {
  const beds   = document.getElementById('flatBedFilter')?.value || '';
  const area   = document.getElementById('flatAreaFilter')?.value || '';
  const search = (document.getElementById('flatSearch')?.value || '').toLowerCase();

  let filtered = allListings;

  // Tab filter
  if (activeFlatTab !== 'all') {
    filtered = filtered.filter(l => l.type === activeFlatTab);
  }
  // Bedrooms
  if (beds) filtered = filtered.filter(l => l.bedrooms === parseInt(beds));
  // Area
  if (area) filtered = filtered.filter(l =>
    (l.society_location || '').toLowerCase().includes(area.toLowerCase())
  );
  // Text search
  if (search) filtered = filtered.filter(l =>
    (l.title || '').toLowerCase().includes(search) ||
    (l.society_name || '').toLowerCase().includes(search)
  );

  // Update count bar
  const countBar = document.getElementById('flatCountBar');
  if (countBar) {
    const rentCount = filtered.filter(l => l.type === 'rent').length;
    const saleCount = filtered.filter(l => l.type === 'sale').length;
    countBar.textContent = `Showing ${filtered.length} flat${filtered.length !== 1 ? 's' : ''} — ${rentCount} For Rent · ${saleCount} For Sale`;
  }

  renderListings(filtered);
  if (filtered.length === 0) {
    document.getElementById('listingsGrid').innerHTML =
      '<div style="color:var(--text3);text-align:center;padding:60px;grid-column:1/-1">کوئی فلیٹ نہیں ملا۔ No flats found for the selected filters.</div>';
  }
}

function filterSocieties(query) {
  const q = query.toLowerCase();
  renderSocieties(allSocieties.filter(s =>
    s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)
  ));
}

function filterSocietiesByArea(area) {
  if (!area) { renderSocieties(allSocieties); return; }
  renderSocieties(allSocieties.filter(s => s.location.toLowerCase().includes(area.toLowerCase())));
}

// ============================================================
// HOUSING SOCIETIES RENDER & FILTER
// ============================================================
function renderHousing(list) {
  const grid = document.getElementById('housingGrid');
  if (!grid) return;
  const bar = document.getElementById('housingCountBar');
  if (bar) bar.textContent = `Showing ${list.length} housing societ${list.length !== 1 ? 'ies' : 'y'} — plots & land for sale`;

  if (!list.length) {
    grid.innerHTML = '<div style="color:var(--text3);text-align:center;padding:60px;grid-column:1/-1">کوئی سوسائٹی نہیں ملی۔ No societies found.</div>';
    return;
  }
  grid.innerHTML = list.map((h, i) => `
    <div class="housing-card">
      <div class="housing-card-header">
        <div class="housing-card-num">${h.id}</div>
        <div style="flex:1">
          <div class="housing-card-title">${h.name}</div>
          <div class="housing-card-location">📍 ${h.location}</div>
        </div>
      </div>
      <div class="housing-card-body">
        <div class="housing-row">
          <span class="housing-row-label">Plot Sizes</span>
          <span class="housing-row-val">${h.available_sizes}</span>
        </div>
        <div class="housing-rates">${h.estimated_rates}</div>
        <div class="housing-row">
          <span class="housing-row-label">Total Plots</span>
          <span class="housing-row-val">${h.total_plots}</span>
        </div>
        <div class="housing-row">
          <span class="housing-row-label">Road Width</span>
          <span class="housing-row-val">${h.road_width}</span>
        </div>
        <div class="housing-row">
          <span class="housing-row-label">🔥 Sui Gas</span>
          <span class="housing-row-val">${h.sui_gas}</span>
        </div>
        <div class="housing-row">
          <span class="housing-row-label">⚡ Electricity</span>
          <span class="housing-row-val">${h.electricity}</span>
        </div>
        <div class="housing-row">
          <span class="housing-row-label">🕌 Masjid</span>
          <span class="housing-row-val">${h.masjid}</span>
        </div>
        <div class="housing-row">
          <span class="housing-row-label">🌿 Amenities</span>
          <span class="housing-row-val">${h.amenities}</span>
        </div>
      </div>
      <div class="housing-card-footer">
        <span class="housing-plots-badge">🏘️ Housing Society</span>
        <a href="tel:03013501356" class="btn-contact-broker">📞 Contact Broker</a>
      </div>
    </div>
  `).join('');
}

function filterHousing(query) {
  const q = query.toLowerCase();
  renderHousing(allHousing.filter(h =>
    h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q)
  ));
}

function filterHousingByArea(area) {
  if (!area) { renderHousing(allHousing); return; }
  renderHousing(allHousing.filter(h => h.location.toLowerCase().includes(area.toLowerCase())));
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function formatPrice(n) {
  if (!n) return 'N/A';
  if (n >= 10000000) return (n / 10000000).toFixed(1) + ' Crore';
  if (n >= 100000) return (n / 100000).toFixed(0) + ' Lac';
  return 'PKR ' + n.toLocaleString();
}

function formatMonthly(n) {
  if (!n) return 'N/A';
  return 'PKR ' + n.toLocaleString() + '/mo';
}

function starsHtml(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty) + ` (${rating})`;
}

const BUILDING_ICONS = ['🏢', '🏙️', '🌆', '🏗️', '🏬', '🏛️', '🌇', '🏠', '🏡', '🏘️'];

function societyCardHtml(s, idx) {
  const icon = BUILDING_ICONS[idx % BUILDING_ICONS.length];
  return `
    <div class="society-card ${s.featured ? 'featured' : ''}" onclick="openSocietyDetail(${s.id})">
      <div class="card-img">
        <span style="font-size:4rem">${icon}</span>
        <div class="card-img-num"># ${idx + 1}</div>
      </div>
      <div class="card-body">
        <div class="card-name">${s.name}</div>
        <div class="card-name-urdu">${s.name_urdu || ''}</div>
        <div class="card-location">${s.location}</div>
        <div class="card-type">${s.type || ''}</div>
        <div class="price-grid">
          <div class="price-box">
            <div class="price-label">2-Bed Rent</div>
            <div class="price-val">${s.rent_2bed_min ? 'PKR ' + (s.rent_2bed_min/1000).toFixed(0) + 'k–' + (s.rent_2bed_max/1000).toFixed(0) + 'k' : '—'}</div>
          </div>
          <div class="price-box">
            <div class="price-label">2-Bed Sale</div>
            <div class="price-val">${formatPrice(s.sale_2bed_min)} +</div>
          </div>
          ${s.rent_3bed_min ? `
          <div class="price-box">
            <div class="price-label">3-Bed Rent</div>
            <div class="price-val">PKR ${(s.rent_3bed_min/1000).toFixed(0)}k–${(s.rent_3bed_max/1000).toFixed(0)}k</div>
          </div>` : ''}
          ${s.sale_3bed_min ? `
          <div class="price-box">
            <div class="price-label">3-Bed Sale</div>
            <div class="price-val">${formatPrice(s.sale_3bed_min)} +</div>
          </div>` : ''}
        </div>
        <div class="infra-badges">
          <span class="infra-badge badge-gas">⛽ Gas: ${s.sui_gas?.includes('Active') || s.sui_gas?.includes('Connected') ? 'Active' : 'Available'}</span>
          <span class="infra-badge badge-water">💧 WASA</span>
          <span class="infra-badge badge-power">⚡ HESCO</span>
        </div>
        <div class="card-amenities" style="margin-top:10px">${s.amenities || ''}</div>
      </div>
      <div class="card-footer">
        <button class="btn-detail">View Details →</button>
        <span style="font-size:0.75rem;color:var(--text3)">📍 ${s.location.split(',')[0]}</span>
      </div>
    </div>
  `;
}

function renderFeatured() {
  const featured = allSocieties.filter(s => s.featured === 1);
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = featured.map((s, i) => societyCardHtml(s, allSocieties.indexOf(s))).join('');
}

function renderSocieties(list) {
  document.getElementById('societiesGrid').innerHTML = list.length
    ? list.map((s, i) => societyCardHtml(s, i)).join('')
    : '<p style="color:var(--text3);grid-column:1/-1;text-align:center;padding:60px">No societies found.</p>';
}

function renderBrokers(list) {
  document.getElementById('brokersGrid').innerHTML = list.map(b => `
    <div class="broker-card ${b.tier}">
      <div class="broker-tier-dot" style="background:${b.color_tag || '#4A90D9'}"></div>
      <div class="broker-name">${b.name}</div>
      <div class="broker-agency">${b.agency || 'Independent Broker'}</div>
      <div class="broker-stars">${starsHtml(b.rating)} <span class="broker-rating-num">(${b.rating.toFixed(1)})</span></div>
      <div class="broker-spec-row">
        <span class="broker-spec-icon">🏢</span>
        <span class="broker-spec-text">${b.specialties || 'Flats, Plazas, Plots & Houses'}</span>
      </div>
      ${b.verified ? '<div class="broker-verified">✓ Verified VIP Broker</div>' : ''}
      <div class="broker-phone-row">
        <a href="tel:${b.phone}" class="broker-btn-call" title="Call ${b.name}">📞 Call</a>
        <a href="https://wa.me/92${b.phone.substring(1)}?text=Hello%2C%20I%20am%20interested%20in%20properties%20in%20Hyderabad" target="_blank" class="broker-btn-whatsapp" title="WhatsApp ${b.name}">💬 WhatsApp</a>
      </div>
      <div class="broker-phone-num">📞 ${b.phone}</div>
    </div>
  `).join('');
}

function renderListings(list) {
  document.getElementById('listingsGrid').innerHTML = list.map(l => `
    <div class="listing-card">
      <div class="listing-type ${l.type}">${l.type === 'rent' ? '🏠 FOR RENT' : '🏷️ FOR SALE'}</div>
      <div class="listing-title">${l.title}</div>
      <div class="listing-society">📍 ${l.society_name || ''} — ${l.society_location || ''}</div>
      <div class="listing-price">${l.type === 'rent' ? formatMonthly(l.price) : formatPrice(l.price)}</div>
      <div class="listing-broker">
        <div class="broker-mini-avatar">${(l.broker_name || 'Z')[0]}</div>
        <div>
          <div class="broker-mini-name">${l.broker_name || 'Zahid Hussain'}</div>
          <div class="broker-mini-phone">${l.broker_phone || '03013501356'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// SOCIETY DETAIL MODAL
// ============================================================
async function openSocietyDetail(id) {
  const res = await fetch('/api/societies/' + id);
  const s = await res.json();

  const amenityArr = (s.amenities || '').split(',').map(a => a.trim()).filter(Boolean);

  const html = `
    <div class="detail-header">
      <div class="detail-name">${s.name}</div>
      <div class="detail-name-urdu">${s.name_urdu || ''}</div>
      <div class="detail-location">📍 ${s.location}</div>
      <div class="card-type">${s.type || ''}</div>
    </div>

    <div class="detail-section">
      <h4>💰 Pricing</h4>
      <div class="price-table">
        ${s.rent_2bed_min ? `<div class="price-cell"><div class="price-cell-label">2-Bed Rent/Month</div><div class="price-cell-val">PKR ${s.rent_2bed_min.toLocaleString()} – ${s.rent_2bed_max.toLocaleString()}</div></div>` : ''}
        ${s.rent_3bed_min ? `<div class="price-cell"><div class="price-cell-label">3-Bed Rent/Month</div><div class="price-cell-val">PKR ${s.rent_3bed_min.toLocaleString()} – ${s.rent_3bed_max.toLocaleString()}</div></div>` : ''}
        ${s.sale_2bed_min ? `<div class="price-cell"><div class="price-cell-label">2-Bed Sale Price</div><div class="price-cell-val">${formatPrice(s.sale_2bed_min)} – ${formatPrice(s.sale_2bed_max)}</div></div>` : ''}
        ${s.sale_3bed_min ? `<div class="price-cell"><div class="price-cell-label">3-Bed Sale Price</div><div class="price-cell-val">${formatPrice(s.sale_3bed_min)} – ${formatPrice(s.sale_3bed_max)}</div></div>` : ''}
      </div>
    </div>

    <div class="detail-section">
      <h4>🏗️ Infrastructure</h4>
      <div class="infra-table">
        <div class="infra-row"><div class="infra-icon">⛽</div><div><div class="infra-label">Sui Gas</div><div class="infra-val">${s.sui_gas || 'N/A'}</div></div></div>
        <div class="infra-row"><div class="infra-icon">💧</div><div><div class="infra-label">Water Supply</div><div class="infra-val">${s.water_supply || 'N/A'}</div></div></div>
        <div class="infra-row" style="grid-column:1/-1"><div class="infra-icon">⚡</div><div><div class="infra-label">Electricity / Loadshedding</div><div class="infra-val">${s.electricity || 'N/A'}</div></div></div>
      </div>
    </div>

    <div class="detail-section">
      <h4>✨ Amenities & Features</h4>
      <div class="amenity-tags">
        ${amenityArr.map(a => `<span class="amenity-tag">${a}</span>`).join('')}
      </div>
    </div>

    ${s.brokers && s.brokers.length ? `
    <div class="detail-section">
      <h4>🤝 Our Brokers for This Society</h4>
      <div class="brokers-list">
        ${s.brokers.map(b => `
          <div class="broker-mini-card ${b.is_primary ? 'primary' : ''}">
            ${b.is_primary ? '<div style="font-size:0.68rem;color:var(--gold);font-weight:700;margin-bottom:6px;">⭐ PRIMARY BROKER</div>' : ''}
            <div style="font-weight:700;font-size:0.88rem;margin-bottom:4px">${b.name}</div>
            <div style="font-size:0.78rem;color:var(--text3);margin-bottom:8px">${b.agency || 'Independent'}</div>
            <div style="font-size:0.82rem;color:var(--gold)">📞 <a href="tel:${b.phone}">${b.phone}</a></div>
            <div style="font-size:0.8rem;color:var(--gold);margin-top:4px">${starsHtml(b.rating)}</div>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  `;

  document.getElementById('societyModalContent').innerHTML = html;
  document.getElementById('societyModal').classList.add('open');
}

function closeSocietyModal(e) {
  if (!e || e.target === document.getElementById('societyModal')) {
    document.getElementById('societyModal').classList.remove('open');
  }
}

// ============================================================
// MAP
// ============================================================
function makeDotIcon(color, size) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 8px ${color},0 2px 6px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2 - 4],
    className: ''
  });
}

function popupHtml(name, loc, type, extra, phone) {
  return `<div style="font-family:Inter,system-ui;min-width:220px;padding:4px">
    <div style="font-weight:800;font-size:0.95rem;color:#1a1a2e;margin-bottom:2px">${name}</div>
    <div style="color:#666;font-size:0.75rem;margin-bottom:8px">📍 ${loc}</div>
    <div style="font-size:0.72rem;color:#4f8ef7;font-weight:600;margin-bottom:8px">🏷️ ${type}</div>
    ${extra || ''}
    <div style="display:flex;gap:8px;margin-top:8px">
      <a href="tel:${phone || '03013501356'}" style="flex:1;background:#4f8ef7;color:#fff;text-align:center;padding:7px;border-radius:8px;font-weight:700;font-size:0.75rem;text-decoration:none">📞 Call</a>
      <a href="https://wa.me/92${(phone || '03013501356').substring(1)}?text=Hi%2C%20interested%20in%20${encodeURIComponent(name)}" target="_blank" style="flex:1;background:#25D366;color:#fff;text-align:center;padding:7px;border-radius:8px;font-weight:700;font-size:0.75rem;text-decoration:none">💬 WhatsApp</a>
    </div>
  </div>`;
}

function initMap() {
  if (mapInstance) { mapInstance.invalidateSize(); return; }
  mapInstance = L.map('map', { center: [25.396, 68.345], zoom: 13, zoomControl: true });

  // Free OSM tiles (no API key needed)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance);

  // Dot icons
  const buildingDot = makeDotIcon('#FFD700', 14);
  const flatDot = makeDotIcon('#4f8ef7', 10);
  const housingDot = makeDotIcon('#38d9c0', 12);
  const vipDot = makeDotIcon('#ff6b6b', 18);

  // Build society coordinate lookup (name -> {lat, lng})
  const societyCoords = {};
  allSocieties.forEach(s => {
    if (s.latitude && s.longitude) {
      societyCoords[s.name] = { lat: s.latitude, lng: s.longitude };
    }
  });

  // Real GPS coordinates for housing societies (Hyderabad, Sindh)
  const housingGps = {
    'GULSHAN-E-ZEALPAK': [25.388, 68.308],
    'SAIMA DOWNTOWN': [25.385, 68.320],
    'PALM VILLAGE': [25.383, 68.315],
    'PALM ROYAL': [25.383, 68.316],
    'CITIZEN COLONY': [25.419, 68.334],
    'REVENUE EMPLOYEES': [25.424, 68.327],
    'ROHAAN FARAZ': [25.380, 68.318],
    'SADIQ LIVNA': [25.378, 68.312],
    'GULISTAN-E-SARMAST': [25.385, 68.348],
    'NEW HYDERABAD CITY': [25.375, 68.310],
    'DAMAN-E-KOHSAR': [25.394, 68.358],
    'NAQASH VILLAS': [25.426, 68.322],
    'INK CITY': [25.376, 68.305],
    'ZULFIQAR ROYAL': [25.422, 68.320],
    'GULSHAN-E-SAJJAD': [25.421, 68.331],
    'HYDERABAD-BADIN': [25.380, 68.355],
    'BADIN ROAD': [25.380, 68.355],
    'GULSHAN-E-SHAHBAZ': [25.392, 68.298],
    'AL-MUSTAFA TOWN': [25.416, 68.334],
    'AL-RAHIM TOWN': [25.428, 68.318],
    'AL-HABEEB CITY': [25.396, 68.315],
    'GULSHAN-E-IQBAL': [25.423, 68.328],
    'QASIMABAD PHASE': [25.420, 68.330],
    'MEHRAN TOWN': [25.426, 68.325],
    'GREEN CITY': [25.398, 68.290],
    'TEACHERS SOCIETY': [25.425, 68.336],
  };

  // Helper: find housing GPS from location text
  function getHousingCoords(name, location) {
    const text = (name + ' ' + (location || '')).toUpperCase();
    for (const [key, coords] of Object.entries(housingGps)) {
      if (text.includes(key)) return coords;
    }
    // Fallback area-based (specific areas only)
    if (text.includes('LATIFABAD')) return [25.391, 68.352];
    if (text.includes('QASIMABAD')) return [25.422, 68.330];
    if (text.includes('BYPASS')) return [25.380, 68.315];
    if (text.includes('SITE')) return [25.388, 68.308];
    if (text.includes('JAMSHORO')) return [25.398, 68.290];
    if (text.includes('AIRPORT') || text.includes('SCHEME')) return [25.396, 68.315];
    if (text.includes('CANTT') || text.includes('SADDAR')) return [25.381, 68.378];
    return null; // No random default — only show real locations
  }

  // VIP Broker HQ marker (placed at Saddar, Hyderabad — central business area)
  const vipMarker = L.marker([25.381, 68.378], { icon: vipDot });
  vipMarker.addTo(mapInstance);
  vipMarker.bindPopup(popupHtml(
    '⭐ Zahid Hussain — VIP Broker HQ',
    'Al Habib Real Estate, Hyderabad',
    'VIP 5-Star Broker — All Societies',
    '<div style="background:#fff8e1;padding:6px 10px;border-radius:6px;font-size:0.75rem;color:#333"><b>Flats, Plazas, Plots & Houses</b><br>📞 03013501356</div>'
  ));

  // Buildings (gold dots) — ONLY show if real GPS coordinates exist
  allSocieties.forEach(s => {
    if (!s.latitude || !s.longitude) return; // Skip if no real GPS
    const lat = s.latitude;
    const lng = s.longitude;
    const m = L.marker([lat, lng], { icon: buildingDot });
    m.addTo(mapInstance);
    m.bindPopup(popupHtml(
      s.name, s.location, '🏢 Building / Apartment',
      `<div style="display:flex;gap:10px;margin-bottom:6px">
        <div style="text-align:center;flex:1;background:#f0f4ff;padding:6px;border-radius:6px">
          <div style="font-size:0.65rem;color:#888">Rent</div>
          <div style="font-weight:700;color:#4f8ef7;font-size:0.8rem">${s.rent_2bed_min ? 'PKR '+(s.rent_2bed_min/1000).toFixed(0)+'k+' : 'N/A'}</div>
        </div>
        <div style="text-align:center;flex:1;background:#f0fff4;padding:6px;border-radius:6px">
          <div style="font-size:0.65rem;color:#888">Sale</div>
          <div style="font-weight:700;color:#38d9c0;font-size:0.8rem">${s.sale_2bed_min ? (s.sale_2bed_min/100000).toFixed(0)+' Lac+' : 'N/A'}</div>
        </div>
      </div>`
    ));
  });

  // Flats (blue dots) — inherit parent building's real coordinates with small offset
  if (allListings && allListings.length) {
    allListings.forEach((f, i) => {
      const parent = societyCoords[f.society_name];
      if (!parent) return; // Skip if parent building has no GPS
      // Deterministic small jitter based on index so flats cluster near their building
      const angle = (i * 2.39996) % (Math.PI * 2); // golden angle spread
      const radius = 0.002 + (i % 5) * 0.001;
      const lat = parent.lat + Math.sin(angle) * radius;
      const lng = parent.lng + Math.cos(angle) * radius;
      const m = L.marker([lat, lng], { icon: flatDot });
      m.addTo(mapInstance);
      m.bindPopup(popupHtml(
        f.title || ('Flat #'+(i+1)),
        f.society_name || 'Hyderabad',
        f.type === 'rent' ? '🏠 For Rent' : '🏷️ For Sale',
        `<div style="font-size:0.78rem;color:#333;margin-bottom:4px">
          ${f.type === 'rent' ? '💰 Rent: PKR '+(f.price||0).toLocaleString()+'/mo' : '💰 Price: PKR '+(f.price||0).toLocaleString()}
          <br>${f.bedrooms || '?'} Bed · ${f.size_sqft || '?'} sqft
        </div>`
      ));
    });
  }

  // Housing societies (green dots) — ONLY show if real GPS coordinates found
  if (allHousing && allHousing.length) {
    allHousing.forEach((h, i) => {
      const coords = getHousingCoords(h.name, h.location);
      if (!coords) return; // Skip if no real GPS found
      // Small jitter so multiple societies in same area don't overlap
      const jLat = coords[0] + (Math.sin(i * 1.7) * 0.003);
      const jLng = coords[1] + (Math.cos(i * 1.7) * 0.003);
      const m = L.marker([jLat, jLng], { icon: housingDot });
      m.addTo(mapInstance);
      m.bindPopup(popupHtml(
        h.name, h.location || 'Hyderabad',
        '🏘️ Housing Society',
        `<div style="font-size:0.78rem;color:#333;margin-bottom:4px">
          ${h.plot_sizes || 'Various plots'}
          <br>${h.price_range || 'Contact for price'}
        </div>`
      ));
    });
  }
}

// ============================================================
// RATING TICKER
// ============================================================
function buildRatingTicker() {
  const items = [
    '⭐⭐⭐⭐⭐ Zahid Hussain Al Habib Real Estate — 03013501356',
    '🏆 Boulevard Heights (Auto Bhan) — Luxury Apts from 35k/month',
    '⭐⭐⭐⭐ Defence Garden Apartments (Cantt) — Minimal Load-shedding',
    '🏢 Cantonment Plaza — Prime Location, High Security',
    '⭐⭐⭐⭐ Royal Tower & Plaza — Qasimabad Main Road',
    '🌟 20 Verified Buildings in Hyderabad Sindh',
    '⭐⭐⭐⭐ Jumeirah Heights — Luxury 2-Bed from 70 Lac',
    '📞 Top Broker: Zahid Hussain — 03013501356',
    '🏗️ Wadhu Wah Avenue Tower — VIP 3-Bed from 1.25 Crore',
    '✅ 38 Verified Brokers | 20 Premium Buildings',
  ];
  const doubled = [...items, ...items];
  document.getElementById('ratingTicker').innerHTML =
    doubled.map(t => `<span class="ticker-item">${t}</span>`).join('');
}

// ============================================================
// AI CHATBOT
// ============================================================
function toggleChat() {
  chatOpen = !chatOpen;
  const widget = document.getElementById('chatWidget');
  if (chatOpen) {
    widget.classList.add('open');
    document.getElementById('chatInput').focus();
  } else {
    widget.classList.remove('open');
  }
}

function chatKeypress(e) {
  if (e.key === 'Enter') sendChat();
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendMsg('user', msg);
  chatHistory.push({ role: 'user', content: msg });

  const typingId = appendTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });
    const data = await res.json();
    removeTyping(typingId);
    const reply = data.reply || 'Sorry, could not get response.';
    appendMsg('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    
    // Auto-speak the reply for natural AI agent experience
    autoSpeakReply(reply);
  } catch {
    removeTyping(typingId);
    appendMsg('bot', 'Connection error. Please try again!');
  }
}

function appendMsg(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  // Simple markdown-like: **bold**, line breaks
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
  const speakBtn = role === 'bot'
    ? `<button class="msg-speak-btn" onclick="speakText(this, \`${text.replace(/`/g, "'").replace(/\\/g, "\\\\")}\`)">🔊 Speak</button>`
    : '';
  div.innerHTML = `<div class="msg-bubble">${formatted}${speakBtn}</div>`;
  const msgs = document.getElementById('chatMsgs');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const div = document.createElement('div');
  div.className = 'msg bot typing-bubble';
  div.id = id;
  div.innerHTML = `<div class="msg-bubble"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  const msgs = document.getElementById('chatMsgs');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ============================================================
// VOICE INPUT — Speech-to-Text (WhatsApp-style voice messages)
// ============================================================
let recognition = null;
let isRecording = false;

function toggleVoice() {
  // Check browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Voice input not supported in this browser. Use Chrome or Edge.');
    return;
  }

  const micBtn = document.getElementById('chatMic');

  if (isRecording) {
    // Stop recording
    if (recognition) recognition.stop();
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎤';
    return;
  }

  // Start recording
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'ur-PK'; // Default Urdu/Pakistan, will also detect English

  const input = document.getElementById('chatInput');
  const originalText = input.value;

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('recording');
    micBtn.textContent = '⏹️';
    showToast('🎤 Listening... Speak now! (Bolna shuru karein)');
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Show interim results as preview in input
    if (interimTranscript) {
      input.value = originalText + (originalText ? ' ' : '') + interimTranscript;
      input.style.borderColor = '#ff6b6b';
    }

    // When final result arrives, update input and auto-send
    if (finalTranscript) {
      input.value = originalText + (originalText ? ' ' : '') + finalTranscript;
      input.style.borderColor = '#38d9c0';
      // Auto-send after short delay
      setTimeout(() => {
        input.style.borderColor = '';
        sendChat();
      }, 500);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      showToast('No speech detected. Try again!');
    } else if (event.error === 'not-allowed') {
      showToast('Microphone access denied. Please allow mic permission.');
    } else {
      showToast('Voice error: ' + event.error);
    }
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎤';
    input.style.borderColor = '';
  };

  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.textContent = '🎤';
    input.style.borderColor = '';
  };

  recognition.start();
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ============================================================
// 4D PROPERTY SHOWCASE — Parallax Tilt + Copy + AI
// ============================================================
const showcaseImages = [
  { url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80', badge: 'LUXURY' },
  { url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80', badge: 'PREMIUM' },
  { url: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80', badge: 'NEW' },
  { url: 'https://images.unsplash.com/photo-1567684014761-b65e2e59b9eb?w=600&q=80', badge: 'HOT' },
  { url: 'https://images.unsplash.com/photo-1582407947092-67eacc073259?w=600&q=80', badge: 'VIP' },
  { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80', badge: 'TOP' },
];

function buildShowcase4D() {
  const grid = document.getElementById('showcaseGrid');
  if (!grid || !allListings.length) return;

  // Pick top 6 flats to showcase
  const picks = allListings.slice(0, 6);

  grid.innerHTML = picks.map((f, i) => {
    const img = showcaseImages[i % showcaseImages.length];
    const typeLabel = f.type === 'rent' ? '🏠 For Rent' : '🏷️ For Sale';
    const priceText = f.type === 'rent'
      ? 'PKR ' + (f.price || 0).toLocaleString() + '/mo'
      : 'PKR ' + (f.price || 0).toLocaleString();
    const beds = f.bedrooms || '?';
    const size = f.size_sqft || '?';
    const copyData = `${f.title || 'Flat'}\\n📍 ${f.society_name || 'Hyderabad'}\\n${typeLabel}\\n💰 ${priceText}\\n🛏️ ${beds} Bed · ${size} sqft\\n📞 03013501356`;

    return `<div class="showcase-card" data-copy="${copyData}" onmousemove="tilt4D(event, this)" onmouseleave="resetTilt(this)">
      <div class="showcase-glow"></div>
      <div style="position:relative;overflow:hidden;height:200px">
        <img src="${img.url}" class="showcase-card-img" alt="${f.title || 'Flat'}" loading="lazy" />
        <div class="showcase-card-overlay"></div>
        <span class="showcase-card-badge">${img.badge}</span>
      </div>
      <div class="showcase-card-body">
        <div class="showcase-card-name">${f.title || 'Flat #' + (i+1)}</div>
        <div class="showcase-card-loc">📍 ${f.society_name || 'Hyderabad'} — ${typeLabel}</div>
        <div class="showcase-card-info">
          <div class="showcase-card-stat">
            <div class="showcase-card-stat-label">Price</div>
            <div class="showcase-card-stat-val">${f.price ? 'PKR ' + (f.price/1000).toFixed(0) + 'k' : 'Contact'}</div>
          </div>
          <div class="showcase-card-stat">
            <div class="showcase-card-stat-label">Beds</div>
            <div class="showcase-card-stat-val">${beds} Bed</div>
          </div>
          <div class="showcase-card-stat">
            <div class="showcase-card-stat-label">Size</div>
            <div class="showcase-card-stat-val">${size} sqft</div>
          </div>
        </div>
        <div class="showcase-card-actions">
          <button class="showcase-btn-copy" onclick="copyProperty(this, \`${copyData}\`)">📋 Copy Details</button>
          <button class="showcase-btn-ai" onclick="askAIabout('${(f.society_name || 'Hyderabad').replace(/'/g, "\\'")}')">🤖 AI Agent</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function tilt4D(e, card) {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * -8;
  const rotateY = ((x - centerX) / centerX) * 8;

  card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;

  // Move glow follow
  const glow = card.querySelector('.showcase-glow');
  if (glow) {
    glow.style.left = (x - 60) + 'px';
    glow.style.top = (y - 60) + 'px';
  }
}

function resetTilt(card) {
  card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)';
}

function copyProperty(btn, data) {
  const text = data.replace(/\\n/g, '\n');
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = '📋 Copy Details';
    }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.textContent = '📋 Copy Details';
    }, 2000);
  });
}

function askAIabout(name) {
  // Open chat and pre-fill
  if (!chatOpen) toggleChat();
  const input = document.getElementById('chatInput');
  input.value = `Tell me everything about ${name} — pricing, availability, and nearby facilities`;
  input.focus();
}

// ============================================================
// 3D ANIMATED BACKGROUND — Houses + Rotating Globe
// ============================================================
function initBg3D() {
  if (typeof THREE === 'undefined') return;
  const container = document.getElementById('bg3d');
  if (!container) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020308, 0.012);
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 14);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);

  // Premium lighting setup
  const ambient = new THREE.AmbientLight(0x334466, 0.5);
  scene.add(ambient);
  
  const sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
  sunLight.position.set(15, 10, 8);
  scene.add(sunLight);
  
  const rimLight = new THREE.DirectionalLight(0x4488ff, 0.4);
  rimLight.position.set(-10, 5, -5);
  scene.add(rimLight);
  
  const pointGold = new THREE.PointLight(0xd4a853, 0.8, 35);
  pointGold.position.set(-6, 4, 2);
  scene.add(pointGold);
  
  const pointTeal = new THREE.PointLight(0x38d9c0, 0.5, 30);
  pointTeal.position.set(6, -2, 8);
  scene.add(pointTeal);

  // ---- PHOTOREALISTIC EARTH GLOBE ----
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';
  
  const globeGeo = new THREE.SphereGeometry(4.2, 128, 128);
  
  // Create canvas-based Earth texture (high quality procedural)
  const earthCanvas = document.createElement('canvas');
  earthCanvas.width = 2048;
  earthCanvas.height = 1024;
  const ctx = earthCanvas.getContext('2d');
  
  // Ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGrad.addColorStop(0, '#0a1f4a');
  oceanGrad.addColorStop(0.3, '#0d2d5c');
  oceanGrad.addColorStop(0.5, '#0f3366');
  oceanGrad.addColorStop(0.7, '#0d2d5c');
  oceanGrad.addColorStop(1, '#0a1f4a');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 1024);
  
  // Add ocean depth variations
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 2048;
    const y = Math.random() * 1024;
    const r = Math.random() * 40 + 5;
    const alpha = Math.random() * 0.05;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(20, 60, 120, ${alpha})`;
    ctx.fill();
  }
  
  // Continent shapes (simplified world map)
  const continents = [
    // North America
    { x: 300, y: 250, w: 350, h: 280, color: '#2d5a27' },
    { x: 280, y: 200, w: 200, h: 100, color: '#3a6b34' },
    // South America
    { x: 450, y: 520, w: 150, h: 280, color: '#2d6b27' },
    { x: 430, y: 480, w: 100, h: 100, color: '#357a2e' },
    // Europe
    { x: 950, y: 200, w: 200, h: 180, color: '#3d6b35' },
    { x: 900, y: 180, w: 150, h: 80, color: '#4a7a42' },
    // Africa
    { x: 1000, y: 380, w: 200, h: 320, color: '#5a7a32' },
    { x: 980, y: 350, w: 150, h: 100, color: '#6b8a3e' },
    // Asia
    { x: 1200, y: 180, w: 500, h: 350, color: '#3a6b30' },
    { x: 1150, y: 150, w: 300, h: 120, color: '#4a7b3a' },
    // Australia
    { x: 1600, y: 580, w: 200, h: 150, color: '#7a6a32' },
    // India
    { x: 1350, y: 380, w: 100, h: 150, color: '#4a7a38' },
    // Middle East
    { x: 1100, y: 340, w: 120, h: 100, color: '#6a7a3a' },
  ];
  
  continents.forEach(c => {
    // Draw main continent with irregular edges
    ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const rx = c.w / 2 * (0.7 + Math.random() * 0.4);
      const ry = c.h / 2 * (0.7 + Math.random() * 0.4);
      const px = c.x + Math.cos(angle) * rx;
      const py = c.y + Math.sin(angle) * ry;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = c.color;
    ctx.fill();
    
    // Add terrain texture
    for (let i = 0; i < 100; i++) {
      const tx = c.x + (Math.random() - 0.5) * c.w;
      const ty = c.y + (Math.random() - 0.5) * c.h;
      const tr = Math.random() * 15 + 3;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${60 + Math.random()*40}, ${100 + Math.random()*50}, ${40 + Math.random()*30}, ${Math.random() * 0.3})`;
      ctx.fill();
    }
  });
  
  // Add mountain ranges
  const mountains = [
    { x: 1300, y: 250, count: 30 }, // Himalayas
    { x: 400, y: 280, count: 20 },  // Rockies
    { x: 470, y: 600, count: 15 },  // Andes
    { x: 1050, y: 220, count: 10 }, // Alps
  ];
  mountains.forEach(m => {
    for (let i = 0; i < m.count; i++) {
      const mx = m.x + (Math.random() - 0.5) * 100;
      const my = m.y + (Math.random() - 0.5) * 50;
      ctx.beginPath();
      ctx.arc(mx, my, Math.random() * 8 + 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 170, 160, ${Math.random() * 0.4})`;
      ctx.fill();
    }
  });
  
  // Add city lights (bright dots)
  const cities = [
    [420, 280], [380, 320], [450, 350], // USA
    [470, 550], [490, 620], // South America
    [1000, 230], [1050, 250], [1080, 270], // Europe
    [1020, 420], [1060, 450], // Africa
    [1380, 300], [1400, 350], [1350, 280], // India/Asia
    [1500, 280], [1550, 320], // East Asia
    [1650, 620], // Australia
  ];
  cities.forEach(([cx, cy]) => {
    // City glow
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 120, 0.3)';
    ctx.fill();
    // City center
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
    ctx.fill();
  });
  
  // Create texture from canvas
  const earthTexture = new THREE.CanvasTexture(earthCanvas);
  
  // Night lights canvas
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = 2048;
  nightCanvas.height = 1024;
  const nctx = nightCanvas.getContext('2d');
  nctx.fillStyle = '#000000';
  nctx.fillRect(0, 0, 2048, 1024);
  
  // City lights for night
  cities.forEach(([cx, cy]) => {
    for (let i = 0; i < 30; i++) {
      const nx = cx + (Math.random() - 0.5) * 40;
      const ny = cy + (Math.random() - 0.5) * 30;
      nctx.beginPath();
      nctx.arc(nx, ny, Math.random() * 2 + 0.5, 0, Math.PI * 2);
      nctx.fillStyle = `rgba(255, ${200 + Math.random()*55}, ${100 + Math.random()*100}, ${Math.random() * 0.8 + 0.2})`;
      nctx.fill();
    }
  });
  const nightTexture = new THREE.CanvasTexture(nightCanvas);
  
  // Earth material with day/night
  const globeMat = new THREE.MeshPhongMaterial({
    map: earthTexture,
    emissiveMap: nightTexture,
    emissive: 0xffdd88,
    emissiveIntensity: 0.3,
    specular: 0x222244,
    shininess: 25,
    transparent: false,
  });
  
  const globe = new THREE.Mesh(globeGeo, globeMat);
  globe.position.set(9, 1, -8);
  scene.add(globe);
  
  // Atmosphere glow
  const atmosGeo = new THREE.SphereGeometry(4.35, 64, 64);
  const atmosMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
  });
  const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
  atmosphere.position.copy(globe.position);
  scene.add(atmosphere);

  // Cloud layer
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cctx = cloudCanvas.getContext('2d');
  cctx.fillStyle = 'rgba(0,0,0,0)';
  cctx.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 150; i++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 512;
    const cr = Math.random() * 60 + 20;
    const grad = cctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = grad;
    cctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  }
  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  
  const cloudGeo = new THREE.SphereGeometry(4.28, 64, 64);
  const cloudMat = new THREE.MeshPhongMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  });
  const clouds = new THREE.Mesh(cloudGeo, cloudMat);
  clouds.position.copy(globe.position);
  scene.add(clouds);

  // Globe orbit rings (gold & teal)
  const ringGeo = new THREE.TorusGeometry(5.5, 0.04, 8, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4a853, transparent: true, opacity: 0.4 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(globe.position);
  ring.rotation.x = Math.PI / 2.5;
  scene.add(ring);

  const ring2Geo = new THREE.TorusGeometry(5.8, 0.025, 8, 100);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38d9c0, transparent: true, opacity: 0.25 });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.position.copy(globe.position);
  ring2.rotation.x = Math.PI / 1.8;
  ring2.rotation.y = 0.3;
  scene.add(ring2);

  // Orbiting satellite
  const satGroup = new THREE.Group();
  const satBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.08, 0.15),
    new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.8 })
  );
  const satPanel1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.01, 0.12),
    new THREE.MeshPhongMaterial({ color: 0x2244aa, emissive: 0x1122aa, emissiveIntensity: 0.3 })
  );
  satPanel1.position.x = 0.2;
  const satPanel2 = satPanel1.clone();
  satPanel2.position.x = -0.2;
  satGroup.add(satBody, satPanel1, satPanel2);
  scene.add(satGroup);

  // ---- PHOTOREALISTIC BUILDINGS ----
  const houses = [];
  
  // Generate window texture for buildings
  function createBuildingTexture(width, height, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Building base color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 256);
    
    // Add subtle concrete/glass texture
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
      ctx.fillRect(Math.random() * 128, Math.random() * 256, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    
    // Windows
    const winW = 16;
    const winH = 20;
    const winGapX = 24;
    const winGapY = 32;
    const cols = Math.floor(128 / winGapX);
    const rows = Math.floor(256 / winGapY);
    
    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const isLit = Math.random() > 0.35;
        const wx = c * winGapX;
        const wy = r * winGapY;
        
        if (isLit) {
          // Lit window with warm glow
          const warmth = Math.random();
          const r2 = 200 + warmth * 55;
          const g2 = 180 + warmth * 40;
          const b2 = 100 + warmth * 50;
          ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
          ctx.fillRect(wx, wy, winW, winH);
          // Window glow
          ctx.fillStyle = `rgba(${r2},${g2},${b2},0.3)`;
          ctx.fillRect(wx - 2, wy - 2, winW + 4, winH + 4);
        } else {
          // Dark window (glass reflection)
          ctx.fillStyle = `rgba(30, 40, 60, 0.9)`;
          ctx.fillRect(wx, wy, winW, winH);
          // Slight reflection
          ctx.fillStyle = `rgba(100, 120, 150, 0.2)`;
          ctx.fillRect(wx, wy, winW / 2, winH / 3);
        }
        
        // Window frame
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(wx, wy, winW, winH);
      }
    }
    
    return new THREE.CanvasTexture(canvas);
  }
  
  const buildingStyles = [
    { color: '#1a2a4a', accent: 0x4488cc, name: 'modern-blue' },
    { color: '#2a1a3a', accent: 0x8844aa, name: 'modern-purple' },
    { color: '#1a3a2a', accent: 0x44aa88, name: 'modern-teal' },
    { color: '#3a2a1a', accent: 0xcc8844, name: 'modern-gold' },
    { color: '#2a2a2a', accent: 0x888888, name: 'modern-silver' },
    { color: '#3a1a1a', accent: 0xaa4444, name: 'modern-red' },
    { color: '#1a2a1a', accent: 0x44aa44, name: 'modern-green' },
  ];

  for (let i = 0; i < 28; i++) {
    const group = new THREE.Group();
    const style = buildingStyles[i % buildingStyles.length];
    
    // Varied building shapes
    const bodyW = 0.5 + Math.random() * 0.6;
    const bodyH = 1.0 + Math.random() * 2.5;
    const bodyD = 0.5 + Math.random() * 0.5;
    
    // Main building body with texture
    const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
    const buildingTex = createBuildingTexture(bodyW * 100, bodyH * 100, style.color);
    const bodyMat = new THREE.MeshPhongMaterial({
      map: buildingTex,
      specular: 0x333333,
      shininess: 60,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = bodyH / 2;
    body.castShadow = true;
    group.add(body);

    // Glass facade on front
    const glassGeo = new THREE.BoxGeometry(bodyW * 0.98, bodyH * 0.95, 0.02);
    const glassMat = new THREE.MeshPhongMaterial({
      color: style.accent,
      transparent: true,
      opacity: 0.15,
      specular: 0xffffff,
      shininess: 200,
      reflectivity: 1
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, bodyH / 2, bodyD / 2 + 0.01);
    group.add(glass);

    // Roof details
    const roofGeo = new THREE.BoxGeometry(bodyW * 1.05, 0.08, bodyD * 1.05);
    const roofMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      specular: 0x666666,
      shininess: 80
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = bodyH + 0.04;
    group.add(roof);
    
    // Rooftop equipment (AC units, water tank)
    if (bodyH > 1.5 && Math.random() > 0.3) {
      const acGeo = new THREE.BoxGeometry(0.12, 0.08, 0.1);
      const acMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
      for (let a = 0; a < 3; a++) {
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.set((Math.random() - 0.5) * bodyW * 0.6, bodyH + 0.12, (Math.random() - 0.5) * bodyD * 0.6);
        group.add(ac);
      }
    }

    // Antenna on tall buildings
    if (bodyH > 2.0) {
      const antGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.4, 4);
      const antMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });
      const ant = new THREE.Mesh(antGeo, antMat);
      ant.position.y = bodyH + 0.25;
      group.add(ant);
      // Aircraft warning light
      const lightGeo = new THREE.SphereGeometry(0.025, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1 });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.y = bodyH + 0.45;
      group.add(light);
    }

    // Building base/entrance
    const baseGeo = new THREE.BoxGeometry(bodyW * 1.1, 0.15, bodyD * 1.1);
    const baseMat = new THREE.MeshPhongMaterial({
      color: 0x222222,
      specular: 0x444444,
      shininess: 100
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.075;
    group.add(base);
    
    // Entrance canopy (on some buildings)
    if (Math.random() > 0.5) {
      const canopyGeo = new THREE.BoxGeometry(bodyW * 0.4, 0.02, 0.15);
      const canopyMat = new THREE.MeshPhongMaterial({ color: style.accent, emissive: style.accent, emissiveIntensity: 0.2 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set(0, 0.3, bodyD / 2 + 0.08);
      group.add(canopy);
    }

    // Position buildings in scene
    const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
    const radius = 5 + Math.random() * 12;
    group.position.set(
      Math.cos(angle) * radius,
      -3.5 + Math.random() * 6,
      -12 + Math.random() * 16
    );
    group.rotation.y = Math.random() * Math.PI;

    houses.push({
      mesh: group,
      baseY: group.position.y,
      speed: 0.12 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
      rotSpeed: 0.0005 + Math.random() * 0.0015
    });
    scene.add(group);
  }

  // ---- STARFIELD PARTICLES ----
  const starGeo = new THREE.BufferGeometry();
  const starCount = 800;
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  
  for (let i = 0; i < starCount; i++) {
    starPos[i*3] = (Math.random() - 0.5) * 80;
    starPos[i*3+1] = (Math.random() - 0.5) * 80;
    starPos[i*3+2] = (Math.random() - 0.5) * 80;
    
    const type = Math.random();
    if (type < 0.3) { // Gold
      starColors[i*3] = 0.85; starColors[i*3+1] = 0.66; starColors[i*3+2] = 0.13;
    } else if (type < 0.6) { // White
      starColors[i*3] = 0.95; starColors[i*3+1] = 0.95; starColors[i*3+2] = 1.0;
    } else if (type < 0.8) { // Blue
      starColors[i*3] = 0.4; starColors[i*3+1] = 0.6; starColors[i*3+2] = 0.9;
    } else { // Teal
      starColors[i*3] = 0.22; starColors[i*3+1] = 0.85; starColors[i*3+2] = 0.75;
    }
    starSizes[i] = Math.random() * 0.12 + 0.05;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({ 
    size: 0.12, 
    transparent: true, 
    opacity: 0.8, 
    vertexColors: true,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---- ANIMATION LOOP ----
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotate Earth realistically
    globe.rotation.y = t * 0.05;
    clouds.rotation.y = t * 0.03;
    atmosphere.rotation.y = t * 0.02;
    
    // Ring rotations
    ring.rotation.z = t * 0.04;
    ring2.rotation.z = -t * 0.03;

    // Satellite orbit
    const satOrbitR = 5.2;
    satGroup.position.set(
      globe.position.x + Math.cos(t * 0.25) * satOrbitR,
      globe.position.y + Math.sin(t * 0.4) * 0.8,
      globe.position.z + Math.sin(t * 0.25) * satOrbitR
    );
    satGroup.rotation.y = t * 0.5;

    // Float buildings with gentle motion
    houses.forEach(h => {
      h.mesh.position.y = h.baseY + Math.sin(t * h.speed + h.offset) * 0.35;
      h.mesh.rotation.y += h.rotSpeed;
    });

    // Pulse lights subtly
    pointGold.intensity = 0.7 + Math.sin(t * 0.6) * 0.2;
    pointTeal.intensity = 0.4 + Math.sin(t * 0.9 + 1) * 0.15;

    // Slow star rotation
    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.003;

    renderer.render(scene, camera);
  }
  animate();

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ============================================================
// TTS — Text to Speech (premium natural voice)
// ============================================================
let currentUtterance = null;
let bestVoices = {};

function loadBestVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  
  // Priority: Google > Microsoft > Apple > default
  // Prefer female voices for clearer sound
  const priorities = ['Google', 'Microsoft', 'Apple', 'Samsung', 'natural', 'premium'];
  const femaleNames = ['Samantha', 'Karen', 'Moira', 'Fiona', 'Tessa', 'Serena', 'Allison', 'Susan', 'Zira', 'Hazel'];
  
  ['en-US', 'en-GB', 'ur-PK', 'hi-IN', 'zh-CN'].forEach(lang => {
    const langVoices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    
    // Score each voice
    let best = null, bestScore = -1;
    langVoices.forEach(v => {
      let score = 0;
      priorities.forEach((p, i) => {
        if (v.name.toLowerCase().includes(p.toLowerCase())) score += (10 - i) * 5;
      });
      femaleNames.forEach(f => {
        if (v.name.includes(f)) score += 20;
      });
      if (v.localService === false) score += 15; // Cloud voices are better
      if (score > bestScore) { bestScore = score; best = v; }
    });
    if (best) bestVoices[lang] = best;
  });
}

// Load voices when available
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = loadBestVoices;
  setTimeout(loadBestVoices, 100);
  setTimeout(loadBestVoices, 500);
}

function speakText(btn, text) {
  // Stop any current speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.querySelectorAll('.msg-speak-btn.speaking').forEach(b => {
      b.classList.remove('speaking');
      b.textContent = '🔊 Speak';
    });
    if (btn.classList.contains('speaking')) return;
  }

  // Clean text for speech (remove markdown and emojis)
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<br\s*\/?>/g, '. ')
    .replace(/<[^>]+>/g, '')
    .replace(/\|/g, ', ')
    .replace(/[-]{2,}/g, ' ')
    .replace(/[📞🏢🏆💰⭐🏅🔍🏘️🏠🌟✅📍🏷️🛏️💬🔊🔇🎤⏹️]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // Detect language and select best voice
  let lang = 'en-US';
  if (/[\u0600-\u06FF]/.test(text)) {
    lang = 'ur-PK';
  } else if (/[\u4e00-\u9fff]/.test(text)) {
    lang = 'zh-CN';
  } else if (/[\u0900-\u097F]/.test(text)) {
    lang = 'hi-IN';
  }

  utterance.lang = lang;
  
  // Use best available voice for this language
  if (bestVoices[lang]) {
    utterance.voice = bestVoices[lang];
  } else if (bestVoices['en-US']) {
    utterance.voice = bestVoices['en-US'];
  }

  // Natural speech settings
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  utterance.volume = 1.0;

  btn.classList.add('speaking');
  btn.textContent = '🔇 Stop';

  utterance.onend = () => {
    btn.classList.remove('speaking');
    btn.textContent = '🔊 Speak';
  };
  utterance.onerror = () => {
    btn.classList.remove('speaking');
    btn.textContent = '🔊 Speak';
  };

  window.speechSynthesis.speak(utterance);
}

// ============================================================
// AI AGENT AUTO-SPEAK — speaks every reply naturally
// ============================================================
let agentVoiceEnabled = true; // auto-speak on by default

function autoSpeakReply(text) {
  if (!agentVoiceEnabled) return;
  if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
  
  // Clean text
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<br\s*\/?>/g, '. ')
    .replace(/<[^>]+>/g, '')
    .replace(/\|/g, ', ')
    .replace(/[-]{2,}/g, ' ')
    .replace(/[📞🏢🏆💰⭐🏅🔍🏘️🏠🌟✅📍🏷️🛏️💬🔊🔇🎤⏹️]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (!cleanText) return;
  
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Detect language
  let lang = 'en-US';
  if (/[\u0600-\u06FF]/.test(text)) {
    lang = 'ur-PK';
  } else if (/[\u4e00-\u9fff]/.test(text)) {
    lang = 'zh-CN';
  } else if (/[\u0900-\u097F]/.test(text)) {
    lang = 'hi-IN';
  }
  utterance.lang = lang;
  
  // Pick best voice
  if (bestVoices[lang]) utterance.voice = bestVoices[lang];
  else if (bestVoices['en-US']) utterance.voice = bestVoices['en-US'];
  
  // Natural agent voice settings
  utterance.rate = 0.93;
  utterance.pitch = 1.02;
  utterance.volume = 0.95;
  
  window.speechSynthesis.speak(utterance);
}

function toggleAgentVoice() {
  agentVoiceEnabled = !agentVoiceEnabled;
  const btn = document.getElementById('chatVoiceToggle');
  if (agentVoiceEnabled) {
    btn.textContent = '🔊';
    btn.classList.remove('muted');
    showToast('AI Agent voice: ON');
  } else {
    btn.textContent = '🔇';
    btn.classList.add('muted');
    window.speechSynthesis.cancel();
    showToast('AI Agent voice: OFF');
  }
}

// ============================================================
// AMBIENT MUSIC — Real MP3 Stream (Royalty-Free)
// Internet Archive CC BY-SA 4.0
// ============================================================
let ambientPlaying = false;
let ambientInitialized = false;

// Playlist of royalty-free ambient tracks (Internet Archive, CC BY-SA 4.0)
const ambientTracks = [
  'https://archive.org/download/100_free_royalty_background_music_tracks/AutoMeditate.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/dreams.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/FreeLife.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/StellarAndromeda.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/bright.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/palermo.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/Lotus.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/EccoPlasma.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/Pinnacle.mp3',
  'https://archive.org/download/100_free_royalty_background_music_tracks/Ways.mp3',
];
let currentTrackIdx = 0;

function getAmbientAudio() {
  return document.getElementById('ambientAudio');
}

function initAmbientMusic() {
  if (ambientInitialized) return;
  ambientInitialized = true;
  
  const audio = getAmbientAudio();
  if (!audio) return;
  
  // Set first track
  audio.src = ambientTracks[0];
  audio.volume = 0.15; // Soft background volume
  audio.loop = false; // We'll cycle tracks
  
  // When track ends, play next one
  audio.addEventListener('ended', () => {
    currentTrackIdx = (currentTrackIdx + 1) % ambientTracks.length;
    audio.src = ambientTracks[currentTrackIdx];
    audio.volume = 0.15;
    if (ambientPlaying) {
      audio.play().catch(() => {});
    }
  });
  
  // Show the button
  const btn = document.getElementById('ambientTopBtn');
  if (btn) btn.style.display = 'flex';
}

function toggleAmbientMusic() {
  const audio = getAmbientAudio();
  if (!audio) return;
  
  if (!ambientInitialized) initAmbientMusic();
  
  const btn = document.getElementById('ambientTopBtn');
  const icon = document.getElementById('ambientTopIcon');
  const label = document.getElementById('ambientTopLabel');
  
  if (ambientPlaying) {
    // Pause
    audio.pause();
    ambientPlaying = false;
    btn.classList.remove('playing');
    icon.textContent = '🔇';
    label.textContent = 'Music OFF';
  } else {
    // Play
    audio.volume = 0.15;
    audio.play().then(() => {
      ambientPlaying = true;
      btn.classList.add('playing');
      icon.textContent = '🎵';
      label.textContent = 'Music ON';
    }).catch(err => {
      console.warn('Audio play blocked:', err);
      showToast('Click again to play music');
    });
  }
}

// Auto-play on first user interaction (bypasses browser autoplay block)
function setupAmbientAutoPlay() {
  const handler = () => {
    if (!ambientInitialized) {
      initAmbientMusic();
      // Auto-play on first interaction
      const audio = getAmbientAudio();
      if (audio) {
        audio.volume = 0.12;
        audio.play().then(() => {
          ambientPlaying = true;
          const btn = document.getElementById('ambientTopBtn');
          const icon = document.getElementById('ambientTopIcon');
          const label = document.getElementById('ambientTopLabel');
          if (btn) btn.classList.add('playing');
          if (icon) icon.textContent = '🎵';
          if (label) label.textContent = 'Music ON';
        }).catch(() => {});
      }
    }
    // Remove listener after first trigger
    document.removeEventListener('click', handler);
    document.removeEventListener('touchstart', handler);
    document.removeEventListener('keydown', handler);
  };
  
  document.addEventListener('click', handler, { once: true });
  document.addEventListener('touchstart', handler, { once: true });
  document.addEventListener('keydown', handler, { once: true });
}
