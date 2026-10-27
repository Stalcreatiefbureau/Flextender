function initDraggableMarquee() {
  // Check GSAP dependencies
  if (
    typeof gsap === "undefined" ||
    typeof Observer === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    console.warn("Draggable Marquee: GSAP, Observer or ScrollTrigger is missing.");
    return;
  }

  gsap.registerPlugin(Observer, ScrollTrigger);

  const wrappers = document.querySelectorAll(
    "[data-draggable-marquee-init]"
  );

  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (
      wrapper.getAttribute("data-draggable-marquee-init") === "initialized"
    ) {
      return;
    }

    const collection = wrapper.querySelector(
      "[data-draggable-marquee-collection]"
    );

    const list = wrapper.querySelector(
      "[data-draggable-marquee-list]"
    );

    if (!collection || !list) return;

    const duration = Math.max(
      0.1,
      getNumberAttr(wrapper, "data-duration", 20)
    );

    const multiplier = Math.max(
      0,
      getNumberAttr(wrapper, "data-multiplier", 40)
    );

    const sensitivity = getNumberAttr(
      wrapper,
      "data-sensitivity",
      0.01
    );

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth = list.scrollWidth || list.getBoundingClientRect().width;

    if (!wrapperWidth || !listWidth) return;

    // Duplicate items until marquee fills the available space
    const minRequiredWidth = wrapperWidth + listWidth + 2;

    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);

      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");

      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);

    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,

      modifiers: {
        x: (x) => wrapX(parseFloat(x)) + "px"
      }
    });

    // Initial direction
    const initialDirectionAttr = (
      wrapper.getAttribute("data-direction") || "left"
    ).toLowerCase();

    const baseDirection =
      initialDirectionAttr === "right" ? -1 : 1;

    const timeScale = {
      value: baseDirection
    };

    if (baseDirection < 0) {
      marqueeLoop.progress(1);
    }

    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);

      wrapper.setAttribute(
        "data-direction",
        timeScale.value < 0 ? "right" : "left"
      );
    }

    applyTimeScale();

    // Drag interaction
    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,

      onChangeX: (observerEvent) => {
        let velocityTimeScale =
          observerEvent.velocityX * -sensitivity;

        velocityTimeScale = gsap.utils.clamp(
          -multiplier,
          multiplier,
          velocityTimeScale
        );

        gsap.killTweensOf(timeScale);

        const restingDirection =
          velocityTimeScale < 0 ? -1 : 1;

        gsap.timeline({
          onUpdate: applyTimeScale
        })
          .to(timeScale, {
            value: velocityTimeScale,
            duration: 0.1,
            overwrite: true
          })
          .to(timeScale, {
            value: restingDirection,
            duration: 1
          });
      }
    });

    // Pause when outside viewport
    ScrollTrigger.create({
      trigger: wrapper,
      start: "top bottom",
      end: "bottom top",

      onEnter: () => {
        marqueeLoop.resume();
        applyTimeScale();
        marqueeObserver.enable();
      },

      onEnterBack: () => {
        marqueeLoop.resume();
        applyTimeScale();
        marqueeObserver.enable();
      },

      onLeave: () => {
        marqueeLoop.pause();
        marqueeObserver.disable();
      },

      onLeaveBack: () => {
        marqueeLoop.pause();
        marqueeObserver.disable();
      }
    });

    wrapper.setAttribute(
      "data-draggable-marquee-init",
      "initialized"
    );
  });
}

// Initialize when DOM is ready, including dynamically loaded scripts
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initDraggableMarquee,
    { once: true }
  );
} else {
  initDraggableMarquee();
}
