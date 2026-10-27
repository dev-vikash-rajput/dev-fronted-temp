/* Sample 2 — homepage behaviour.
   Shop: "Shop by category" (chip tabs filter 10 coloured category bubbles → toys.html?cat=), "Shop by age" tiles,
   segment tiles (live + blurred "coming soon"), Hot Picks grid (brief §14 E-3), popular-picks / under-price rails, Gift Finder quiz, toy grid (age chips, sort, search) and the Instagram tiles.
   Business: wholesale toys row (search turns it into a grid) and the launch-journey timeline.
   Re-renders when the interface mode or region changes. Shared state and cards come from site.js (window.Jivora). */
(function () {
  "use strict";

  var J = window.Jivora;
  if (!J) return;
  var esc = J.escapeHTML;
  var filter = { age: "all", sort: "featured", query: "" };
  var catChip = "all";

  var lists = {
    best: document.querySelector('[data-list="popular"]'),
    hot: document.querySelector('[data-list="hot"]'),
    grid: document.querySelector('[data-list="shop-grid"]'),
    under: document.querySelector('[data-list="under"]'),
    bizRow: document.querySelector('[data-list="biz-row"]')
  };
  var emptyEl = document.querySelector("[data-empty]");
  var statusEl = document.querySelector("[data-search-status]");
  var wsStatusEl = document.querySelector("[data-ws-status]");
  var countEl = document.querySelector("[data-toy-count]");
  var wsCountEl = document.querySelector("[data-ws-count]");
  var searchInput = document.getElementById("search-input");

  function scrollToEl(el) {
    if (el) el.scrollIntoView({ behavior: J.reduceMotion ? "auto" : "smooth", block: "start" });
  }

  // ===== Shop by category: chip tabs (All / age / Popular picks) filter the 10 category bubbles =====
  var CHIP_PARAMS = { "0-2": "age=0-2", "3-5": "age=3-5", "6+": "age=6-8,9%2B", popular: "popular=1" };

  function chipMatch(p) {
    if (catChip === "all") return true;
    if (catChip === "popular") return J.isPopular(p);
    return J.inAge(p, catChip);
  }

  function renderCats() {
    var ul = document.querySelector("[data-cats]");
    if (!ul) return;
    var shown = 0;
    ul.innerHTML = J.categories.map(function (c, i) {
      var n = J.products.filter(function (p) { return p.category === c.slug && chipMatch(p); }).length;
      if (!n) return "";
      shown++;
      return '<li><a class="cat-bubble tone-' + J.toneAt(i) + '" href="' + J.categoryUrl(c.slug, CHIP_PARAMS[catChip]) + '">' +
        '<span class="cat-bubble__ring"><img src="' + J.imagePath(c.image) + '" alt="" width="200" height="200" loading="lazy"></span>' +
        '<span class="cat-bubble__label">' + esc(c.name) + "</span>" +
        '<span class="cat-bubble__count">' + n + (n === 1 ? " toy" : " toys") + "</span></a></li>";
    }).join("");
    document.querySelectorAll("[data-cat-chip]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-cat-chip") === catChip));
    });
    var status = document.querySelector("[data-cats-status]");
    if (status) status.textContent = shown + " categories shown";
  }

  // ===== Shop by age: 4 colourful tiles =====
  function renderAgeTiles() {
    var ul = document.querySelector("[data-age-tiles]");
    if (!ul || ul.children.length) return;
    ul.innerHTML = J.ages.map(function (a) {
      var n = J.products.filter(function (p) { return J.inAge(p, a.id); }).length;
      return '<li><a class="age-tile tone-' + a.tone + '" href="' + J.categoryUrl("", "age=" + encodeURIComponent(a.id)) + '">' +
        '<span class="age-tile__text"><span class="age-tile__age">' + esc(a.label.replace(" yrs", "")) + '<small>yrs</small></span>' +
        '<span class="age-tile__name">' + esc(a.name) + '</span><span class="age-tile__count">' + n + " toys</span></span>" +
        '<span class="age-tile__photo"><img src="' + J.imagePath(a.image) + '" alt="" width="240" height="240" loading="lazy"></span></a></li>';
    }).join("");
  }

  // ===== Segments: live tile + blurred "coming soon" previews =====
  function renderSegments() {
    var html = J.segments.map(function (s) {
      if (s.live) {
        return '<li class="seg" data-reveal><a class="seg__card seg__card--live" href="' + J.categoryUrl("") + '">' +
          '<span class="seg__media"><img src="' + s.image + '" alt="" width="800" height="533" loading="lazy"></span>' +
          '<span class="seg__body"><span class="seg__name">' + esc(s.name) + '</span><span class="seg__blurb">' + esc(s.blurb) + "</span>" +
          '<span class="live-pill"><span class="live-pill__dot" aria-hidden="true"></span>Live · ' + J.products.length + " toys</span></span></a></li>";
      }
      return '<li class="seg" data-reveal><div class="seg__card seg__card--soon">' +
        '<span class="seg__media" aria-hidden="true">' +
          '<img class="seg__blur" src="' + s.image + '" alt="" width="800" height="533" loading="lazy">' +
          '<img class="seg__peek" src="' + s.image + '" alt="" width="800" height="533" loading="lazy">' +
          '<span class="soon-pill soon-pill--float">Coming soon</span></span>' +
        '<span class="seg__body"><span class="seg__name">' + esc(s.name) + '</span><span class="seg__blurb">' + esc(s.blurb) + "</span>" +
          '<button class="btn btn--sm btn--outline seg__soon" type="button" data-soon="' + s.id + '" aria-label="What\'s coming in ' + esc(s.name) + '">What\'s coming</button>' +
        "</span></div></li>";
    }).join("");
    document.querySelectorAll("[data-segments]").forEach(function (ul) { ul.innerHTML = html; });
  }

  // ===== Filtering =====
  function matchesQuery(p) {
    if (!filter.query) return true;
    var hay = (p.name + " " + p.short + " " + p.highlights.join(" ")).toLowerCase();
    return filter.query.toLowerCase().split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  function sorted(items) {
    var copy = items.slice();
    if (filter.sort === "price-asc") copy.sort(function (a, b) { return J.priceOf(a) - J.priceOf(b); });
    if (filter.sort === "price-desc") copy.sort(function (a, b) { return J.priceOf(b) - J.priceOf(a); });
    if (filter.sort === "name") copy.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return copy;
  }

  function renderGrid() {
    var items = sorted(J.products.filter(function (p) {
      return (filter.age === "all" || J.inAge(p, filter.age)) && matchesQuery(p);
    }));
    lists.grid.innerHTML = items.map(J.shopCard).join("");
    emptyEl.hidden = items.length > 0;
    countEl.textContent = "(" + items.length + ")";
  }

  function renderShop() {
    var limit = J.underLimit();
    lists.best.innerHTML = J.products.filter(J.isPopular).map(J.shopCard).join("");
    if (lists.hot) lists.hot.innerHTML = J.products.filter(J.isHot).map(J.shopCard).join("");
    lists.under.innerHTML = J.products.filter(function (p) { return J.priceOf(p) < limit.value; })
      .sort(function (a, b) { return J.priceOf(a) - J.priceOf(b); }).map(J.shopCard).join("");
    renderCats();
    renderAgeTiles();
    renderGrid();
    renderGift(false);
    renderInsta();
  }

  function renderStatus() {
    var parts = [];
    if (filter.query) parts.push("Search: <strong>“" + esc(filter.query) + "”</strong>");
    statusEl.hidden = !parts.length;
    if (parts.length) statusEl.innerHTML = parts.join(" · ") + ' <button class="link-btn" type="button" data-reset>Clear</button>';
  }

  // ===== Business: wholesale row (a search shows all matches as a grid) =====
  function renderBiz() {
    var items = J.products.filter(matchesQuery);
    lists.bizRow.className = filter.query ? "grid grid--ws" : "rail";
    lists.bizRow.innerHTML = items.map(J.bizMiniCard).join("");
    wsCountEl.textContent = "(" + items.length + ")";
    wsStatusEl.hidden = !filter.query;
    if (filter.query) {
      wsStatusEl.innerHTML = (items.length ? "" : "No wholesale toys match. ") + "Search: <strong>“" + esc(filter.query) +
        '”</strong> <button class="link-btn" type="button" data-reset>Clear</button>';
    }
  }

  function render() {
    renderSegments();
    if (J.state.mode === "business") renderBiz(); else renderShop();
    renderStatus();
    J.observe();
    updateRails();
  }

  // ===== Age chips (+ header nav links and promo tiles) =====
  function syncFilterUI() {
    document.querySelectorAll("[data-age]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-age") === filter.age));
    });
    document.querySelectorAll(".catnav [data-age-link]").forEach(function (a) {
      a.classList.toggle("is-active", a.getAttribute("data-age-link") === filter.age);
    });
  }

  function refreshGrid() {
    syncFilterUI();
    renderGrid();
    renderStatus();
    J.observe(lists.grid);
  }

  // ===== Gift Finder =====
  var GIFT_WHO = [
    { id: "baby", label: "Baby", sub: "0–2 yrs" },
    { id: "kid", label: "Kid", sub: "3–8 yrs" },
    { id: "teen", label: "Teen", sub: "9+ yrs" }
  ];
  var GIFT_AGES = {
    baby: [{ label: "0–12 months", r: [0, 11] }, { label: "1–2 years", r: [12, 35] }],
    kid: [{ label: "3–5 years", r: [36, 71] }, { label: "6–8 years", r: [72, 107] }],
    teen: [{ label: "9–12 years", r: [108, 155] }, { label: "13+ years", r: [156, 216] }]
  };
  var GIFT_BUDGET = {
    IN: [{ label: "Under ₹500", max: 500 }, { label: "₹500–₹1,000", min: 500, max: 1000 }, { label: "₹1,000+", min: 1000 }, { label: "Any budget" }],
    UK: [{ label: "Under £8", max: 8 }, { label: "£8–£15", min: 8, max: 15 }, { label: "£15+", min: 15 }, { label: "Any budget" }]
  };
  var gift = { step: 0, who: null, age: null, budget: null };
  var giftPanel = document.querySelector("[data-gift]");
  var giftResults = document.querySelector("[data-gift-results]");

  function giftChips(options, kind) {
    return '<div class="gift__chips" role="group">' + options.map(function (o, i) {
      return '<button class="gift-chip" type="button" data-gift-pick="' + kind + '" data-value="' + i + '">' +
        esc(o.label) + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</button>";
    }).join("") + "</div>";
  }

  function giftMatches() {
    var range = GIFT_AGES[GIFT_WHO[gift.who].id][gift.age].r;
    var budget = GIFT_BUDGET[J.state.region][gift.budget];
    var byAge = J.products.filter(function (p) { return p.ages[0] <= range[1] && p.ages[1] >= range[0]; });
    var inBudget = byAge.filter(function (p) {
      var price = J.priceOf(p);
      return (budget.min === undefined || price >= budget.min) && (budget.max === undefined || price < budget.max);
    });
    return { exact: inBudget, close: byAge };
  }

  function renderGift(focus) {
    if (!giftPanel) return;
    var html;
    if (gift.step === 0) {
      html = '<p class="gift__q" id="gift-q">Who is it for?</p>' + giftChips(GIFT_WHO, "who");
    } else if (gift.step === 1) {
      html = '<p class="gift__q" id="gift-q">How old?</p>' + giftChips(GIFT_AGES[GIFT_WHO[gift.who].id], "age");
    } else {
      html = '<p class="gift__q" id="gift-q">' + (gift.step === 2 ? "What’s your budget?" : "Your picks") + "</p>" +
        giftChips(GIFT_BUDGET[J.state.region], "budget");
    }
    var back = gift.step > 0 ? '<button class="link-btn gift__back" type="button" data-gift-back>Back</button>' : "";
    var restart = gift.step > 0 ? '<button class="btn btn--sm btn--dark" type="button" data-gift-restart>Start over</button>' : "";
    giftPanel.innerHTML = html + '<div class="gift__nav">' + back + restart + "</div>";

    // Selected state + progress
    giftPanel.querySelectorAll("[data-gift-pick]").forEach(function (b) {
      var kind = b.getAttribute("data-gift-pick");
      b.setAttribute("aria-pressed", String(gift[kind] === Number(b.getAttribute("data-value"))));
    });
    document.querySelectorAll("[data-gift-dot]").forEach(function (li) {
      var i = Number(li.getAttribute("data-gift-dot"));
      li.classList.toggle("is-done", i < gift.step || (i === 2 && gift.budget !== null));
      li.classList.toggle("is-current", i === Math.min(gift.step, 2) && !(i === 2 && gift.budget !== null));
    });
    if (focus) {
      var first = giftPanel.querySelector("[data-gift-pick]");
      if (first) first.focus();
    }

    // Results
    if (gift.budget === null) {
      giftResults.innerHTML = "";
      return;
    }
    var m = giftMatches();
    var who = GIFT_WHO[gift.who].label.toLowerCase();
    var age = GIFT_AGES[GIFT_WHO[gift.who].id][gift.age].label;
    var budget = GIFT_BUDGET[J.state.region][gift.budget].label;
    var items = m.exact.length ? m.exact : m.close;
    var head = m.exact.length
      ? m.exact.length + " gift idea" + (m.exact.length === 1 ? "" : "s") + " for a " + who + " (" + age + "), " + budget.toLowerCase()
      : "Nothing in this budget yet — closest picks for a " + who + " (" + age + ")";
    items = items.slice().sort(function (a, b) { return J.priceOf(a) - J.priceOf(b); });
    giftResults.innerHTML = '<p class="gift__result-head">' + esc(head) + "</p>" +
      (items.length ? '<div class="grid gift__grid">' + items.map(J.shopCard).join("") + "</div>"
        : '<p class="empty">No toys for this age yet — more arrive at launch.</p>');
    giftResults.querySelectorAll(".card").forEach(function (card, i) {
      card.removeAttribute("data-reveal");
      card.classList.add("gift-in");
      card.style.setProperty("--d", i * 60 + "ms");
    });
  }

  // ===== Instagram tiles (our toy photos; every tile opens the profile in a new tab) =====
  var INSTA_URL = "https://www.instagram.com/toyandjoyindore/";
  var INSTA = [
    { img: "wooden-train.jpg", label: "Wooden train set" },
    { img: "crochet-bunny.jpg", label: "Hand-crocheted bunny" },
    { img: "kite.jpg", label: "Kite day in the park" },
    { img: "modelling-clay.jpg", label: "Modelling clay creations" },
    { img: "dinosaur-figures.jpg", label: "Dinosaur figures" },
    { img: "rainbow-xylophone.jpg", label: "Rainbow xylophone" }
  ];
  var instaIcon = '<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>';

  function renderInsta() {
    var ul = document.querySelector("[data-insta]");
    if (!ul || ul.children.length) return;
    ul.innerHTML = INSTA.map(function (t) {
      return '<li><a class="insta__tile" href="' + INSTA_URL + '" target="_blank" rel="noopener">' +
        '<img src="' + J.imagePath(t.img) + '" alt="" width="400" height="400" loading="lazy">' +
        '<span class="insta__overlay" aria-hidden="true">' + instaIcon + "<span>View on Instagram</span></span>" +
        '<span class="visually-hidden">' + esc(t.label) + " — @toyandjoyindore on Instagram (opens in a new tab)</span></a></li>";
    }).join("");
  }

  // ===== Business: launch-journey timeline draws on scroll =====
  var journey = document.querySelector("[data-journey]");
  if (journey) {
    if (J.reduceMotion || !("IntersectionObserver" in window)) {
      journey.classList.add("is-drawn");
    } else {
      document.documentElement.classList.add("journey-anim");
      var jo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          journey.classList.add("is-drawn");
          jo.disconnect();
        });
      }, { threshold: 0.35 });
      jo.observe(journey);
    }
  }

  // ===== Clicks =====
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cat-chip], [data-age], [data-age-link], [data-reset], [data-plan], [data-rail-prev], [data-rail-next], [data-gift-pick], [data-gift-back], [data-gift-restart]");
    if (!t) return;
    if (t.hasAttribute("data-cat-chip")) { catChip = t.getAttribute("data-cat-chip"); renderCats(); return; }
    if (t.hasAttribute("data-age")) { filter.age = t.getAttribute("data-age"); refreshGrid(); }
    if (t.hasAttribute("data-age-link")) { filter.age = t.getAttribute("data-age-link"); refreshGrid(); }
    if (t.hasAttribute("data-reset")) {
      filter.query = "";
      filter.age = "all";
      if (searchInput) searchInput.value = "";
      setUrlQuery("");
      if (J.state.mode === "business") renderBiz(); else refreshGrid();
      renderStatus();
      J.observe();
    }
    if (t.hasAttribute("data-plan")) {
      var select = document.querySelector("[data-plan-select]");
      if (select) select.value = t.getAttribute("data-plan");
    }
    if (t.hasAttribute("data-rail-prev") || t.hasAttribute("data-rail-next")) {
      var rail = document.querySelector('[data-rail="' + t.closest("[data-rail-nav]").getAttribute("data-rail-nav") + '"]');
      var dir = t.hasAttribute("data-rail-next") ? 1 : -1;
      rail.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: J.reduceMotion ? "auto" : "smooth" });
    }
    if (t.hasAttribute("data-gift-pick")) {
      var kind = t.getAttribute("data-gift-pick");
      var value = Number(t.getAttribute("data-value"));
      if (kind === "who") { gift.who = value; gift.age = null; gift.budget = null; gift.step = 1; }
      if (kind === "age") { gift.age = value; gift.budget = null; gift.step = 2; }
      if (kind === "budget") { gift.budget = value; gift.step = 3; }
      renderGift(kind !== "budget");
    }
    if (t.hasAttribute("data-gift-back")) {
      if (gift.step === 3) { gift.budget = null; gift.step = 2; }
      else if (gift.step === 2) { gift.age = null; gift.step = 1; }
      else { gift.who = null; gift.step = 0; }
      renderGift(true);
    }
    if (t.hasAttribute("data-gift-restart")) {
      gift = { step: 0, who: null, age: null, budget: null };
      renderGift(true);
    }
  });

  var sortSelect = document.querySelector("[data-sort]");
  sortSelect.addEventListener("change", function () {
    filter.sort = sortSelect.value;
    renderGrid();
    J.observe(lists.grid);
  });

  // ===== Search (header form; ?q= when coming from the product page) =====
  function setUrlQuery(q) {
    try {
      var url = new URL(window.location.href);
      if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
      window.history.replaceState(null, "", url.pathname.split("/").pop() + url.search + url.hash);
    } catch (e) { /* ignore */ }
  }

  document.querySelectorAll("[data-search]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      filter.query = form.querySelector("input").value.trim();
      setUrlQuery(filter.query);
      render();
      scrollToEl(document.getElementById(J.state.mode === "business" ? "wholesale" : "toys"));
    });
  });

  try {
    var q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      filter.query = q.slice(0, 80);
      if (searchInput) searchInput.value = filter.query;
    }
  } catch (e) { /* ignore */ }

  // ===== Rails: hide arrows when there is nothing to scroll =====
  function updateRails() {
    document.querySelectorAll("[data-rail]").forEach(function (rail) {
      var nav = document.querySelector('[data-rail-nav="' + rail.getAttribute("data-rail") + '"]');
      if (!nav) return;
      var max = rail.scrollWidth - rail.clientWidth - 2;
      nav.querySelector("[data-rail-prev]").disabled = rail.scrollLeft <= 2;
      nav.querySelector("[data-rail-next]").disabled = rail.scrollLeft >= max;
      nav.hidden = !rail.classList.contains("rail") || max <= 0;
    });
  }

  document.querySelectorAll("[data-rail]").forEach(function (rail) {
    rail.addEventListener("scroll", function () { window.requestAnimationFrame(updateRails); }, { passive: true });
  });
  window.addEventListener("resize", updateRails);

  // ===== Re-render on mode / region / cross-tab changes =====
  J.onChange(function (what) {
    if (what === "mode" || what === "region" || what === "sync") render();
  });

  syncFilterUI();
  render();
  if (filter.query) {
    var first = document.getElementById(J.state.mode === "business" ? "wholesale" : "toys");
    if (first) first.scrollIntoView();
  }
})();
