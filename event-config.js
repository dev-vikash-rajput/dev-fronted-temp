/* Sample 2 — pre-launch event settings (brief §14 "Decisions 27 Oct", §15 "Decisions 29 Oct": IFB Diwali Event Gift Coupon). Change values here only; every page reads them.
   Loaded in <head> on every page, before the deferred scripts that read it. (Pre-launch noindex is a static
   <meta name="robots"> tag in each HTML file — see docs/launch-checklist.md.)

   EVENT_START / EVENT_END are UK wall-clock times (Europe/London, GMT/BST handled automatically) in the form
   "YYYY-MM-DDTHH:MM:SS". The countdown always counts to these fixed moments, so it never resets on refresh or for a
   new visitor. Event day: Sun 1 Nov 2026 (source: user, 27 Oct — brief Open Question 19, resolved). UK is on GMT that
   day (BST ended 25 Oct); the conversion uses the Europe/London time zone, never a hard-coded offset.

   FORM_ENDPOINT: the Google Apps Script web-app URL (…/exec). Empty = "Demo mode — not saved" (nothing is sent).
   COUPON_AMOUNT: null = the Gift Coupon value is NOT shown anywhere on the site (client 29 Oct: "discount nahi hai").
   Whether to show it at all is brief Open Question 26 — no page reads this value today. */
(function () {
  "use strict";

  window.JIVORA_EVENT = {
    EVENT_START: "2026-11-01T00:00:00",   // UK time (Europe/London)
    EVENT_END: "2026-11-01T23:59:59",     // UK time (Europe/London)
    TIMEZONE: "Europe/London",
    COUPON_AMOUNT: null,
    FORM_ENDPOINT: "",
    PRIVACY_URL: "privacy.html",
    TERMS_URL: "terms.html"
  };
})();
