// ========================
// CINEXX – APP.JS (ADMIN ONLY)
// ========================

const API_BASE = 'https://cinestream.kraxx.my.id/'; // same domain

// ========================
// API
// ========================
async function apiFetch(path) {
  try {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    console.error('Fetch error:', e);
    return null;
  }
}

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

  const card = document.createElement('div');
  card.className = 'movie-card';

  card.innerHTML = `
    <span class="movie-card-quality">${quality}</span>
    <span class="movie-card-type">FILM</span>
    <img src="${placeholder(title)}" alt="${title}" loading="lazy"/>
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

  if (!items.length) {
    grid.innerHTML = `<div style="color:#777">Tidak ada data</div>`;
    return;
  }

  items.forEach(item => {
    grid.appendChild(renderCard(item));
  });
}

// ========================
// HERO
// ========================
let heroMovies = [];
let heroIndex = 0;

function setHero(movie) {
  if (!movie) return;

  const title = document.getElementById('heroTitle');
  const desc = document.getElementById('heroDesc');
  const meta = document.getElementById('heroMeta');

  title.textContent = movie.title;
  desc.textContent = movie.desc || 'Tidak ada deskripsi.';

  meta.innerHTML = `
    <span>⭐ ${movie.rating || '-'}</span>
    <span>${movie.year || '-'}</span>
    <span>${movie.genre || '-'}</span>
  `;

  document.getElementById('heroWatchBtn').onclick = () => {
    if (movie.embed) window.open(movie.embed, '_blank');
  };

  document.getElementById('heroInfoBtn').onclick = () => openDetail(movie);
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
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal">
      <button class="modal-close">✕</button>
      <h2>${movie.title}</h2>
      <p><b>Rating:</b> ⭐ ${movie.rating || '-'}</p>
      <p><b>Tahun:</b> ${movie.year || '-'}</p>
      <p><b>Genre:</b> ${movie.genre || '-'}</p>
      <p>${movie.desc || '-'}</p>
      ${
        movie.embed
          ? `<button onclick="window.open('${movie.embed}','_blank')">▶ Tonton</button>`
          : `<div style="color:#888">Tidak ada link video</div>`
      }
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// ========================
// SEARCH
// ========================
function doSearch() {
  const q = document.getElementById('searchInput')?.value?.toLowerCase();
  if (!q) return;

  const filtered = heroMovies.filter(f =>
    f.title.toLowerCase().includes(q)
  );

  populateGrid('trendingGrid', filtered);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch();
});

// ========================
// INIT
// ========================
async function initHome() {
  const films = await apiFetch('/api/films');

  if (!films) {
    console.error('API gagal');
    return;
  }

  if (!films.length) {
    document.getElementById('heroTitle').textContent = 'Belum ada film';
    return;
  }

  // HERO
  heroMovies = films;
  setHero(films[0]);
  heroIndex = 1;
  setInterval(rotateHero, 8000);

  // TRENDING (terbaru)
  populateGrid('trendingGrid', films.slice(0, 6));

  // POPULAR (rating >= 7)
  populateGrid(
    'popularGrid',
    films.filter(f => f.rating >= 7)
  );

  // TOP RATED
  populateGrid(
    'topRatedGrid',
    [...films].sort((a, b) => b.rating - a.rating).slice(0, 6)
  );

  // SERIES (opsional, berdasarkan genre)
  populateGrid(
    'seriesGrid',
    films.filter(f =>
      (f.genre || '').toLowerCase().includes('series')
    )
  );
}

// ========================
// RUN
// ========================
if (document.getElementById('trendingGrid')) {
  initHome();
}
