(function () {
  'use strict';

  var id = new URLSearchParams(location.search).get('id');
  if (!id) {
    // Clean URL fallback: /realizacie/slug
    var parts = location.pathname.split('/');
    id = parts[parts.length - 1];
  }
  if (!id) { location.href = '/realizacie'; return; }

  fetch('data/realizacie.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var item = data.items.find(function (p) { return p.id === id; });
      if (!item) { location.href = '/realizacie'; return; }

      // Page title
      document.title = item.title + ' — BCP HOLDING';
      var ptEl = document.getElementById('page-title');
      if (ptEl) ptEl.textContent = document.title;

      // Breadcrumb
      var bc = document.getElementById('breadcrumb-title');
      if (bc) bc.textContent = item.title;

      // Badge
      var badge = document.getElementById('proj-badge');
      if (badge) badge.textContent = item.category;

      // Title
      var h1 = document.getElementById('proj-title');
      if (h1) h1.innerHTML = item.title + ' &mdash;<br><span class="txt-green">' + item.titleAccent + '</span>';

      // Meta pills
      var meta = document.getElementById('proj-meta');
      if (meta) {
        var pills = [];
        if (item.location) pills.push({ emoji: '\uD83D\uDCCD', text: item.location });
        if (item.year) pills.push({ emoji: '\uD83D\uDCC5', text: item.year });
        if (item.client) pills.push({ emoji: '\uD83C\uDFE2', text: item.client });
        if (item.type) pills.push({ emoji: '\u26A1', text: item.type });
        meta.innerHTML = pills.map(function (p) {
          return '<span class="meta-pill">' + p.emoji + ' <strong>' + p.text + '</strong></span>';
        }).join('');
      }

      // Gallery
      var gallery = document.getElementById('gallery');
      if (gallery && item.gallery && item.gallery.length) {
        var MAX_VISIBLE = 6;
        var total = item.gallery.length;
        var visible = item.gallery.slice(0, MAX_VISIBLE);
        var html = '';

        visible.forEach(function (img, i) {
          var featuredClass = img.featured ? ' g-featured' : '';
          var isLast = (i === visible.length - 1) && (total > MAX_VISIBLE);
          var moreOverlay = isLast
            ? '<div class="g-more-overlay">+' + (total - MAX_VISIBLE) + ' more</div>'
            : '';
          html += '<div class="g-item' + featuredClass + '" data-index="' + i + '">'
            + '<img src="' + img.url + '" alt="' + img.alt + '" />'
            + '<div class="g-item-overlay"><div class="g-zoom-icon">\uD83D\uDD0D</div></div>'
            + moreOverlay
            + '</div>';
        });
        gallery.innerHTML = html;

        // Wire up lightbox
        wireLightbox(item.gallery);
      }

      // About
      var aboutEl = document.getElementById('proj-about');
      if (aboutEl) {
        var aboutHtml = '';
        if (item.about) aboutHtml += '<p>' + item.about + '</p>';
        if (item.aboutExtra) aboutHtml += '<p>' + item.aboutExtra + '</p>';
        aboutEl.innerHTML = aboutHtml;
      }

      // Scope
      var scopeEl = document.getElementById('proj-scope');
      if (scopeEl && item.scope) {
        scopeEl.innerHTML = item.scope.map(function (s) {
          return '<li>' + s + '</li>';
        }).join('');
      }

      // Sidebar
      var sidebar = document.getElementById('proj-sidebar');
      if (sidebar) {
        var rows = [];
        if (item.location) rows.push({ label: 'Lokalita', value: item.location });
        if (item.category) rows.push({ label: 'Kategória', value: item.category });
        if (item.client) rows.push({ label: 'Klient', value: item.client });
        if (item.type) rows.push({ label: 'Typ prác', value: item.type });
        sidebar.innerHTML = rows.map(function (r) {
          return '<div class="sb-row">'
            + '<span class="sb-label">' + r.label + '</span>'
            + '<span class="sb-value">' + r.value + '</span>'
            + '</div>';
        }).join('');
      }

      // Related projects
      var relGrid = document.getElementById('related-grid');
      if (relGrid && item.relatedIds && item.relatedIds.length) {
        var relHtml = '';
        item.relatedIds.forEach(function (rid) {
          var rel = data.items.find(function (p) { return p.id === rid; });
          if (!rel) return;
          relHtml += '<a href="/realizacie/' + rel.id + '" class="rel-card">'
            + '<div class="rel-img"><img src="' + rel.image + '" alt="' + rel.title + '" /></div>'
            + '<div class="rel-body">'
            + '<div class="rel-cat">' + rel.category + '</div>'
            + '<div class="rel-title">' + rel.title + '</div>'
            + '</div></a>';
        });
        relGrid.innerHTML = relHtml;
      }
    })
    .catch(function () {
      location.href = '/realizacie';
    });

  // Lightbox wiring
  function wireLightbox(images) {
    var lightbox = document.getElementById('lightbox');
    var lbImg = document.getElementById('lb-img');
    var lbClose = document.getElementById('lb-close');
    var lbPrev = document.getElementById('lb-prev');
    var lbNext = document.getElementById('lb-next');
    var lbCounter = document.getElementById('lb-counter');
    if (!lightbox || !lbImg) return;

    var current = 0;

    function show() {
      lbImg.src = images[current].url;
      lbImg.alt = images[current].alt;
      lbCounter.textContent = (current + 1) + ' / ' + images.length;
    }
    function open(index) {
      current = index;
      show();
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    function prev() { current = (current - 1 + images.length) % images.length; show(); }
    function next() { current = (current + 1) % images.length; show(); }

    // Attach click to gallery items (use event delegation)
    var galleryEl = document.getElementById('gallery');
    if (galleryEl) {
      galleryEl.addEventListener('click', function (e) {
        var item = e.target.closest('.g-item');
        if (!item) return;
        var idx = parseInt(item.getAttribute('data-index'), 10);
        open(idx);
      });
    }

    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', prev);
    lbNext.addEventListener('click', next);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });
  }
})();
