function initBouncyContentTabs() {
  // Rustige, zakelijke timing: geen overshoot, geen squash
  const config = {
    travel: 0.45,      // duur van de indicator-beweging
    ease: "power3.inOut",
    panelOut: 0.2,     // oude inhoud fade uit
    panelIn: 0.35,     // nieuwe inhoud fade in
    panelShift: 12,    // kleine verschuiving in px (was 35)
    height: 0.4,       // hoogte-aanpassing van de card
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let instanceCount = 0;

  document.querySelectorAll("[data-bouncy-tabs-init]").forEach((root) => {
    const nav = root.querySelector("[data-bouncy-tabs-nav]");
    const indicator = root.querySelector("[data-bouncy-tabs-indicator]");
    const ghost = root.querySelector("[data-bouncy-tabs-ghost]");
    const buttons = nav ? Array.from(nav.querySelectorAll("[data-bouncy-tabs-button]")) : [];
    if (!nav || !indicator || buttons.length < 2) return;

    const card = root.querySelector("[data-bouncy-tabs-card]");
    const panelsWrap = root.querySelector("[data-bouncy-tabs-panels]");
    const panels = panelsWrap
      ? Array.from(panelsWrap.querySelectorAll("[data-bouncy-tabs-panel]"))
      : [];
    const hasCard = Boolean(card && panelsWrap && panels.length);

    instanceCount += 1;
    buttons.forEach((button, i) => {
      const panel = panels[i];
      if (!panel) return;
      if (!button.id) button.id = "bouncy-tabs-" + instanceCount + "-tab-" + (i + 1);
      if (!panel.id) panel.id = "bouncy-tabs-" + instanceCount + "-panel-" + (i + 1);
      button.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", button.id);
    });

    let activeIndex = Math.max(0, buttons.findIndex((b) => b.hasAttribute("data-active")));
    const pos = { left: 0, right: 0 };
    let ghostVisible = false;
    const dur = (d) => (reduceMotion.matches ? 0 : d);

    function syncButtonState() {
      buttons.forEach((b, i) => {
        b.toggleAttribute("data-active", i === activeIndex);
        b.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
        b.tabIndex = i === activeIndex ? 0 : -1;
      });
    }

    function rectFor(button) {
      return {
        left: button.offsetLeft,
        right: button.offsetLeft + button.offsetWidth,
        top: button.offsetTop,
        height: button.offsetHeight,
      };
    }

    function render() {
      gsap.set(indicator, { x: pos.left, width: pos.right - pos.left });
    }

    function place(index) {
      const target = rectFor(buttons[index]);
      pos.left = target.left;
      pos.right = target.right;
      gsap.killTweensOf(pos);
      gsap.killTweensOf(indicator);
      gsap.set(indicator, { scaleY: 1, y: target.top, height: target.height });
      render();
    }

    function setPanelsHeight() {
      if (hasCard) gsap.set(panelsWrap, { height: panels[activeIndex].offsetHeight });
    }

    function swapPanelsInstant() {
      if (!hasCard) return;
      panels.forEach((p, i) => {
        gsap.killTweensOf(p);
        gsap.set(p, { autoAlpha: i === activeIndex ? 1 : 0, x: 0 });
        p.toggleAttribute("data-active", i === activeIndex);
      });
      gsap.set(card, { scaleX: 1, scaleY: 1, x: 0 });
      setPanelsHeight();
    }

    function transitionCard(prevIndex, movingRight) {
      if (!hasCard) return;
      const direction = movingRight ? 1 : -1;
      const incoming = panels[activeIndex];
      const outgoing = panels[prevIndex];
      if (!incoming || !outgoing) return;

      panels.forEach((p) => {
        if (p !== incoming && p !== outgoing) {
          gsap.killTweensOf(p);
          gsap.set(p, { autoAlpha: 0, x: 0 });
          p.removeAttribute("data-active");
        }
      });
      incoming.setAttribute("data-active", "");
      outgoing.removeAttribute("data-active");

      gsap.killTweensOf([card, panelsWrap, incoming, outgoing]);
      gsap.set(card, { scaleX: 1, scaleY: 1, x: 0 });
      const targetHeight = incoming.offsetHeight;

      gsap.timeline()
        .to(outgoing, {
          x: direction * -config.panelShift,
          autoAlpha: 0,
          duration: config.panelOut,
          ease: "power2.in",
        }, 0)
        .to(panelsWrap, {
          height: targetHeight,
          duration: config.height,
          ease: "power2.inOut",
        }, 0)
        .fromTo(incoming, {
          x: direction * config.panelShift,
          autoAlpha: 0,
        }, {
          x: 0,
          autoAlpha: 1,
          duration: config.panelIn,
          ease: "power2.out",
        }, config.panelOut * 0.75)
        .set(outgoing, { x: 0 });
    }

    function goTo(index) {
      if (index === activeIndex) return;
      const prevIndex = activeIndex;
      const movingRight = index > activeIndex;
      activeIndex = index;
      syncButtonState();

      if (reduceMotion.matches) {
        place(index);
        swapPanelsInstant();
        return;
      }

      transitionCard(prevIndex, movingRight);

      const target = rectFor(buttons[index]);
      gsap.killTweensOf(pos);
      gsap.killTweensOf(indicator);

      // Indicator glijdt in één vloeiende beweging naar de nieuwe tab
      gsap.set(indicator, { scaleY: 1 });
      gsap.to(indicator, {
        y: target.top,
        height: target.height,
        duration: config.travel,
        ease: config.ease,
      });
      gsap.to(pos, {
        left: target.left,
        right: target.right,
        duration: config.travel,
        ease: config.ease,
        onUpdate: render,
      });
    }

    function moveGhost(button) {
      if (!ghost) return;
      const target = rectFor(button);
      if (!ghostVisible) {
        ghostVisible = true;
        gsap.killTweensOf(ghost);
        gsap.set(ghost, {
          x: target.left,
          y: target.top,
          width: target.right - target.left,
          height: target.height,
        });
        gsap.to(ghost, { autoAlpha: 1, duration: dur(0.25), ease: "power2.out" });
      } else {
        gsap.to(ghost, {
          x: target.left,
          y: target.top,
          width: target.right - target.left,
          height: target.height,
          autoAlpha: 1,
          duration: dur(0.3),
          ease: "power3.out",
        });
      }
    }

    function hideGhost() {
      if (!ghost) return;
      ghostVisible = false;
      gsap.to(ghost, { autoAlpha: 0, duration: dur(0.2), ease: "power1.out" });
    }

    function refreshLayout() {
      const rows = new Set(buttons.map((b) => b.offsetTop));
      nav.toggleAttribute("data-wrapped", rows.size > 1);
      place(activeIndex);
      setPanelsHeight();
    }

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => goTo(index));
      button.addEventListener("mouseenter", () => moveGhost(button));
    });

    nav.addEventListener("mouseleave", hideGhost);
    nav.addEventListener("keydown", (event) => {
      let next = null;
      if (event.key === "ArrowRight") next = Math.min(buttons.length - 1, activeIndex + 1);
      if (event.key === "ArrowLeft") next = Math.max(0, activeIndex - 1);
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      if (next === null) return;
      event.preventDefault();
      if (next !== activeIndex) {
        goTo(next);
        buttons[next].focus();
      }
    });

    window.addEventListener("resize", refreshLayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshLayout);

    if (ghost) gsap.set(ghost, { autoAlpha: 0 });
    panels.forEach((p, i) => gsap.set(p, { autoAlpha: i === activeIndex ? 1 : 0 }));
    
    syncButtonState();
    refreshLayout();
  });
}

