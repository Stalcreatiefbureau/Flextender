function initHeroGalleryAnimation() {
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-hero-gallery]').forEach((gallery) => {
    const center = gallery.querySelector('[data-hero-center]');
    if (!center) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: gallery,

        // Pin gallery when vertically centered in viewport
        start: 'center center',

        // Scroll distance
        end: '+=150%',

        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    // Small pause before expanding
    tl.to({}, {
      duration: 0.2
    });

    // Expand center mask
    tl.to(center, {
      width: () => window.innerWidth,
      duration: 1,
      ease: 'none'
    });
  });
}

// Initialize Hero Gallery Animation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeroGalleryAnimation);
} else {
  initHeroGalleryAnimation();
}
