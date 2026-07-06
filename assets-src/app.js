(function () {
  'use strict';

  // ---------- i18n ----------
  var EN = {
    'a11y.skip': 'Skip to content',
    'nav.brands': 'Brands', 'nav.ingredients': 'Ingredients', 'nav.stats': 'Statistics', 'nav.method': 'Methodology',
    'nav.backBrands': 'all brands', 'nav.backIng': 'all ingredients',
    'footer.disclaimer': 'Informational and educational service. Data comes from public sources (labels, company registries, institutional reports, press) — every claim cites its source. Ownership structures and supply chains change over time; check the source and its date before relying on the data.',
    'footer.report': 'Report a correction or suggestion', 'footer.method': 'Methodology & sources', 'footer.about': 'About', 'footer.updated': 'updated:', 'footer.mapcredit': 'map:',
    'card.made': 'made in', 'card.capital': 'capital', 'card.verify': '⚠ needs verification', 'card.issues': 'topics',
    'hero.title': 'Where does what you buy really come from?', 'hero.tagline': 'The informed consumer portal',
    'hero.sub': 'Country of production, manufacturer, brand owner, origin of capital and raw materials — public data gathered and documented in one place. No emotion, no boycotts: just facts with sources.',
    'tile.brands': 'Brands & capital', 'tile.ing': 'Ingredients & map', 'tile.stats': 'Statistics',
    'tile.statsSub': 'production vs capital',
    'home.brands': 'Selected brands', 'home.allBrands': 'all →', 'home.ing': 'Ingredients on the world map', 'home.allIng': 'all →',
    'home.ingLead': 'Grain, cocoa, palm oil, fish… What the fine print won’t tell you: where the raw material really comes from and what comes with it.',
    'stats.title': 'Where does the capital behind these brands come from?', 'stats.more': 'See full statistics →',
    'stats.base': 'Database:', 'stats.records': 'brands', 'stats.date': 'as of:', 'stats.madePL': 'made in Poland', 'stats.capitalPL': 'Polish capital',
    'stats.gap': 'This gap is the point of this site: "made in Poland" does not mean "Polish company".',
    'stats.disclaimer': 'Statistics cover only brands in this database — not the whole market. The database grows with every update.',
    'chain.brand': 'brand', 'chain.producer': 'producer', 'chain.owner': 'owner', 'chain.capital': 'capital',
    'field.brand': 'Brand', 'field.category': 'Category', 'field.producer': 'Producer', 'field.madeIn': 'Country of production', 'field.plants': 'Plants / locations', 'field.owner': 'Brand owner', 'field.ownerCountry': 'Owner country', 'field.capital': 'Origin of capital', 'field.updated': 'As of',
    'product.stakes': 'Capital ties', 'product.stakesLead': 'Who actually holds the shares — against the "national" labels.',
    'product.ingredients': 'Key ingredients', 'product.sources': 'Sources', 'product.share': 'Shareable card', 'product.download': 'Download PNG',
    'product.verify': '⚠ Marked as "needs verification" — confirm with sources before citing.',
    'product.disclaimer': 'Information from public sources, educational purpose. See an error?', 'product.reportLink': 'Report a correction',
    'ing.usedIn': 'Found in:', 'ing.map': 'Where it comes from worldwide', 'ing.stats': 'Numbers & facts', 'ing.issues': 'What the label doesn’t show', 'ing.brands': 'Brands in the database using it', 'ing.source': 'source:',
    'ing.disclaimer': 'Compiled from public sources, educational purpose. Every number and topic cites a source.',
    'ing.pageTitle': 'Ingredients and their origin', 'ing.pageSub': 'Where the raw materials in your basket come from — with a map, data and documented issues you won’t see on the packaging.',
    'country.capitalFrom': 'Capital from:', 'country.count': 'Brands in database:',
    'filter.all': 'all', 'search.none': 'No results. Missing a brand? Report it.', 'search.none2': 'No results.',
    'brands.title': 'Brands & capital', 'brands.sub': 'Who owns the brand and where the capital comes from. Filter by capital country and category.',
    'method.title': 'Methodology and sources',
    'form.title': 'Report a correction or suggestion',
    'form.lead': 'Found an error, know a better source, or missing a brand/ingredient? Write to us — every submission is verified against sources before publication. You don’t have to provide contact details.',
    'form.type': 'Type of submission', 'form.t1': 'Correction to existing data', 'form.t2': 'New product / brand / ingredient', 'form.t3': 'Better / additional source', 'form.t4': 'Other',
    'form.msg': 'Message *', 'form.src': 'Source (link, if any)', 'form.contact': 'Reply contact (optional)', 'form.send': 'Send submission',
    'form.note': 'Submissions go to a private inbox. We don’t collect data you don’t volunteer.',
    'about.title': 'About', 'tile.brandsSub': 'brands — who owns them', 'tile.ingSub': 'raw materials — where from',
    'ing.paradox': 'SHELF PARADOX', 'card.paradox': 'shelf paradox',
    'card.aid': '💰 documented state support', 'product.aidTag': '💰 DOCUMENTED STATE SUPPORT',
    'stats.paradoxTitle': 'Paradoxes of the shop shelf',
    'stats.paradoxLead': 'Cases where the market defies common sense — documented, with sources.',
    'stats.paradoxMore': 'full data and sources →',
    'search.ph': 'Search a brand, manufacturer, owner…', 'search.phIng': 'Search an ingredient…',
    'footer.privacy': 'Privacy & cookies', 'footer.support': 'Support the project',
    'note.text': 'This site only stores your language choice and uses technical hosting files (Cloudflare). We collect no analytics or marketing data and do not track you.',
    'note.more': 'Details', 'note.ok': 'Got it',
    'priv.title': 'Privacy & cookies',
    'priv.lead': 'In short: we don’t track you. No analytics, no ads, no marketing cookies. Below — exactly what, why and on what legal basis.',
    'priv.adminSummary': 'Data controller & contact',
    'priv.admin': 'skadprodukt.org is an editorial project. The controller of personal data processed in connection with the site is the person responsible for the project:',
    'priv.adminContact': 'Contact for data-protection matters:',
    'priv.adminOr': 'or via', 'priv.form': 'the suggestion form', 'priv.showEmail': 'Show e-mail address',
    'priv.h2': 'What we store on your device (cookies / localStorage)',
    'priv.storeIntro': 'The site is static and keeps this to an absolute minimum. We use no Google Analytics, pixels, ads or trackers (a strict CSP allows only resources from our own domain).',
    'priv.tWhat': 'What', 'priv.tPurpose': 'Purpose', 'priv.tBasis': 'Basis',
    'priv.langP': 'Remembering your chosen language (PL/EN) — stored only when you click the toggle.',
    'priv.langB': 'Function requested by the user — no consent required (art. 399(3)(2) PKE).',
    'priv.noteP': 'Remembering that you dismissed the info note (so it isn’t shown again).',
    'priv.noteB': 'Function requested by the user — no consent required.',
    'priv.cfC': '__cf_bm and similar (Cloudflare)',
    'priv.cfP': 'Technical hosting/security files (bot protection), set by Cloudflare.',
    'priv.cfB': 'Technically necessary — no consent required.',
    'priv.noConsent': 'That is why <strong>we show no cookie-consent popup</strong> — we use no files that would require it. Storing information on end devices is governed by art. 399 of the Electronic Communications Law (Journal of Laws 2024 item 1221); our uses fall under the “necessity” exception in paragraph 3.',
    'priv.browser': 'You can remove the stored language and note dismissal at any time by clearing site data in your browser.',
    'priv.h3': 'Data from the suggestion form',
    'priv.formIntro': 'If you use the <a href="/zglos/">suggestion form</a>, we process:',
    'priv.f1': '<strong>the submission content</strong> and optional <strong>source</strong> — to verify and correct site data;',
    'priv.f2': '<strong>reply contact</strong> (optional, only if you provide it) — to respond;',
    'priv.f3': '<strong>IP address</strong> — server-side only, for the anti-spam limit; we do not store it together with the submission.',
    'priv.formBasis': '<strong>Legal basis:</strong> art. 6(1)(f) GDPR (legitimate interest — handling the submission and protecting the site from abuse), and for voluntary contact art. 6(1)(a) GDPR (consent by providing the data). <strong>Retention:</strong> submissions are kept until handled plus a reasonable archival period, then deleted; the IP-based anti-spam counter expires automatically after 24 hours.',
    'priv.processor': '<strong>Processors:</strong> the site is hosted by Cloudflare, Inc. (Cloudflare Pages and KV storage) — data may be processed on the provider’s infrastructure under its policy and standard data-protection clauses.',
    'priv.h4': 'Your rights',
    'priv.rights': 'You have the right to: access, rectification, erasure, restriction of processing, objection and data portability. You may also lodge a complaint with the President of the Personal Data Protection Office (<a href="https://uodo.gov.pl" rel="nofollow noopener" target="_blank">uodo.gov.pl</a>). The controller’s contact details are at the bottom of this page.',
    'priv.updated': 'Informational document, as of'
  };

  var lang = localStorage.getItem('skadprodukt-lang') || ((navigator.language || 'pl').slice(0, 2) === 'pl' ? 'pl' : 'en');
  var plCache = {}, phCache = {};
  function applyLang() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], k = el.getAttribute('data-i18n');
      if (!(k in plCache)) plCache[k] = el.innerHTML;
      // innerHTML (nie textContent) — teksty EN mogą zawierać <strong>/<a>; są nasze, zaufane
      el.innerHTML = (lang === 'en' && EN[k]) ? EN[k] : plCache[k];
    }
    // placeholdery pól (atrybut nie da się objąć innerHTML)
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      var pe = phs[j], pk = pe.getAttribute('data-i18n-ph');
      if (!(pk in phCache)) phCache[pk] = pe.getAttribute('placeholder') || '';
      pe.setAttribute('placeholder', (lang === 'en' && EN[pk]) ? EN[pk] : phCache[pk]);
    }
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'pl' ? 'EN' : 'PL';
    document.documentElement.lang = lang;
  }
  var toggle = document.getElementById('lang-toggle');
  if (toggle) toggle.addEventListener('click', function () {
    lang = lang === 'pl' ? 'en' : 'pl';
    localStorage.setItem('skadprodukt-lang', lang);
    applyLang();
  });
  applyLang();

  // ---------- animowane słupki ----------
  var fills = document.querySelectorAll('.bar-fill[data-pct]');
  if (fills.length) requestAnimationFrame(function () {
    for (var i = 0; i < fills.length; i++) fills[i].style.width = fills[i].getAttribute('data-pct') + '%';
  });

  // ---------- wyszukiwarka + filtry ----------
  var grid = document.getElementById('grid');
  var search = document.getElementById('search');
  if (grid && search) {
    var cards = [].slice.call(grid.querySelectorAll('.card'));
    var capFilter = '*', catFilter = null;
    var noRes = document.getElementById('no-results');
    function refresh() {
      var q = search.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (c) {
        var ok = (capFilter === '*' || c.dataset.capital === capFilter)
          && (!catFilter || c.dataset.category === catFilter)
          && (!q || (c.dataset.search || '').indexOf(q) !== -1);
        c.classList.toggle('hidden', !ok);
        if (ok) visible++;
      });
      if (noRes) noRes.classList.toggle('hidden', visible > 0);
    }
    search.addEventListener('input', refresh);
    // prefill z ?q=
    var qp = new URLSearchParams(location.search).get('q');
    if (qp) { search.value = qp; }
    document.querySelectorAll('.chip[data-filter]').forEach(function (ch) {
      ch.addEventListener('click', function () {
        capFilter = ch.dataset.filter;
        document.querySelectorAll('.chip[data-filter]').forEach(function (x) { x.classList.toggle('chip-on', x === ch); });
        refresh();
      });
    });
    document.querySelectorAll('.chip-cat').forEach(function (ch) {
      ch.addEventListener('click', function () {
        catFilter = (catFilter === ch.dataset.cat) ? null : ch.dataset.cat;
        document.querySelectorAll('.chip-cat').forEach(function (x) { x.classList.toggle('chip-on', x.dataset.cat === catFilter); });
        refresh();
      });
    });
    if (qp) refresh();
  }

  // ---------- mapa świata ----------
  var mount = document.getElementById('wmap-mount');
  if (mount) {
    var countries = [];
    try { countries = JSON.parse(mount.getAttribute('data-countries') || '[]'); } catch (e) { }
    fetch('/assets/world-map.svg').then(function (r) { return r.text(); }).then(function (svgText) {
      mount.innerHTML = svgText;
      var svg = mount.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('width'); svg.removeAttribute('height');
      try {
        var bb = svg.getBBox();
        var pad = bb.width * 0.01;
        svg.setAttribute('viewBox', (bb.x - pad) + ' ' + (bb.y - pad) + ' ' + (bb.width + pad * 2) + ' ' + (bb.height + pad * 2));
      } catch (e) { svg.setAttribute('viewBox', '0 0 800 600'); }
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      var tip = document.getElementById('wmap-tooltip');
      countries.forEach(function (o, idx) {
        var el = svg.getElementById ? svg.getElementById(o.cc) : svg.querySelector('#' + o.cc);
        if (!el) return;
        el.classList.add(idx === 0 ? 'hl-major' : 'hl');
        el.setAttribute('data-note', (o.share ? o.share + ' — ' : '') + (o.note || ''));
        var name = el.getAttribute('title') || o.cc;
        if (tip) {
          el.addEventListener('mousemove', function (ev) {
            tip.innerHTML = '<strong>' + name + '</strong>' + (el.getAttribute('data-note') || '');
            tip.classList.remove('hidden');
            var rect = mount.getBoundingClientRect();
            var x = ev.clientX - rect.left + 12, y = ev.clientY - rect.top + 12;
            if (x + 250 > rect.width) x = rect.width - 250;
            tip.style.left = Math.max(4, x) + 'px';
            tip.style.top = y + 'px';
          });
          el.addEventListener('mouseleave', function () { tip.classList.add('hidden'); });
        }
      });
    }).catch(function () { mount.innerHTML = '<p class="muted">Nie udało się wczytać mapy.</p>'; });
  }

  // ---------- pobieranie karty PNG ----------
  var dl = document.getElementById('dl-card');
  if (dl) dl.addEventListener('click', function () {
    var svg = document.querySelector('#share-card svg');
    if (!svg) return;
    var xml = new XMLSerializer().serializeToString(svg);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1350;
      canvas.getContext('2d').drawImage(img, 0, 0, 1080, 1350);
      var a = document.createElement('a');
      a.download = 'skadprodukt-' + dl.dataset.slug + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  });

  // ---------- formularz zgłoszeń ----------
  var form = document.getElementById('suggest-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('f-status');
    var submit = document.getElementById('f-submit');
    var msg = document.getElementById('f-message').value.trim();
    if (msg.length < 10) {
      status.className = 'form-status err';
      status.textContent = lang === 'en' ? 'Please describe your submission (min. 10 characters).' : 'Opisz zgłoszenie (min. 10 znaków).';
      return;
    }
    var payload = {
      type: document.getElementById('f-type').value,
      message: msg,
      source: document.getElementById('f-source').value.trim(),
      contact: document.getElementById('f-contact').value.trim(),
      website: document.getElementById('f-website').value,
      page: location.pathname
    };
    submit.disabled = true;
    status.className = 'form-status';
    status.textContent = lang === 'en' ? 'Sending…' : 'Wysyłanie…';
    fetch('/api/zgloszenie', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d.ok) {
          status.className = 'form-status ok';
          status.textContent = lang === 'en' ? 'Thank you! Your submission has been received.' : 'Dziękujemy! Zgłoszenie zostało przyjęte.';
          form.reset();
        } else {
          status.className = 'form-status err';
          status.textContent = (res.d && res.d.error) || (lang === 'en' ? 'Something went wrong. Try again later.' : 'Coś poszło nie tak. Spróbuj później.');
          submit.disabled = false;
        }
      }).catch(function () {
        status.className = 'form-status err';
        status.textContent = lang === 'en' ? 'Network error. Try again later.' : 'Błąd sieci. Spróbuj później.';
        submit.disabled = false;
      });
  });

  // ---------- nota informacyjna (NIE baner zgody — cookies niezbędne nie wymagają zgody) ----------
  var note = document.getElementById('info-note');
  if (note) {
    try {
      if (!localStorage.getItem('skadprodukt-info-ok')) note.classList.remove('hidden');
    } catch (e) { note.classList.remove('hidden'); }
    var okBtn = document.getElementById('info-ok');
    if (okBtn) okBtn.addEventListener('click', function () {
      note.classList.add('hidden');
      try { localStorage.setItem('skadprodukt-info-ok', '1'); } catch (e) { }
    });
  }

  // ---------- odsłanianie e-maila (anty-scraping: adres składany dopiero na żądanie) ----------
  function revealEmail(el) {
    var addr = el.getAttribute('data-user') + '@' + el.getAttribute('data-dom');
    var a = document.createElement('a');
    a.href = 'mailto:' + addr;
    a.textContent = addr;
    a.className = 'mail-shown';
    el.replaceWith(a);
  }
  var mrs = document.querySelectorAll('.mailrev');
  for (var mi = 0; mi < mrs.length; mi++) {
    (function (el) {
      el.addEventListener('click', function () { revealEmail(el); });
      el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); revealEmail(el); } });
    })(mrs[mi]);
  }
})();
