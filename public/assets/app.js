(function(){
'use strict';
// ---------- i18n ----------
var I18N = {
  en: {
    'nav.home':'Database','nav.stats':'Statistics','nav.method':'Methodology','nav.back':'all products',
    'hero.title':'Where does what you buy really come from?',
    'hero.sub':'Country of production, manufacturer, brand owner, origin of capital. Public data gathered in one place.',
    'filter.all':'all','search.none':'No results. Missing a product? Report it.',
    'card.made':'made in','card.capital':'capital','card.verify':'⚠ needs verification',
    'chain.brand':'brand','chain.producer':'producer','chain.owner':'owner','chain.capital':'capital',
    'field.brand':'Brand','field.category':'Category','field.producer':'Producer','field.madeIn':'Country of production','field.plants':'Plants / locations','field.owner':'Brand owner','field.ownerCountry':'Owner country','field.capital':'Origin of capital','field.updated':'As of',
    'product.sources':'Sources','product.share':'Shareable card','product.download':'Download PNG',
    'product.verify':'⚠ Marked as "needs verification" — confirm with sources before citing.',
    'product.disclaimer':'All information comes from public sources and is educational. Represent this brand and see an error? Report a correction.',
    'stats.title':'Where does the capital behind these brands come from?','stats.more':'See full statistics →',
    'stats.base':'Database:','stats.records':'records','stats.date':'as of:','stats.madePL':'made in Poland','stats.capitalPL':'Polish capital',
    'stats.gap':'This gap is the point of this site: "made in Poland" does not mean "Polish company".',
    'stats.disclaimer':'Statistics cover only brands in this database — not the whole market. The database grows with every update.',
    'country.capitalFrom':'Capital from:','country.count':'Brands in database:',
    'method.title':'Methodology and sources',
    'footer.disclaimer':'Data gathered from public sources (labels, registries, company pages, press). May be outdated — always check the sources listed with each product. Informational and educational service, not shopping advice.',
    'footer.updated':'updated:','footer.report':'report a correction'
  }
};
var lang = localStorage.getItem('skadto-lang') || ((navigator.language||'pl').slice(0,2)==='pl' ? 'pl' : 'en');
var plTexts = {};
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if(!(k in plTexts)) plTexts[k] = el.innerHTML;
    if(lang==='en' && I18N.en[k]) el.textContent = I18N.en[k];
    else el.innerHTML = plTexts[k];
  });
  var btn = document.getElementById('lang-toggle');
  if(btn) btn.textContent = lang==='pl' ? 'EN' : 'PL';
  document.documentElement.lang = lang;
}
var toggle = document.getElementById('lang-toggle');
if(toggle) toggle.addEventListener('click', function(){
  lang = lang==='pl' ? 'en' : 'pl';
  localStorage.setItem('skadto-lang', lang);
  applyLang();
});
applyLang();

// ---------- szukajka + filtry ----------
var search = document.getElementById('search');
var grid = document.getElementById('grid');
if(search && grid){
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  var capFilter = '*', catFilter = null;
  function refresh(){
    var q = search.value.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function(c){
      var ok = (capFilter==='*' || c.dataset.capital===capFilter)
        && (!catFilter || c.dataset.category===catFilter)
        && (!q || c.dataset.search.indexOf(q)!==-1);
      c.classList.toggle('hidden', !ok);
      if(ok) visible++;
    });
    document.getElementById('no-results').classList.toggle('hidden', visible>0);
  }
  search.addEventListener('input', refresh);
  document.querySelectorAll('.chip[data-filter]').forEach(function(ch){
    ch.addEventListener('click', function(){
      capFilter = ch.dataset.filter;
      document.querySelectorAll('.chip[data-filter]').forEach(function(x){x.classList.toggle('chip-on', x===ch);});
      refresh();
    });
  });
  document.querySelectorAll('.chip-cat').forEach(function(ch){
    ch.addEventListener('click', function(){
      catFilter = (catFilter===ch.dataset.cat) ? null : ch.dataset.cat;
      document.querySelectorAll('.chip-cat').forEach(function(x){x.classList.toggle('chip-on', x.dataset.cat===catFilter);});
      refresh();
    });
  });
}

// ---------- pobieranie karty PNG ----------
var dl = document.getElementById('dl-card');
if(dl) dl.addEventListener('click', function(){
  var svg = document.querySelector('#share-card svg');
  var xml = new XMLSerializer().serializeToString(svg);
  var img = new Image();
  img.onload = function(){
    var canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    canvas.getContext('2d').drawImage(img, 0, 0, 1080, 1350);
    var a = document.createElement('a');
    a.download = 'skadto-' + dl.dataset.slug + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
});
})();