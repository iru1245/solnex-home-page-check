/* ==========================================================
   SOLNEX – Services Page behaviour (page-specific only)
   ========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Gentle scroll reveal. Content stays visible if JS / IntersectionObserver / motion is unavailable. */
  var items = document.querySelectorAll(".sv-reveal");
  if (items.length && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("sv-js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  /* 2. Missing image: hide the broken icon so the patterned placeholder shows.
        A late "load" removes the flag again, so a valid lazy image is never hidden. */
  document.querySelectorAll(".img-frame img").forEach(function (img) {
    img.addEventListener("error", function () { img.classList.add("img-missing"); });
    img.addEventListener("load", function () { img.classList.remove("img-missing"); });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("loading") !== "lazy") {
      img.classList.add("img-missing");
    }
  });
})();