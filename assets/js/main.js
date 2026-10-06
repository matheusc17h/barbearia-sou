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
        /* O filtro destaca os cortes escolhidos e esmaece os outros, sem
           tirá-los do lugar: esconder cards mudava a altura da página e
           bagunçava as animações presas à rolagem das seções de baixo. */
        cards.forEach(function (card) {
          var match = f === "all" || card.dataset.cat === f;
          card.classList.toggle("is-dimmed", !match);
          card.setAttribute("aria-hidden", String(!match));
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
      }, { threshold: 0.25, rootMargin: "200px 0px" }).observe(kidsVideo); /* começa a carregar um pouco antes */
    }
  }

  /* --------------------------- som do vídeo Kids (só depois do toque) */
  var soundBtn = doc.querySelector(".sound-toggle");
  if (kidsVideo && soundBtn) {
    var soundLabel = soundBtn.querySelector(".sound-toggle__label");
    soundBtn.addEventListener("click", function () {
      var on = kidsVideo.muted; /* estava mudo -> liga */
      kidsVideo.muted = !on;
      if (on) {
        kidsVideo.volume = 1;
        var pp = kidsVideo.play(); /* o toque libera o som também no iPhone */
        if (pp && pp.catch) pp.catch(function () {});
      }
      soundBtn.setAttribute("aria-pressed", String(on));
      soundLabel.textContent = on ? "Desativar som" : "Ativar som";
    });
  }

  /* ------------------------------------------------------------------
     Vídeo do topo: looping infinito que nunca fica travado.
     O iPhone pausa vídeos sozinho (modo pouca energia, troca de aba,
     voltar pelo navegador); aqui ele volta a tocar em todos esses casos.
     Fora da tela ele pausa (ninguém vê) e retoma ao voltar: poupa bateria.
     ------------------------------------------------------------------ */
  var heroVideo = doc.querySelector(".hero__video");
  if (heroVideo && !reduceMotion) {
    var heroNaTela = true;
    var tocarHero = function () {
      if (!heroNaTela || doc.hidden || !heroVideo.paused) return;
      var hp = heroVideo.play();
      if (hp && hp.catch) hp.catch(function () {});
    };
    heroVideo.loop = true;
    heroVideo.addEventListener("pause", function () { setTimeout(tocarHero, 250); });
    heroVideo.addEventListener("ended", function () { heroVideo.currentTime = 0; tocarHero(); });
    doc.addEventListener("visibilitychange", tocarHero);
    window.addEventListener("pageshow", tocarHero);
    /* modo pouca energia bloqueia o autoplay até o primeiro toque */
    ["touchstart", "click", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, tocarHero, { passive: true, once: true });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroNaTela = entries[0].isIntersecting;
        if (heroNaTela) tocarHero(); else heroVideo.pause();
      }).observe(heroVideo);
    }
    tocarHero();
  }

  /* -------------------------------------- marquee dos famosos (CSS) */
  var fameTrack = doc.querySelector("[data-marquee]");
  if (fameTrack && !reduceMotion) fameTrack.setAttribute("data-run", "true");

  /* ================================================================
     GSAP: entrada do hero, profundidade da seção Kids, letras acendendo
     nos títulos e um efeito próprio por seção (cards, galeria, feed, mapa)
     ================================================================ */
  /* ---------------------------------------------------------------
     Efeito "letras acendendo em ordem aleatória" (títulos com data-letters)
     - quebra em palavras + letras: a palavra nunca se parte no meio da linha
     - o SplitText põe aria-label no título e esconde as letras do leitor de
       tela, então ele lê a frase normal
     - o título inteiro leva ~1,4s, tenha quantas letras tiver
     - no fim desfaz a quebra (o texto volta ao normal e o degradê dourado
       volta a ser contínuo)
     Retorna { chars, play } ou null se não deu para quebrar.
     --------------------------------------------------------------- */
  var prepararLetras = function (titulo) {
    var gsap = window.gsap;
    if (!window.SplitText) return null;
    /* frase para o leitor de tela, tirada do texto como aparece na tela:
       o rótulo automático do SplitText juntava palavras separadas por <br>
       ("assinama casa") e lia o código do espaço fixo */
    var copia = titulo.cloneNode(true);
    Array.prototype.forEach.call(copia.querySelectorAll("br"), function (br) {
      br.parentNode.replaceChild(doc.createTextNode(" "), br);
    });
    var frase = copia.textContent.replace(/\s+/g, " ").trim(); /* \s também pega o espaço fixo */
    var split;
    try {
      split = new window.SplitText(titulo, {
        type: "words,chars", tag: "span", wordsClass: "word", charsClass: "char"
      });
    } catch (e) { return null; }
    titulo.setAttribute("aria-label", frase);
    gsap.set(split.chars, { opacity: 0 });        /* esconde as letras antes de mostrar o título: sem piscada */
    gsap.set(titulo, { visibility: "visible" });
    return {
      chars: split.chars,
      anim: function () {
        return gsap.to(split.chars, {
          opacity: 1, duration: 0.5, ease: "power1.out",
          stagger: { amount: 1.4, from: "random" },
          onComplete: function () { split.revert(); }
        });
      }
    };
  };

  var revelarLetras = function (titulo) {
    var fx = prepararLetras(titulo);
    if (!fx) { window.gsap.set(titulo, { visibility: "visible" }); return; }
    if (window.ScrollTrigger) {
      window.ScrollTrigger.create({ trigger: titulo, start: "top 82%", once: true, onEnter: fx.anim });
    } else {
      fx.anim();
    }
  };

  var startGsap = function () {
    /* se a rede de segurança já revelou a página (fontes muito lentas),
       não esconder nada de novo: só tira o estado de espera */
    if (root.classList.contains("anim-failsafe")) {
      root.classList.remove("gsap-ready");
      return;
    }
    if (reduceMotion || !window.gsap) {
      root.classList.remove("gsap-ready");
      root.classList.add("anim-failsafe");
      return;
    }

    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(window.SplitText);

    /* ---- 1. Entrada orquestrada do hero -------------------------- */
    /* Ritmo geral do site: suave e sem pressa (pedido do cliente) */
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    /* Título do topo: já está na tela ao abrir, então não usa ScrollTrigger;
       as letras acendem dentro da própria animação de abertura. */
    var heroTitle = doc.querySelector(".hero [data-letters]");
    var heroFx = heroTitle ? prepararLetras(heroTitle) : null;
    if (heroTitle && !heroFx) gsap.set(heroTitle, { visibility: "visible" });

    tl.to("[data-hero='eyebrow']", { opacity: 1, y: 0, duration: 1.1 });
    if (heroFx) tl.add(heroFx.anim(), "-=0.6");
    tl
      /* o bloco de informações (elemento visual) assume a posição final
         junto com as últimas linhas do título, não depois */
      .to("[data-hero='meta']", { opacity: 1, y: 0, duration: 1.5 }, "<0.25")
      .to("[data-hero='lede']", { opacity: 1, y: 0, duration: 1.3 }, "-=1.1")
      .to("[data-hero='actions']", { opacity: 1, y: 0, duration: 1.2, stagger: 0.12 }, "-=0.9");

    /* ---- 2. Profundidade real na seção Kids (camadas, scrub) ---- */
    if (window.ScrollTrigger) {
      /* [elemento, começa (yPercent), termina]: tudo sobe de baixo para cima
         conforme a rolagem (o cliente não gosta de nada descendo) */
      var layers = [
        ["[data-parallax='media']", 12, -6],
        ["[data-parallax='badge']", 30, -16],
        ["[data-parallax='copy']", 8, -4],
        [".kids__bg", 0, -14],
        [".kids__glow", 0, -9]
      ];
      layers.forEach(function (camada) {
        var el = doc.querySelector(camada[0]);
        if (!el) return;
        gsap.fromTo(el, { yPercent: camada[1] }, {
          yPercent: camada[2],
          ease: "none",
          scrollTrigger: {
            trigger: ".kids",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2 /* parallax segue a rolagem com atraso macio */
          }
        });
      });

      /* ---- efeitos por seção (cada um ligado ao conteúdo) ------ */
      if (window.ScrollTrigger.config) window.ScrollTrigger.config({ ignoreMobileResize: true });
      var once = function (trigger, start) {
        return { trigger: trigger, start: start || "top 85%", once: true };
      };

      /* Títulos de seção com data-letters: letras acendem ao entrar na tela */
      Array.prototype.forEach.call(doc.querySelectorAll("[data-letters]"), function (titulo) {
        if (!titulo.closest(".hero")) revelarLetras(titulo);
      });

      /* Rótulo dourado e texto de apoio entram logo depois do título */
      Array.prototype.forEach.call(doc.querySelectorAll(".section__eyebrow"), function (el) {
        gsap.from(el, { opacity: 0, x: -16, duration: 1.2, ease: "power2.out", scrollTrigger: once(el, "top 90%") });
      });
      Array.prototype.forEach.call(doc.querySelectorAll(".section__intro"), function (el) {
        gsap.from(el, { opacity: 0, y: 20, duration: 1.4, delay: 0.25, ease: "power2.out", scrollTrigger: once(el, "top 90%") });
      });

      /* Cards: cada um entra de um jeito diferente (a ordem dos efeitos
         se repete se houver mais cards que efeitos). clearProps devolve o
         controle ao CSS no fim, para o hover continuar funcionando. */
      /* Nenhum efeito vem de cima para baixo (o cliente não gosta):
         "placa" (girava de cima) e "desce" foram removidos. */
      var ENTRANCES = [
        { from: { opacity: 0, y: 50 } },                                         /* sobe */
        { from: { opacity: 0, x: -60, rotation: -2.5 } },                        /* vem da esquerda, girando de leve */
        { from: { opacity: 0, scale: 0.9 } },                                    /* cresce */
        { from: { opacity: 0, x: 60, rotation: 2.5 } },                          /* vem da direita, girando de leve */
        { from: { opacity: 0, scale: 1.06, filter: "blur(10px)" } },            /* entra em foco */
        { from: { opacity: 0, y: 60, rotation: -1.5 } }                          /* sobe girando de leve */
      ];
      /* Efeitos com nome: um card pode escolher o seu no HTML com
         data-entrada="nome" (passa por cima da ordem automática). */
      var ENTRADAS_NOMEADAS = {
        sobe:     ENTRANCES[0],
        esquerda: ENTRANCES[1],
        cresce:   ENTRANCES[2],
        direita:  ENTRANCES[3],
        foco:     ENTRANCES[4],
        girando:  ENTRANCES[5]
      };
      var entradaDo = function (card, padrao) {
        return ENTRADAS_NOMEADAS[card.getAttribute("data-entrada")] || padrao;
      };
      /* junta o estado inicial do efeito com as opções da animação */
      var comEfeito = function (fx, opcoes) {
        var v = {}, k;
        for (k in fx.from) v[k] = fx.from[k];
        for (k in opcoes) v[k] = opcoes[k];
        return v;
      };
      /* start: em que altura da tela o card dispara ("top 50%" = quando o
         topo do card chega na metade da tela). stagger: atraso entre
         cards da mesma linha (0 quando cada um tem o seu gatilho). */
      /* rowDelay: número = atraso entre colunas; 0 = sem atraso;
         "fila" = cards que estão na mesma linha da tela entram um depois do
         outro (no celular, uma coluna, cada card tem seu próprio momento) */
      var revealCards = function (selector, offset, start, rowDelay) {
        var cards = Array.prototype.slice.call(doc.querySelectorAll(selector));
        var posNaLinha = cards.map(function (card, i) {
          var n = 0, top = card.offsetTop;
          for (var k = 0; k < i; k++) if (Math.abs(cards[k].offsetTop - top) < 4) n++;
          return n;
        });
        cards.forEach(function (card, i) {
          var fx = entradaDo(card, ENTRANCES[(i + (offset || 0)) % ENTRANCES.length]);
          /* a transição de CSS do card (usada no hover) brigaria com o GSAP
             quadro a quadro e deixaria a entrada travada: fica desligada
             durante a animação e volta no fim (clearProps) */
          gsap.set(card, { opacity: 1, y: 0, transition: "none" });
          gsap.from(card, comEfeito(fx, {
            duration: 1.7,
            delay: rowDelay === "fila" ? posNaLinha[i] * 0.6
                 : rowDelay === 0 ? 0 : (i % 3) * 0.2, /* cards da mesma linha não entram juntos */
            ease: "power2.out", /* desacelera devagar, nada brusco */
            clearProps: "transform,opacity,transition,filter",
            scrollTrigger: once(card, start || "top 92%")
          }));
        });
      };

      /* Cards presos à rolagem (scrub): o card avança conforme você rola e
         termina exatamente quando o topo dele chega na metade da tela;
         rolando para cima, ele volta. Cards na mesma linha (desktop) têm o
         trecho deslocado, então entram um de cada vez.
         foto: seletor de uma imagem dentro do card que também "assenta"
         (zoom diminuindo) junto com a rolagem. */
      var cardsNaRolagem = function (selector, offset, foto) {
        var cards = Array.prototype.slice.call(doc.querySelectorAll(selector));
        cards.forEach(function (card, i) {
          var n = 0;
          for (var k = 0; k < i; k++) if (Math.abs(cards[k].offsetTop - card.offsetTop) < 4) n++;
          var fx = entradaDo(card, ENTRANCES[(i + offset) % ENTRANCES.length]); /* cada card com um efeito */
          var atraso = n * 140; /* px de rolagem entre cards da mesma linha */
          /* só a transição da borda/fundo do hover continua no CSS; transform e
             opacidade ficam com o GSAP o tempo todo (por causa do scrub) */
          gsap.set(card, { opacity: 1, y: 0, transition: "border-color 250ms, background-color 250ms" });
          var trecho = function () { /* um objeto novo para cada animação */
            return {
              trigger: card,
              start: "top bottom-=" + atraso,
              end: "top 50%-=" + atraso,
              scrub: 1.2 /* segue a rolagem com atraso macio */
            };
          };
          /* fromTo com o estado final escrito: se o ScrollTrigger recalcular
             com o card escondido pelo filtro (display:none), um from() regravaria
             o final como "opacidade 0" e o card sumiria para sempre */
          var final = { opacity: 1, x: 0, y: 0, scale: 1, rotation: 0,
                        ease: "none", /* com scrub a suavidade vem da rolagem */
                        scrollTrigger: trecho() };
          if (fx.from.filter) final.filter = "blur(0px)";
          gsap.fromTo(card, comEfeito(fx, {}), final);
          var img = foto && card.querySelector(foto);
          if (img) {
            gsap.set(img, { transition: "none" });
            gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: trecho() });
          }
        });
      };

      /* Cortes que assinam a casa: presos à rolagem, com a foto assentando */
      cardsNaRolagem(".cut-card", 0, ":scope > img");
      /* Serviços avulsos: presos à rolagem; começa por outro efeito */
      cardsNaRolagem(".svc-card", 2);
      revealCards(".plan-card", 4);

      /* Famosos: os cards deslizam para dentro (a faixa em si já tem a
         animação contínua em CSS, então o efeito vai nos cards) */
      gsap.set(".fame__row:first-child .fame-card", { transition: "none" });
      gsap.from(".fame__row:first-child .fame-card", { opacity: 0, x: 80, duration: 1.6, ease: "power2.out",
        stagger: 0.15, clearProps: "transform,opacity,transition", scrollTrigger: once(".fame__track") });

      /* Instagram: as fotos acendem em sequência, como um feed carregando */
      gsap.set(".ig__grid img", { transition: "none" });
      gsap.from(".ig__grid li", { opacity: 0, scale: 0.92, duration: 1.3, ease: "power2.out",
        stagger: { each: 0.12, from: "start" }, scrollTrigger: once(".ig__grid"),
        onComplete: function () { gsap.set(".ig__grid img", { clearProps: "transition" }); } });

      /* Contato: o pino cai no mapa */
      gsap.from(".contact__pin", { y: -60, opacity: 0, duration: 1.6, ease: "power3.out", scrollTrigger: once(".contact__map", "top 80%") });

      /* Agendamento: o brilho dourado acompanha a rolagem (só em telas grandes) */
      gsap.matchMedia().add("(min-width: 900px)", function () {
        gsap.fromTo(".book", { backgroundPosition: "0% 0%" }, { backgroundPosition: "0% 100%", ease: "none",
          scrollTrigger: { trigger: ".book", start: "top bottom", end: "bottom top", scrub: 0.6 } });
      });
    } else {
      gsap.set("[data-reveal]", { opacity: 1, y: 0 });
      Array.prototype.forEach.call(doc.querySelectorAll("[data-letters]"), function (t) {
        if (!t.closest(".hero")) revelarLetras(t); /* sem ScrollTrigger: acende direto */
      });
    }

    root.classList.remove("gsap-ready");

    /* recalcula posições depois que imagens/fontes acomodam o layout */
    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
      setTimeout(function () { window.ScrollTrigger.refresh(); }, 400);
      window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
    }
  };

  /* ------------------------------------------------------------------
     Tela de carregamento: sai quando as fontes e o vídeo do topo estão
     prontos (mínimo 0,7s para não piscar, máximo 3s para não prender).
     A abertura do GSAP começa enquanto ela some.
     ------------------------------------------------------------------ */
  var loader = doc.querySelector(".loader");
  var inicio = Date.now();
  var fontesProntas = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
  var heroPronto = new Promise(function (ok) {
    if (!heroVideo || reduceMotion || heroVideo.readyState >= 3) return ok();
    heroVideo.addEventListener("canplay", ok, { once: true });
    heroVideo.addEventListener("error", ok, { once: true });
  });
  var limite = new Promise(function (ok) { setTimeout(ok, 3000); });

  var tirarLoader = function () {
    if (!loader) return;
    loader.classList.add("is-done");
    /* pausa o brilho e tira do DOM depois do esmaecimento */
    setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 800);
  };

  Promise.race([Promise.all([fontesProntas, heroPronto]), limite]).then(function () {
    var espera = Math.max(0, 700 - (Date.now() - inicio));
    setTimeout(function () {
      tirarLoader();
      /* as letras só podem ser quebradas depois das fontes carregarem,
         senão as quebras de linha saem erradas */
      fontesProntas.then(startGsap);
    }, espera);
  });

  /* rede de segurança: nada pode ficar invisível */
  setTimeout(function () {
    if (root.classList.contains("gsap-ready")) {
      root.classList.add("anim-failsafe");
    }
  }, 6000);
})();
