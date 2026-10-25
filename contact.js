/* ==========================================================
   SOLNEX Energy Solution – Contact page script (vanilla JS)
   Loaded AFTER the shared script.js, which already handles the
   mobile menu, scroll reveal, footer year and the floating /
   footer WhatsApp links. This file only adds the enquiry form
   (validation + WhatsApp handoff) and a few small page helpers.

   No data is sent to any server and nothing is stored: the form
   builds a WhatsApp message in the visitor's browser and opens
   WhatsApp. The visitor still has to press Send inside WhatsApp.
   ========================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     CONFIGURATION
     Verified against script.js, which holds WHATSAPP_NUMBER = "9131910814"
     (a 10-digit Indian number; script.js adds the 91 country code).
     If the official number ever changes, update it here, in script.js,
     and in the tel: / wa.me links in contact.html.
     ---------------------------------------------------------- */
  var WHATSAPP_NUMBER = "919131910814"; // country code + number, digits only
  var LOCK_MS = 6000;                   // how long the submit button stays locked after a submission

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $all(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* Strip control characters and trim */
  function clean(value) {
    return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  }

  function buildWhatsAppUrl(message) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
  }

  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var canHover = !!(window.matchMedia && window.matchMedia("(hover: hover)").matches);

  /* ---------- Scroll-triggered drawing: the curved line and the enquiry steps start when they scroll into view ---------- */
  var observed = $all(".ct-observe");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in-view"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.35 });
    observed.forEach(function (el) { io.observe(el); });
  } else {
    observed.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Hero: the solar scene and floating cards drift with the cursor (mouse devices only) ---------- */
  var hero = $("#ctx-hero");
  if (hero) {
    var scene = $(".ctx-scene", hero);
    /* SMIL motion (the glowing energy dots) is not stopped by CSS, so pause it for reduced-motion visitors */
    if (reduceMotion && scene && typeof scene.pauseAnimations === "function") { scene.pauseAnimations(); }

    if (canHover && !reduceMotion) {
      var heroFrame = 0;
      hero.addEventListener("pointermove", function (e) {
        if (heroFrame) { return; }
        heroFrame = window.requestAnimationFrame(function () {
          heroFrame = 0;
          var r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
          hero.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
        });
      });
      hero.addEventListener("pointerleave", function () {
        hero.style.setProperty("--mx", "0");
        hero.style.setProperty("--my", "0");
      });
    }
  }

  /* ---------- Contact panels lean gently toward the cursor (mouse devices only) ---------- */
  if (canHover && !reduceMotion) {
    $all(".ct-tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--try", (((e.clientX - r.left) / r.width - 0.5) * 6).toFixed(2) + "deg");
        el.style.setProperty("--trx", ((-((e.clientY - r.top) / r.height - 0.5)) * 6).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--try", "0deg");
        el.style.setProperty("--trx", "0deg");
      });
    });
  }

  /* ---------- Form ---------- */
  var form = $("#contact-form");
  if (!form) { return; }

  var statusEl = $("#cf-status");
  var submitBtn = $("#cf-submit");
  var submitLabel = $("#cf-submit-label");
  var fallbackBox = $("#cf-fallback");
  var fallbackText = $("#cf-fallback-text");
  var retryLink = $("#cf-retry");
  var copyBtn = $("#cf-copy");

  var fields = {
    name: $("#cf-name"),
    phone: $("#cf-phone"),
    email: $("#cf-email"),
    interest: $("#cf-interest"),
    city: $("#cf-city"),
    message: $("#cf-message")
  };

  var submitting = false;

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = "form-status" + (type ? " " + type : "");
  }

  function setFieldError(key, text) {
    var input = fields[key];
    var err = $("#cf-err-" + key);
    if (!input || !err) { return; }
    var wrapper = input.closest(".field");
    err.textContent = text || "";
    if (wrapper) { wrapper.classList.toggle("invalid", !!text); }
    if (text) { input.setAttribute("aria-invalid", "true"); } else { input.removeAttribute("aria-invalid"); }
  }

  /* Indian mobile number: 10 digits starting 6-9, optionally with +91 / 91 / 0 in front */
  function isValidPhone(raw) {
    var digits = raw.replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) { digits = digits.slice(2); }
    else if (digits.length === 11 && digits.charAt(0) === "0") { digits = digits.slice(1); }
    return /^[6-9]\d{9}$/.test(digits);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  /* Client-side validation improves usability only. It is not a security control. */
  function validate() {
    var firstInvalid = null;
    function fail(key, msg) {
      setFieldError(key, msg);
      if (!firstInvalid) { firstInvalid = fields[key]; }
    }

    var name = clean(fields.name.value);
    var phone = clean(fields.phone.value);
    var email = clean(fields.email.value);

    ["name", "phone", "email", "interest"].forEach(function (k) { setFieldError(k, ""); });

    if (name.length < 2) { fail("name", "Please enter your full name."); }
    if (!phone) { fail("phone", "Please enter your phone number."); }
    else if (!isValidPhone(phone)) { fail("phone", "Please enter a valid 10-digit Indian mobile number."); }
    if (email && !isValidEmail(email)) { fail("email", "Please enter a valid email address, or leave this blank."); }
    if (!fields.interest.value) { fail("interest", "Please choose what you are interested in."); }

    if (firstInvalid) { firstInvalid.focus(); return false; }
    return true;
  }

  function buildMessage() {
    var email = clean(fields.email.value);
    var city = clean(fields.city.value);
    var extra = clean(fields.message.value);

    var lines = [
      "Hello SOLNEX Team!",
      "",
      "I would like to enquire about solar solutions.",
      "",
      "Name: " + clean(fields.name.value),
      "Phone: " + clean(fields.phone.value)
    ];
    if (email) { lines.push("Email: " + email); }
    lines.push("Interested In: " + fields.interest.value);
    if (city) { lines.push("City: " + city); }
    if (extra) { lines.push("Project Details: " + extra); }
    lines.push("", "Please contact me regarding my enquiry.");
    return lines.join("\n");
  }

  function showFallback(message, url) {
    fallbackText.value = message;
    retryLink.href = url;
    fallbackBox.hidden = false;
  }

  function hideFallback() { fallbackBox.hidden = true; }

  /* Lock the button briefly so a double tap cannot open WhatsApp twice */
  function lockSubmit() {
    submitting = true;
    submitBtn.setAttribute("aria-disabled", "true");
    submitLabel.textContent = "Opening WhatsApp\u2026";
    window.setTimeout(function () {
      submitting = false;
      submitBtn.removeAttribute("aria-disabled");
      submitLabel.textContent = "Send My Enquiry";
    }, LOCK_MS);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); // nothing is posted anywhere by the form itself
    if (submitting) { return; }
    hideFallback();

    if (!validate()) {
      setStatus("Please fix the highlighted fields and try again.", "error");
      return;
    }

    var message = buildMessage();
    var url = buildWhatsAppUrl(message);
    lockSubmit();

    /* Must run directly inside the click so browsers allow the new tab */
    var win = window.open(url, "_blank");
    if (win) {
      win.opener = null;
      setStatus("WhatsApp should now be open with your enquiry filled in. Press Send in WhatsApp to deliver it. It has not been sent yet.", "ok");
    } else {
      setStatus("Your browser blocked WhatsApp from opening. Use the button below to try again, or copy your message.", "error");
      showFallback(message, url);
    }
  });

  /* Clear a field's error as soon as the visitor edits it */
  Object.keys(fields).forEach(function (key) {
    var el = fields[key];
    if (!el) { return; }
    el.addEventListener("input", function () { setFieldError(key, ""); });
    el.addEventListener("change", function () { setFieldError(key, ""); });
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var done = function () { setStatus("Message copied. Paste it into a WhatsApp chat with SOLNEX.", "ok"); };
      var manual = function () {
        fallbackText.focus();
        fallbackText.select();
        setStatus("Please copy the selected message manually.", "error");
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText.value).then(done, manual);
      } else { manual(); }
    });
  }

  /* ---------- Buttons that jump to the form: move keyboard focus to the first field once the scroll settles ---------- */
  $all("[data-focus-form]").forEach(function (link) {
    link.addEventListener("click", function () {
      window.setTimeout(function () { fields.name.focus({ preventScroll: true }); }, 500);
    });
  });

  /* ---------- Hero quick picks (Home / Business / Industry): choose the matching option, then the link scrolls to the form ---------- */
  $all("[data-interest]").forEach(function (link) {
    link.addEventListener("click", function () {
      var wanted = link.getAttribute("data-interest");
      Array.prototype.some.call(fields.interest.options, function (opt) {
        if (opt.value === wanted) {
          fields.interest.value = wanted;
          setFieldError("interest", "");
          return true;
        }
        return false;
      });
    });
  });

  /* ---------- Optional pre-selection from a link such as contact.html?interest=residential ---------- */
  try {
    var wanted = new URLSearchParams(window.location.search).get("interest");
    if (wanted) {
      wanted = wanted.toLowerCase();
      Array.prototype.some.call(fields.interest.options, function (opt) {
        if (opt.value && opt.value.toLowerCase().indexOf(wanted) === 0) {
          fields.interest.value = opt.value;
          return true;
        }
        return false;
      });
    }
  } catch (err) { /* URLSearchParams unavailable: ignore */ }
})();