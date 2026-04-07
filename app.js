var WORKER_URL = 'https://stream.internetdnsofficial.workers.dev';
var heroMovies = [];
var heroIndex = 0;
var allFilms = [];

function placeholder(title) {
  return 'https://via.placeholder.com/342x513/12121a/444?text=' + encodeURIComponent(title);
}

function renderCard(item) {
  var title = item.title || 'Unknown';
  var year = item.year || '-';
  var rating = item.rating || '-';
  var quality = item.quality || 'HD';
  var type = item.type === 'tv' ? 'SERIES' : 'FILM';
  var imgSrc = item.poster || placeholder(title);

  var card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML =
    '<span class="movie-card-quality">' + quality + '</span>' +
    '<span class="movie-card-type">' + type + '</span>' +
    '<img src="' + imgSrc + '" alt="' + title + '" loading="lazy" onerror="this.src=\'' + placeholder(title) + '\'">' +
    '<div class="movie-card-info">' +
      '<div class="movie-card-title">' + title + '</div>' +
      '<div class="movie-card-meta">' +
        '<span>' + year + '</span>' +
        '<span class="movie-card-rating">&#9733; ' + rating + '</span>' +
      '</div>' +
    '</div>';

  card.addEventListener('click', function() { openDetail(item); });
  return card;
}

function populateGrid(gridId, items) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || !items.length) {
    grid.innerHTML = '<div style="color:#777;padding:1rem">Tidak ada data</div>';
    return;
  }
  for (var i = 0; i < items.length; i++) {
    grid.appendChild(renderCard(items[i]));
  }
}

function setHero(movie) {
  if (!movie) return;
  var t = document.getElementById('heroTitle');
  var d = document.getElementById('heroDesc');
  var m = document.getElementById('heroMeta');
  if (t) t.textContent = movie.title;
  if (d) d.textContent = movie.overview || movie.desc || 'Tidak ada deskripsi.';
  if (m) m.innerHTML =
    '<span>&#9733; ' + (movie.rating || '-') + '</span>' +
    '<span>' + (movie.year || '-') + '</span>' +
    '<span>' + (movie.category || movie.genre || '-') + '</span>';

  var wb = document.getElementById('heroWatchBtn');
  var ib = document.getElementById('heroInfoBtn');
  if (wb) wb.onclick = function() { openDetail(movie); };
  if (ib) ib.onclick = function() { openDetail(movie); };
}

function rotateHero() {
  if (!heroMovies.length) return;
  setHero(heroMovies[heroIndex]);
  heroIndex = (heroIndex + 1) % heroMovies.length;
}

function openDetail(movie) {
  var old = document.getElementById('detailOverlay');
  if (old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'detailOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem';

  var imgSrc = movie.poster || placeholder(movie.title);
  overlay.innerHTML =
    '<div style="background:#1a1a26;border-radius:12px;padding:2rem;max-width:520px;width:100%;position:relative;max-height:90vh;overflow-y:auto">' +
      '<button id="detailClose" style="position:absolute;top:1rem;right:1rem;background:none;border:1px solid #444;color:white;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:1rem">x</button>' +
      '<img src="' + imgSrc + '" style="width:100px;border-radius:8px;float:right;margin:0 0 1rem 1rem" onerror="this.style.display=\'none\'">' +
      '<h2 style="margin:0 0 0.5rem">' + movie.title + '</h2>' +
      '<p style="color:#aaa;margin:0 0 1rem">&#9733; ' + (movie.rating||'-') + '   ' + (movie.year||'-') + '   ' + (movie.category||'-') + '</p>' +
      '<p style="color:#ccc;line-height:1.6;margin:0 0 1.5rem">' + (movie.overview||movie.desc||'Tidak ada deskripsi.') + '</p>' +
      '<button id="detailWatch" style="background:#e50914;color:white;border:none;padding:0.6rem 1.5rem;border-radius:6px;cursor:pointer;font-size:0.9rem">Tonton</button>' +
    '</div>';

  document.body.appendChild(overlay);
  document.getElementById('detailClose').onclick = function() { overlay.remove(); };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
  document.getElementById('detailWatch').onclick = function() { openPlayer(movie); };
}

function openPlayer(movie) {
  if (!movie.tmdbId) { alert('Tidak ada TMDB ID.'); return; }

  var old = document.getElementById('playerOverlay');
  if (old) old.remove();

  var servers = [];
  try {
    var raw = localStorage.getItem('cinexx_db');
    if (raw) servers = JSON.parse(raw).servers || [];
  } catch(e) {}

  var active = servers.filter(function(s) { return s.active; });
  if (!active.length) active = [{ name: 'Default', url: 'https://vidsrc.to/embed/{type}/{id}' }];

  function buildUrl(srv) {
    return srv.url.replace('{id}', movie.tmdbId).replace('{type}', movie.type || 'movie');
  }

  var btnHtml = '';
  for (var i = 0; i < active.length; i++) {
    btnHtml += '<button class="srv-btn" data-i="' + i + '" style="background:' + (i===0?'#e50914':'#333') + ';color:white;border:1px solid #555;padding:0.3rem 0.8rem;border-radius:5px;cursor:pointer;font-size:0.78rem">' + active[i].name + '</button>';
  }

  var overlay = document.createElement('div');
  overlay.id = 'playerOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem';
  overlay.innerHTML =
    '<div style="width:100%;max-width:900px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">' +
        '<b>' + movie.title + '</b>' +
        '<button id="playerClose" style="background:none;border:1px solid #555;color:white;width:32px;height:32px;border-radius:6px;cursor:pointer">x</button>' +
      '</div>' +
      '<div style="display:flex;gap:0.5rem;margin-bottom:0.8rem;flex-wrap:wrap">' + btnHtml + '</div>' +
      '<div style="position:relative;padding-top:56.25%;background:#000;border-radius:8px;overflow:hidden">' +
        '<iframe id="playerFrame" src="' + buildUrl(active[0]) + '" style="position:absolute;inset:0;width:100%;height:100%;border:none" allowfullscreen allow="autoplay;encrypted-media"></iframe>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  document.getElementById('playerClose').onclick = function() { overlay.remove(); };

  var btns = overlay.querySelectorAll('.srv-btn');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      var idx = parseInt(this.dataset.i);
      for (var k = 0; k < btns.length; k++) btns[k].style.background = '#333';
      this.style.background = '#e50914';
      document.getElementById('playerFrame').src = buildUrl(active[idx]);
    });
  }
}

