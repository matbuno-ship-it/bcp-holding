(function () {
  var grid = document.getElementById('news-grid');
  if (!grid) return;

  // Slovak month names
  var months = [
    'janu\u00E1ra', 'febru\u00E1ra', 'marca', 'apr\u00EDla', 'm\u00E1ja', 'j\u00FAna',
    'j\u00FAla', 'augusta', 'septembra', 'okt\u00F3bra', 'novembra', 'decembra'
  ];

  function formatDate(iso) {
    var parts = iso.split('-');
    var day = parseInt(parts[2], 10);
    var month = parseInt(parts[1], 10) - 1;
    var year = parts[0];
    return day + '. ' + months[month] + ' ' + year;
  }

  // Category class mapping
  function catClass(category) {
    var map = {
      'Spolo\u010Dnos\u0165': 'cat-spolocnost',
      'Projekt': 'cat-projekt',
      'Legislat\u00EDva': 'cat-legislativa',
      'Technika': 'cat-technika'
    };
    return map[category] || 'cat-projekt';
  }

  fetch('data/novinky.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = data.items || [];

      // Remove existing static cards
      var existingCards = grid.querySelectorAll('.news-card');
      existingCards.forEach(function (card) { card.remove(); });

      // Render cards
      items.forEach(function (item, index) {
        var article = document.createElement('article');
        var isFeatured = index === 0;
        article.className = 'news-card' + (isFeatured ? ' news-featured' : '');
        article.dataset.cat = item.category;
        article.dataset.href = 'novinka.html?id=' + encodeURIComponent(item.id);

        article.innerHTML =
          '<div class="news-img">' +
            '<img src="' + item.image + '" alt="' + item.title.replace(/"/g, '&quot;') + '" />' +
            '<span class="news-cat-badge ' + catClass(item.category) + '">' + item.category + '</span>' +
          '</div>' +
          '<div class="news-body">' +
            '<div class="news-date">' + formatDate(item.date) + '</div>' +
            '<h3 class="news-title">' + item.title + '</h3>' +
            '<p class="news-desc">' + item.description + '</p>' +
            '<a href="novinka.html?id=' + encodeURIComponent(item.id) + '" class="news-link">\u010C\u00EDta\u0165 viac \u2192</a>' +
          '</div>';

        grid.appendChild(article);
      });

      // Wire up card click behavior
      grid.addEventListener('click', function (e) {
        var card = e.target.closest('.news-card');
        if (!card) return;
        if (e.target.closest('a')) return;
        var href = card.dataset.href;
        if (href) window.location.href = href;
      });

      // Wire up filter buttons
      initFilters();
    })
    .catch(function (err) {
      console.error('Failed to load novinky:', err);
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--grey);">' +
        'Nepodarilo sa na\u010D\u00EDta\u0165 novinky. Sk\u00FAste to nesk\u00F4r.' +
        '</div>';
    });

  function initFilters() {
    var btns = document.querySelectorAll('.filter-btn');
    var cards = document.querySelectorAll('.news-card');

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var cat = btn.dataset.cat;
        cards.forEach(function (card) {
          var match = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('hidden', !match);
          if (match && card.classList.contains('news-featured') && cat !== 'all') {
            card.classList.remove('news-featured');
            card.dataset.wasFeatured = 'true';
          } else if (cat === 'all' && card.dataset.wasFeatured) {
            card.classList.add('news-featured');
          }
        });
      });
    });
  }
})();
