/* ==========================================================
   SOLNEX Energy Solution – Homepage script (vanilla JS)
   - Mobile menu, scroll reveal, dynamic year
   - WhatsApp click-to-chat enquiry form (no backend, no storage)
   - Demonstration calculator (shows NO monetary figures)
   ========================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIGURATION – EDIT THIS SECTION
     ----------------------------------------------------------
     >>> WHERE TO INSERT THE BUSINESS WHATSAPP NUMBER <<<
     Replace the placeholder text below with the OFFICIAL SOLNEX
     business WhatsApp number:
       - include the country code (India = 91)
       - digits only: no "+", no spaces, no hyphens
     Example format: "919876543210"  (this is only a format example,
     NOT a real SOLNEX number)
     ---------------------------------------------------------- */
  var WHATSAPP_NUMBER = "9131910814"; // <-- INSERT NUMBER HERE

  /* Calculator assumptions. No verified tariffs, prices, generation
     or subsidy values are available, so the calculator is a
     demonstration and never shows money figures. Only set
     `verified` to true after the business supplies real data AND
     the result logic below is extended accordingly. */
  var CALC_CONFIG = { verified: false };

  /* ---------- Helpers ---------- */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* Number is usable only if it is 10-15 digits (country code included) */
  /* wa.me needs the country code. A plain 10-digit Indian number gets 91 added. */
  function waNumber() { return /^\d{10}$/.test(WHATSAPP_NUMBER) ? "91" + WHATSAPP_NUMBER : WHATSAPP_NUMBER; }
  function isWhatsAppConfigured() { return /^\d{10,15}$/.test(WHATSAPP_NUMBER); }

  /* Click-to-chat URL: https://wa.me/NUMBER?text=ENCODED_MESSAGE */
  function buildWhatsAppUrl(message) {
    return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(message);
  }

  /* Remove control characters and trim, to keep the message clean */
  function clean(value) {
    return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  }

  document.documentElement.classList.add("js");

  /* ---------- Footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  /* ---------- Mobile menu ---------- */
  var toggle = $("#menu-toggle");
  var nav = $("#main-nav");

  function setMenu(open) {
    if (!toggle || !nav) { return; }
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("a")) { setMenu(false); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) { setMenu(false); }
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = $all(".reveal, .reveal-left, .reveal-right, .reveal-zoom");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add("visible");
          observer.unobserve(el);
          /* After the entrance finishes, drop the reveal classes. Otherwise their
             transform/transition rules override the card hover lift. */
          window.setTimeout(function () {
            el.classList.remove("reveal", "reveal-left", "reveal-right", "reveal-zoom");
          }, 1600);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Form elements ---------- */
  var form = $("#enquiry-form");
  var statusEl = $("#form-status");
  var fallbackBox = $("#form-fallback");
  var fallbackText = $("#fallback-message");
  var retryLink = $("#retry-link");
  var copyBtn = $("#copy-message");

  var fields = {
    name: $("#f-name"), phone: $("#f-phone"), location: $("#f-location"),
    property: $("#f-property"), bill: $("#f-bill"),
    requirement: $("#f-requirement"), message: $("#f-message"), consent: $("#f-consent")
  };

  /* The last built message is kept in page memory ONLY (never in storage) */
  var lastMessage = "";

  function setStatus(text, type) {
    if (!statusEl) { return; }
    statusEl.textContent = text;
    statusEl.className = "form-status" + (type ? " " + type : "");
  }

  function setFieldError(key, text) {
    var input = fields[key];
    var err = $("#err-" + key);
    if (!input || !err) { return; }
    var wrapper = input.closest(".field");
    err.textContent = text || "";
    if (wrapper) { wrapper.classList.toggle("invalid", !!text); }
    if (text) { input.setAttribute("aria-invalid", "true"); } else { input.removeAttribute("aria-invalid"); }
  }

  /* Returns true if phone looks like a valid Indian mobile number */
  function isValidPhone(raw) {
    var digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) { digits = digits.slice(2); }
    else if (digits.length === 11 && digits.charAt(0) === "0") { digits = digits.slice(1); }
    return /^[6-9]\d{9}$/.test(digits);
  }

  /* Client-side validation only. This improves usability but is NOT
     a security control: anyone can bypass browser checks. This static
     site has no server, so nothing is stored or processed here; if a
     backend is ever added, it must re-validate all input server-side. */
  function validateForm() {
    var firstInvalid = null;
    function fail(key, msg) {
      setFieldError(key, msg);
      if (!firstInvalid) { firstInvalid = fields[key]; }
    }

    var name = clean(fields.name.value);
    var phone = clean(fields.phone.value);
    var location = clean(fields.location.value);

    setFieldError("name", ""); setFieldError("phone", ""); setFieldError("location", "");
    setFieldError("property", ""); setFieldError("requirement", ""); setFieldError("consent", "");

    if (name.length < 2) { fail("name", "Please enter your full name."); }
    if (!phone) { fail("phone", "Please enter your WhatsApp number."); }
    else if (!isValidPhone(phone)) { fail("phone", "Please enter a valid 10-digit mobile number."); }
    if (location.length < 2) { fail("location", "Please enter your city or PIN code."); }
    if (!fields.property.value) { fail("property", "Please select a property type."); }
    if (!fields.requirement.value) { fail("requirement", "Please select your solar requirement."); }
    if (!fields.consent.checked) { fail("consent", "Please tick the consent box so SOLNEX can contact you."); }

    if (firstInvalid) { firstInvalid.focus(); return false; }
    return true;
  }

  function buildEnquiryMessage() {
    var bill = clean(fields.bill.value) || "Not provided";
    var extra = clean(fields.message.value);
    var lines = [
      "Hello SOLNEX Team!",
      "",
      "I am interested in a solar solution.",
      "",
      "Name: " + clean(fields.name.value),
      "Phone: " + clean(fields.phone.value),
      "Location: " + clean(fields.location.value),
      "Property Type: " + fields.property.value,
      "Monthly Electricity Bill: " + bill,
      "Requirement: " + fields.requirement.value
    ];
    if (extra) { lines.push("Additional Message: " + extra); }
    lines.push("", "Please contact me regarding my enquiry.");
    return lines.join("\n");
  }

  function showFallback(message, url) {
    if (!fallbackBox) { return; }
    fallbackText.value = message;
    if (url) { retryLink.href = url; retryLink.hidden = false; }
    else { retryLink.hidden = true; }
    fallbackBox.hidden = false;
  }

  function hideFallback() { if (fallbackBox) { fallbackBox.hidden = true; } }

  /* Open WhatsApp. Returns true if the browser allowed a new tab. */
  function openWhatsApp(url) {
    var win = window.open(url, "_blank");
    if (win) { win.opener = null; return true; }
    return false;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault(); // no page reload, no data sent anywhere by the form itself
      hideFallback();

      if (!validateForm()) {
        setStatus("Please fix the highlighted fields and try again.", "error");
        return;
      }

      lastMessage = buildEnquiryMessage();

      /* Missing / placeholder number: do not open a broken link */
      if (!isWhatsAppConfigured()) {
        setStatus("The SOLNEX WhatsApp number has not been configured yet, so WhatsApp could not be opened. Your message is shown below so you can copy it.", "error");
        showFallback(lastMessage, null);
        return;
      }

      var url = buildWhatsAppUrl(lastMessage);
      var opened = openWhatsApp(url);

      if (opened) {
        setStatus("WhatsApp should now be open with your details filled in. Please press Send inside WhatsApp to deliver your enquiry. It has not been sent yet.", "ok");
      } else {
        setStatus("Your browser blocked WhatsApp from opening. Your message is kept below on this page only; use the button to try again or copy it.", "error");
        showFallback(lastMessage, url);
      }
    });

    /* Clear a field's error as soon as the visitor edits it */
    Object.keys(fields).forEach(function (key) {
      var el = fields[key];
      if (!el) { return; }
      el.addEventListener("input", function () { setFieldError(key, ""); });
      el.addEventListener("change", function () { setFieldError(key, ""); });
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var done = function () { setStatus("Message copied. Paste it into a WhatsApp chat with SOLNEX.", "ok"); };
      var failCopy = function () {
        fallbackText.focus(); fallbackText.select();
        setStatus("Please copy the selected message manually.", "error");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText.value).then(done, failCopy);
      } else { failCopy(); }
    });
  }

  /* ---------- Buttons that pre-select form values or focus the form ---------- */
  $all("[data-prefill]").forEach(function (link) {
    link.addEventListener("click", function () {
      var parts = (link.getAttribute("data-prefill") || "").split("|");
      if (fields.property && parts[0]) { fields.property.value = parts[0]; }
      if (fields.requirement && parts[1]) { fields.requirement.value = parts[1]; }
    });
  });

  $all("[data-focus-form]").forEach(function (link) {
    link.addEventListener("click", function () {
      setTimeout(function () { if (fields.name) { fields.name.focus({ preventScroll: true }); } }, 500);
    });
  });

  /* ---------- WhatsApp links outside the form (floating button + footer) ---------- */
  var generalMessage = "Hello SOLNEX Team!\n\nI would like to know more about solar solutions for my property. Please get in touch.";

  function wireWhatsAppLink(el) {
    if (!el) { return; }
    if (isWhatsAppConfigured()) {
      el.href = buildWhatsAppUrl(generalMessage);
    } else {
      /* No number configured: send the visitor to the enquiry form instead */
      el.removeAttribute("target");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.hash = "enquiry";
      });
    }
  }
  wireWhatsAppLink($("#float-whatsapp"));
  wireWhatsAppLink($("#footer-whatsapp"));

  /* ---------- Demonstration calculator (no monetary figures) ---------- */
  var calcForm = $("#calc-form");
  var calcResult = $("#calc-result");
  var calcCta = $("#calc-cta");

  if (calcForm && calcResult) {
    calcForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var property = calcForm.elements["property"].value;
      var bill = calcForm.elements["bill"].value;
      var location = clean(calcForm.elements["location"].value);

      while (calcResult.firstChild) { calcResult.removeChild(calcResult.firstChild); }

      var intro = document.createElement("p");
      intro.textContent = "Thank you. A detailed assessment from SOLNEX would typically consider:";
      calcResult.appendChild(intro);

      var list = document.createElement("ul");
      var items = [
        "Property type: " + (property || "not selected"),
        "Location: " + (location || "not provided"),
        "Electricity usage: " + (bill ? "bill range " + bill : "not provided"),
        "Available roof or land space, shading and structure",
        "Local electricity tariffs and applicable regulations"
      ];
      items.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text; // textContent: user input is never parsed as HTML
        list.appendChild(li);
      });
      calcResult.appendChild(list);

      if (!CALC_CONFIG.verified) {
        var note = document.createElement("p");
        note.textContent = "No cost, savings or payback figures are shown because verified assumptions have not been supplied yet.";
        calcResult.appendChild(note);
      }
      calcResult.hidden = false;
    });
  }

  /* Carry calculator selections into the main enquiry form */
  if (calcCta && calcForm) {
    calcCta.addEventListener("click", function () {
      if (calcForm.elements["bill"].value) { fields.bill.value = calcForm.elements["bill"].value; }
      if (calcForm.elements["property"].value) { fields.property.value = calcForm.elements["property"].value; }
      if (clean(calcForm.elements["location"].value)) { fields.location.value = clean(calcForm.elements["location"].value); }
    });
  }
  /* ==========================================================
     EXTRA MOTION (all respects prefers-reduced-motion)
     Uses CSS custom properties set from JS, which the strict
     Content Security Policy allows (no inline style attributes).
     ========================================================== */
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var canHover = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);

  /* Broken images: hide the browser's broken icon so the label shows */
  $all(".img-frame img").forEach(function (img) {
    function mark() { img.classList.add("img-missing"); if (img.parentNode) { img.parentNode.classList.add("no-img"); } }
    img.addEventListener("error", mark);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) { mark(); }
  });

  /* Scroll progress bar, header shadow, and the PM Surya Ghar timeline fill */
  var progressEl = $("#scroll-progress");
  var headerEl = $(".site-header");
  var timelineEl = $(".timeline");
  var sunTrack = $("#sun-track");
  var parallaxImgs = $all("[data-parallax]");
  var ticking = false;

  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressEl) { progressEl.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ")"; }
      if (headerEl) { headerEl.classList.toggle("scrolled", window.scrollY > 10); }
      if (!reduceMotion) { document.documentElement.style.setProperty("--sy", Math.min(window.scrollY, 800)); }
      if (sunTrack) { sunTrack.style.setProperty("--p", (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4)); }
      if (!reduceMotion) {
        parallaxImgs.forEach(function (img) {
          var fr = img.parentNode.getBoundingClientRect();
          var c = Math.max(-0.5, Math.min(0.5, (fr.top + fr.height / 2) / window.innerHeight - 0.5));
          img.style.setProperty("--py", (c * -48).toFixed(1) + "px");
        });
      }
      if (timelineEl) {
        var r = timelineEl.getBoundingClientRect();
        var p = (window.innerHeight * 0.65 - r.top) / r.height;
        timelineEl.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(3));
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* Highlight the nav link of the section on screen */
  var navLinks = $all('.main-nav a[href^="#"]:not(.btn)');
  if ("IntersectionObserver" in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        var id = entry.target.id === "pm-surya-ghar" ? "subsidy" : entry.target.id;
        navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + id); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    ["solutions", "subsidy", "pm-surya-ghar"].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) { spy.observe(sec); }
    });
  }

  /* Count-up numbers: the final value is already in the HTML as a fallback */
  function formatNum(n) { return Math.round(n).toLocaleString("en-IN"); }
  function runCount(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var pre = el.getAttribute("data-prefix") || "";
    var suf = el.getAttribute("data-suffix") || "";
    if (reduceMotion || !isFinite(end)) { return; }
    var start = null, dur = 1700;
    function frame(ts) {
      if (start === null) { start = ts; }
      var t = Math.min(1, (ts - start) / dur);
      el.textContent = pre + formatNum(end * (1 - Math.pow(1 - t, 3))) + suf;
      if (t < 1) { window.requestAnimationFrame(frame); }
    }
    el.textContent = pre + "0" + suf;
    window.requestAnimationFrame(frame);
  }
  var counters = $all("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCount(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* Hero image: gentle 3D tilt that follows the pointer (mouse devices only) */
  var heroVisual = $(".hero-visual");
  var heroFrame = $(".hero-frame");
  if (heroVisual && heroFrame && canHover && !reduceMotion) {
    heroVisual.addEventListener("pointermove", function (e) {
      var r = heroVisual.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      heroFrame.style.setProperty("--ry", (x * 8).toFixed(2) + "deg");
      heroFrame.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
    });
    heroVisual.addEventListener("pointerleave", function () {
      heroFrame.style.setProperty("--ry", "0deg");
      heroFrame.style.setProperty("--rx", "0deg");
    });
  }

  /* Cursor spotlight inside cards */
  if (canHover && !reduceMotion) {
    $all(".card, .subsidy-card, .t-item").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* Click ripple on buttons */
  if (!reduceMotion) {
    $all(".btn").forEach(function (btn) {
      btn.addEventListener("pointerdown", function (e) {
        var r = btn.getBoundingClientRect();
        var dot = document.createElement("span");
        dot.className = "ripple";
        dot.style.left = (e.clientX - r.left) + "px";
        dot.style.top = (e.clientY - r.top) + "px";
        btn.appendChild(dot);
        window.setTimeout(function () { if (dot.parentNode) { dot.parentNode.removeChild(dot); } }, 700);
      });
    });
  }
  /* Hero headline: each word rises into place (the highlighted phrase moves as one unit).
     Works with the .ln line wrappers used in the hero. */
  var heroTitle = $("#hero-title");
  if (heroTitle) {
    var n = 0;
    var wrapWords = function (parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) { return; }
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var inner = document.createElement("span"); inner.className = "wi";
            inner.style.setProperty("--i", n++); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          parent.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.classList.contains("accent")) {
          var wrap = document.createElement("span"); wrap.className = "w";
          parent.insertBefore(wrap, node); wrap.appendChild(node);
          node.classList.add("wi"); node.style.setProperty("--i", n++);
        } else if (node.nodeType === 1 && node.classList.contains("ln")) {
          wrapWords(node);
        }
      });
    };
    wrapWords(heroTitle);
  }

  /* Hero solar card: one sample "sunny day" plays in a loop. The line draws as the sun moves
     across the sky and the kW value and clock follow it. A labelled illustration, not real data.
     It is a small in-card change, so it also runs when the system asks for reduced motion. */
  var kwVal = $("#hero-kw");
  var kwLine = $(".sc-line");
  var kwDot = $(".sc-dot");
  if (kwVal && kwLine && kwDot) {
    var kwPing = $(".sc-ping"), kwGuide = $(".sc-guide"), kwClip = $("#sc-clip-rect"), kwClock = $("#hero-clock");
    var kwLen = kwLine.getTotalLength(), kwPeak = 2.84;
    kwLine.style.strokeDasharray = kwLen;
    var kwRender = function (f) {
      var pt = kwLine.getPointAtLength(kwLen * f), x = pt.x.toFixed(1), y = pt.y.toFixed(1);
      kwLine.style.strokeDashoffset = (kwLen * (1 - f)).toFixed(1);
      [kwDot, kwPing].forEach(function (el) {
        if (el) { el.setAttribute("cx", x); el.setAttribute("cy", y); el.style.opacity = 1; }
      });
      if (kwGuide) { kwGuide.setAttribute("x1", x); kwGuide.setAttribute("x2", x); kwGuide.setAttribute("y1", y); }
      if (kwClip) { kwClip.setAttribute("width", x); }
      kwVal.textContent = Math.max(0, Math.min(kwPeak, kwPeak * (62 - pt.y) / 54)).toFixed(2);
      if (kwClock) {
        var hrs = 6 + 12 * f, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
        kwClock.textContent = (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h >= 12 ? "PM" : "AM");
      }
    };
    kwRender(0.6);
    {
      var kwStart = performance.now() + 900, kwDay = 8000, kwHold = 1500;
      kwRender(0);
      (function kwTick(t) {
        if (t >= kwStart) { kwRender(Math.min(1, ((t - kwStart) % (kwDay + kwHold)) / kwDay)); }
        requestAnimationFrame(kwTick);
      })(performance.now());
    }
  }

  /* ==========================================================
     ENHANCED MOTION (second pass)
     Only touches CSS variables / element.style via JS, which the
     strict Content Security Policy allows. No inline handlers,
     no external scripts, no network requests were added.
     ========================================================== */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- Values marquee: auto-scroll, drag/swipe to move, speeds up as you scroll ---------- */
  var marquee = $(".marquee");
  var mTrack = marquee ? $(".marquee-track", marquee) : null;
  var mBtn = $("#marquee-toggle");

  if (marquee && mTrack && mTrack.children.length > 1) {
    var mSetCount = Math.floor(mTrack.children.length / 2);          // HTML holds the set twice
    var mOriginals = Array.prototype.slice.call(mTrack.children, 0, mSetCount);
    var mClones = [];
    var mLoop = 0, mX = 0, mBoost = 0;
    var mBase = reduceMotion ? 26 : 70;                               // px per second (slower if user prefers less motion)
    var mCur = -mBase;                                                // current signed velocity
    var mPaused = false, mHover = false, mDrag = false, mInView = true;
    var mRaf = 0, mLast = 0;
    var mDragStartX = 0, mDragStartPos = 0, mPX = 0, mPT = 0, mDragV = 0;
    var mScrollY = window.scrollY;

    /* Measure one full set and add copies so very wide screens never show a gap */
    function mSetup() {
      mClones.forEach(function (n) { if (n.parentNode) { n.parentNode.removeChild(n); } });
      mClones = [];
      mLoop = mTrack.children[mSetCount].offsetLeft - mTrack.children[0].offsetLeft;
      var guard = 0;
      while (mLoop > 0 && mTrack.offsetWidth < mLoop + marquee.clientWidth && guard < 8) {
        mOriginals.forEach(function (n) { var c = n.cloneNode(true); mTrack.appendChild(c); mClones.push(c); });
        guard++;
      }
    }

    function mWrap() {
      if (mLoop <= 0) { return; }
      mX = mX % mLoop;
      if (mX > 0) { mX -= mLoop; }
    }

    function mApply() { mTrack.style.transform = "translate3d(" + mX.toFixed(2) + "px,0,0)"; }

    function mTick(ts) {
      mRaf = 0;
      if (!mInView) { return; }
      var dt = Math.min(0.05, Math.max(0, (ts - mLast) / 1000));
      mLast = ts;
      if (!mDrag) {
        var target = (mPaused || mHover) ? 0 : -mBase + mBoost;
        mCur += (target - mCur) * Math.min(1, dt * 5);                 // smooth speed-up / slow-down
        mX += mCur * dt;
        mBoost *= Math.pow(0.03, dt);                                  // scroll boost fades out
      }
      mWrap();
      mApply();
      mRaf = window.requestAnimationFrame(mTick);
    }

    function mStart() {
      if (mRaf || !mInView) { return; }
      mLast = window.performance.now();
      mRaf = window.requestAnimationFrame(mTick);
    }

    mSetup();
    mApply();
    mStart();
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(mSetup); }
    window.addEventListener("load", mSetup);
    var mResizeT = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(mResizeT);
      mResizeT = window.setTimeout(mSetup, 150);
    });

    /* Only animate while the banner is on screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        mInView = entries[0].isIntersecting;
        if (mInView) { mStart(); }
      }).observe(marquee);
    }

    /* Page scroll pushes the banner: scroll down = faster left, scroll up = it surges back right */
    if (!reduceMotion) {
      window.addEventListener("scroll", function () {
        var d = window.scrollY - mScrollY;
        mScrollY = window.scrollY;
        mBoost = clamp(mBoost - d * 9, -520, 520);
      }, { passive: true });
    }

    /* Mouse hover pauses so the words can be read */
    marquee.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { mHover = true; } });
    marquee.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { mHover = false; } });

    /* Drag with mouse, pen or finger. Release keeps the momentum, then it eases back to cruising speed. */
    marquee.addEventListener("pointerdown", function (e) {
      if (e.button > 0 || (e.target.closest && e.target.closest(".marquee-toggle"))) { return; }
      mDrag = true; mDragStartX = e.clientX; mDragStartPos = mX; mPX = e.clientX; mPT = e.timeStamp; mDragV = 0;
      marquee.classList.add("dragging");
      try { marquee.setPointerCapture(e.pointerId); } catch (err) { /* not critical */ }
    });
    marquee.addEventListener("pointermove", function (e) {
      if (!mDrag) { return; }
      mX = mDragStartPos + (e.clientX - mDragStartX);
      var dt = (e.timeStamp - mPT) / 1000;
      if (dt > 0) { mDragV = mDragV * 0.7 + ((e.clientX - mPX) / dt) * 0.3; }
      mPX = e.clientX; mPT = e.timeStamp;
      mWrap(); mApply();
    });
    function mEndDrag(e) {
      if (!mDrag) { return; }
      mDrag = false;
      marquee.classList.remove("dragging");
      if (e.timeStamp - mPT > 90) { mDragV = 0; }                      // finger stopped before release: no fling
      mCur = clamp(mDragV, -1800, 1800);
      try { marquee.releasePointerCapture(e.pointerId); } catch (err) { /* not critical */ }
    }
    marquee.addEventListener("pointerup", mEndDrag);
    marquee.addEventListener("pointercancel", mEndDrag);

    /* Pause / play button (keyboard and screen-reader friendly) */
    if (mBtn) {
      mBtn.hidden = false;
      mBtn.addEventListener("click", function () {
        mPaused = !mPaused;
        mBtn.setAttribute("aria-pressed", mPaused ? "true" : "false");
      });
    }
  }

  /* ---------- Hero: floating sun motes ---------- */
  var heroSection = $(".hero");
  if (heroSection && !reduceMotion) {
    var sparks = document.createElement("div");
    sparks.className = "hero-sparks";
    sparks.setAttribute("aria-hidden", "true");
    var sparkCount = window.innerWidth < 700 ? 9 : 18;
    for (var s = 0; s < sparkCount; s++) {
      var mote = document.createElement("i");
      mote.style.setProperty("--x", (Math.random() * 100).toFixed(1) + "%");
      mote.style.setProperty("--s", (6 + Math.random() * 12).toFixed(1) + "px");
      mote.style.setProperty("--d", (7 + Math.random() * 8).toFixed(1) + "s");
      mote.style.setProperty("--dl", (-Math.random() * 12).toFixed(1) + "s");
      mote.style.setProperty("--dx", ((Math.random() - 0.5) * 120).toFixed(0) + "px");
      sparks.appendChild(mote);
    }
    heroSection.insertBefore(sparks, heroSection.firstChild);
  }

  /* ---------- Hero: glows, chips and cards drift with the pointer ---------- */
  if (heroSection && canHover && !reduceMotion) {
    heroSection.addEventListener("pointermove", function (e) {
      var r = heroSection.getBoundingClientRect();
      heroSection.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      heroSection.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    heroSection.addEventListener("pointerleave", function () {
      heroSection.style.setProperty("--px", "0");
      heroSection.style.setProperty("--py", "0");
    });
  }

  /* ---------- Cards: gentle 3D tilt that follows the cursor ---------- */
  if (canHover && !reduceMotion) {
    $all(".solution-card, .icon-card, .subsidy-card").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--try", (x * 7).toFixed(2) + "deg");
        el.style.setProperty("--trx", (-y * 7).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--try", "0deg");
        el.style.setProperty("--trx", "0deg");
      });
    });

    /* Magnetic buttons: they lean toward the cursor */
    $all(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty("--tx", clamp(dx * 0.18, -8, 8).toFixed(1) + "px");
        btn.style.setProperty("--ty", clamp(dy * 0.28, -6, 6).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  /* ---------- Header: slides away when reading down, returns when scrolling up ---------- */
  if (headerEl && !reduceMotion) {
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY, d = y - lastY;
      if (Math.abs(d) < 8) { return; }
      var menuOpen = nav && nav.classList.contains("open");
      headerEl.classList.toggle("hide", d > 0 && y > 320 && !menuOpen);
      lastY = y;
    }, { passive: true });
    headerEl.addEventListener("focusin", function () { headerEl.classList.remove("hide"); });
  }

  /* Sun-arc animation is SVG-based: stop it for visitors who prefer reduced motion */
  var sunArc = $("#hv-svg");
  if (sunArc && reduceMotion && sunArc.pauseAnimations) { sunArc.pauseAnimations(); }
})();