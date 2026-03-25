(function () {
  'use strict';

  var STORAGE_KEY = 'bcp_cookie_consent';
  var settingsOpen = false;

  // ── CSS ──────────────────────────────────────────────────────────────
  var css = '\
#bcp-cookie-banner{position:fixed;bottom:0;left:0;right:0;width:100%;z-index:10000;\
background:rgba(7,0,31,0.97);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);\
border-top:1px solid rgba(110,69,255,0.25);font-family:inherit;color:#fff;\
transition:transform .4s ease;}\
#bcp-cookie-banner.bcp-hidden{transform:translateY(100%);pointer-events:none;}\
#bcp-cookie-banner *{box-sizing:border-box;}\
.bcp-cb-inner{max-width:1140px;margin:0 auto;padding:1.5rem;}\
.bcp-cb-text{font-size:.935rem;line-height:1.6;color:rgba(255,255,255,0.85);margin:0 0 1.25rem;}\
.bcp-cb-text a{color:#6e45ff;text-decoration:underline;}\
.bcp-cb-text a:hover{color:#8f6fff;}\
.bcp-cb-buttons{display:flex;gap:.75rem;flex-wrap:wrap;}\
.bcp-cb-buttons button{padding:.7rem 1.5rem;border-radius:8px;font-size:.875rem;font-weight:600;\
cursor:pointer;transition:background .2s,border-color .2s,color .2s;font-family:inherit;line-height:1.4;}\
.bcp-btn-accept{background:#6e45ff;color:#fff;border:2px solid #6e45ff;}\
.bcp-btn-accept:hover{background:#5a34e6;border-color:#5a34e6;}\
.bcp-btn-reject{background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.25);}\
.bcp-btn-reject:hover{border-color:rgba(255,255,255,0.5);}\
.bcp-btn-settings{background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.25);}\
.bcp-btn-settings:hover{border-color:rgba(255,255,255,0.5);}\
\
.bcp-cb-settings{max-height:0;overflow:hidden;transition:max-height .4s ease;}\
.bcp-cb-settings.bcp-open{max-height:500px;}\
.bcp-cb-settings-inner{padding:1.25rem 0 0;border-top:1px solid rgba(255,255,255,0.08);margin-top:1.25rem;}\
.bcp-cb-toggle-row{display:flex;align-items:center;justify-content:space-between;\
padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,0.06);}\
.bcp-cb-toggle-row:last-child{border-bottom:none;}\
.bcp-cb-toggle-info{flex:1;padding-right:1rem;}\
.bcp-cb-toggle-label{font-size:.875rem;font-weight:600;color:#fff;margin:0 0 .2rem;}\
.bcp-cb-toggle-desc{font-size:.8rem;color:rgba(255,255,255,0.55);margin:0;line-height:1.45;}\
\
.bcp-toggle{position:relative;width:44px;height:24px;flex-shrink:0;}\
.bcp-toggle input{opacity:0;width:0;height:0;position:absolute;}\
.bcp-toggle-track{position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;\
background:rgba(255,255,255,0.15);cursor:pointer;transition:background .25s;}\
.bcp-toggle input:checked+.bcp-toggle-track{background:#6e45ff;}\
.bcp-toggle input:disabled+.bcp-toggle-track{cursor:not-allowed;opacity:.7;}\
.bcp-toggle-knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;\
background:#fff;transition:transform .25s;pointer-events:none;}\
.bcp-toggle input:checked~.bcp-toggle-knob{transform:translateX(20px);}\
\
@media(max-width:580px){\
.bcp-cb-buttons{flex-direction:column;}\
.bcp-cb-buttons button{width:100%;}\
.bcp-cb-toggle-row{flex-wrap:wrap;gap:.5rem;}\
.bcp-cb-toggle-info{width:100%;padding-right:0;}\
}';

  // ── HTML ─────────────────────────────────────────────────────────────
  var html = '\
<div class="bcp-cb-inner">\
  <p class="bcp-cb-text">Táto webová stránka používa cookies na zabezpečenie správneho fungovania \
a zlepšenie vášho zážitku. Viac informácií nájdete v našich \
<a href="ochrana-osobnych-udajov.html">zásadách ochrany osobných údajov</a>.</p>\
  <div class="bcp-cb-buttons">\
    <button class="bcp-btn-accept" id="bcp-cb-accept">Prijať všetky</button>\
    <button class="bcp-btn-reject" id="bcp-cb-reject">Odmietnuť všetky</button>\
    <button class="bcp-btn-settings" id="bcp-cb-settings-btn">Nastavenia</button>\
  </div>\
  <div class="bcp-cb-settings" id="bcp-cb-settings-panel">\
    <div class="bcp-cb-settings-inner">\
      <div class="bcp-cb-toggle-row">\
        <div class="bcp-cb-toggle-info">\
          <p class="bcp-cb-toggle-label">Nevyhnutné cookies</p>\
          <p class="bcp-cb-toggle-desc">Potrebné pre základné fungovanie stránky.</p>\
        </div>\
        <label class="bcp-toggle">\
          <input type="checkbox" checked disabled id="bcp-tog-essential">\
          <span class="bcp-toggle-track"></span>\
          <span class="bcp-toggle-knob"></span>\
        </label>\
      </div>\
      <div class="bcp-cb-toggle-row">\
        <div class="bcp-cb-toggle-info">\
          <p class="bcp-cb-toggle-label">Analytické cookies</p>\
          <p class="bcp-cb-toggle-desc">Pomáhajú nám pochopiť, ako návštevníci používajú stránku.</p>\
        </div>\
        <label class="bcp-toggle">\
          <input type="checkbox" id="bcp-tog-analytics">\
          <span class="bcp-toggle-track"></span>\
          <span class="bcp-toggle-knob"></span>\
        </label>\
      </div>\
      <div class="bcp-cb-toggle-row">\
        <div class="bcp-cb-toggle-info">\
          <p class="bcp-cb-toggle-label">Marketingové cookies</p>\
          <p class="bcp-cb-toggle-desc">Používané na zobrazovanie relevantného obsahu a reklám.</p>\
        </div>\
        <label class="bcp-toggle">\
          <input type="checkbox" id="bcp-tog-marketing">\
          <span class="bcp-toggle-track"></span>\
          <span class="bcp-toggle-knob"></span>\
        </label>\
      </div>\
    </div>\
  </div>\
</div>';

  // ── Inject styles ────────────────────────────────────────────────────
  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Inject banner ───────────────────────────────────────────────────
  function injectBanner() {
    var banner = document.getElementById('bcp-cookie-banner');
    if (banner) return banner;

    banner = document.createElement('div');
    banner.id = 'bcp-cookie-banner';
    banner.classList.add('bcp-hidden');
    banner.innerHTML = html;
    document.body.appendChild(banner);
    return banner;
  }

  // ── Get today's date string ─────────────────────────────────────────
  function todayString() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // ── Read / write consent ────────────────────────────────────────────
  function getConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(essential, analytics, marketing) {
    var consent = {
      essential: essential,
      analytics: analytics,
      marketing: marketing,
      timestamp: todayString()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {
      // storage full or unavailable — fail silently
    }
    applyConsent(consent);
  }

  // ── Apply consent (Google Maps iframes) ─────────────────────────────
  function applyConsent(consent) {
    var iframes = document.querySelectorAll('iframe[data-consent-src]');
    var placeholder = document.getElementById('maps-consent-placeholder');

    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      if (consent.marketing) {
        iframe.src = iframe.getAttribute('data-consent-src');
        iframe.style.display = '';
      } else {
        iframe.removeAttribute('src');
        iframe.style.display = 'none';
      }
    }

    if (placeholder) {
      placeholder.style.display = consent.marketing ? 'none' : '';
    }
  }

  // ── Show / hide banner ──────────────────────────────────────────────
  function showBanner() {
    var banner = injectBanner();

    // Reset settings panel state
    settingsOpen = false;
    var panel = document.getElementById('bcp-cb-settings-panel');
    var settingsBtn = document.getElementById('bcp-cb-settings-btn');
    if (panel) panel.classList.remove('bcp-open');
    if (settingsBtn) settingsBtn.textContent = 'Nastavenia';

    // Reset toggles to defaults
    var togAnalytics = document.getElementById('bcp-tog-analytics');
    var togMarketing = document.getElementById('bcp-tog-marketing');
    if (togAnalytics) togAnalytics.checked = false;
    if (togMarketing) togMarketing.checked = false;

    // Show with a small delay so the CSS transition fires
    requestAnimationFrame(function () {
      banner.classList.remove('bcp-hidden');
    });
  }

  function hideBanner() {
    var banner = document.getElementById('bcp-cookie-banner');
    if (banner) {
      banner.classList.add('bcp-hidden');
    }
  }

  // ── Bind events ─────────────────────────────────────────────────────
  function bindEvents() {
    // Accept all
    document.getElementById('bcp-cb-accept').addEventListener('click', function () {
      saveConsent(true, true, true);
      hideBanner();
    });

    // Reject all
    document.getElementById('bcp-cb-reject').addEventListener('click', function () {
      saveConsent(true, false, false);
      hideBanner();
    });

    // Settings / Save
    var settingsBtn = document.getElementById('bcp-cb-settings-btn');
    settingsBtn.addEventListener('click', function () {
      var panel = document.getElementById('bcp-cb-settings-panel');

      if (!settingsOpen) {
        panel.classList.add('bcp-open');
        settingsBtn.textContent = 'Uložiť nastavenia';
        settingsOpen = true;
      } else {
        // Save current toggle values
        var analytics = document.getElementById('bcp-tog-analytics').checked;
        var marketing = document.getElementById('bcp-tog-marketing').checked;
        saveConsent(true, analytics, marketing);
        hideBanner();
      }
    });
  }

  // ── Public: reopen banner ───────────────────────────────────────────
  window.bcpOpenCookieSettings = function () {
    showBanner();
  };

  // ── Init ─────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    injectBanner();
    bindEvents();

    var consent = getConsent();
    if (consent) {
      applyConsent(consent);
      // Banner stays hidden
    } else {
      showBanner();
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
