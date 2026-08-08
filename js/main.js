/* HYDRA STEAM FOAM — behaviour layer.
   Theme, language/RTL, mobile drawer, scroll reveal, live opening state,
   WhatsApp lead form. No build step and no dependencies. */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     Business details. Everything the business might need to edit lives
     here. Numbers are E.164 for links and prettified in the dictionary.
     --------------------------------------------------------------------- */
  var BIZ = {
    whatsapp: "971567794638",     // digits only, used for every wa.me link
    phone: "+971567794638",       // 056 779 4638 — the Google listing number
    lat: 25.1919375,              // decoded from plus code 57RM+QQ Dubai
    lng: 55.2844375
  };

  /* Opening hours, in minutes past midnight, Dubai local time.
     The Google listing publishes "Open 24 hours" for all seven days, so
     open24 is true and the live line in the hero always reads open. If the
     business ever moves to fixed hours, set open24 to false and fill in
     opens/closes — nothing else needs to change here, but the wording in
     js/i18n.js (h.*, hero.open.*, i.hours.v) and the
     openingHoursSpecification in the JSON-LD block of index.html both
     describe the same hours and have to be corrected alongside it. */
  var HOURS = {
    open24: true,
    opens: 8 * 60,
    closes: 22 * 60
  };

  var LOCALES = ["en", "ar"];
  var STORE_LANG = "hsf.lang";
  var STORE_THEME = "hsf.theme";
  var I18N = window.HSF_I18N;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------------
     Theme
     --------------------------------------------------------------------- */
  var media = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try { return localStorage.getItem(STORE_THEME); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#060e1e" : "#f5f8fd");
    $$(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
    });
  }

  function setTheme(theme) {
    applyTheme(theme);
    try { localStorage.setItem(STORE_THEME, theme); } catch (e) {}
  }

  applyTheme(storedTheme() || (media.matches ? "dark" : "light"));

  // Follow the OS only while the visitor has not chosen for themselves.
  var onSchemeChange = function (e) { if (!storedTheme()) applyTheme(e.matches ? "dark" : "light"); };
  if (media.addEventListener) media.addEventListener("change", onSchemeChange);
  else if (media.addListener) media.addListener(onSchemeChange);

  $$(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  });

  /* ---------------------------------------------------------------------
     Language and direction
     --------------------------------------------------------------------- */
  var currentLang = "en";

  function detectLang() {
    var saved;
    try { saved = localStorage.getItem(STORE_LANG); } catch (e) {}
    if (saved && LOCALES.indexOf(saved) > -1) return saved;

    var params = new URLSearchParams(window.location.search);
    var q = params.get("lang");
    if (q && LOCALES.indexOf(q) > -1) return q;

    var nav = (navigator.languages || [navigator.language || "en"]).join(",").toLowerCase();
    return nav.indexOf("ar") === 0 || nav.indexOf(",ar") > -1 ? "ar" : "en";
  }

  function t(key) {
    var pack = I18N[currentLang] || I18N.en;
    return pack[key] != null ? pack[key] : (I18N.en[key] != null ? I18N.en[key] : key);
  }

  function applyLang(lang) {
    if (LOCALES.indexOf(lang) === -1) lang = "en";
    currentLang = lang;

    var pack = I18N[lang];
    var root = document.documentElement;
    root.setAttribute("lang", lang);
    root.setAttribute("dir", pack.dir);

    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });

    // data-i18n-attr="placeholder:f.name.ph, aria-label:cta.call"
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });

    document.title = t("meta.title");
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.desc"));
    var ogTitle = $('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", t("meta.title"));
    var ogDesc = $('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", t("meta.desc"));
    var ogLocale = $('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute("content", lang === "ar" ? "ar_AE" : "en_AE");

    $$(".lang-btn__label").forEach(function (el) { el.textContent = pack.toggleTo; });
    $$(".lang-btn").forEach(function (el) { el.setAttribute("aria-label", t("cta.lang")); });

    // Quick-contact links carry a pre-written message in the active language.
    $$("[data-wa-quick]").forEach(function (el) { el.setAttribute("href", waLink(t("wa.quick"))); });

    try { localStorage.setItem(STORE_LANG, lang); } catch (e) {}
  }

  function waLink(message) {
    return "https://wa.me/" + BIZ.whatsapp + "?text=" + encodeURIComponent(message);
  }

  applyLang(detectLang());

  $$(".lang-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(currentLang === "en" ? "ar" : "en");
    });
  });

  /* ---------------------------------------------------------------------
     Header stuck state (sentinel + observer, never a scroll listener)
     --------------------------------------------------------------------- */
  var header = $(".header");
  var sentinel = $("#top-sentinel");
  if (header && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      header.setAttribute("data-stuck", String(!entries[0].isIntersecting));
    }, { threshold: 0 }).observe(sentinel);
  }

  /* ---------------------------------------------------------------------
     Mobile drawer
     --------------------------------------------------------------------- */
  var drawer = $("#drawer");
  var navToggle = $(".nav-toggle");

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function drawerIsOpen() {
    return !!drawer && drawer.getAttribute("data-open") === "true";
  }

  function setDrawer(open) {
    if (!drawer) return;
    drawer.setAttribute("data-open", String(open));
    drawer.setAttribute("aria-hidden", String(!open));
    if (navToggle) navToggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";

    if (open) {
      // CSS flips visibility with a 0s delay on open, so the panel is
      // focusable immediately. No rAF needed, which keeps this working when
      // the tab is backgrounded and frames are throttled.
      var first = drawer.querySelector(FOCUSABLE);
      if (first) first.focus();
    } else if (navToggle) {
      navToggle.focus();
    }
  }

  if (navToggle) navToggle.addEventListener("click", function () { setDrawer(true); });
  $$("[data-drawer-close]").forEach(function (el) {
    el.addEventListener("click", function () { setDrawer(false); });
  });

  document.addEventListener("keydown", function (e) {
    if (!drawerIsOpen()) return;

    if (e.key === "Escape") { setDrawer(false); return; }

    // Keep Tab inside the open panel.
    if (e.key !== "Tab") return;
    var items = $$(FOCUSABLE, drawer).filter(function (el) { return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---------------------------------------------------------------------
     Scroll reveal. Communicates reading order as each section enters.
     --------------------------------------------------------------------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function initReveal() {
    var items = $$("[data-reveal]");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.setAttribute("data-shown", "true"); });
      return;
    }
    $$("[data-reveal-stagger]").forEach(function (group) {
      $$("[data-reveal]", group).forEach(function (el, i) {
        el.style.setProperty("--reveal-delay", Math.min(i, 6) * 70 + "ms");
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-shown", "true");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }
  initReveal();

  /* ---------------------------------------------------------------------
     "Open now" line. Times are Dubai local (UTC+4) regardless of the
     visitor's own clock, so someone browsing from London still sees the
     business's state and not their own.
     --------------------------------------------------------------------- */
  var openLine = $("[data-open-line]");
  if (openLine) {
    var state = "open";
    if (!HOURS.open24) {
      var now = new Date();
      var dubai = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
      var mins = dubai.getHours() * 60 + dubai.getMinutes();
      state = (mins >= HOURS.opens && mins < HOURS.closes) ? "open" : "shut";
    }
    // Each state is a separate translated span, so no runtime string
    // interpolation is needed and Arabic reads naturally.
    openLine.setAttribute("data-state", state);
  }

  /* ---------------------------------------------------------------------
     Booking form. Composes a WhatsApp message from the fields; there is no
     backend and nothing is posted anywhere.
     --------------------------------------------------------------------- */
  var form = $("#quote-form");

  if (form) {
    var status = $("#form-status");
    var statusText = $("#form-status-text");
    var statusLink = $("#form-status-link");

    var setInvalid = function (field, invalid) {
      var wrap = field.closest(".field");
      if (wrap) wrap.setAttribute("data-invalid", String(invalid));
      field.setAttribute("aria-invalid", String(invalid));
    };

    var validPhone = function (value) {
      return value.replace(/[^\d]/g, "").length >= 7;
    };

    // Clear the error as soon as the visitor starts fixing the field.
    $$("#quote-form input, #quote-form select").forEach(function (el) {
      el.addEventListener("input", function () {
        if (el.closest(".field") && el.closest(".field").getAttribute("data-invalid") === "true") {
          setInvalid(el, false);
        }
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.elements.name;
      var phone = form.elements.phone;
      // Named "service", not "item": HTMLFormControlsCollection exposes its
      // own item() method under that key, so form.elements.item would hand
      // back the function instead of the <select>.
      var service = form.elements.service;
      var area = form.elements.area;
      var notes = form.elements.notes;

      var firstBad = null;
      var checks = [
        [name, name.value.trim().length > 0],
        [phone, validPhone(phone.value)],
        [service, service.value !== ""]
      ];
      checks.forEach(function (pair) {
        var ok = pair[1];
        setInvalid(pair[0], !ok);
        if (!ok && !firstBad) firstBad = pair[0];
      });

      if (firstBad) {
        firstBad.focus();
        if (status) status.setAttribute("data-show", "false");
        return;
      }

      var selected = service.options[service.selectedIndex];
      var lines = [
        t("wa.greeting"),
        "",
        t("wa.name") + ": " + name.value.trim(),
        t("wa.phone") + ": " + phone.value.trim(),
        t("wa.item") + ": " + selected.textContent.trim()
      ];
      if (area.value.trim()) lines.push(t("wa.area") + ": " + area.value.trim());
      if (notes.value.trim()) lines.push(t("wa.notes") + ": " + notes.value.trim());

      var url = waLink(lines.join("\n"));

      if (statusText) statusText.textContent = t("f.status");
      if (statusLink) {
        statusLink.setAttribute("href", url);
        statusLink.textContent = t("f.status.link");
      }
      if (status) {
        status.setAttribute("data-show", "true");
        status.focus();
      }

      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------------------------
     Current year in the footer
     --------------------------------------------------------------------- */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
