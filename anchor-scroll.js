/**
 * Flextender — Global Anchor Scroll
 * Gebruik in Webflow een link naar de ID van een sectie.
 * De bestaande [data-nav] bepaalt de offset. [data-anchor-navbar] heeft voorrang.
 */
(() => {
  if (window.flxAnchorScrollInitialized) return;
  window.flxAnchorScrollInitialized = true;

  const EXTRA_OFFSET = 40;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getTarget(hash) {
    if (!hash || hash === '#') return null;

    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return null;
    }
  }

  function scrollToTarget(target, behavior = 'smooth') {
    const navbar = document.querySelector('[data-anchor-navbar]') ||
      document.querySelector('[data-nav]');
    const offset = (navbar?.getBoundingClientRect().height ?? 0) + EXTRA_OFFSET;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion.matches ? 'instant' : behavior
    });
  }

  function focusTarget(target) {
    if (typeof target.focus !== 'function') return;

    target.focus({ preventScroll: true });
    if (document.activeElement === target || target.hasAttribute('tabindex')) return;

    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (document.activeElement === target) {
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    } else {
      target.removeAttribute('tabindex');
    }
  }

  function handleClick(event) {
    if (event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const link = event.target.closest?.('a[href*="#"]');
    if (!link || link.matches('[download], .w-tab-link, [data-nav-trigger], [data-nav-burger]')) return;
    if (link.target && link.target.toLowerCase() !== '_self') return;

    const currentUrl = new URL(window.location.href);
    const url = new URL(link.href);
    if (url.origin !== currentUrl.origin ||
        url.pathname !== currentUrl.pathname ||
        url.search !== currentUrl.search) return;

    const target = getTarget(url.hash);
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    if (currentUrl.hash !== url.hash) history.pushState(null, '', url.hash);

    focusTarget(target);
    scrollToTarget(target);
  }

  function alignCurrentHash(behavior) {
    requestAnimationFrame(() => {
      const target = getTarget(window.location.hash);
      if (target) scrollToTarget(target, behavior);
    });
  }

  function init() {
    // Het mobiele menu verwerkt de klik vóór Webflows ankerhandler op document.
    document.body.addEventListener('click', handleClick);

    const initialHash = window.location.hash;
    if (initialHash) {
      const alignInitialHash = () => {
        if (window.location.hash === initialHash) alignCurrentHash('instant');
      };

      if (document.readyState === 'complete') alignInitialHash();
      else window.addEventListener('load', alignInitialHash, { once: true });
    }

    window.addEventListener('popstate', () => alignCurrentHash('instant'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
