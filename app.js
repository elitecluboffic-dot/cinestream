// ========================
// CINEXX – APP.JS
// ========================

// Ganti dengan URL Cloudflare Worker lo nanti
const API_BASE = '
stream.internetdnsofficial.workers.dev';

const IMG_BASE = 'https://image.tmdb.org/t/p/';

// ========================
// UTILS
// ========================
function posterUrl(path, size = 'w342') {
  if (!path) return 'https://via.placeholder.com/342x513/12121a/444?text=No+Poster';
  return `${IMG_BASE}${size}${path}`;
}

function backdropUrl(path) {
  if (!path) return '';
  return `${IMG_BASE}w1280${path}`;
}

function year(dateStr) {
  if (!dateStr) return '–';
  return dateStr.split('-')[0];
}

function formatRating(r) {
  if (!r) return '–';
  return (Math.round(r * 10) / 10).toFixed(1);
}

// ========================
// API CALLS VIA WORKER
// ========================
async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    console.error('Fetch error:', e);
    return null;
  }
}

// ========================
// RENDER CARD
// ========================
function renderCard(item, type = 'movie') {
  const title = item.title || item.name || 'Unknown';
  const date = item.release_date || item.first_air_date || '';
  const rating = formatRating(item.vote_average);
  const quality = 'BLURAY';
  const typeLabel = type === 'tv' ? 'SERIES' : 'FILM';

  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <span class="movie-card-quality">${quality}</span>
    <span class="movie-card-type">${typeLabel}</span>
    <img src="${posterUrl(item.poster_path)}" alt="${title}" loading="lazy"/>
    <div class="movie-card-info">
      <div class="movie-card-title">${title}</div>
      <div class="movie-card-meta">
        <span>${year(date)}</span>
        <span class="movie-card-rating">⭐ ${rating}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openDetail(item.id, type));
  return card;
}

function populateGrid(gridId, items, type) {
  const grid = document.getElementById(gridId);
  if (!grid || !items) return;
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(renderCard(item, type)));
}

// ========================
// HERO SECTION
// ========================
let heroMovies = [];
let heroIndex = 0;

function setHero(movie) {
  const section = document.getElementById('heroSection');
  const title = document.getElementById('heroTitle');
  const desc = document.getElementById('heroDesc');
  const meta = document.getElementById('heroMeta');
  const watchBtn = document.getElementById('heroWatchBtn');
  const infoBtn = document.getElementById('heroInfoBtn');

  if (!movie) return;

  section.style.backgroundImage = `url('${backdropUrl(movie.backdrop_path)}')`;
  title.textContent = movie.title || movie.name;
  desc.textContent = movie.overview || 'Tidak ada deskripsi.';

  const rating = formatRating(movie.vote_average);
  const releaseYear = year(movie.release_date);
  meta.innerHTML = `
    <span class="rating">⭐ ${rating}</span>
    <span>${releaseYear}</span>
    ${movie.genre_ids ? '' : ''}
  `;

  watchBtn.onclick = () => {
    window.location.href = `watch.html?id=${movie.id}&type=movie`;
  };
  infoBtn.onclick = () => openDetail(movie.id, 'movie');
}

function rotateHero() {
  if (heroMovies.length === 0) return;
  setHero(heroMovies[heroIndex]);
  heroIndex = (heroIndex + 1) % Math.min(heroMovies.length, 5);
}

// ========================
// DETAIL MODAL
// ========================
async function openDetail(id, type) {
  const data = await apiFetch(`/detail?id=${id}&type=${type}`);
  if (!data) return;

  const title = data.title || data.name || 'Unknown';
  const rating = formatRating(data.vote_average);
  const releaseYear = year(data.release_date || data.first_air_date);
  const runtime = data.runtime ? `${data.runtime} mnt` : (data.number_of_seasons ? `${data.number_of_seasons} Season` : '');
  const genres = data.genres || [];
  const overview = data.overview || 'Tidak ada deskripsi.';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header" style="background-image: url('${backdropUrl(data.backdrop_path)}')">
        <div class="modal-header-overlay"></div>
        <button class="modal-close" id="modalClose">✕</button>
      </div>
      <div class="modal-body">
        <div class="modal-title">${title}</div>
        <div class="modal-meta">
          <span class="modal-rating">⭐ ${rating}</span>
          <span>${releaseYear}</span>
          <span>${runtime}</span>
          <span style="color:var(--accent);font-weight:600">${type === 'tv' ? 'SERIES' : 'FILM'}</span>
        </div>
        <div class="modal-genres">
          ${genres.map(g => `<span class="genre-pill">${g.name}</span>`).join('')}
        </div>
        <p class="modal-desc">${overview}</p>
        <div class="modal-actions">
          <button class="btn-watch" onclick="window.location.href='watch.html?id=${id}&type=${type}'">▶ Tonton Sekarang</button>
          <button class="btn-info" id="closeModalBtn">✕ Tutup</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay);
  });
  overlay.querySelector('#modalClose').addEventListener('click', () => closeModal(overlay));
  overlay.querySelector('#closeModalBtn').addEventListener('click', () => closeModal(overlay));
}

function closeModal(overlay) {
  overlay.remove();
  document.body.style.overflow = '';
}

// ========================
// SEARCH
// ========================
function doSearch() {
  const q = document.getElementById('searchInput')?.value?.trim();
  if (!q) return;
  window.location.href = `search.html?q=${encodeURIComponent(q)}`;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// ========================
// SCROLL NAVBAR
// ========================
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

// ========================
// INIT HOMEPAGE
// ========================
async function initHome() {
  const [trending, popular, topRated, series] = await Promise.all([
    apiFetch('/trending'),
    apiFetch('/popular?type=movie'),
    apiFetch('/toprated?type=movie'),
    apiFetch('/popular?type=tv'),
  ]);

  if (trending?.results) {
    heroMovies = trending.results;
    setHero(heroMovies[0]);
    heroIndex = 1;
    setInterval(rotateHero, 8000);
    populateGrid('trendingGrid', trending.results, 'movie');
  }

  if (popular?.results) populateGrid('popularGrid', popular.results, 'movie');
  if (topRated?.results) populateGrid('topRatedGrid', topRated.results, 'movie');
  if (series?.results) populateGrid('seriesGrid', series.results, 'tv');
}

// ========================
// RUN
// ========================
if (document.getElementById('trendingGrid')) {
  initHome();
}
