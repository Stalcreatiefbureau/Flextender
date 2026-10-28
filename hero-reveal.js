let heroRevealInstances = [];

function initHeroReveal(scope = document) {
  // Controleer of GSAP beschikbaar is
  if (typeof gsap === "undefined") {
    console.warn("Hero Reveal: GSAP is niet geladen.");
    return;
  }

  // Controleer of SplitText beschikbaar is
  if (typeof SplitText !== "undefined") {
    gsap.registerPlugin(SplitText);
  }

  const elements = [
    ...scope.querySelectorAll("[data-hero-reveal]")
  ];

  if (!elements.length) return;

  const EASE = "expo.out";

  const BASE_DELAY = 0.1;
  const STEP = 0.15;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  elements.forEach((el, index) => {

    // Voorkom dubbele initialisatie
    if (el.dataset.heroRevealInitialized === "true") return;

    const type = el.dataset.heroReveal || "lines";

    const customDelay = parseFloat(el.dataset.heroDelay);

    const delay = Number.isFinite(customDelay)
      ? customDelay
      : BASE_DELAY + index * STEP;

    // Reduced motion
    if (reducedMotion) {
      gsap.set(el, {
        autoAlpha: 1,
        clearProps: "clipPath,transform"
      });

      el.dataset.heroRevealInitialized = "true";
      return;
    }

    /* ============================================
       FADE REVEAL
       ============================================ */

    if (type === "fade") {

      const tween = gsap.fromTo(
        el,
        {
          autoAlpha: 0,
          y: 24
        },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: EASE,
          delay
        }
      );

      heroRevealInstances.push(tween);

      el.dataset.heroRevealInitialized = "true";

      return;
    }

    /* ============================================
       IMAGE REVEAL
       ============================================ */

    if (type === "image") {

      const img = el.tagName === "IMG"
        ? null
        : el.querySelector("img, video");

      gsap.set(el, {
        autoAlpha: 1,
        clipPath: "inset(100% 0% 0% 0%)"
      });

      if (img) {
        gsap.set(img, {
          scale: 1.2
        });
      }

      const tl = gsap.timeline({
        delay
      });

      tl.to(el, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1,
        ease: "expo.inOut"
      });

      if (img) {
        tl.to(
          img,
          {
            scale: 1,
            duration: 1.4,
            ease: EASE
          },
          0
        );
      }

      heroRevealInstances.push(tl);

      el.dataset.heroRevealInitialized = "true";

      return;
    }

    /* ============================================
       TEXT LINE REVEAL
       ============================================ */

    if (typeof SplitText === "undefined") {
      console.warn(
        "Hero Reveal: SplitText ontbreekt.",
        el
      );

      gsap.set(el, {
        autoAlpha: 1
      });

      return;
    }

    const split = SplitText.create(el, {

      type: "lines",

      mask: "lines",

      linesClass: "hero-line",

      autoSplit: true,

      onSplit(self) {

        gsap.set(el, {
          autoAlpha: 1
        });

        const stagger = parseFloat(
          el.dataset.heroStagger
        ) || 0.05;

        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.3,
          ease: EASE,
          stagger,
          delay
        });

      }

    });

    heroRevealInstances.push(split);

    el.dataset.heroRevealInitialized = "true";

  });

}


/* ============================================
   DESTROY HERO REVEALS
   ============================================ */

function destroyHeroReveals() {

  heroRevealInstances.forEach((instance) => {

    if (
      typeof SplitText !== "undefined" &&
      instance instanceof SplitText
    ) {
      instance.revert();
    } else {
      instance.kill();
    }

  });

  heroRevealInstances = [];

  document
    .querySelectorAll("[data-hero-reveal-initialized]")
    .forEach((el) => {
      delete el.dataset.heroRevealInitialized;
    });

}


/* ============================================
   INITIALIZE HERO REVEALS
   ============================================ */

function initializeHeroReveals() {

  if (document.fonts && document.fonts.ready) {

    document.fonts.ready.then(() => {
      initHeroReveal();
    });

  } else {

    initHeroReveal();

  }

}

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    initializeHeroReveals
  );

} else {

  initializeHeroReveals();

}