function doSearch() {
  var input = document.getElementById('searchInput');
  if (!input) return;
  var q = input.value.toLowerCase().trim();
  if (!q) { initHome(); return; }
  var filtered = allFilms.filter(function(f) {
    return f.title.toLowerCase().indexOf(q) !== -1;
  });
  populateGrid('trendingGrid', filtered);
  populateGrid('popularGrid', []);
  populateGrid('topRatedGrid', []);
  populateGrid('seriesGrid', []);
}

function initHome() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', WORKER_URL + '/api/films', true);
  xhr.onload = function() {
    var films = [];
    try { films = JSON.parse(xhr.responseText); } catch(e) {}

    if (!films.length) {
      try {
        var raw = localStorage.getItem('cinexx_db');
        if (raw) films = JSON.parse(raw).films || [];
      } catch(e) {}
    }

    allFilms = films;

    if (!films.length) {
      var ht = document.getElementById('heroTitle');
      if (ht) ht.textContent = 'Belum ada film';
      populateGrid('trendingGrid', []);
      populateGrid('popularGrid', []);
      populateGrid('topRatedGrid', []);
      populateGrid('seriesGrid', []);
      return;
    }

    var featured = films.filter(function(f) { return f.featured === 'yes'; });
    heroMovies = featured.length ? featured : films;
    setHero(heroMovies[0]);
    heroIndex = 1;
    setInterval(rotateHero, 8000);

    populateGrid('trendingGrid', films.slice(0, 6));
    populateGrid('popularGrid', films.filter(function(f) { return parseFloat(f.rating) >= 7; }).slice(0, 6));
    populateGrid('topRatedGrid', films.slice().sort(function(a,b) { return parseFloat(b.rating)-parseFloat(a.rating); }).slice(0, 6));
    populateGrid('seriesGrid', films.filter(function(f) { return f.type === 'tv'; }).slice(0, 6));
  };
  xhr.onerror = function() {
    try {
      var raw = localStorage.getItem('cinexx_db');
      var films = raw ? JSON.parse(raw).films || [] : [];
      allFilms = films;
      if (films.length) {
        heroMovies = films;
        setHero(films[0]);
        heroIndex = 1;
        setInterval(rotateHero, 8000);
        populateGrid('trendingGrid', films.slice(0, 6));
        populateGrid('popularGrid', films.filter(function(f) { return parseFloat(f.rating) >= 7; }).slice(0, 6));
        populateGrid('topRatedGrid', films.slice().sort(function(a,b) { return parseFloat(b.rating)-parseFloat(a.rating); }).slice(0, 6));
        populateGrid('seriesGrid', films.filter(function(f) { return f.type === 'tv'; }).slice(0, 6));
      }
    } catch(e) {}
  };
  xhr.send();
}

window.onload = function() {
  var searchBtn = document.getElementById('searchBtn');
  if (searchBtn) searchBtn.onclick = doSearch;
  var searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSearch();
  });
  initHome();
};
