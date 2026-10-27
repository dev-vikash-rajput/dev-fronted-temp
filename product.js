/* Sample 2 — product page: renders one toy from products.js by ?id=<id>.
   Shop mode: gallery, name, price, age, description, highlights, add to cart, wishlist, related toys.
   Business mode adds wholesale tiers, MOQ, lead time, packaging, Incoterms, compliance note, seller card and a
   quote request form (front-end only). Re-renders when the interface mode or region changes. All content is DUMMY. */
(function () {
  "use strict";

  var J = window.Jivora;
  if (!J) return;
  var esc = J.escapeHTML;
  var root = document.getElementById("pdp-root");
  var id = "";
  try { id = new URLSearchParams(window.location.search).get("id") || ""; } catch (e) { /* ignore */ }
  var product = J.byId(id);
  var activeImage = 0;
  var rfqQty = product ? product.wholesale.moq : 0;
  var qty = 1;

  function notFound() {
    document.title = "Toy not found | JIVORA";
    root.innerHTML = '<section class="container not-found">' +
      '<p class="eyebrow eyebrow--amber">Not found</p>' +
      '<h1 class="not-found__title">We couldn’t find that toy.</h1>' +
      "<p>It may have moved, or the link is incomplete. Browse all toys instead.</p>" +
      '<a class="btn btn--primary" href="toys.html" data-mode-link>Browse all toys</a></section>';
  }

  if (!product) { notFound(); return; }

  function list(items) {
    return '<ul class="ticks">' + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }

  function gallery() {
    var imgs = product.images;
    var thumbs = imgs.length > 1 ? '<div class="gallery__thumbs" role="group" aria-label="Choose photo">' + imgs.map(function (img, i) {
      return '<button class="gallery__thumb" type="button" data-thumb="' + i + '" aria-pressed="' + (i === activeImage) + '" aria-label="Photo ' + (i + 1) + " of " + imgs.length + '">' +
        '<img src="' + J.imagePath(img) + '" alt="" width="96" height="96" loading="lazy"></button>';
    }).join("") + "</div>" : "";
    return '<div class="gallery">' +
      '<div class="gallery__main">' +
        '<img src="' + J.imagePath(imgs[activeImage]) + '" alt="' + esc(product.alt[activeImage]) + '" width="800" height="800" fetchpriority="high" data-main-img>' +
        (product.badge ? '<span class="card__badge">' + esc(product.badge) + "</span>" : "") +
      "</div>" + thumbs + "</div>";
  }

  function buyBox() {
    var business = J.state.mode === "business";
    var on = J.inWish(product.id);
    var from = J.tiersOf(product)[J.tiersOf(product).length - 1];
    var html = '<div class="pdp__info">' +
      '<p class="pdp__seller">' + J.icons.shield + " " + J.sellerLabel(product) + "</p>" +
      '<h1 class="pdp__title">' + esc(product.name) + "</h1>" +
      '<p class="pdp__tags"><span class="age-tag age-tag--lg">Age ' + esc(product.ageLabel) + "</span></p>";

    if (business) {
      html += '<div class="pdp__price pdp__price--biz"><span class="pdp__price-label">Wholesale from</span><strong>' + J.money(from.price) + '</strong><span class="pdp__price-unit">/ pc</span></div>' +
        '<p class="pdp__rrp">Suggested retail price ' + J.money(J.priceOf(product)) + " · MOQ " + product.wholesale.moq + " pcs · Lead time " + esc(J.leadOf(product)) + "</p>";
    } else {
      html += '<div class="pdp__price"><strong>' + J.money(J.priceOf(product)) + '</strong><span class="pdp__price-unit">incl. taxes</span></div>';
      // Shop & Save Price Promise (brief §14 E-2)
      if (J.hasPriceMatch(product)) {
        html += '<p class="pdp__promise">' + J.icons.tag + 'Price Promise — found it cheaper? We\'ll match it or credit the difference.* <a href="terms.html#price-promise">See terms</a></p>';
      }
    }

    html += '<p class="pdp__short">' + esc(product.short) + "</p>" + list(product.highlights);

    if (business) {
      var inRfq = J.inRfq(product.id);
      html += '<div class="pdp__actions">' +
        '<a class="btn btn--primary" href="#quote">Request quote</a>' +
        '<button class="btn ' + (inRfq ? "btn--added" : "btn--outline") + '" type="button" data-pdp-rfq aria-pressed="' + inRfq + '">' + (inRfq ? J.icons.check + " In RFQ list" : "Add to RFQ list") + "</button>" +
        "</div>";
    } else {
      html += '<div class="pdp__actions">' +
        '<div class="stepper stepper--lg" role="group" aria-label="Quantity">' +
          '<button type="button" data-qty-step="-1" aria-label="Decrease quantity">−</button>' +
          '<span data-qty aria-live="polite">' + qty + "</span>" +
          '<button type="button" data-qty-step="1" aria-label="Increase quantity">+</button>' +
        "</div>" +
        (J.inStock(product)
          ? '<button class="btn btn--primary pdp__add" type="button" data-pdp-add>Add to cart</button>'
          : '<button class="btn btn--disabled pdp__add" type="button" disabled>Sold out</button>') +
        '<button class="icon-btn icon-btn--line pdp__wish" type="button" data-wish="' + product.id + '" data-wish-toggle="' + product.id + '" aria-pressed="' + on + '" aria-label="Save to wishlist">' + J.icons.heart + "</button>" +
        "</div>" +
        '<p class="pdp__note"><span class="announcement__dot" aria-hidden="true"></span>Pre-launch: orders open soon. Add to cart now and we’ll keep it saved on this device.</p>';
    }
    return html + "</div>";
  }

  function detailsSection() {
    var rows = Object.keys(product.details).map(function (k) {
      return "<div><dt>" + esc(k) + "</dt><dd>" + esc(product.details[k]) + "</dd></div>";
    }).join("");
    return '<section class="block block--tight" aria-labelledby="about-title"><div class="container pdp-details">' +
      '<div><h2 class="block__title block__title--sm" id="about-title">About this toy</h2><p class="pdp-details__text">' + esc(product.description) + "</p></div>" +
      '<dl class="spec">' + rows + "<div><dt>Age</dt><dd>" + esc(product.ageLabel) + "</dd></div><div><dt>Sold by</dt><dd>" + J.sellerLabel(product).replace("Sold by ", "") + "</dd></div></dl>" +
      "</div></section>";
  }

  function tradeSection() {
    var trade = J.trade[J.state.region];
    var tiers = J.tiersOf(product);
    var rows = tiers.map(function (t, i) {
      var next = tiers[i + 1];
      var range = next ? t.min + "–" + (next.min - 1) + " pcs" : t.min + "+ pcs";
      return "<tr data-tier=\"" + i + "\"><td>" + range + "</td><td>" + J.money(t.price) + "</td></tr>";
    }).join("");
    var seller = product.seller === "partner"
      ? { name: "Verified partner seller", text: "An independent wholesaler verified by Jivora before listing. Quotes and dispatch are coordinated through Jivora." }
      : { name: "Sold by Jivora", text: "Jivora’s own stock, held and dispatched by Jivora. One contact for quotes, samples and repeat orders." };

    return '<section class="block block--tight" id="trade" aria-labelledby="trade-title"><div class="container">' +
      '<div class="block__head"><h2 class="block__title block__title--sm" id="trade-title">Trade details</h2>' +
      '<p class="block__note">' + (J.state.region === "UK" ? "UK prices in £, ex-VAT." : "India prices in ₹, ex-GST.") + " Indicative — confirmed in your quote.</p></div>" +
      '<div class="trade">' +
        '<div class="panel"><h3 class="panel__title">Wholesale price tiers</h3>' +
          '<div class="table-scroll"><table class="tiers"><thead><tr><th scope="col">Quantity</th><th scope="col">Price / pc</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>" +
        '<div class="panel"><h3 class="panel__title">Order &amp; packaging</h3><dl class="spec spec--compact">' +
          "<div><dt>MOQ</dt><dd>" + product.wholesale.moq + " pcs</dd></div>" +
          "<div><dt>Carton</dt><dd>" + esc(product.wholesale.carton) + "</dd></div>" +
          "<div><dt>Lead time</dt><dd>" + esc(J.leadOf(product)) + "</dd></div>" +
          "<div><dt>Packaging</dt><dd>" + esc(product.wholesale.packaging) + "</dd></div></dl></div>" +
        '<div class="panel"><h3 class="panel__title">Delivery terms (Incoterms)</h3>' + list(trade.incoterms) +
          '<h3 class="panel__title panel__title--gap">Compliance</h3><p class="panel__text">Compliance documents available on request</p></div>' +
        '<div class="panel panel--seller"><p class="eyebrow">Seller</p><h3 class="panel__title">' + J.icons.shield + " " + seller.name + "</h3>" +
          '<p class="panel__text">' + seller.text + "</p>" +
          '<ul class="ticks"><li>Verified before listing</li><li>Genuine products only</li><li>Replies to quotes within 1 working day (target)</li></ul></div>' +
      "</div></div></section>" +
      quoteSection();
  }

  function quoteSection() {
    return '<section class="block block--tight" id="quote" aria-labelledby="quote-title"><div class="container">' +
      '<div class="quote">' +
        '<div class="quote__text"><h2 class="block__title block__title--sm" id="quote-title">Request a quote</h2>' +
          "<p>Tell us how many you need. You’ll get a firm price, delivery terms and dispatch date.</p>" +
          '<div class="quote__estimate"><span>Indicative total</span><strong data-estimate></strong><small data-estimate-note></small></div></div>' +
        '<form class="quote__form" id="quote-form" novalidate>' +
          '<div class="field"><label for="q-qty">Quantity (pcs, min ' + product.wholesale.moq + ")</label>" +
            '<input class="input" id="q-qty" name="qty" type="number" inputmode="numeric" min="' + product.wholesale.moq + '" step="1" value="' + rfqQty + '" required aria-describedby="q-qty-error">' +
            '<p class="field__error" id="q-qty-error" hidden></p></div>' +
          '<div class="field"><label for="q-company">Business name</label><input class="input" id="q-company" name="company" type="text" autocomplete="organization" required></div>' +
          '<div class="field"><label for="q-email">Work email</label><input class="input" id="q-email" name="email" type="email" autocomplete="email" required></div>' +
          '<div class="field"><label for="q-note">Notes (optional)</label><input class="input" id="q-note" name="note" type="text" placeholder="e.g. need samples first"></div>' +
          '<button class="btn btn--primary btn--block field--wide" type="submit">Send quote request</button>' +
          '<p class="form-msg field--wide" role="status" aria-live="polite" data-quote-msg></p>' +
        "</form></div></div></section>";
  }

  function relatedSection() {
    var business = J.state.mode === "business";
    var others = J.products.filter(function (p) { return p.id !== product.id; });
    var sameCat = others.filter(function (p) { return p.category === product.category; });
    var sameAge = others.filter(function (p) { return p.category !== product.category && p.age === product.age; });
    var rest = others.filter(function (p) { return p.category !== product.category && p.age !== product.age; });
    var picks = sameCat.concat(sameAge, rest).slice(0, 5);
    return '<section class="block block--tight" aria-labelledby="related-title"><div class="container">' +
      '<div class="block__head"><h2 class="block__title block__title--sm" id="related-title">' + (business ? "More wholesale toys" : "You may also like") + "</h2>" +
      '<a class="block__link" href="' + J.categoryUrl(product.category) + '">View all</a></div>' +
      '<div class="grid grid--related' + (business ? " grid--biz" : "") + '">' + picks.map(business ? J.bizCard : J.shopCard).join("") + "</div>" +
      "</div></section>";
  }

  // Sticky bottom bar on phones / tablets (hidden from 1024px by CSS)
  function buyBar() {
    var business = J.state.mode === "business";
    var from = J.tiersOf(product)[J.tiersOf(product).length - 1];
    return '<div class="buybar" aria-label="Quick actions">' +
      '<div class="buybar__price"><span class="buybar__name">' + esc(product.name) + "</span>" +
        "<strong>" + (business ? "From " + J.money(from.price) + " / pc" : J.money(J.priceOf(product))) + "</strong></div>" +
      (business
        ? '<a class="btn btn--primary" href="#quote">Request quote</a>'
        : J.inStock(product)
          ? '<button class="btn btn--primary" type="button" data-pdp-add>Add to cart</button>'
          : '<button class="btn btn--disabled" type="button" disabled>Sold out</button>') +
      "</div>";
  }

  function render() {
    var business = J.state.mode === "business";
    var cat = J.categoryBySlug(product.category);
    document.title = product.name + " | JIVORA";
    root.innerHTML =
      '<nav class="container crumbs" aria-label="Breadcrumb"><ol>' +
        '<li><a href="index.html' + (business ? "?mode=business" : "") + '">Home</a></li>' +
        '<li><a href="' + J.categoryUrl("") + '">' + (business ? "Wholesale toys" : "Toys") + "</a></li>" +
        (cat ? '<li><a href="' + J.categoryUrl(cat.slug) + '">' + esc(cat.name) + "</a></li>" : "") +
        '<li aria-current="page">' + esc(product.name) + "</li></ol></nav>" +
      '<section class="container pdp" aria-label="Product overview">' + gallery() + buyBox() + "</section>" +
      detailsSection() +
      (business ? tradeSection() : "") +
      relatedSection() +
      buyBar();
    if (business) updateEstimate();
    J.observe(root);
  }

  // ===== Business: quote estimate =====
  function readQty(input) {
    var value = Math.round(Number(input.value));
    return isFinite(value) ? value : 0;
  }

  function updateEstimate() {
    var input = document.getElementById("q-qty");
    var out = root.querySelector("[data-estimate]");
    var note = root.querySelector("[data-estimate-note]");
    if (!input || !out) return;
    var n = readQty(input);
    var moq = product.wholesale.moq;
    var tiers = J.tiersOf(product);
    root.querySelectorAll(".tiers tbody tr").forEach(function (tr) { tr.classList.remove("is-active"); });
    if (n < moq) {
      out.textContent = "—";
      note.textContent = "Minimum order is " + moq + " pcs.";
      return;
    }
    var tier = J.tierFor(product, n);
    var row = root.querySelector('.tiers tbody tr[data-tier="' + tiers.indexOf(tier) + '"]');
    if (row) row.classList.add("is-active");
    out.textContent = J.money(tier.price * n);
    note.textContent = n + " pcs × " + J.money(tier.price) + " / pc (ex-tax)";
  }

  root.addEventListener("input", function (e) {
    if (e.target.id === "q-qty") {
      rfqQty = readQty(e.target);
      updateEstimate();
    }
  });

  root.addEventListener("submit", function (e) {
    if (e.target.id !== "quote-form") return;
    e.preventDefault();
    var form = e.target;
    var msg = form.querySelector("[data-quote-msg]");
    var qtyInput = form.querySelector("#q-qty");
    var qtyError = form.querySelector("#q-qty-error");
    var n = readQty(qtyInput);
    var problems = [];

    var badQty = n < product.wholesale.moq;
    qtyInput.setAttribute("aria-invalid", String(badQty));
    qtyError.hidden = !badQty;
    qtyError.textContent = badQty ? "Enter at least " + product.wholesale.moq + " pcs (MOQ)." : "";
    if (badQty) problems.push(qtyInput);

    ["q-company", "q-email"].forEach(function (fid) {
      var input = form.querySelector("#" + fid);
      var bad = !input.value.trim() || (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
      input.setAttribute("aria-invalid", String(bad));
      if (bad) problems.push(input);
    });

    if (problems.length) {
      msg.className = "form-msg field--wide is-error";
      msg.textContent = "Please check the highlighted fields.";
      problems[0].focus();
      return;
    }
    msg.className = "form-msg field--wide is-success";
    msg.textContent = "Thanks — your quote request for " + n + " pcs is in. The seller replies within one working day.";
  });

  root.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-thumb")) {
      activeImage = Number(t.getAttribute("data-thumb"));
      var img = root.querySelector("[data-main-img]");
      img.src = J.imagePath(product.images[activeImage]);
      img.alt = product.alt[activeImage];
      root.querySelectorAll("[data-thumb]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === t));
      });
    }
    if (t.hasAttribute("data-qty-step")) {
      qty = Math.min(99, Math.max(1, qty + Number(t.getAttribute("data-qty-step"))));
      root.querySelector("[data-qty]").textContent = qty;
    }
    if (t.hasAttribute("data-pdp-add")) {
      J.addToCart(product.id, qty);
      J.bump("cart");
      J.celebrate(t);
      J.toast(qty + " × " + product.name + " added to cart");
      t.textContent = "Added to cart";
      setTimeout(function () { if (document.contains(t)) t.textContent = "Add to cart"; }, 1500);
    }
    if (t.hasAttribute("data-pdp-rfq")) {
      var added = J.toggleRfq(product.id, Math.max(rfqQty, product.wholesale.moq));
      if (added) J.bump("rfq");
      J.toast(added ? "Added to RFQ list" : "Removed from RFQ list");
    }
  });

  // Business RFQ button lives outside the card grid, so refresh it on changes
  J.onChange(function (what) {
    if (what === "mode" || what === "region" || what === "sync") { render(); return; }
    var b = root.querySelector("[data-pdp-rfq]");
    if (b && what === "rfq") {
      var on = J.inRfq(product.id);
      b.setAttribute("aria-pressed", String(on));
      b.className = "btn " + (on ? "btn--added" : "btn--outline");
      b.innerHTML = on ? J.icons.check + " In RFQ list" : "Add to RFQ list";
    }
  });

  render();
})();
