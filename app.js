// ========================
// CINEXX – APP.JS
// ========================

const WORKER_URL = 'https://stream.internetdnsofficial.workers.dev';

// ========================
// UTILS
// ========================
function placeholder(title) {
  return `https://via.placeholder.com/342x513/12121a/444?text=${encodeURIComponent(title)}`;
}

// ========================
// RENDER CARD
// ========================
function renderCard(item) {
  const title = item.title || 'Unknown';
  const year = item.year || '-';
  const rating = item.rating || '-';
  const quality = item.quality || 'HD';
  const type = item.type === 'tv' ? 'SERIES' : 'FILM';
  const imgSrc = item.poster || placeholder(title);

  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <span class="movie-card-quality">${quality}</span>
    <span class="movie-card-type">${type}</span>
    <img src="${imgSrc}" alt="${title}" loading="lazy"/>
    <div class="movie-card-info">
      <div class="movie-card-title">${title}</div>
      <div class="movie-card-meta">
        <span>${year}</span>
        <span class="movie-card-rating">⭐ ${rating}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openDetail(item));
  return card;
}

function populateGrid(gridId, items) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || !items.length) {
    grid.innerHTML = `<div style="color:#777;padding:1rem">Tidak ada data</div>`;
    return;
  }
  items.forEach(item => grid.appendChild(renderCard(item)));
}

// ========================
// HERO
// ========================
let heroMovies = [];
let heroIndex = 0;

function setHero(movie) {
  if (!movie) return;
  const titleEl = document.getElementById('heroTitle');
  const descEl = document.getElementById('heroDesc');
  const metaEl = document.getElementById('heroMeta');
  if (titleEl) titleEl.textContent = movie.title;
  if (descEl) descEl.textContent = movie.overview || movie.desc || 'Tidak ada deskripsi.';
  if (metaEl) metaEl.innerHTML = `
    <span>⭐ ${movie.rating || '-'}</span>
    <span>${movie.year || '-'}</span>
    <span>${movie.category || movie.genre || '-'}</span>
  `;
  const watchBtn = document.getElementById('heroWatchBtn');
  const infoBtn = document.getElementById('heroInfoBtn');
  if (watchBtn) watchBtn.onclick = () => openDetail(movie);
  if (infoBtn) infoBtn.onclick = () => openDetail(movie);
}

function rotateHero() {
  if (!heroMovies.length) return;
  setHero(heroMovies[heroIndex]);
  heroIndex = (heroIndex + 1) % heroMovies.length;
}

