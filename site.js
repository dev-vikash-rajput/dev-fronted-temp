/* Sample 2 — shared behaviour for index.html, toys.html and product.html:
   interface mode (Shop / For Business), cart, wishlist and RFQ list, product cards,
   "Toys" mega-menu + drawer category list, cart / wishlist / RFQ sheet, "coming soon" dialog, mobile drawer,
   toast and small scroll reveals, plus the pre-launch event helpers (UK-time phase, header links) and the
   form sender used by the event registration form (POST to JIVORA_EVENT.FORM_ENDPOINT, brief §14) and the
   ?preview=event / ?preview=after review mode.
   State lives in localStorage (wrapped in try/catch, falls back to memory) so all pages stay in sync.
   All prices are in £ (Decisions 29 Oct — no region / currency switch).
   Front-end only — forms and checkout do not send or charge anything. */
(function () {
  "use strict";

  var root = document.documentElement;
  var KEYS = { mode: "jivora-s2-mode", cart: "jivora-s2-cart", wish: "jivora-s2-wish", rfq: "jivora-s2-rfq" };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var products = window.JIVORA_PRODUCTS || [];
  var segments = window.JIVORA_SEGMENTS || [];
  var categories = window.JIVORA_CATEGORIES || [];
  var NEW_SINCE = "2026-10-15";   // toys added on or after this date count as "New" (dummy dates)
  var trade = window.JIVORA_TRADE || {};
  var listeners = [];

  // ===== Storage (falls back to memory when localStorage is blocked) =====
  var memory = {};

  function load(key, fallback, raw) {
    try {
      var value = window.localStorage.getItem(key);
      if (value === null) return fallback;
      return raw ? value : JSON.parse(value);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }

  function save(key, value, raw) {
    memory[key] = value;
    try {
      window.localStorage.setItem(key, raw ? value : JSON.stringify(value));
    } catch (e) {
      /* private mode or storage disabled: keep the in-memory copy */
    }
  }

  function asMap(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  var state = {
    mode: root.getAttribute("data-mode") === "business" ? "business" : "shop",
    cart: asMap(load(KEYS.cart, {})),   // { productId: quantity }
    rfq: asMap(load(KEYS.rfq, {})),     // { productId: quantity }
    wish: load(KEYS.wish, [])           // [productId]
  };
  if (!Array.isArray(state.wish)) state.wish = [];

  // Drop ids that no longer exist in products.js
  function clean() {
    Object.keys(state.cart).forEach(function (id) { if (!byId(id)) delete state.cart[id]; });
    Object.keys(state.rfq).forEach(function (id) { if (!byId(id)) delete state.rfq[id]; });
    state.wish = state.wish.filter(byId);
  }

  // ===== Helpers =====
  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function byId(id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function money(value) {
    return "£" + value.toFixed(2);
  }

  function priceOf(product) {
    return product.price.GBP;
  }

  function tiersOf(product) {
    return product.wholesale.tiers.GBP;
  }

  function tierFor(product, qty) {
    var tiers = tiersOf(product);
    var match = tiers[0];
    tiers.forEach(function (t) { if (qty >= t.min) match = t; });
    return match;
  }

  function leadOf(product) {
    return product.wholesale.lead.UK;
  }

  function sellerLabel(product) {
    return product.seller === "partner" ? "Verified partner seller" : "Sold by Jivora";
  }

  // "Under £10" rail / filter
  function underLimit() {
    return { value: 10, label: "Under £10" };
  }

  function imagePath(file) {
    return "assets/toys/" + file;
  }

  function productUrl(product) {
    return "product.html?id=" + encodeURIComponent(product.id) + (state.mode === "business" ? "&mode=business" : "");
  }

  // ===== Categories (client's list, products.js) =====
  function categoryBySlug(slug) {
    return categories.filter(function (c) { return c.slug === slug; })[0] || null;
  }

  function categoryCount(slug) {
    return products.filter(function (p) { return p.category === slug; }).length;
  }

  // toys.html listing URL; extra = other query params, e.g. "age=0-2"
  function categoryUrl(slug, extra) {
    var params = [];
    if (slug) params.push("cat=" + encodeURIComponent(slug));
    if (extra) params.push(extra);
    if (state.mode === "business") params.push("mode=business");
    return "toys.html" + (params.length ? "?" + params.join("&") : "");
  }

  function inStock(p) { return p.inStock !== false; }
  function isNew(p) { return p.badge === "New" || p.added >= NEW_SINCE; }
  function isPopular(p) { return p.badge === "Popular pick"; }
  function isHot(p) { return p.hot === true; }
  function hasPriceMatch(p) { return p.priceMatch === true; }

  // ===== Pre-launch event (event-config.js, brief §14 E-1) =====
  // Times in the config are UK wall-clock times. They are turned into fixed instants, so every visitor (any time zone,
  // any number of refreshes) counts down to the same moment — the timer can never reset.
  var EVENT = window.JIVORA_EVENT || null;
  var londonFmt = null;
  try {
    londonFmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: (EVENT && EVENT.TIMEZONE) || "Europe/London", hourCycle: "h23",
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  } catch (e) { /* very old browser: treat UK time as GMT */ }

  function londonOffset(ms) {
    if (!londonFmt) return 0;
    var parts = {};
    londonFmt.formatToParts(new Date(ms)).forEach(function (part) { parts[part.type] = Number(part.value); });
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(ms / 1000) * 1000;
  }

  // "2026-11-14T00:00:00" (UK time) -> epoch ms, or NaN when the value is not a valid date
  function ukTime(text) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(text || ""));
    if (!m) return NaN;
    var guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
    var ms = guess - londonOffset(guess);
    return guess - londonOffset(ms);   // second pass settles the GMT/BST switch-over days
  }

  // Review mode for the client (brief §14 E-11): ?preview=event shows the "during" state with the form open,
  // ?preview=after the ended state. Simulated from page load, marked with a "Preview" badge; without the
  // parameter the real dates decide.
  var PREVIEW = (function () {
    var v = "";
    try { v = new URLSearchParams(window.location.search).get("preview") || ""; } catch (e) {}
    return v === "event" || v === "after" ? v : "";
  })();
  var previewFrom = Date.now();

  // Sheet test before the event (brief §14 E-13): ?preview=event&testkey=XXXX sends the key with the form, so the
  // Apps Script skips the event-window check and writes to its "Test" tab. The key is read once, removed from the
  // address bar straight away and never written into the page or any link.
  var TEST_KEY = (function () {
    var key = "";
    try {
      var url = new URL(window.location.href);
      key = (url.searchParams.get("testkey") || "").slice(0, 200);
      if (url.searchParams.has("testkey")) {
        url.searchParams.delete("testkey");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch (e) {}
    return PREVIEW === "event" ? key : "";
  })();

  // phase: "before" | "during" | "after" | "off" (no or broken config). EVENT_END is inclusive to the second:
  // with "23:59:59" registration is still open at 23:59:59.999 and closes at 00:00:00 the next day.
  function eventInfo(now) {
    var start = EVENT ? ukTime(EVENT.EVENT_START) : NaN;
    var end = EVENT ? ukTime(EVENT.EVENT_END) : NaN;
    if (!isFinite(start) || !isFinite(end) || end <= start) return { phase: "off" };
    var t = now === undefined ? Date.now() : now;
    if (PREVIEW) {
      // Pretend the event began when the page opened: same length as the real event, real dates for the labels
      var length = end - start;
      var shift = PREVIEW === "event" ? previewFrom - start : previewFrom - end - 1000;
      return { phase: PREVIEW === "event" && t < previewFrom + length ? "during" : "after", start: start, end: end, now: t - shift, preview: true };
    }
    return { phase: t < start ? "before" : t < end + 1000 ? "during" : "after", start: start, end: end, now: t };
  }

  // UK-time labels: date "Sun, 1 Nov 2026", time "11:59 pm" (midnight -> "midnight")
  function ukParts(ms) {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-GB", {
        timeZone: (EVENT && EVENT.TIMEZONE) || "Europe/London",
        weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hourCycle: "h23"
      }).formatToParts(new Date(ms)).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {
      var d = new Date(ms);
      parts = { weekday: d.toUTCString().slice(0, 3), day: String(d.getUTCDate()), month: d.toUTCString().slice(8, 11),
        year: String(d.getUTCFullYear()), hour: String(d.getUTCHours()), minute: ("0" + d.getUTCMinutes()).slice(-2) };
    }
    var h = Number(parts.hour), m = parts.minute;
    return {
      date: parts.weekday + ", " + parts.day + " " + parts.month + " " + parts.year,
      time: h === 0 && m === "00" ? "midnight" : ((h % 12) || 12) + ":" + m + (h < 12 ? " am" : " pm")
    };
  }

  // "Sun, 1 Nov 2026 · from midnight"
  function ukStartLabel(ms) {
    var p = ukParts(ms);
    return p.date + " · from " + p.time;
  }

  // "Sun, 1 Nov 2026 · 11:59 pm"; just the time when it ends on the start day (sameDayAs)
  function ukEndLabel(ms, sameDayAs) {
    var p = ukParts(ms);
    return sameDayAs && ukParts(sameDayAs).date === p.date ? p.time : p.date + " · " + p.time;
  }

  function ukDateOnly(ms) {
    return ukParts(ms).date;
  }

  // Long UK-time parts: date "Sunday 1 November 2026", time "00:00" (24-hour)
  function ukLong(ms) {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: (EVENT && EVENT.TIMEZONE) || "Europe/London",
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date(ms)).forEach(function (p) { parts[p.type] = p.value; });
    return { date: parts.weekday + " " + parts.day + " " + parts.month + " " + parts.year, time: parts.hour + ":" + parts.minute };
  }

  // "Sunday 1 November 2026 · 00:00–23:59" (client wording 29 Oct); falls back to the short labels on very old browsers
  function ukWindowLabel(start, end) {
    try {
      var s = ukLong(start), e = ukLong(end);
      return s.date === e.date ? s.date + " · " + s.time + "–" + e.time : s.date + " " + s.time + " – " + e.date + " " + e.time;
    } catch (err) {
      return ukStartLabel(start) + " – " + ukEndLabel(end, start);
    }
  }

  function ukLongDate(ms) {
    try { return ukLong(ms).date; } catch (err) { return ukDateOnly(ms); }
  }

  // Header / USP / drawer "Gift Coupon" links: hidden once registration has closed (the coupon value is never shown)
  var eventTimer;
  function syncEventLinks() {
    var info = eventInfo();
    // Event dates written out in UK time (terms.html)
    if (info.phase !== "off") {
      document.querySelectorAll("[data-event-start]").forEach(function (el) { el.textContent = ukStartLabel(info.start); });
      document.querySelectorAll("[data-event-end]").forEach(function (el) { el.textContent = ukEndLabel(info.end, info.start); });
      document.querySelectorAll("[data-event-window]").forEach(function (el) { el.textContent = ukWindowLabel(info.start, info.end); });
    }
    document.querySelectorAll("[data-event-link]").forEach(function (el) {
      el.hidden = info.phase === "after" || info.phase === "off";
    });
    clearTimeout(eventTimer);
    var next = info.phase === "before" ? info.start : info.phase === "during" ? info.end + 1000 : 0;
    if (next) eventTimer = setTimeout(syncEventLinks, Math.min(next - Date.now() + 250, 2147483000));
  }

  // ===== Form sender (Google Apps Script web app, brief §14 E-1) =====
  // text/plain keeps it a "simple" CORS request (no preflight, which Apps Script cannot answer).
  function formEndpoint() {
    return EVENT && typeof EVENT.FORM_ENDPOINT === "string" ? EVENT.FORM_ENDPOINT.trim() : "";
  }

  // Safety rule (brief §14): an empty endpoint must never go live silently. Away from localhost / file:// the forms
  // carry a visible "Preview — registrations are not saved yet" banner.
  function isLocalHost() {
    var h = window.location.hostname;
    return window.location.protocol === "file:" || h === "" || h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1" || /\.localhost$/.test(h);
  }

  function isLivePreview() {
    return !formEndpoint() && !isLocalHost();
  }

  function sendForm(payload) {
    var url = formEndpoint();
    if (!url) return Promise.resolve({ ok: true, demo: true });
    if (!window.fetch) return Promise.reject(new Error("unsupported"));
    return window.fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow"
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  // ===== Age groups (0–2 / 3–5 / 6–8 / 9+, plus "6+" for the homepage chips) =====
  var ages = window.JIVORA_AGES || [];
  var AGE_RANGES = { "6+": [72, 999] };
  ages.forEach(function (a) { AGE_RANGES[a.id] = a.range; });

  // A toy fits an age group when its suitable range (months) overlaps the group's range
  function inAge(p, id) {
    var r = AGE_RANGES[id];
    return !!r && p.ages[0] <= r[1] && p.ages[1] >= r[0];
  }

  // ===== Toy palette accents (pink, yellow, sky, green, purple) =====
  var TONES = ["pink", "yellow", "sky", "green", "purple"];
  var AGE_TONES = { "0-2": "pink", "3-5": "yellow", "6+": "sky" };
  function toneAt(i) { return TONES[i % TONES.length]; }
  function ageTone(p) { return AGE_TONES[p.age] || "green"; }

  var icons = {
    heart: '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shield: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6l7-3z" fill="currentColor"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    tag: '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5V5a1 1 0 0 1 1-1h7.5L20 11.5 12.5 19 4 12.5z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/></svg>'
  };

  // ===== Product cards =====
  function inCart(id) { return !!state.cart[id]; }
  function inRfq(id) { return !!state.rfq[id]; }
  function inWish(id) { return state.wish.indexOf(id) !== -1; }

  function wishButton(p) {
    var on = inWish(p.id);
    return '<button class="card__wish" type="button" data-wish="' + p.id + '" aria-pressed="' + on + '" aria-label="' +
      (on ? "Remove " : "Save ") + escapeHTML(p.name) + (on ? " from wishlist" : " to wishlist") + '">' + icons.heart + "</button>";
  }

  function promiseHTML(p) {
    return hasPriceMatch(p) ? '<p class="card__promise">' + icons.tag + "Price Promise</p>" : "";
  }

  function badgeHTML(p) {
    if (!p.badge) return "";
    var mod = p.badge === "Gift pick" ? " card__badge--gift" : p.badge === "New" ? " card__badge--new" : "";
    return '<span class="card__badge' + mod + '">' + escapeHTML(p.badge) + "</span>";
  }

  function shopCard(p) {
    var url = productUrl(p);
    var swap = p.images.length > 1;
    var stock = inStock(p);
    return '<article class="card' + (stock ? "" : " card--soldout") + '" data-reveal>' +
      '<a class="card__media' + (swap ? " card__media--swap" : "") + '" href="' + url + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + imagePath(p.images[0]) + '" alt="" width="400" height="400" loading="lazy">' +
        (swap ? '<img class="card__img-alt" src="' + imagePath(p.images[1]) + '" alt="" width="400" height="400" loading="lazy">' : "") +
        (stock ? badgeHTML(p) : '<span class="card__badge card__badge--soldout">Sold out</span>') +
      "</a>" + wishButton(p) +
      '<button class="card__qv" type="button" data-qv="' + p.id + '" aria-label="Quick view: ' + escapeHTML(p.name) + '">Quick view</button>' +
      '<div class="card__body">' +
        '<p class="card__meta"><span class="age-tag age-tag--' + ageTone(p) + '">' + escapeHTML(p.ageLabel) + "</span>" +
          '<span class="card__seller">' + sellerLabel(p) + "</span></p>" +
        '<h3 class="card__name"><a href="' + url + '">' + escapeHTML(p.name) + "</a></h3>" +
        '<p class="card__desc">' + escapeHTML(p.short) + "</p>" + promiseHTML(p) +
        '<div class="card__foot"><span class="card__price">' + money(priceOf(p)) + "</span>" +
          (stock
            ? '<button class="btn btn--sm btn--primary card__add" type="button" data-add-cart="' + p.id + '" aria-label="Add ' + escapeHTML(p.name) + ' to cart">' +
              '<span class="card__add-label">Add</span></button>'
            : '<button class="btn btn--sm btn--disabled card__add" type="button" disabled aria-label="' + escapeHTML(p.name) + ' is sold out">Sold out</button>') +
          "</div>" +
      "</div></article>";
  }

  function bizCard(p) {
    var url = productUrl(p);
    var from = tiersOf(p)[tiersOf(p).length - 1];
    var on = inRfq(p.id);
    return '<article class="card card--biz" data-reveal>' +
      '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + imagePath(p.images[0]) + '" alt="" width="400" height="400" loading="lazy">' +
        '<span class="card__badge card__badge--seller">' + icons.shield + sellerLabel(p) + "</span>" +
      "</a>" +
      '<div class="card__body">' +
        '<h3 class="card__name"><a href="' + url + '">' + escapeHTML(p.name) + "</a></h3>" +
        '<p class="card__ws"><span class="card__ws-label">Wholesale from</span> <strong>' + money(from.price) + "</strong> / pc</p>" +
        '<p class="card__tiers">' + tiersOf(p).map(function (t) { return t.min + "+ " + money(t.price); }).join(" · ") + "</p>" +
        '<dl class="card__facts">' +
          "<div><dt>MOQ</dt><dd>" + p.wholesale.moq + " pcs</dd></div>" +
          "<div><dt>Lead time</dt><dd>" + escapeHTML(leadOf(p)) + "</dd></div>" +
          "<div><dt>Retail (RRP)</dt><dd>" + money(priceOf(p)) + "</dd></div>" +
          "<div><dt>Age</dt><dd>" + escapeHTML(p.ageLabel) + "</dd></div>" +
        "</dl>" +
        '<button class="btn btn--sm btn--block ' + (on ? "btn--added" : "btn--outline") + '" type="button" data-rfq="' + p.id + '" aria-pressed="' + on + '">' +
          rfqLabel(on) + "</button>" +
      "</div></article>";
  }

  // Compact wholesale card for the business "Wholesale toys" row: photo, name, MOQ, starting tier, Add to RFQ
  function bizMiniCard(p) {
    var url = productUrl(p);
    var from = tiersOf(p)[tiersOf(p).length - 1];
    var on = inRfq(p.id);
    return '<article class="card card--biz card--mini" data-reveal>' +
      '<a class="card__media" href="' + url + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + imagePath(p.images[0]) + '" alt="" width="400" height="400" loading="lazy">' +
      "</a>" +
      '<div class="card__body">' +
        '<h3 class="card__name"><a href="' + url + '">' + escapeHTML(p.name) + "</a></h3>" +
        '<p class="card__ws"><span class="card__ws-label">From</span> <strong>' + money(from.price) + "</strong> / pc</p>" +
        '<p class="card__moq">MOQ ' + p.wholesale.moq + " pcs</p>" +
        '<button class="btn btn--sm btn--block ' + (on ? "btn--added" : "btn--outline") + '" type="button" data-rfq="' + p.id + '" aria-pressed="' + on + '">' +
          rfqLabel(on, true) + "</button>" +
      "</div></article>";
  }

  function rfqLabel(on, short) {
    if (short) return on ? icons.check + " In RFQ" : "Add to RFQ";
    return on ? icons.check + " In RFQ list" : "Add to RFQ list";
  }

  // ===== Change events =====
  function onChange(fn) { listeners.push(fn); }

  function emit(what) {
    listeners.forEach(function (fn) { fn(what); });
    syncButtons();
    updateHeader();
    if (sheet && sheet.open) renderSheet();
  }

  // Update wishlist hearts and RFQ buttons in place (no re-render, so focus is kept)
  function syncButtons() {
    document.querySelectorAll(".card__wish[data-wish], [data-wish-toggle]").forEach(function (b) {
      var id = b.getAttribute("data-wish") || b.getAttribute("data-wish-toggle");
      var p = byId(id);
      var on = inWish(id);
      b.setAttribute("aria-pressed", String(on));
      if (b.classList.contains("card__wish")) {
        b.setAttribute("aria-label", (on ? "Remove " : "Save ") + p.name + (on ? " from wishlist" : " to wishlist"));
      }
    });
    document.querySelectorAll(".card--biz [data-rfq]").forEach(function (b) {
      var on = inRfq(b.getAttribute("data-rfq"));
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("btn--added", on);
      b.classList.toggle("btn--outline", !on);
      b.innerHTML = rfqLabel(on, !!b.closest(".card--mini"));
    });
  }

  // ===== Mode (Shop / For Business) =====
  function setUrlMode() {
    if (!window.history || !window.history.replaceState) return;
    try {
      var url = new URL(window.location.href);
      if (state.mode === "business") url.searchParams.set("mode", "business");
      else url.searchParams.delete("mode");
      window.history.replaceState(null, "", url.pathname.split("/").pop() + url.search + url.hash);
    } catch (e) { /* file:// or old browser — the stored mode still applies */ }
  }

  function syncModeLinks() {
    document.querySelectorAll("a[data-mode-link]").forEach(function (a) {
      var href = a.getAttribute("href").replace(/[?&]mode=business/, "");
      var hash = "";
      if (href.indexOf("#") !== -1) { hash = href.slice(href.indexOf("#")); href = href.slice(0, href.indexOf("#")); }
      if (state.mode === "business") href += (href.indexOf("?") === -1 ? "?" : "&") + "mode=business";
      a.setAttribute("href", href + hash);
    });
  }

  // Search box wording follows the interface
  function syncSearch() {
    var business = state.mode === "business";
    document.querySelectorAll("[data-search]").forEach(function (form) {
      var input = form.querySelector("input");
      var label = form.querySelector("label");
      input.placeholder = business ? "Search wholesale products" : "Search toys — try “wooden”, “plush”, “RC”";
      if (label) label.textContent = business ? "Search wholesale products" : "Search toys";
    });
  }

  function syncToggles() {
    document.querySelectorAll("[data-set-mode]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-mode") === state.mode));
    });
  }

  function setMode(mode, silent) {
    mode = mode === "business" ? "business" : "shop";
    var changed = mode !== state.mode;
    state.mode = mode;
    root.setAttribute("data-mode", mode);
    save(KEYS.mode, mode, true);
    syncToggles();
    syncSearch();
    setUrlMode();
    syncModeLinks();
    renderCategoryMenus();
    if (changed && !silent) {
      emit("mode");
      toast(mode === "business" ? "Business view: wholesale prices, MOQ and trade details" : "Shop view: simple store for shoppers");
    }
  }

  // ===== Cart / wishlist / RFQ =====
  function addToCart(id, qty) {
    state.cart[id] = (state.cart[id] || 0) + (qty || 1);
    save(KEYS.cart, state.cart);
    emit("cart");
  }

  function setCartQty(id, qty) {
    if (qty <= 0) delete state.cart[id];
    else state.cart[id] = Math.min(qty, 99);
    save(KEYS.cart, state.cart);
    emit("cart");
  }

  function toggleWish(id) {
    var i = state.wish.indexOf(id);
    if (i === -1) state.wish.push(id); else state.wish.splice(i, 1);
    save(KEYS.wish, state.wish);
    emit("wish");
    return i === -1;
  }

  function toggleRfq(id, qty) {
    var p = byId(id);
    if (!p) return false;
    var added = !state.rfq[id];
    if (added) state.rfq[id] = Math.max(qty || p.wholesale.moq, p.wholesale.moq);
    else delete state.rfq[id];
    save(KEYS.rfq, state.rfq);
    emit("rfq");
    return added;
  }

  function setRfqQty(id, qty) {
    state.rfq[id] = qty;
    save(KEYS.rfq, state.rfq);
    listeners.forEach(function (fn) { fn("rfq-qty"); });
  }

  function cartCount() {
    return Object.keys(state.cart).reduce(function (n, id) { return n + state.cart[id]; }, 0);
  }

  function updateHeader() {
    var counts = { cart: cartCount(), wishlist: state.wish.length, rfq: Object.keys(state.rfq).length };
    var labels = { cart: ["Cart", "item"], wishlist: ["Wishlist", "item"], rfq: ["RFQ list", "product"] };
    Object.keys(counts).forEach(function (k) {
      document.querySelectorAll('[data-count="' + k + '"]').forEach(function (el) {
        el.textContent = counts[k];
        el.classList.toggle("is-empty", counts[k] === 0);
      });
      document.querySelectorAll('[data-open-sheet="' + k + '"]').forEach(function (b) {
        b.setAttribute("aria-label", labels[k][0] + ", " + counts[k] + " " + labels[k][1] + (counts[k] === 1 ? "" : "s"));
      });
    });
  }

  // Bump animation on the header icon
  function bump(kind) {
    if (reduceMotion) return;
    document.querySelectorAll('[data-count="' + kind + '"]').forEach(function (el) {
      el.classList.remove("is-bump");
      void el.offsetWidth;
      el.classList.add("is-bump");
    });
  }

  // Restartable one-shot animation class
  function pop(els, cls) {
    if (reduceMotion) return;
    cls = cls || "is-pop";
    Array.prototype.forEach.call(els, function (el) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    });
  }

  // Cart icon bounce + a small confetti burst from the button (skipped under reduced motion)
  var CONFETTI = ["#F59E0B", "#FCD34D", "#2563EB", "#60A5FA", "#4ADE80", "#F2F5FF"];

  function celebrate(fromEl) {
    if (reduceMotion) return;
    pop(document.querySelectorAll('[data-open-sheet="cart"]'), "is-bounce");
    var box = fromEl.getBoundingClientRect();
    var burst = document.createElement("div");
    burst.className = "confetti";
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = box.left + box.width / 2 + "px";
    burst.style.top = box.top + box.height / 2 + "px";
    for (var i = 0; i < 16; i++) {
      var bit = document.createElement("i");
      var angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      var dist = 38 + Math.random() * 46;
      bit.style.setProperty("--x", Math.cos(angle) * dist + "px");
      bit.style.setProperty("--y", Math.sin(angle) * dist - 18 + "px");
      bit.style.setProperty("--r", Math.round(Math.random() * 540 - 270) + "deg");
      bit.style.background = CONFETTI[i % CONFETTI.length];
      burst.appendChild(bit);
    }
    document.body.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 1000);
  }

  // ===== Toast =====
  var toastEl = document.getElementById("toast");
  var toastTimer;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2800);
  }

  // ===== Dialog helpers (<dialog> with a fallback for very old browsers) =====
  function openDialog(d) {
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); }
    else d.setAttribute("open", "");
    document.body.classList.add("has-dialog");
  }

  function closeDialog(d) {
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
  }

  function wireDialog(d) {
    if (!d) return;
    d.addEventListener("click", function (e) { if (e.target === d) closeDialog(d); });
    d.addEventListener("close", function () {
      if (!document.querySelector("dialog[open]")) document.body.classList.remove("has-dialog");
      if (d._opener && document.contains(d._opener)) d._opener.focus();
    });
  }

  // ===== Sheet: cart / wishlist / RFQ =====
  var sheet = document.getElementById("sheet");
  var sheetType = "cart";

  function thumb(p) {
    return '<img class="line__img" src="' + imagePath(p.images[0]) + '" alt="" width="64" height="64" loading="lazy">';
  }

  function cartHTML() {
    var ids = Object.keys(state.cart);
    var note = '<div class="prelaunch-note"><strong>Pre-launch: orders open soon</strong><p>Checkout opens at launch — your cart is saved on this device.</p></div>';
    if (!ids.length) {
      return '<p class="sheet__empty">Your cart is empty. Add a few toys to see how it works.</p>' + note;
    }
    var total = 0;
    var lines = ids.map(function (id) {
      var p = byId(id);
      var qty = state.cart[id];
      total += priceOf(p) * qty;
      return '<li class="line">' + thumb(p) +
        '<div class="line__info"><a class="line__name" href="' + productUrl(p) + '">' + escapeHTML(p.name) + "</a>" +
        '<span class="line__price">' + money(priceOf(p)) + "</span>" +
        '<div class="stepper" role="group" aria-label="Quantity for ' + escapeHTML(p.name) + '">' +
          '<button type="button" data-cart-step="' + id + '" data-step="-1" aria-label="Decrease quantity">−</button>' +
          '<span aria-live="polite">' + qty + "</span>" +
          '<button type="button" data-cart-step="' + id + '" data-step="1" aria-label="Increase quantity">+</button>' +
        "</div></div>" +
        '<button class="icon-btn icon-btn--sm" type="button" data-cart-remove="' + id + '" aria-label="Remove ' + escapeHTML(p.name) + '">' + icons.close + "</button></li>";
    }).join("");
    return '<ul class="lines">' + lines + "</ul>" +
      '<div class="sheet__total"><span>Subtotal</span><strong>' + money(total) + "</strong></div>" +
      '<button class="btn btn--block btn--disabled" type="button" disabled>Checkout — opens at launch</button>' +
      note;
  }

  function wishHTML() {
    if (!state.wish.length) return '<p class="sheet__empty">No saved toys yet. Tap the heart on any toy to save it here.</p>';
    return '<ul class="lines">' + state.wish.map(function (id) {
      var p = byId(id);
      return '<li class="line">' + thumb(p) +
        '<div class="line__info"><a class="line__name" href="' + productUrl(p) + '">' + escapeHTML(p.name) + "</a>" +
        '<span class="line__price">' + money(priceOf(p)) + "</span>" +
        '<button class="btn btn--sm btn--outline" type="button" data-add-cart="' + id + '">Add to cart</button></div>' +
        '<button class="icon-btn icon-btn--sm" type="button" data-wish="' + id + '" aria-label="Remove ' + escapeHTML(p.name) + ' from wishlist">' + icons.close + "</button></li>";
    }).join("") + "</ul>";
  }

  function rfqHTML() {
    var ids = Object.keys(state.rfq);
    if (!ids.length) {
      return '<p class="sheet__empty">Your RFQ list is empty. Add wholesale products and request one quote for all of them.</p>';
    }
    var total = 0;
    var lines = ids.map(function (id) {
      var p = byId(id);
      var qty = state.rfq[id];
      var tier = tierFor(p, qty);
      total += tier.price * qty;
      return '<li class="line">' + thumb(p) +
        '<div class="line__info"><a class="line__name" href="' + productUrl(p) + '">' + escapeHTML(p.name) + "</a>" +
        '<span class="line__price">' + money(tier.price) + " / pc · MOQ " + p.wholesale.moq + "</span>" +
        '<label class="line__qty"><span>Qty (pcs)</span><input class="input input--sm" type="number" inputmode="numeric" min="' + p.wholesale.moq + '" step="1" value="' + qty + '" data-rfq-qty="' + id + '"></label></div>' +
        '<button class="icon-btn icon-btn--sm" type="button" data-rfq="' + id + '" aria-label="Remove ' + escapeHTML(p.name) + ' from RFQ list">' + icons.close + "</button></li>";
    }).join("");
    return '<ul class="lines">' + lines + "</ul>" +
      '<div class="sheet__total"><span>Indicative total (ex-tax)</span><strong data-rfq-total>' + money(total) + "</strong></div>" +
      '<p class="sheet__hint">Final prices come in the quote. Delivery terms: ' + escapeHTML((trade.incoterms || []).join(" · ")) + ".</p>" +
      '<button class="btn btn--primary btn--block" type="button" data-send-rfq>Request quote for ' + ids.length + " product" + (ids.length === 1 ? "" : "s") + "</button>" +
      '<p class="form-msg" role="status" aria-live="polite" data-rfq-msg></p>';
  }

  function renderSheet() {
    var titles = { cart: "Cart", wishlist: "Wishlist", rfq: "RFQ list" };
    sheet.querySelector(".sheet__title").textContent = titles[sheetType];
    sheet.querySelector("[data-sheet-body]").innerHTML =
      sheetType === "cart" ? cartHTML() : sheetType === "wishlist" ? wishHTML() : rfqHTML();
  }

  function openSheet(type, opener) {
    if (!sheet) return;
    sheetType = type;
    sheet._opener = opener;
    renderSheet();
    openDialog(sheet);
  }

  // ===== Quick view dialog =====
  var qv = document.getElementById("qv");

  function openQuickView(id, opener) {
    var p = byId(id);
    if (!p || !qv) return;
    qv._opener = opener;
    var thumbs = p.images.length > 1 ? '<div class="qv__thumbs">' + p.images.map(function (img, i) {
      return '<button class="gallery__thumb" type="button" data-qv-thumb="' + i + '" aria-pressed="' + (i === 0) + '" aria-label="Photo ' + (i + 1) + '">' +
        '<img src="' + imagePath(img) + '" alt="" width="96" height="96" loading="lazy"></button>';
    }).join("") + "</div>" : "";
    qv.querySelector("[data-qv-body]").innerHTML =
      '<div class="qv__media"><img src="' + imagePath(p.images[0]) + '" alt="' + escapeHTML(p.alt[0]) + '" width="800" height="800" data-qv-main>' + badgeHTML(p) + "</div>" +
      '<div class="qv__info">' + thumbs +
        '<p class="pdp__seller">' + icons.shield + " " + sellerLabel(p) + "</p>" +
        '<h2 class="qv__title" id="qv-title">' + escapeHTML(p.name) + "</h2>" +
        '<p><span class="age-tag age-tag--lg">Age ' + escapeHTML(p.ageLabel) + "</span></p>" +
        '<p class="qv__price">' + money(priceOf(p)) + "</p>" + promiseHTML(p) +
        '<p class="qv__desc">' + escapeHTML(p.short) + "</p>" +
        '<div class="qv__actions">' +
          '<button class="btn btn--primary" type="button" data-add-cart="' + p.id + '"><span class="card__add-label">Add to cart</span></button>' +
          '<a class="btn btn--ghost" href="' + productUrl(p) + '">Full details</a>' +
        "</div>" +
        '<p class="pdp__note"><span class="announcement__dot" aria-hidden="true"></span>Pre-launch: orders open soon.</p>' +
      "</div>" +
      '<button class="icon-btn soon__x" type="button" data-close-qv aria-label="Close quick view">' + icons.close + "</button>";
    openDialog(qv);
  }

  // ===== Coming soon dialog =====
  var soon = document.getElementById("soon");

  function openSoon(id, opener) {
    var seg = segments.filter(function (s) { return s.id === id; })[0];
    if (!seg || !soon) return;
    soon._opener = opener;
    soon.querySelector("[data-soon-body]").innerHTML =
      '<div class="soon__media"><img src="' + seg.image + '" alt="' + escapeHTML(seg.alt) + '" width="800" height="533"><span class="soon-pill soon-pill--lg">Coming soon</span></div>' +
      '<div class="soon__body">' +
        '<h2 class="soon__title" id="soon-title">' + escapeHTML(seg.name) + " is launching soon</h2>" +
        '<p class="soon__text">' + escapeHTML(seg.blurb) + ". We're opening with Toys first — " + escapeHTML(seg.name) + " follows soon. Follow us on Instagram for launch news.</p>" +
        '<button class="link-btn soon__close" type="button" data-close-soon>Keep browsing toys</button>' +
      "</div>" +
      '<button class="icon-btn soon__x" type="button" data-close-soon aria-label="Close">' + icons.close + "</button>";
    openDialog(soon);
  }

  // ===== Demo forms (business enquiry) =====
  function handleDemoForm(form) {
    var msg = form.querySelector(".form-msg");
    var invalid = Array.prototype.filter.call(form.querySelectorAll("input[required]"), function (input) {
      var bad = !input.value.trim() || (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      input.setAttribute("aria-invalid", String(bad));
      return bad;
    });
    if (invalid.length) {
      msg.className = "form-msg is-error";
      msg.textContent = invalid[0].type === "email" ? "Please enter a valid email address." : "Please fill in all fields.";
      invalid[0].focus();
      return;
    }
    msg.className = "form-msg is-success";
    msg.textContent = form.classList.contains("enquire__form")
      ? "Thanks! Our team will reply within one working day."
      : "You're on the list! We'll email you at launch.";
    form.reset();
  }

  // ===== "Toys" mega-menu (header) + category list in the drawer =====
  var chevron = '<svg class="megamenu__chev" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function renderCategoryMenus() {
    var under = underLimit();
    document.querySelectorAll("[data-megamenu-panel]").forEach(function (panel) {
      panel.innerHTML = '<div class="container megamenu__inner">' +
        '<ul class="megamenu__grid">' + categories.map(function (c) {
          return '<li><a class="megamenu__item" href="' + categoryUrl(c.slug) + '">' +
            '<img src="' + imagePath(c.image) + '" alt="" width="56" height="56" loading="lazy">' +
            '<span><span class="megamenu__name">' + escapeHTML(c.name) + '</span>' +
            '<span class="megamenu__count">' + categoryCount(c.slug) + " toys</span></span></a></li>";
        }).join("") + "</ul>" +
        '<div class="megamenu__side">' +
          '<p class="megamenu__label">Shop by age</p>' +
          '<ul class="megamenu__links">' + ages.map(function (a) {
            return '<li><a class="tone-' + a.tone + '" href="' + categoryUrl("", "age=" + encodeURIComponent(a.id)) + '">' + escapeHTML(a.label) + "</a></li>";
          }).join("") + "</ul>" +
          '<p class="megamenu__label">Quick picks</p>' +
          '<ul class="megamenu__links">' +
            '<li><a href="' + categoryUrl("", "popular=1") + '">Popular picks</a></li>' +
            '<li><a href="' + categoryUrl("", "price=under") + '">' + under.label + "</a></li></ul>" +
          '<a class="btn btn--primary btn--sm megamenu__all" href="' + categoryUrl("") + '">Shop all toys</a>' +
        "</div></div>";
    });
    document.querySelectorAll("[data-drawer-ages]").forEach(function (ul) {
      ul.innerHTML = ages.map(function (a) {
        return '<li><a href="' + categoryUrl("", "age=" + encodeURIComponent(a.id)) + '">' + escapeHTML(a.label) + " · " + escapeHTML(a.name) + "</a></li>";
      }).join("");
    });
    document.querySelectorAll("[data-drawer-cats]").forEach(function (ul) {
      ul.innerHTML = '<li><a href="' + categoryUrl("") + '">All toys</a></li>' + categories.map(function (c) {
        return '<li><a href="' + categoryUrl(c.slug) + '">' + escapeHTML(c.name) + "</a></li>";
      }).join("");
    });
  }

  var megamenus = document.querySelectorAll("[data-megamenu]");
  var hoverCapable = window.matchMedia("(hover: hover) and (min-width: 1024px)");

  function setMegamenu(menu, open) {
    var btn = menu.querySelector("[data-megamenu-toggle]");
    clearTimeout(menu._timer);
    menu.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
  }

  megamenus.forEach(function (menu) {
    var btn = menu.querySelector("[data-megamenu-toggle]");
    if (btn.querySelector(".megamenu__chev") === null) btn.insertAdjacentHTML("beforeend", chevron);
    btn.addEventListener("click", function () {
      setMegamenu(menu, !menu.classList.contains("is-open"));
    });
    menu.addEventListener("mouseenter", function () {
      if (hoverCapable.matches) setMegamenu(menu, true);
    });
    menu.addEventListener("mouseleave", function () {
      if (!hoverCapable.matches) return;
      menu._timer = setTimeout(function () { setMegamenu(menu, false); }, 160);
    });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMegamenu(menu, false);
        btn.focus();
      }
    });
    menu.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !menu.contains(e.relatedTarget)) setMegamenu(menu, false);
    });
  });

  document.addEventListener("click", function (e) {
    megamenus.forEach(function (menu) {
      if (menu.classList.contains("is-open") && !menu.contains(e.target)) setMegamenu(menu, false);
    });
  });

  // Used by toys.html when a menu link updates the listing in place
  function closeMenus() {
    megamenus.forEach(function (menu) { setMegamenu(menu, false); });
    closeDrawer(false);
  }

  // ===== Mobile drawer =====
  var drawer = document.getElementById("drawer");
  var menuToggle = document.getElementById("menu-toggle");

  function openDrawer() {
    drawer.hidden = false;
    document.body.classList.add("menu-open");
    menuToggle.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () {
      drawer.classList.add("is-open");
      drawer.querySelector(".drawer__panel").focus();
    });
  }

  function closeDrawer(restoreFocus) {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove("is-open");
    document.body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    setTimeout(function () { drawer.hidden = true; }, reduceMotion ? 0 : 260);
    if (restoreFocus !== false) menuToggle.focus();
  }

  if (drawer && menuToggle) {
    menuToggle.addEventListener("click", openDrawer);
    drawer.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
      if (e.key !== "Tab") return;
      var focusables = drawer.querySelectorAll("a[href], button:not([disabled])");
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
      if (mq.matches) closeDrawer(false);
    });
  }

  // ===== Scroll reveals (small, transform/opacity only) =====
  var revealObserver = null;
  if (!reduceMotion && "IntersectionObserver" in window) {
    root.classList.add("reveal-on");
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });
  }

  function observe(scope) {
    var items = (scope || document).querySelectorAll("[data-reveal]:not(.is-in)");
    items.forEach(function (el, i) {
      if (!revealObserver) { el.classList.add("is-in"); return; }
      el.style.setProperty("--d", (i % 5) * 50 + "ms");
      revealObserver.observe(el);
    });
  }

  // ===== Event delegation =====
  document.addEventListener("click", function (e) {
    var t = e.target.closest("button, a");
    if (!t) return;

    if (t.hasAttribute("data-set-mode")) {
      setMode(t.getAttribute("data-set-mode"));
      return;
    }
    if (t.hasAttribute("data-go-mode")) {
      // Links that also switch interface (footer, cart sheet). Same page: switch + follow the hash.
      setMode(t.getAttribute("data-go-mode"), true);
      emit("mode");
      if (t.hasAttribute("data-close-sheet") && sheet) closeDialog(sheet);
      var href = t.getAttribute("href") || "";
      var samePage = document.body.classList.contains("page-home") && href.indexOf("index.html") === 0;
      if (samePage && href.indexOf("#") !== -1) {
        e.preventDefault();
        var target = document.querySelector(href.slice(href.indexOf("#")));
        closeDrawer(false);
        if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else if (samePage) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }
      return;
    }
    if (t.hasAttribute("data-add-cart")) {
      var id = t.getAttribute("data-add-cart");
      addToCart(id, 1);
      bump("cart");
      celebrate(t);
      var label = t.querySelector(".card__add-label");
      if (label) {
        var before = label.textContent;
        label.textContent = "Added";
        t.classList.add("is-added");
        setTimeout(function () { label.textContent = before === "Added" ? "Add" : before; t.classList.remove("is-added"); }, 1400);
      }
      toast("Added to cart");
      return;
    }
    if (t.hasAttribute("data-wish")) {
      var wid = t.getAttribute("data-wish");
      var nowSaved = toggleWish(wid);
      if (nowSaved) {
        bump("wishlist");
        pop(document.querySelectorAll('[data-wish="' + wid + '"]'));
      }
      toast(nowSaved ? "Saved to wishlist" : "Removed from wishlist");
      return;
    }
    if (t.hasAttribute("data-rfq")) {
      var added = toggleRfq(t.getAttribute("data-rfq"));
      if (added) bump("rfq");
      toast(added ? "Added to RFQ list" : "Removed from RFQ list");
      return;
    }
    if (t.hasAttribute("data-open-sheet")) {
      openSheet(t.getAttribute("data-open-sheet"), t);
      return;
    }
    if (t.hasAttribute("data-close-sheet")) {
      closeDialog(sheet);
      return;
    }
    if (t.hasAttribute("data-cart-step")) {
      var cid = t.getAttribute("data-cart-step");
      setCartQty(cid, state.cart[cid] + Number(t.getAttribute("data-step")));
      return;
    }
    if (t.hasAttribute("data-cart-remove")) {
      setCartQty(t.getAttribute("data-cart-remove"), 0);
      return;
    }
    if (t.hasAttribute("data-send-rfq")) {
      var msg = sheet.querySelector("[data-rfq-msg]");
      msg.className = "form-msg is-success";
      msg.textContent = "Thanks — your quote request is in. Verified sellers reply within one working day.";
      return;
    }
    if (t.hasAttribute("data-qv")) {
      openQuickView(t.getAttribute("data-qv"), t);
      return;
    }
    if (t.hasAttribute("data-qv-thumb")) {
      var qi = Number(t.getAttribute("data-qv-thumb"));
      var qp = byId(qv.querySelector("[data-add-cart]").getAttribute("data-add-cart"));
      var main = qv.querySelector("[data-qv-main]");
      main.src = imagePath(qp.images[qi]);
      main.alt = qp.alt[qi];
      qv.querySelectorAll("[data-qv-thumb]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === t)); });
      return;
    }
    if (t.hasAttribute("data-close-qv")) {
      closeDialog(qv);
      return;
    }
    if (t.hasAttribute("data-soon")) {
      closeDrawer(false);
      openSoon(t.getAttribute("data-soon"), t);
      return;
    }
    if (t.hasAttribute("data-close-soon")) {
      closeDialog(soon);
      return;
    }
    if (t.hasAttribute("data-close-drawer")) {
      closeDrawer();
      return;
    }
    // In-page links inside the drawer close it
    if (drawer && drawer.contains(t) && t.tagName === "A") closeDrawer(false);
  });

  // Drawer overlay is a div, not a button
  if (drawer) {
    drawer.querySelector(".drawer__overlay").addEventListener("click", function () { closeDrawer(); });
  }

  document.addEventListener("change", function (e) {
    if (e.target.matches("[data-rfq-qty]")) {
      var id = e.target.getAttribute("data-rfq-qty");
      var p = byId(id);
      var qty = Math.round(Number(e.target.value));
      if (!isFinite(qty) || qty < p.wholesale.moq) {
        qty = p.wholesale.moq;
        toast("Minimum order for " + p.name + " is " + p.wholesale.moq + " pcs");
      }
      e.target.value = qty;
      setRfqQty(id, qty);
      // Refresh prices in place without re-rendering (keeps focus)
      var line = e.target.closest(".line");
      var tier = tierFor(p, qty);
      line.querySelector(".line__price").textContent = money(tier.price) + " / pc · MOQ " + p.wholesale.moq;
      var total = Object.keys(state.rfq).reduce(function (n, rid) {
        var rp = byId(rid);
        return n + tierFor(rp, state.rfq[rid]).price * state.rfq[rid];
      }, 0);
      sheet.querySelector("[data-rfq-total]").textContent = money(total);
    }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-demo-form]")) {
      e.preventDefault();
      handleDemoForm(e.target);
    }
  });

  // Keep tabs and pages in sync when another tab changes the state
  window.addEventListener("storage", function (e) {
    if (e.key === KEYS.cart) state.cart = asMap(load(KEYS.cart, {}));
    else if (e.key === KEYS.rfq) state.rfq = asMap(load(KEYS.rfq, {}));
    else if (e.key === KEYS.wish) { state.wish = load(KEYS.wish, []); if (!Array.isArray(state.wish)) state.wish = []; }
    else return;
    clean();
    emit("sync");
  });

  wireDialog(sheet);
  wireDialog(soon);
  wireDialog(qv);

  // ===== USP bar: duplicate the list once so the phone marquee loops seamlessly =====
  document.querySelectorAll(".usp__list--clone").forEach(function (clone) {
    var original = clone.previousElementSibling;
    if (original) clone.innerHTML = original.innerHTML;
    clone.querySelectorAll("a").forEach(function (a) { a.setAttribute("tabindex", "-1"); });
  });

  // ===== Init =====
  clean();
  setMode(state.mode, true);   // saves ?mode=business from the URL and syncs toggles + links
  syncEventLinks();   // header / USP / drawer event links + event dates
  document.querySelectorAll("[data-preview-banner]").forEach(function (el) { el.hidden = !isLivePreview(); });
  updateHeader();

  window.Jivora = {
    state: state,
    products: products,
    segments: segments,
    categories: categories,
    categoryBySlug: categoryBySlug,
    categoryCount: categoryCount,
    categoryUrl: categoryUrl,
    inStock: inStock,
    isNew: isNew,
    trade: trade,
    ages: ages,
    inAge: inAge,
    isPopular: isPopular,
    isHot: isHot,
    hasPriceMatch: hasPriceMatch,
    eventConfig: EVENT,
    eventInfo: eventInfo,
    ukStartLabel: ukStartLabel,
    ukEndLabel: ukEndLabel,
    ukDateOnly: ukDateOnly,
    ukWindowLabel: ukWindowLabel,
    ukLongDate: ukLongDate,
    formEndpoint: formEndpoint,
    previewMode: PREVIEW,
    testKey: function () { return TEST_KEY; },
    isLivePreview: isLivePreview,
    sendForm: sendForm,
    toneAt: toneAt,
    ageTone: ageTone,
    byId: byId,
    escapeHTML: escapeHTML,
    money: money,
    priceOf: priceOf,
    tiersOf: tiersOf,
    tierFor: tierFor,
    leadOf: leadOf,
    sellerLabel: sellerLabel,
    underLimit: underLimit,
    imagePath: imagePath,
    productUrl: productUrl,
    shopCard: shopCard,
    bizCard: bizCard,
    bizMiniCard: bizMiniCard,
    icons: icons,
    inCart: inCart,
    inRfq: inRfq,
    inWish: inWish,
    addToCart: addToCart,
    toggleRfq: toggleRfq,
    bump: bump,
    toast: toast,
    onChange: onChange,
    observe: observe,
    closeMenus: closeMenus,
    openSoon: openSoon,
    celebrate: celebrate,
    pop: pop,
    reduceMotion: reduceMotion
  };
})();
