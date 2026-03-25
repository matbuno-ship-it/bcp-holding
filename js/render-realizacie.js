(function () {
  var grid = document.getElementById('proj-grid');
  var noRes = document.getElementById('no-results');

  if (!grid) return;

  // Category class mapping
  function catClass(category) {
    if (category === 'Dátové rozvody') return 'cat-datove';
    return 'cat-elektro';
  }

  fetch('/data/realizacie.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = data.items || [];

      // Remove existing static cards (but keep #no-results)
      var existingCards = grid.querySelectorAll('.proj-card');
      existingCards.forEach(function (card) { card.remove(); });

      // Render cards
      items.forEach(function (item) {
        var article = document.createElement('article');
        article.className = 'proj-card';
        article.dataset.cat = item.category;
        article.dataset.href = '/realizacie/' + encodeURIComponent(item.id);

        article.innerHTML =
          '<div class="proj-img">' +
            '<img src="' + item.image + '" alt="' + item.title.replace(/"/g, '&quot;') + '" />' +
            '<span class="proj-cat ' + catClass(item.category) + '">' + item.category + '</span>' +
          '</div>' +
          '<div class="proj-body">' +
            '<h3 class="proj-title">' + item.title + '</h3>' +
            '<p class="proj-desc">' + item.description + '</p>' +
            '<div class="proj-footer">' +
              '<span class="proj-location">\uD83D\uDCCD ' + item.location + '</span>' +
              '<a href="/realizacie/' + encodeURIComponent(item.id) + '" class="proj-link">Detail <span>\u2192</span></a>' +
            '</div>' +
          '</div>';

        // Insert before #no-results if it exists, otherwise append
        if (noRes) {
          grid.insertBefore(article, noRes);
        } else {
          grid.appendChild(article);
        }
      });

      // Wire up card click behavior
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.proj-card');
        if (!card) return;
        // Don't hijack if clicking an actual link
        if (e.target.closest('a')) return;
        var href = card.dataset.href;
        if (href) window.location.href = href;
      });

      // Wire up filter buttons
      initFilters();
    })
    .catch(function (err) {
      console.error('Failed to load realizacie:', err);
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--grey);">' +
        'Nepodarilo sa na\u010D\u00EDta\u0165 projekty. Sk\u00FAste to nesk\u00F4r.' +
        '</div>';
    });

  function initFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.proj-card');
    var noResults = document.getElementById('no-results');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var cat = btn.dataset.cat;
        var visible = 0;

        cards.forEach(function (card) {
          if (cat === 'all' || card.dataset.cat === cat) {
            card.classList.remove('hidden');
            visible++;
          } else {
            card.classList.add('hidden');
          }
        });

        if (noResults) {
          noResults.classList.toggle('visible', visible === 0);
        }
      });
    });
  }
})();
