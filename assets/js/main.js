/* =====================================================================
   Sow — Men's Hair Stylist · interações
   GSAP usado em 2 momentos: entrada do hero e profundidade da seção Kids.
   Todo o resto é CSS. Respeita prefers-reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- ano */
  var yearEl = doc.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------- header "grudado" */
  var header = doc.querySelector(".site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-stuck", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------ menu mobile */
  var toggle = doc.querySelector(".nav__toggle");
  var menu = doc.getElementById("nav-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      toggle.querySelector(".visually-hidden").textContent = open ? "Fechar menu" : "Abrir menu";
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* --------------------------------------------- filtro da galeria */
  var chips = Array.prototype.slice.call(doc.querySelectorAll(".cuts__filter .chip"));
  var cards = Array.prototype.slice.call(doc.querySelectorAll(".cut-card"));
  if (chips.length && cards.length) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-selected", String(on));
        });
        cards.forEach(function (card) {
          var show = f === "all" || card.dataset.cat === f;
          card.hidden = !show;
          if (show && window.gsap && !reduceMotion) {
            window.gsap.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
          }
        });
      });
    });
  }

  /* --------------------------------- vídeo Kids: tocar só quando visível */
  var kidsVideo = doc.querySelector(".kids__video");
  if (kidsVideo) {
    if (reduceMotion) {
      kidsVideo.removeAttribute("autoplay");
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            var p = kidsVideo.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            kidsVideo.pause();
          }
        });
      }, { threshold: 0.25 }).observe(kidsVideo);
    }
  }

  /* tenta iniciar o vídeo do hero (autoplay mudo) */
  var heroVideo = doc.querySelector(".hero__video");
  if (heroVideo && !reduceMotion) {
    var hp = heroVideo.play();
    if (hp && hp.catch) hp.catch(function () {});
  }

  /* -------------------------------------- marquee dos famosos (CSS) */
  var fameTrack = doc.querySelector("[data-marquee]");
  if (fameTrack && !reduceMotion) fameTrack.setAttribute("data-run", "true");

  /* ================================================================
     GSAP — entrada do hero + profundidade da seção Kids
     ================================================================ */
  var startGsap = function () {
    if (reduceMotion || !window.gsap) {
      root.classList.remove("gsap-ready");
      root.classList.add("anim-failsafe");
      return;
    }

    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    /* ---- 1. Entrada orquestrada do hero -------------------------- */
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.to("[data-hero='eyebrow']", { opacity: 1, y: 0, duration: 0.7 })
      .to("[data-hero='line']", { yPercent: 0, opacity: 1, duration: 1.05, stagger: 0.09 }, "-=0.45")
      /* o bloco de informações (elemento visual) assume a posição final
         junto com as últimas linhas do título, não depois */
      .to("[data-hero='meta']", { opacity: 1, y: 0, duration: 1 }, "<0.15")
      .to("[data-hero='lede']", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .to("[data-hero='actions']", { opacity: 1, y: 0, duration: 0.7 }, "-=0.55");

    /* ---- 2. Profundidade real na seção Kids (camadas, scrub) ---- */
    if (window.ScrollTrigger) {
      var layers = [
        ["[data-parallax='media']", -6],
        ["[data-parallax='badge']", -22],
        ["[data-parallax='copy']", 5],
        [".kids__bg", -14],
        [".kids__glow", -9]
      ];
      layers.forEach(function (pair) {
        var el = doc.querySelector(pair[0]);
        if (!el) return;
        gsap.to(el, {
          yPercent: pair[1],
          ease: "none",
          scrollTrigger: {
            trigger: ".kids",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6
          }
        });
      });

      /* SplitText (moderação): o único texto que "monta" palavra a palavra */
      var kidsTitle = doc.querySelector("[data-reveal='kids-title']");
      if (kidsTitle) {
        var kWords = null;
        try {
          if (window.SplitText) {
            kWords = new window.SplitText(kidsTitle, { type: "words" }).words;
          }
        } catch (e) { kWords = null; }

        gsap.set(kidsTitle, { opacity: 1, y: 0 });
        if (kWords && kWords.length) gsap.set(kWords, { opacity: 0, y: 24 });

        var played = false;
        var playKids = function () {
          if (played) return;
          played = true;
          if (kWords && kWords.length) {
            gsap.to(kWords, { opacity: 1, y: 0, duration: 0.7, stagger: 0.055, ease: "expo.out" });
          } else {
            gsap.fromTo(kidsTitle, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out" });
          }
        };

        window.ScrollTrigger.create({
          trigger: ".kids",
          start: "top 45%",
          once: true,
          onEnter: playKids
        });
        setTimeout(playKids, 3500); /* backup: nunca fica escondido */
      }

      /* ---- reveals discretos no scroll (uma vez) --------------- */
      var reveals = Array.prototype.slice.call(
        doc.querySelectorAll("[data-reveal]:not([data-reveal='kids-title'])")
      );
      if (window.ScrollTrigger.batch) {
        window.ScrollTrigger.batch(reveals, {
          start: "top 85%",
          once: true,
          onEnter: function (els) {
            gsap.to(els, {
              opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: "expo.out"
            });
          }
        });
      } else {
        gsap.set(reveals, { opacity: 1, y: 0 });
      }
    } else {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
    }

    root.classList.remove("gsap-ready");

    /* recalcula posições depois que imagens/fontes acomodam o layout */
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
      setTimeout(function () { window.ScrollTrigger.refresh(); }, 400);
      window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
    }
  };

  var kickoff = function () {
    if (doc.fonts && doc.fonts.ready) {
      var done = false;
      var go = function () { if (!done) { done = true; startGsap(); } };
      doc.fonts.ready.then(go);
      setTimeout(go, 1500); /* não espera fontes travadas */
    } else {
      startGsap();
    }
  };

  if (doc.readyState === "complete") {
    kickoff();
  } else {
    window.addEventListener("load", kickoff);
  }

  /* rede de segurança: nada pode ficar invisível */
  setTimeout(function () {
    if (root.classList.contains("gsap-ready")) {
      root.classList.add("anim-failsafe");
    }
  }, 3600);
})();
