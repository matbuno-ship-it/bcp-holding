(function () {
  'use strict';

  var id = new URLSearchParams(location.search).get('id');
  if (!id) {
    // Clean URL fallback: /novinky/slug
    var parts = location.pathname.split('/');
    id = parts[parts.length - 1];
  }
  if (!id) { location.href = '/novinky'; return; }

  // Slovak month names
  var MONTHS = [
    'januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
    'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'
  ];

  function formatDate(iso) {
    var d = new Date(iso);
    return d.getDate() + '. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  fetch('data/novinky.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var item = data.items.find(function (n) { return n.id === id; });
      if (!item) { location.href = '/novinky'; return; }

      var dateFormatted = formatDate(item.date);

      // Page title
      document.title = item.title + ' | BCP HOLDING';
      var ptEl = document.getElementById('page-title');
      if (ptEl) ptEl.textContent = document.title;

      // Breadcrumb
      var bc = document.getElementById('breadcrumb-title');
      if (bc) bc.textContent = item.title;

      // Category badge
      var catEl = document.getElementById('news-category');
      if (catEl) catEl.textContent = item.category;

      // Title — wrap titleAccent in green span
      var h1 = document.getElementById('news-title');
      if (h1) {
        if (item.titleAccent && item.title.indexOf(item.titleAccent) !== -1) {
          var parts = item.title.split(item.titleAccent);
          h1.innerHTML = parts[0] + '<br><span class="txt-green">' + item.titleAccent + '</span>' + (parts[1] || '');
        } else {
          h1.textContent = item.title;
        }
      }

      // Meta
      var metaEl = document.getElementById('news-meta');
      if (metaEl) {
        metaEl.innerHTML =
          '<span>\uD83D\uDCC5 ' + dateFormatted + '</span>' +
          '<span>\u270D\uFE0F ' + item.author + '</span>' +
          '<span>\u23F1 ' + item.readTime + '</span>';
      }

      // Cover image
      var cover = document.getElementById('news-cover');
      if (cover) {
        cover.src = item.coverImage;
        cover.alt = item.title;
      }

      // Body — render markdown, then convert blockquotes to article-highlight
      var bodyEl = document.getElementById('article-body');
      if (bodyEl && item.body) {
        var html = marked.parse(item.body);

        // Convert <blockquote> to <div class="article-highlight">
        html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, function (match, inner) {
          return '<div class="article-highlight">' + inner + '</div>';
        });

        bodyEl.innerHTML = html;

        // Tags
        if (item.tags && item.tags.length) {
          var tagsHtml = '<div class="article-tags"><span>Témy:</span>';
          item.tags.forEach(function (t) {
            tagsHtml += '<span class="tag-chip">' + t + '</span>';
          });
          tagsHtml += '</div>';
          bodyEl.insertAdjacentHTML('beforeend', tagsHtml);
        }

        // Share buttons
        var shareHtml = '<div class="article-share">'
          + '<span class="share-label">Zdieľať:</span>'
          + '<button class="share-btn" id="share-copy">\uD83D\uDD17 Skopírovať odkaz</button>'
          + '<a class="share-btn" id="share-linkedin" href="#" target="_blank" rel="noopener">in LinkedIn</a>'
          + '<a class="share-btn" id="share-facebook" href="#" target="_blank" rel="noopener">f Facebook</a>'
          + '</div>';
        bodyEl.insertAdjacentHTML('beforeend', shareHtml);

        // Wire share buttons
        var pageUrl = location.href;
        var pageTitle = encodeURIComponent(item.title);

        var liBtn = document.getElementById('share-linkedin');
        if (liBtn) liBtn.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(pageUrl);

        var fbBtn = document.getElementById('share-facebook');
        if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);

        var copyBtn = document.getElementById('share-copy');
        if (copyBtn) {
          copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(pageUrl).then(function () {
              copyBtn.textContent = '\u2705 Skopírované!';
              setTimeout(function () { copyBtn.innerHTML = '\uD83D\uDD17 Skopírovať odkaz'; }, 2000);
            });
          });
        }
      }

      // Sidebar
      var sidebar = document.getElementById('news-sidebar');
      if (sidebar) {
        var rows = [
          { label: 'Dátum', value: dateFormatted },
          { label: 'Kategória', value: item.category },
          { label: 'Autor', value: item.author }
        ];
        var rowsHtml = '<h3>O článku</h3>';
        rows.forEach(function (r) {
          rowsHtml += '<div class="sb-info-row">'
            + '<span class="sb-info-label">' + r.label + '</span>'
            + '<span class="sb-info-value">' + r.value + '</span>'
            + '</div>';
        });
        sidebar.innerHTML = rowsHtml;
      }

      // Related articles
      var relGrid = document.getElementById('related-grid');
      if (relGrid && item.relatedIds && item.relatedIds.length) {
        var relHtml = '';
        item.relatedIds.forEach(function (rid) {
          var rel = data.items.find(function (n) { return n.id === rid; });
          if (!rel) return;
          var relDate = formatDate(rel.date);
          relHtml += '<a href="/novinky/' + rel.id + '" class="rel-card">'
            + '<div class="rel-img"><img src="' + rel.image + '" alt="' + rel.title + '" /></div>'
            + '<div class="rel-body">'
            + '<div class="rel-cat">' + rel.category + '</div>'
            + '<div class="rel-title">' + rel.title + '</div>'
            + '<div class="rel-date">' + relDate + '</div>'
            + '</div></a>';
        });
        relGrid.innerHTML = relHtml;
      }
    })
    .catch(function () {
      location.href = '/novinky';
    });
})();