// ========================
// DETAIL MODAL
// ========================
function openDetail(movie) {
  const existing = document.getElementById('detailOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'detailOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close" id="detailClose">✕</button>
      <img src="${movie.poster || placeholder(movie.title)}"
           style="width:120px;border-radius:8px;float:right;margin:0 0 1rem 1rem"
           onerror="this.style.display='none'">
      <h2>${movie.title}</h2>
      <p style="margin:0.5rem 0;color:#aaa">
        ⭐ ${movie.rating || '-'} &nbsp;·&nbsp;
        ${movie.year || '-'} &nbsp;·&nbsp;
        ${movie.category || movie.genre || '-'} &nbsp;·&nbsp;
        <b>${movie.type === 'tv' ? 'Series' : 'Film'}</b>
      </p>
      <p style="margin:1rem 0;line-height:1.6;color:#ccc">${movie.overview || movie.desc || 'Tidak ada deskripsi.'}</p>
      <button id="detailWatchBtn" style="background:#e50914;color:white;border:none;padding:0.6rem 1.5rem;border-radius:6px;font-size:0.9rem;cursor:pointer">▶ Tonton</button>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('detailClose').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.getElementById('detailWatchBtn').onclick = () => {
    openPlayer(movie);
  };
}

// ========================
// PLAYER
// ========================
function openPlayer(movie) {
  if (!movie.tmdbId) {
    alert('Film ini tidak memiliki TMDB ID untuk diputar.');
    return;
  }

  const existing = document.getElementById('playerOverlay');
  if (existing) existing.remove();

  // Ambil daftar server dari localStorage (dari admin)
  let servers = [];
  try {
    const raw = localStorage.getItem('cinexx_db');
    if (raw) servers = JSON.parse(raw).servers || [];
  } catch (e) {}

  const activeServers = servers.filter(s => s.active);
  if (!activeServers.length) {
    activeServers.push({ name: 'Default', url: 'https://vidsrc.to/embed/{type}/{id}' });
  }

  let currentServer = 0;

  function buildEmbedUrl(srv) {
    return srv.url
      .replace('{id}', movie.tmdbId)
      .replace('{type}', movie.type || 'movie');
  }

  const overlay = document.createElement('div');
  overlay.id = 'playerOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem';

  overlay.innerHTML = `
    <div style="width:100%;max-width:900px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.8rem">
        <div style="font-weight:700;font-size:1rem">${movie.title}</div>
        <button id="playerClose" style="background:none;border:1px solid #444;color:white;width:32px;height:32px;border-radius:6px;cursor:pointer;font-size:1rem">✕</button>
      </div>
      <div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;flex-wrap:wrap" id="serverBtns">
        ${activeServers.map((s, i) => `
          <button class="srv-btn" data-i="${i}"
            style="background:${i===0?'#e50914':'#222'};color:white;border:1px solid #444;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;font-size:0.78rem">
            ${s.name}
          </button>
        `).join('')}
      </div>
      <div style="position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden">
        <iframe id="playerFrame"
          src="${buildEmbedUrl(activeServers[0])}"
          style="position:absolute;inset:0;width:100%;height:100%;border:none"
          allowfullscreen allow="autoplay; encrypted-media">
        </iframe>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('playerClose').onclick = () => overlay.remove();

  overlay.querySelectorAll('.srv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i);
      overlay.querySelectorAll('.srv-btn').forEach(b => b.style.background = '#222');
      btn.style.background = '#e50914';
      document.getElementById('playerFrame').src = buildEmbedUrl(activeServers[i]);
    });
  });
}

// ========================
// SEARCH
// ========================
function doSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const q = input.value.toLowerCase().trim();
  if (!q) return;
  // Cari dari cache films yang sudah dimuat
  const filtered = window._allFilms ? window._allFilms.filter(f =>
    f.title.toLowerCase().includes(q)
  ) : [];
  populateGrid('trendingGrid', filtered.length ? filtered : []);
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  const btn = document.getElementById('searchBtn');
  if (btn) btn.addEventListener('click', doSearch);
}

// ========================
// INIT
// ========================
async function initHome() {
  let films = [];

  // 1. Coba dari Worker KV
  try {
    const res = await fetch(WORKER_URL + '/api/films');
    if (res.ok) {
      films = await res.json();
    }
  } catch (e) {
    console.warn('Worker tidak bisa dijangkau, fallback ke localStorage');
  }

  // 2. Fallback ke localStorage jika Worker kosong/gagal
  if (!films.length) {
    try {
      const raw = localStorage.getItem('cinexx_db');
      if (raw) films = JSON.parse(raw).films || [];
    } catch (e) {}
  }

  // Simpan ke cache global untuk search
  window._allFilms = films;

  if (!films.length) {
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.textContent = 'Belum ada film';
    return;
  }

  // HERO
  const featuredFilms = films.filter(f => f.featured === 'yes');
  heroMovies = featuredFilms.length ? featuredFilms : films;
  setHero(heroMovies[0]);
  heroIndex = 1;
  setInterval(rotateHero, 8000);

  // GRIDS
  populateGrid('trendingGrid', films.slice(0, 6));
  populateGrid('popularGrid', films.filter(f => parseFloat(f.rating) >= 7).slice(0, 6));
  populateGrid('topRatedGrid', [...films].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 6));
  populateGrid('seriesGrid', films.filter(f => f.type === 'tv').slice(0, 6));
}

// ========================
// RUN
// ========================
document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  if (document.getElementById('trendingGrid')) {
    initHome();
  }
});
