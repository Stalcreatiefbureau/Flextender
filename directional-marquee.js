function initMarqueeScrollDirection() {
  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    console.warn("Marquee: GSAP or ScrollTrigger is missing.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  document
    .querySelectorAll("[data-marquee-scroll-direction-target]")
    .forEach((marquee) => {

      // Prevent duplicate initialization
      if (marquee.dataset.marqueeInitialized === "true") return;

      const marqueeContent = marquee.querySelector(
        "[data-marquee-collection-target]"
      );

      const marqueeScroll = marquee.querySelector(
        "[data-marquee-scroll-target]"
      );

      if (!marqueeContent || !marqueeScroll) return;

      // Read attributes
      const {
        marqueeSpeed: speed,
        marqueeDirection: direction,
        marqueeDuplicate: duplicate,
        marqueeScrollSpeed: scrollSpeed
      } = marquee.dataset;

      const marqueeSpeedAttr = parseFloat(speed) || 20;
      const marqueeDirectionAttr = direction === "right" ? 1 : -1;
      const duplicateAmount = Math.max(0, parseInt(duplicate, 10) || 0);
      const scrollSpeedAttr = parseFloat(scrollSpeed) || 0;

      const speedMultiplier =
        window.innerWidth < 479
          ? 0.25
          : window.innerWidth < 991
          ? 0.5
          : 1;

      let marqueeSpeed =
        marqueeSpeedAttr *
        (marqueeContent.offsetWidth / window.innerWidth) *
        speedMultiplier;

      marqueeSpeed = Math.max(0.1, marqueeSpeed);

      // Configure scroll container
      marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
      marqueeScroll.style.width = `${scrollSpeedAttr * 2 + 100}%`;

      // Duplicate marquee content
      if (duplicateAmount > 0) {
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < duplicateAmount; i++) {
          const clone = marqueeContent.cloneNode(true);

          clone.setAttribute("aria-hidden", "true");
          clone.setAttribute("data-marquee-clone", "");

          fragment.appendChild(clone);
        }

        marqueeScroll.appendChild(fragment);
      }

      const marqueeItems = marquee.querySelectorAll(
        "[data-marquee-collection-target]"
      );

      // Create marquee animation
      const animation = gsap.to(marqueeItems, {
        xPercent: -100,
        repeat: -1,
        duration: marqueeSpeed,
        ease: "none"
      });

      animation.totalProgress(0.5);

      // Set initial direction
      gsap.set(marqueeItems, {
        xPercent: marqueeDirectionAttr === 1 ? 100 : -100
      });

      animation.timeScale(marqueeDirectionAttr);
      animation.play();

      marquee.setAttribute("data-marquee-status", "normal");

      // Reverse direction based on scroll
      ScrollTrigger.create({
        trigger: marquee,
        start: "top bottom",
        end: "bottom top",

        onUpdate: (self) => {
          const isInverted = self.direction === 1;

          const currentDirection = isInverted
            ? -marqueeDirectionAttr
            : marqueeDirectionAttr;

          animation.timeScale(currentDirection);

          marquee.setAttribute(
            "data-marquee-status",
            isInverted ? "normal" : "inverted"
          );
        }
      });

      // Extra movement based on scroll position
      const scrollStart =
        marqueeDirectionAttr === -1
          ? scrollSpeedAttr
          : -scrollSpeedAttr;

      const scrollEnd = -scrollStart;

      gsap.fromTo(
        marqueeScroll,
        {
          x: `${scrollStart}vw`
        },
        {
          x: `${scrollEnd}vw`,
          ease: "none",
          scrollTrigger: {
            trigger: marquee,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );

      // Mark as initialized
      marquee.dataset.marqueeInitialized = "true";
    });
}

// Initialize when DOM is ready or script loads dynamically
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initMarqueeScrollDirection,
    { once: true }
  );
} else {
  initMarqueeScrollDirection();
}
