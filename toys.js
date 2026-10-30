/* Sample 2 — toys listing page (toys.html).
   One template for all toys and every category: toys.html?cat=<slug>. Filters (category, age, price range,
   in stock, new, popular picks, Price Promise in Shop mode) and sort are kept in the URL, so every view can be shared or bookmarked; back / forward work.
   Shop mode shows the homepage product card; Business mode shows the wholesale card (MOQ + tier prices).
   Filters are a sidebar from 1024px and a bottom sheet below. All content comes from products.js (DUMMY). */
(function () {
  "use strict";

  var J = window.Jivora;
  if (!J) return;
  var esc = J.escapeHTML;

  var SORTS = ["featured", "price-asc", "price-desc", "newest"];
  // Price ranges use the retail price in £
  var PRICES = [{ id: "budget", label: "Under £7", max: 7 }, { id: "under", label: "Under £10", max: 10 }, { id: "premium", label: "£10 and above", min: 10 }];
  var ALL_IMAGE = "kids-stacking-blocks.jpg";

  var els = {
    crumbs: document.querySelector("[data-crumbs]"),
    title: document.querySelector("[data-listing-title]"),
    sub: document.querySelector("[data-listing-sub]"),
    cats: document.querySelector("[data-listing-cats]"),
    form: document.querySelector("[data-filters]"),
    panel: document.getElementById("filters"),
    openBtn: document.querySelector("[data-filters-open]"),
    showBtn: document.querySelector("[data-filters-show]"),
    filterCount: document.querySelector("[data-filter-count]"),
    count: document.querySelector("[data-results-count]"),
    sort: document.querySelector("[data-listing-sort]"),
    active: document.querySelector("[data-active-filters]"),
    grid: document.querySelector("[data-listing-grid]"),
    empty: document.querySelector("[data-listing-empty]"),
    search: document.getElementById("search-input")
  };

  var state = emptyState();

  function emptyState() {
    return { cat: "", ages: [], price: "", stock: false, fresh: false, popular: false, promise: false, sort: "featured", q: "" };
  }

  // ===== URL <-> state =====
  function readUrl(search) {
    var next = emptyState();
    var params;
    try { params = new URLSearchParams(search); } catch (e) { return next; }
    var cat = params.get("cat") || "";
    next.cat = J.categoryBySlug(cat) ? cat : "";
    var ageIds = J.ages.map(function (a) { return a.id; });
    next.ages = (params.get("age") || "").split(",").filter(function (a, i, arr) {
      return ageIds.indexOf(a) !== -1 && arr.indexOf(a) === i;
    });
    var price = params.get("price") || "";
    next.price = PRICES.some(function (p) { return p.id === price; }) ? price : "";
    next.stock = params.get("stock") === "1";
    next.fresh = params.get("new") === "1";
    next.popular = params.get("popular") === "1";
    next.promise = params.get("promise") === "1";
    var sort = params.get("sort") || "";
    next.sort = SORTS.indexOf(sort) !== -1 ? sort : "featured";
    next.q = (params.get("q") || "").trim().slice(0, 80);
    return next;
  }

  function query(s) {
    var parts = [];
    if (s.cat) parts.push("cat=" + encodeURIComponent(s.cat));
    if (s.ages.length) parts.push("age=" + s.ages.map(encodeURIComponent).join(","));
    if (s.price) parts.push("price=" + s.price);
    if (s.stock) parts.push("stock=1");
    if (s.fresh) parts.push("new=1");
    if (s.popular) parts.push("popular=1");
    if (s.promise) parts.push("promise=1");
    if (s.sort !== "featured") parts.push("sort=" + s.sort);
    if (s.q) parts.push("q=" + encodeURIComponent(s.q));
    if (J.state.mode === "business") parts.push("mode=business");
    return parts.length ? "?" + parts.join("&") : "";
  }

  function writeUrl(push) {
    if (!window.history || !window.history.replaceState) return;
    try {
      var url = "toys.html" + query(state);
      if (push) window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    } catch (e) { /* file:// — filters still work on the page */ }
  }

  // ===== Filtering + sorting =====
  function priceRange(id) {
    return PRICES.filter(function (p) { return p.id === id; })[0];
  }

  function inPrice(p, range) {
    var price = J.priceOf(p);
    return (range.min === undefined || price >= range.min) && (range.max === undefined || price < range.max);
  }

  function matchesQuery(p) {
    if (!state.q) return true;
    var cat = J.categoryBySlug(p.category);
    var hay = (p.name + " " + p.short + " " + p.highlights.join(" ") + " " + (cat ? cat.name : "")).toLowerCase();
    return state.q.toLowerCase().split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  // Price Promise is a shopper offer (brief §14 E-2): the filter only exists in Shop mode
  function promiseOn() {
    return state.promise && J.state.mode !== "business";
  }

  // Every filter except `skip`, so option counts show what you would get by changing that one filter
  function filtered(skip) {
    var range = state.price ? priceRange(state.price) : null;
    return J.products.filter(function (p) {
      return (skip === "cat" || !state.cat || p.category === state.cat) &&
        (skip === "age" || !state.ages.length || state.ages.some(function (id) { return J.inAge(p, id); })) &&
        (skip === "price" || !range || inPrice(p, range)) &&
        (skip === "stock" || !state.stock || J.inStock(p)) &&
        (skip === "new" || !state.fresh || J.isNew(p)) &&
        (skip === "popular" || !state.popular || J.isPopular(p)) &&
        (skip === "promise" || !promiseOn() || J.hasPriceMatch(p)) &&
        matchesQuery(p);
    });
  }

  // Business mode sorts by the lowest wholesale tier, shop mode by retail price
  function sortPrice(p) {
    if (J.state.mode !== "business") return J.priceOf(p);
    var tiers = J.tiersOf(p);
    return tiers[tiers.length - 1].price;
  }

  function sorted(items) {
    var copy = items.slice();
    if (state.sort === "price-asc") copy.sort(function (a, b) { return sortPrice(a) - sortPrice(b); });
    else if (state.sort === "price-desc") copy.sort(function (a, b) { return sortPrice(b) - sortPrice(a); });
    else if (state.sort === "newest") copy.sort(function (a, b) { return a.added < b.added ? 1 : a.added > b.added ? -1 : 0; });
    else copy.sort(function (a, b) { return Number(!J.inStock(a)) - Number(!J.inStock(b)); });   // featured: sold out last
    return copy;
  }

  // ===== Rendering =====
  function toysLabel(n) {
    return n + (n === 1 ? " toy" : " toys");
  }

  function renderHead() {
    var cat = J.categoryBySlug(state.cat);
    var business = J.state.mode === "business";
    var name = cat ? cat.name : business ? "Wholesale toys" : "All toys";
    document.title = name + (cat ? " | Toys" : "") + " | JIVORA";
    els.title.textContent = name;
    els.sub.textContent = business
      ? "Wholesale prices per piece (ex-tax), MOQ and price tiers. Add toys to your RFQ list for one quote."
      : promiseOn() ? "Toys covered by our Shop & Save Price Promise — found it cheaper? We'll match it or credit the difference (selected products, see terms)."
      : cat ? "Age-labelled " + cat.name.toLowerCase() + " from verified sellers." : "Every toy in the store — age-labelled, from verified sellers only.";
    var home = "index.html" + (business ? "?mode=business" : "");
    els.crumbs.innerHTML = '<li><a href="' + home + '">Home</a></li>' +
      (cat
        ? '<li><a href="' + J.categoryUrl("") + '">' + (business ? "Wholesale toys" : "Toys") + '</a></li><li aria-current="page">' + esc(cat.name) + "</li>"
        : '<li aria-current="page">' + (business ? "Wholesale toys" : "Toys") + "</li>");
  }

  function renderCats() {
    var items = [{ slug: "", name: "All toys", image: ALL_IMAGE }].concat(J.categories);
    els.cats.innerHTML = items.map(function (c, i) {
      var current = c.slug === state.cat;
      return '<li><a class="bubble tone-' + (c.slug ? J.toneAt(i - 1) : "yellow") + '" href="' + J.categoryUrl(c.slug) + '"' + (current ? ' aria-current="page"' : "") + ">" +
        '<span class="bubble__ring"><img src="' + J.imagePath(c.image) + '" alt="" width="160" height="160"' + (c.slug ? ' loading="lazy"' : "") + "></span>" +
        '<span class="bubble__name">' + esc(c.name) + "</span></a></li>";
    }).join("");
    var active = els.cats.querySelector('[aria-current="page"]');
    if (active && els.cats.scrollWidth > els.cats.clientWidth) {
      els.cats.scrollLeft = Math.max(0, active.parentNode.offsetLeft - els.cats.clientWidth / 2 + active.offsetWidth / 2);
    }
  }

  function option(type, name, value, label, checked, count) {
    var id = "f-" + name + "-" + (value || "all").replace(/[^a-z0-9]/gi, "");
    return '<li><input class="filters__input" type="' + type + '" id="' + id + '" name="' + name + '" value="' + esc(value) + '"' + (checked ? " checked" : "") + ">" +
      '<label class="filters__option" for="' + id + '"><span class="filters__mark" aria-hidden="true"></span><span class="filters__text">' + esc(label) + "</span>" +
      (count === null ? "" : '<span class="filters__n">' + count + "</span>") + "</label></li>";
  }

  function countBy(skip, test) {
    return filtered(skip).filter(test).length;
  }

  function renderFilters() {
    var business = J.state.mode === "business";
    var catOpts = option("radio", "cat", "", "All toys", !state.cat, countBy("cat", function () { return true; })) +
      J.categories.map(function (c) {
        return option("radio", "cat", c.slug, c.name, state.cat === c.slug, countBy("cat", function (p) { return p.category === c.slug; }));
      }).join("");
    var ageOpts = J.ages.map(function (a) {
      return option("checkbox", "age", a.id, a.label, state.ages.indexOf(a.id) !== -1, countBy("age", function (p) { return J.inAge(p, a.id); }));
    }).join("");
    var priceOpts = option("radio", "price", "", "Any price", !state.price, null) +
      PRICES.map(function (r) {
        return option("radio", "price", r.id, r.label, state.price === r.id, countBy("price", function (p) { return inPrice(p, r); }));
      }).join("");
    var showOpts = option("checkbox", "stock", "1", "In stock", state.stock, countBy("stock", J.inStock)) +
      option("checkbox", "new", "1", "New arrivals", state.fresh, countBy("new", J.isNew)) +
      option("checkbox", "popular", "1", "Popular picks", state.popular, countBy("popular", J.isPopular)) +
      (business ? "" : option("checkbox", "promise", "1", "Price Promise", state.promise, countBy("promise", J.hasPriceMatch)));

    els.form.innerHTML =
      '<fieldset class="filters__group"><legend class="filters__legend">Category</legend><ul class="filters__list">' + catOpts + "</ul></fieldset>" +
      '<fieldset class="filters__group"><legend class="filters__legend">Age</legend><ul class="filters__list">' + ageOpts + "</ul></fieldset>" +
      '<fieldset class="filters__group"><legend class="filters__legend">' + (business ? "Retail price (RRP)" : "Price") + '</legend><ul class="filters__list">' + priceOpts + "</ul></fieldset>" +
      '<fieldset class="filters__group"><legend class="filters__legend">Show</legend><ul class="filters__list">' + showOpts + "</ul></fieldset>";
  }

  function activeChips() {
    var chips = [];
    var cat = J.categoryBySlug(state.cat);
    if (cat) chips.push({ key: "cat", label: cat.name });
    state.ages.forEach(function (id) {
      var a = J.ages.filter(function (x) { return x.id === id; })[0];
      chips.push({ key: "age", value: id, label: a.label });
    });
    if (state.price) chips.push({ key: "price", label: priceRange(state.price).label });
    if (state.stock) chips.push({ key: "stock", label: "In stock" });
    if (state.fresh) chips.push({ key: "new", label: "New arrivals" });
    if (state.popular) chips.push({ key: "popular", label: "Popular picks" });
    if (promiseOn()) chips.push({ key: "promise", label: "Price Promise" });
    if (state.q) chips.push({ key: "q", label: "“" + state.q + "”" });
    return chips;
  }

  function renderActive() {
    var chips = activeChips();
    var n = chips.filter(function (c) { return c.key !== "cat" && c.key !== "q"; }).length;
    els.filterCount.textContent = n;
    els.filterCount.classList.toggle("is-empty", n === 0);
    els.active.hidden = !chips.length;
    els.active.innerHTML = chips.map(function (c) {
      return '<button class="filter-pill" type="button" data-remove="' + c.key + '"' + (c.value ? ' data-value="' + esc(c.value) + '"' : "") +
        ' aria-label="Remove filter: ' + esc(c.label) + '">' + esc(c.label) + J.icons.close + "</button>";
    }).join("") + (chips.length ? '<button class="link-btn" type="button" data-clear-filters>Clear filters</button>' : "");
  }

  function renderGrid() {
    var business = J.state.mode === "business";
    var items = sorted(filtered(""));
    els.grid.classList.toggle("grid--biz", business);
    els.grid.innerHTML = items.map(business ? J.bizCard : J.shopCard).join("");
    els.empty.hidden = items.length > 0;
    els.grid.hidden = !items.length;
    els.count.textContent = toysLabel(items.length);
    els.showBtn.textContent = items.length ? "Show " + toysLabel(items.length) : "No toys match";
    J.observe(els.grid);
  }

  // Highlight the matching header link (All toys / age / under-price) when the view is exactly that
  function syncNav() {
    var current = query({ cat: state.cat, ages: state.ages, price: state.price, stock: state.stock, fresh: state.fresh, popular: state.popular, promise: state.promise, sort: "featured", q: state.q })
      .replace(/[?&]mode=business/, "").replace(/^\?/, "");
    document.querySelectorAll(".catnav [data-catnav]").forEach(function (a) {
      var target = a.getAttribute("data-catnav").replace("+", "%2B");
      a.classList.toggle("is-active", target === current);
    });
  }

  function render() {
    els.sort.value = state.sort;
    if (els.search && document.activeElement !== els.search) els.search.value = state.q;
    renderHead();
    renderCats();
    renderFilters();
    renderActive();
    renderGrid();
    syncNav();
  }

  function update(push) {
    writeUrl(push);
    render();
  }

  // ===== Filter form (applies instantly, sidebar and bottom sheet alike) =====
  els.form.addEventListener("change", function (e) {
    var input = e.target;
    var focusId = input.id;
    if (input.name === "cat") state.cat = input.value;
    if (input.name === "age") {
      state.ages = Array.prototype.filter.call(els.form.querySelectorAll('input[name="age"]'), function (i) { return i.checked; })
        .map(function (i) { return i.value; });
    }
    if (input.name === "price") state.price = input.value;
    if (input.name === "stock") state.stock = input.checked;
    if (input.name === "new") state.fresh = input.checked;
    if (input.name === "popular") state.popular = input.checked;
    if (input.name === "promise") state.promise = input.checked;
    update(input.name === "cat");
    var again = document.getElementById(focusId);
    if (again) again.focus();
  });

  els.sort.addEventListener("change", function () {
    state.sort = els.sort.value;
    update(false);
  });

  function clearFilters() {
    var sort = state.sort;
    state = emptyState();
    state.sort = sort;
    if (els.search) els.search.value = "";
    update(true);
  }

  // ===== Bottom sheet (below 1024px) =====
  var sheetMq = window.matchMedia("(max-width: 1023px)");

  function openFilters() {
    document.body.classList.add("filters-open");
    els.openBtn.setAttribute("aria-expanded", "true");
    els.panel.setAttribute("role", "dialog");
    els.panel.setAttribute("aria-modal", "true");
    els.panel.focus();
  }

  function closeFilters(restore) {
    if (!document.body.classList.contains("filters-open")) return;
    document.body.classList.remove("filters-open");
    els.openBtn.setAttribute("aria-expanded", "false");
    els.panel.removeAttribute("role");
    els.panel.removeAttribute("aria-modal");
    if (restore !== false) els.openBtn.focus();
  }

  els.openBtn.addEventListener("click", openFilters);

  els.panel.addEventListener("keydown", function (e) {
    if (!document.body.classList.contains("filters-open")) return;
    if (e.key === "Escape") { closeFilters(); return; }
    if (e.key !== "Tab") return;
    var focusables = els.panel.querySelectorAll("button:not([disabled]), input");
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === els.panel)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  sheetMq.addEventListener("change", function (mq) { if (!mq.matches) closeFilters(false); });

  // ===== Clicks: pills, clear, sheet, and in-page links to toys.html (mega-menu, chips, crumbs) =====
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-remove], [data-clear-filters], [data-filters-close], a[href]");
    if (!t) return;
    if (t.hasAttribute("data-remove")) {
      var key = t.getAttribute("data-remove");
      if (key === "cat") state.cat = "";
      if (key === "age") state.ages = state.ages.filter(function (a) { return a !== t.getAttribute("data-value"); });
      if (key === "price") state.price = "";
      if (key === "stock") state.stock = false;
      if (key === "new") state.fresh = false;
      if (key === "popular") state.popular = false;
      if (key === "promise") state.promise = false;
      if (key === "q") state.q = "";
      update(key === "cat");
      var pill = els.active.querySelector(".filter-pill") || els.sort;
      pill.focus();
      return;
    }
    if (t.hasAttribute("data-clear-filters")) {
      clearFilters();
      return;
    }
    if (t.hasAttribute("data-filters-close")) {
      closeFilters();
      return;
    }
    var href = t.getAttribute("href");
    if (href.indexOf("toys.html") !== 0 || t.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    // Same page: switch the view without reloading
    e.preventDefault();
    var search = href.indexOf("?") === -1 ? "" : href.slice(href.indexOf("?"));
    state = readUrl(search);
    J.closeMenus();
    closeFilters(false);
    update(true);
    window.scrollTo({ top: 0, behavior: J.reduceMotion ? "auto" : "smooth" });
  });

  // Header search filters this page
  document.querySelectorAll("[data-search]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      state.q = form.querySelector("input").value.trim().slice(0, 80);
      update(true);
    });
  });

  window.addEventListener("popstate", function () {
    state = readUrl(window.location.search);
    render();
  });

  J.onChange(function (what) {
    if (what === "mode" || what === "sync") update(false);
  });

  state = readUrl(window.location.search);
  writeUrl(false);
  render();
})();