// Initialiseren
document.addEventListener("DOMContentLoaded", () => {
  initBouncyContentTabs();
});
</script>

<script>
function initHeroGalleryExpand() {
  const gallery = document.querySelector("[data-hero-gallery]");
  if (!gallery) return;

  const center = gallery.querySelector("[data-hero-center]");
  if (!center) return;

  const centerImg = center.querySelector("img");

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Alleen op desktop/tablet landscape; op mobiel blijft de hero statisch
  mm.add(
    {
      desktop: "(min-width: 992px)",
      reduce: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { desktop, reduce } = context.conditions;
      if (!desktop || reduce) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: gallery,
          start: "top top",   // begint zodra de gallery bovenin het scherm staat
          end: "+=150%",      // scrolllengte van de animatie, groter = langzamer
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true, // herberekent bij resize
        },
      });

      // Middelste foto groeit naar volledig scherm.
      // Omdat de kolommen in een flex-rij naast elkaar staan,
      // worden de andere foto's vanzelf naar buiten geduwd.
      tl.to(center, {
        width: () => window.innerWidth,
        height: () => window.innerHeight,
        borderRadius: 0,
        ease: "power2.inOut",
      }, 0);

      // Subtiele zoom-out op de foto zelf voor wat diepte
      if (centerImg) {
        tl.fromTo(centerImg, { scale: 1.1 }, { scale: 1, ease: "none" }, 0);
      }
    }
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHeroGalleryExpand);
} else {
  initHeroGalleryExpand();
}
