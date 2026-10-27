/* Sample 2 — homepage pre-launch event "Register & get £22.50 off" (brief §14 E-1, E-9 – E-11).
   Phase (before / during / after) and the countdown come from event-config.js via site.js (J.eventInfo, UK time).
   The timer counts to the fixed start / end moments, so it never resets on refresh or for a new visitor, and switches
   phase on its own when a boundary passes. Fake urgency is avoided: no "only X left", no restarting timers.
   Before / after the event the panel shows a message only — there are no reminder / notify forms.
   Form: 2 steps — required full name, email, country; optional mobile, city → required toy categories (≥1) and
   Terms/Privacy consent, optional marketing consent; honeypot; client-side validation; POST to FORM_ENDPOINT as
   text/plain JSON (J.sendForm). Empty endpoint = "Demo mode — not saved".
   ?preview=event / ?preview=after (J.previewMode): simulated state + "Preview" badge; a submit is only sent when
   FORM_ENDPOINT is set, otherwise it shows "Preview — not saved". With ?preview=event&testkey=… the key goes along as
   `test_key` and the Apps Script saves the row in its "Test" tab (pre-event Sheet test, brief §14 E-13). */
(function () {
  "use strict";

  var J = window.Jivora;
  var box = document.querySelector("[data-event]");
  if (!J || !box) return;

  var section = box.closest("section");
  var form = box.querySelector("[data-reg-form]");
  var done = box.querySelector("[data-reg-done]");
  var msg = box.querySelector("[data-reg-msg]");
  var submitBtn = box.querySelector("[data-reg-submit]");
  var demo = !J.formEndpoint();
  var phase = null;
  var tick;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  // ===== Phase + countdown =====
  // "1 Nov" from the configured start (UK time)
  function opensOn(info) {
    var parts = J.ukDateOnly(info.start).split(" ");   // ["Sun,", "1", "Nov", "2026"]
    return parts[1] + " " + parts[2];
  }

  var COPY = {
    before: {
      label: "Event starts in",
      text: function () { return 'Register on event day and <span data-coupon></span> is added to your JIVORA account when orders open.'; },
      icon: "⏳",
      title: function (info) { return "Registration opens on " + opensOn(info) + ' — come back to claim <span data-coupon></span> off'; },
      body: "The form opens here when the countdown ends."
    },
    during: {
      label: "Offer ends in",
      text: function () { return 'Registration is open. Sign up today and <span data-coupon></span> is added to your JIVORA account at launch.'; }
    },
    after: {
      text: function () { return "Thanks to everyone who registered. The store opens soon."; },
      icon: "🎈",
      title: function () { return "This offer has ended"; },
      body: "Registered? Your credit is added to your account at launch."
    }
  };

  function setPhase(info) {
    if (info.phase === phase) return;
    phase = info.phase;
    box.setAttribute("data-phase", phase);
    var copy = COPY[phase];
    box.querySelector("[data-event-text]").innerHTML = copy.text(info);
    if (copy.label) box.querySelector("[data-timer-label]").textContent = copy.label;
    if (copy.title) {
      box.querySelector("[data-msg-icon]").textContent = copy.icon;
      box.querySelector("[data-msg-title]").innerHTML = copy.title(info);
      box.querySelector("[data-msg-text]").textContent = copy.body;
    }
    box.querySelectorAll("[data-phase-show]").forEach(function (el) { el.hidden = el.getAttribute("data-phase-show") !== phase; });
    box.querySelectorAll("[data-phase-hide]").forEach(function (el) { el.hidden = el.getAttribute("data-phase-hide") === phase; });
    // The form only exists during the event; a finished registration keeps its success panel until the offer ends
    if (phase !== "during") {
      done.hidden = true;
    } else if (!done.hidden) {
      form.hidden = true;
    }
    var when = box.querySelector("[data-event-when]");
    when.textContent = phase === "before"
      ? J.ukStartLabel(info.start) + " (UK time)"
      : phase === "during"
        ? "Ends " + J.ukEndLabel(info.end) + " (UK time)"
        : "Ended " + J.ukDateOnly(info.end) + " (UK time)";
    fillCoupon();
  }

  function fillCoupon() {
    box.querySelectorAll("[data-coupon]").forEach(function (el) { el.textContent = J.couponLabel(); });
  }

  function renderClock(info) {
    var target = info.phase === "before" ? info.start : info.end;
    var left = Math.max(0, Math.floor((target - info.now) / 1000));
    var d = Math.floor(left / 86400);
    var parts = { d: d, h: Math.floor(left / 3600) % 24, m: Math.floor(left / 60) % 60, s: left % 60 };
    // During the event the clock is HH:MM:SS; days only show when more than 24 hours remain
    var showDays = info.phase === "before" || d > 0;
    box.querySelector('[data-unit="d"]').hidden = !showDays;
    if (!showDays) parts.h = Math.floor(left / 3600);
    Object.keys(parts).forEach(function (k) {
      box.querySelector('[data-num="' + k + '"]').textContent = pad(parts[k]);
    });
  }

  function update() {
    var info = J.eventInfo();
    if (info.phase === "off") {
      section.hidden = true;
      clearInterval(tick);
      return;
    }
    setPhase(info);
    if (info.phase === "after") clearInterval(tick);
    else renderClock(info);
  }

  // ===== Form: chips from products.js =====
  function chipInput(type, name, value, label, tone) {
    var id = "reg-" + name + "-" + value.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    return '<span class="pick-chip' + (tone ? " tone-" + tone : "") + '"><input type="' + type + '" id="' + id + '" name="' + name + '" value="' + J.escapeHTML(value) + '">' +
      '<label for="' + id + '">' + J.escapeHTML(label) + "</label></span>";
  }

  box.querySelector("[data-reg-cats]").innerHTML = J.categories.map(function (c, i) {
    return chipInput("checkbox", "categories", c.name, c.name, J.toneAt(i));
  }).join("");

  // ===== Steps =====
  var step = 1;

  function showStep(n, focus) {
    step = n;
    form.querySelectorAll("[data-reg-step]").forEach(function (fs) { fs.hidden = Number(fs.getAttribute("data-reg-step")) !== n; });
    form.querySelector("[data-reg-label]").textContent = n === 1 ? "Step 1 of 2 · Your details" : "Step 2 of 2 · Toys you like";
    form.querySelector("[data-reg-bar]").style.transform = "scaleX(" + (n === 1 ? 0.5 : 1) + ")";
    if (focus) {
      var first = form.querySelector('[data-reg-step="' + n + '"] input:not([type="hidden"])');
      if (first) first.focus();
    }
  }

  // ===== Validation =====
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(input, errId, text) {
    var err = document.getElementById(errId);
    if (input) input.setAttribute("aria-invalid", String(!!text));
    if (err) {
      err.textContent = text || "";
      err.hidden = !text;
    }
    return !text;
  }

  function value(name) {
    var el = form.elements[name];
    return el && typeof el.value === "string" ? el.value.trim() : "";
  }

  function checkedValues(name) {
    return Array.prototype.filter.call(form.querySelectorAll('input[name="' + name + '"]'), function (i) { return i.checked; })
      .map(function (i) { return i.value; });
  }

  function validateStep1() {
    var ok = [];
    var name = value("name");
    ok.push(setError(form.elements.name, "reg-name-err", name.length < 2 ? "Please enter your full name." : ""));
    var email = value("email");
    ok.push(setError(form.elements.email, "reg-email-err", !email ? "Please enter your email." : !EMAIL.test(email) ? "Please enter a valid email, e.g. you@example.com." : ""));
    var mobile = value("mobile");
    var digits = mobile.replace(/[\s()+-]/g, "");
    ok.push(setError(form.elements.mobile, "reg-mobile-err", mobile && !/^\d{7,15}$/.test(digits) ? "Please enter a valid mobile number, or leave it empty." : ""));
    var country = checkedValues("country")[0];
    ok.push(setError(null, "reg-country-err", country ? "" : "Please choose UK or India."));
    form.querySelectorAll('input[name="country"]').forEach(function (i) { i.setAttribute("aria-invalid", String(!country)); });
    return ok.every(Boolean);
  }

  function validateStep2() {
    var cats = checkedValues("categories").length > 0;
    var okCats = setError(null, "reg-cats-err", cats ? "" : "Pick at least one toy category.");
    var terms = form.elements.consentTerms.checked;
    var okTerms = setError(form.elements.consentTerms, "reg-terms-err", terms ? "" : "Please agree to the Terms and Privacy Policy to register.");
    return okCats && okTerms;
  }

  function focusFirstError() {
    var bad = form.querySelector('[data-reg-step="' + step + '"] [aria-invalid="true"], [data-reg-step="' + step + '"] .field__error:not([hidden])');
    if (!bad) return;
    if (bad.classList.contains("field__error")) {
      var input = bad.parentElement.querySelector("input");
      if (input) bad = input;
    }
    bad.focus();
  }

  // Clear an error as soon as the field is fixed
  form.addEventListener("input", function (e) {
    var input = e.target;
    if (input.getAttribute("aria-invalid") !== "true") return;
    if (step === 1) validateStep1(); else validateStep2();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "categories" || e.target.name === "consentTerms" || e.target.name === "country") {
      var errId = { categories: "reg-cats-err", consentTerms: "reg-terms-err", country: "reg-country-err" }[e.target.name];
      if (!document.getElementById(errId).hidden) { if (step === 1) validateStep1(); else validateStep2(); }
    }
  });

  form.querySelector("[data-reg-next]").addEventListener("click", function () {
    if (validateStep1()) showStep(2, true);
    else focusFirstError();
  });
  form.querySelector("[data-reg-back]").addEventListener("click", function () { showStep(1, true); });

  // ===== Submit =====
  function payload() {
    return {
      type: "register",
      name: value("name"),
      email: value("email").toLowerCase(),
      mobile: value("mobile"),
      country: checkedValues("country")[0] || "",
      city: value("city"),
      categories: checkedValues("categories"),
      consentTerms: form.elements.consentTerms.checked,
      consentMarketing: form.elements.consentMarketing.checked,
      region: J.state.region,
      coupon: J.couponLabel(),
      hp: value("hp_check"),              // honeypot, must be empty
      preview: !!J.previewMode,
      submittedAt: new Date().toISOString(),
      page: document.body.getAttribute("data-page") || "index.html"
    };
  }

  var ERRORS = {
    duplicate: "This email is already registered — your offer is already linked to it.",
    closed: "Registration is closed — the offer window has ended.",
    invalid: "Some details look wrong. Please check the form and try again."
  };

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.classList.toggle("is-busy", busy);
  }

  function showError(text) {
    msg.className = "form-msg reg__msg is-error";
    msg.textContent = text;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (J.eventInfo().phase !== "during") { update(); return; }
    if (step === 1) {
      if (validateStep1()) showStep(2, true); else focusFirstError();
      return;
    }
    if (!validateStep1()) { showStep(1, false); focusFirstError(); return; }
    if (!validateStep2()) { focusFirstError(); return; }

    var data = payload();
    // Pre-event Sheet test: only with ?preview=event&testkey=… (never shown on the page)
    if (J.testKey()) data.test_key = J.testKey();
    // Honeypot filled → a bot. Pretend it worked, send nothing.
    if (data.hp) { success({ ok: true }, data.email, true); return; }
    // Preview without an endpoint: show the success screen, clearly marked, send nothing
    if (J.previewMode && !J.formEndpoint()) { success({ ok: true, previewOnly: true }, data.email); return; }

    setBusy(true);
    msg.className = "form-msg reg__msg";
    msg.textContent = "Registering…";
    J.sendForm(data).then(function (res) {
      if (res && res.ok) { success(res, data.email); return; }
      var code = res && res.error;
      if (code === "closed" && J.previewMode) {
        showError("Preview — not saved. The form works, but the sheet only accepts entries during the real event (UK time).");
        return;
      }
      if (code === "closed") update();
      showError(ERRORS[code] || "Something went wrong and your details weren't saved. Please try again.");
    }).catch(function () {
      showError("We couldn't reach the server, so nothing was saved. Check your connection and tap Register again.");
    }).then(function () { setBusy(false); });
  });

  function success(res, email, silent) {
    msg.textContent = "";
    msg.className = "form-msg reg__msg";
    var code = res && typeof res.code === "string" && /^JIV-[A-Z0-9]{6}$/.test(res.code) ? res.code : "";
    done.querySelector("[data-reg-code]").hidden = !code;
    done.querySelector("[data-reg-code-value]").textContent = code;
    var linked = done.querySelector("[data-reg-linked]");
    linked.hidden = !!code;
    linked.textContent = code ? "" : "Your offer is linked to " + email + ". Sign up with this email at launch and it's applied automatically.";
    var flag = done.querySelector("[data-reg-demo]");
    flag.textContent = res && res.test ? "Test entry — saved in the Test tab"
      : res && res.previewOnly ? "Preview — not saved" : "Demo mode — not saved";
    flag.hidden = !(res && (res.demo || res.previewOnly || res.test));
    form.hidden = true;
    done.hidden = false;
    fillCoupon();
    done.focus();
    if (!silent) confetti();
  }

  done.querySelector("[data-reg-copy]").addEventListener("click", function (e) {
    var text = done.querySelector("[data-reg-code-value]").textContent;
    var btn = e.currentTarget;
    function copied() { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(copied, function () { J.toast("Press and hold the code to copy it"); });
    else J.toast("Press and hold the code to copy it");
  });

  done.querySelector("[data-reg-again]").addEventListener("click", function () {
    form.reset();
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    form.querySelectorAll(".field__error").forEach(function (el) { el.hidden = true; });
    preselectCountry();
    done.hidden = true;
    form.hidden = false;
    showStep(1, true);
  });

  // ===== Confetti (bigger burst from the panel; off under reduced motion) =====
  var COLOURS = ["#FF7AB6", "#FFD23F", "#5CC8FF", "#5EE08A", "#B38CFF", "#FF9F43"];

  function confetti() {
    if (J.reduceMotion) return;
    var rect = done.getBoundingClientRect();
    var burst = document.createElement("div");
    burst.className = "confetti confetti--big";
    burst.setAttribute("aria-hidden", "true");
    burst.style.left = rect.left + rect.width / 2 + "px";
    burst.style.top = rect.top + Math.min(rect.height / 3, 120) + "px";
    for (var i = 0; i < 44; i++) {
      var bit = document.createElement("i");
      var angle = (Math.PI * 2 * i) / 44 + Math.random() * 0.3;
      var dist = 70 + Math.random() * 120;
      bit.style.setProperty("--x", Math.cos(angle) * dist + "px");
      bit.style.setProperty("--y", Math.sin(angle) * dist - 40 + "px");
      bit.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
      bit.style.background = COLOURS[i % COLOURS.length];
      burst.appendChild(bit);
    }
    document.body.appendChild(burst);
    setTimeout(function () { burst.remove(); }, 1400);
  }

  // ===== Init =====
  function preselectCountry() {
    var id = J.state.region === "UK" ? "reg-country-uk" : "reg-country-in";
    document.getElementById(id).checked = true;
  }

  // Small "Demo mode" flag on localhost; away from localhost the bigger preview banner (site.js) replaces it
  box.querySelectorAll("[data-demo-flag]").forEach(function (el) { el.hidden = !demo || J.isLivePreview() || !!J.previewMode; });
  box.querySelector("[data-preview-badge]").hidden = !J.previewMode;
  preselectCountry();
  showStep(1, false);
  update();
  tick = setInterval(update, 1000);

  J.onChange(function (what) {
    if (what === "region") fillCoupon();
  });
})();
