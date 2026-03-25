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

  fetch('/data/novinky.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var items = data.items || [];
      console.log('Novinky loaded:', items.length, 'items');

      // Remove existing static cards
      var existingCards = grid.querySelectorAll('.news-card');
      existingCards.forEach(function (card) { card.remove(); });

      // Render cards
      items.forEach(function (item, index) {
        var article = document.createElement('article');
        var isFeatured = index === 0;
        article.className = 'news-card' + (isFeatured ? ' news-featured' : '');
        article.dataset.href = '/novinky/' + encodeURIComponent(item.id);

        article.innerHTML =
          '<div class="news-img">' +
            '<img src="' + item.image + '" alt="' + item.title.replace(/"/g, '&quot;') + '" />' +
          '</div>' +
          '<div class="news-body">' +
            '<div class="news-date">' + formatDate(item.date) + '</div>' +
            '<h3 class="news-title">' + item.title + '</h3>' +
            '<p class="news-desc">' + item.description + '</p>' +
            '<a href="/novinky/' + encodeURIComponent(item.id) + '" class="news-link">\u010C\u00EDta\u0165 viac \u2192</a>' +
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

    })
    .catch(function (err) {
      console.error('Failed to load novinky:', err);
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--grey);">' +
        'Nepodarilo sa na\u010D\u00EDta\u0165 novinky. Sk\u00FAste to nesk\u00F4r.' +
        '</div>';
    });
})();
