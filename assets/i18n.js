/* اللغة: الموقع بالعربي (المسارات العادية) وبالإنجليزي تحت /en/ بنفس المسار.
   The language layer, loaded on every page before site.js (Arabic and English):
   • EN_PAGES: the ONE list of pages that have an English twin under /en/. A later phase that translates a page
     adds its path here (relative to the site root, e.g. "plc-lab/lesson-01.html"), and every link, catalog card,
     switcher and resume card picks it up.
   • the «EN» / «ع» switch in the header (twin page if it exists, else the other language's home), remembered in localStorage.
   • on English pages: links to Arabic pages that now have an English twin are upgraded to /en/…, and links marked
     data-ar that don't get a small «Arabic» badge.
   • a small dismissible «English version» hint on the Arabic home for browsers that don't ask for Arabic.
   The English strings live in assets/i18n-en.js (English pages only); scripts read them as LE_I18N.en.
   Never auto-redirects by browser language. */
(function(){
  "use strict";
  var EN_PAGES = [
    "index.html", "labs.html", "about.html", "contact.html", "privacy.html", "refund.html",
    "login.html", "account.html", "reset.html", "subscribe.html", "cert.html", "404.html",
    "courses/basics.html", "courses/classic.html", "courses/drawings.html", "courses/instrumentation.html",
    "courses/plc.html", "courses/inverters.html", "courses/servo.html"
    // later phases: "plc-lab/index.html", "plc-lab/lesson-01.html", …
  ];
  var SET = {}; EN_PAGES.forEach(function(p){ SET[p] = 1; });
  var root = document.documentElement;
  var isEn = /^en\b/i.test(root.getAttribute("lang") || "");

  function store(k, v){ try{ if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  // any path or same-site URL → "courses/plc.html" (no /en/ prefix, no query). Pretty URLs (/labs, /plc-lab/) are filled in.
  function norm(p){
    p = String(p == null ? "" : p).replace(/[?#].*$/, "");
    try { if (/^https?:/i.test(p)){ var u = new URL(p); if (u.origin !== location.origin) return null; p = u.pathname; } } catch (e){ return null; }
    if (p.charAt(0) !== "/"){ try { p = new URL(p, location.href).pathname; } catch (e){ return null; } }
    p = p.replace(/^\/en(?=\/|$)/, "").replace(/^\/+/, "");
    try { p = decodeURI(p); } catch (e){}
    if (p === "" || /\/$/.test(p)) p += "index.html";
    else if (!/\.[a-z0-9]+$/i.test(p.split("/").pop())) p += ".html";
    return p;
  }
  function hasEn(p){ var n = norm(p); return !!(n && SET[n]); }
  function pretty(n){ return n === "index.html" ? "" : n; }
  function enUrl(p){ var n = norm(p); return "/en/" + pretty(n || ""); }
  function arUrl(p){ var n = norm(p); return "/" + pretty(n || ""); }
  // a link for the page language: Arabic pages keep it as is; English pages go to the /en/ twin when there is one
  function href(p){ if (!isEn) return p; var n = norm(p); return n && SET[n] ? "/en/" + pretty(n) : "/" + (n || ""); }
  // the same page in the other language (or the other language's home)
  function twin(){
    var n = norm(location.pathname) || "index.html", keep = location.search + location.hash;
    // login.html?next=…: send the visitor back to the page in the language they switch to
    try {
      var q = new URLSearchParams(location.search), nx = q.get("next");
      if (nx && /^\/(?!\/)/.test(nx)){
        var nn = norm(nx), tail = (nx.match(/[?#].*$/) || [""])[0];
        q.set("next", isEn ? "/" + pretty(nn) + tail : SET[nn] ? "/en/" + pretty(nn) + tail : nx);
        keep = "?" + q.toString() + location.hash;
      }
    } catch (e){}
    if (n === "404.html") return isEn ? "/" : "/en/";
    if (isEn) return "/" + pretty(n) + keep;
    return SET[n] ? "/en/" + pretty(n) + keep : "/en/";
  }
  // API error → message for this page: English text for the error code, else the server's (Arabic) message
  function msg(r, fallback){
    var E = I.en;
    if (E && E.err){ var c = r && r.error; return (c && E.err[c]) || E.err.server_any || fallback; }
    return (r && r.message) || fallback;
  }

  var I = window.LE_I18N = { lang: isEn ? "en" : "ar", isEn: isEn, pages: EN_PAGES, hasEn: hasEn, norm: norm, href: href, enUrl: enUrl, arUrl: arUrl, twin: twin, msg: msg, en: window.LE_I18N && window.LE_I18N.en || null };

  /* ---------- the switch in the header ---------- */
  var bar = document.querySelector(".site-header .bar");
  if (bar){
    var a = document.createElement("a");
    a.className = "icon-btn lang-btn";
    a.setAttribute("data-keep", ""); // not rewritten by the /en/ link upgrade below
    a.href = twin();
    if (isEn){ a.textContent = "ع"; a.lang = "ar"; a.hreflang = "ar"; a.setAttribute("aria-label", "اقرا الصفحة دي بالعربي"); }
    else { a.textContent = "EN"; a.lang = "en"; a.hreflang = "en"; a.setAttribute("aria-label", "Read this page in English"); }
    a.title = a.getAttribute("aria-label");
    a.addEventListener("click", function(){ store("le-lang", isEn ? "ar" : "en"); });
    var theme = bar.querySelector(".theme-btn");
    bar.insertBefore(a, theme || null);
  }

  /* ---------- English pages: upgrade links to /en/ twins, badge the Arabic-only ones marked data-ar ---------- */
  if (isEn){
    document.querySelectorAll("a[href]").forEach(function(el){
      var h = el.getAttribute("href");
      if (!h || /^(#|mailto:|tel:|javascript:)/i.test(h) || /^\/en(\/|$)/.test(h) || /^\/(api|admin)/.test(h)) return;
      if (/^https?:/i.test(h) && h.indexOf(location.origin) !== 0) return;
      if (el.hasAttribute("data-keep")) return;
      var n = norm(h); if (!n || !/\.html$/.test(n)) return;
      if (SET[n]) el.setAttribute("href", "/en/" + pretty(n) + (h.match(/[?#].*$/) || [""])[0]);
      else if (el.hasAttribute("data-ar") && !el.querySelector(".ar-badge")){
        var b = document.createElement("span"); b.className = "ar-badge"; b.textContent = "Arabic"; b.title = "This page is in Arabic for now";
        el.appendChild(b);
      }
    });
    // «The lessons are in Arabic for now» notes: hidden once that page is in EN_PAGES
    document.querySelectorAll("[data-ar-note]").forEach(function(el){ if (hasEn(el.getAttribute("data-ar-note"))) el.hidden = true; });
  }

  /* ---------- Arabic home: «English version» hint for browsers that don't ask for Arabic ---------- */
  if (!isEn && norm(location.pathname) === "index.html" && !store("le-lang") && store("le-en-hint-x") !== "1"){
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""]).join(",");
    if (langs && !/(^|,)\s*ar\b/i.test(langs)){
      var hint = document.createElement("div");
      hint.className = "lang-hint"; hint.lang = "en"; hint.dir = "ltr"; hint.setAttribute("role", "region"); hint.setAttribute("aria-label", "Language");
      hint.innerHTML = '<div class="wrap lh-in"><a href="/en/">English version of this site →</a><button type="button" class="lh-x" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
      hint.querySelector(".lh-x").addEventListener("click", function(){ store("le-en-hint-x", "1"); hint.remove(); });
      hint.querySelector("a").addEventListener("click", function(){ store("le-lang", "en"); });
      var head = document.querySelector(".site-header");
      if (head) head.insertAdjacentElement("afterend", hint); else document.body.insertBefore(hint, document.body.firstChild);
    }
  }
})();
