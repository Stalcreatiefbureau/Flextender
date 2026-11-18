/**
 * Flextender — Wisselende aankondigingen in de topbar
 *
 * [data-announce] op de Collection List of de directe ouder van de berichten.
 * [data-announce-item] op elk Collection Item of bericht.
 * data-announce-interval optioneel op de ouder, in ms (standaard 6000).
 *
 * De nav_css-embed regelt de overgangen en de ondersteuning voor
 * prefers-reduced-motion. .is-ready activeert de wisselende weergave.
 */
(() => {
  const DEFAULT_INTERVAL = 6000;
  const LEAVING_DURATION = 500;

  function init(scope = document) {
    scope.querySelectorAll('[data-announce]').forEach((wrap) => {
      if (wrap.dataset.announceReady) return;

      const items = [...wrap.querySelectorAll(':scope > [data-announce-item]')];
      if (!items.length) return;

      wrap.dataset.announceReady = 'true';
      items.forEach((item, index) => {
        item.classList.toggle('is-active', index === 0);
        item.inert = index !== 0;
      });
      wrap.classList.add('is-ready');
      if (items.length < 2) return;

      const configuredInterval = parseInt(wrap.dataset.announceInterval, 10);
      const interval = configuredInterval > 0 ? configuredInterval : DEFAULT_INTERVAL;
      const leavingTimers = new WeakMap();
      let index = 0;
      let hovered = wrap.matches(':hover');

      function next() {
        const current = items[index];
        index = (index + 1) % items.length;
        const upcoming = items[index];

        current.classList.remove('is-active');
        current.classList.add('is-leaving');
        current.inert = true;

        clearTimeout(leavingTimers.get(upcoming));
        upcoming.classList.remove('is-leaving');
        upcoming.classList.add('is-active');
        upcoming.inert = false;

        leavingTimers.set(current, setTimeout(() => {
          current.classList.remove('is-leaving');
          leavingTimers.delete(current);
        }, LEAVING_DURATION));
      }

      wrap.addEventListener('pointerenter', () => { hovered = true; });
      wrap.addEventListener('pointerleave', () => { hovered = false; });
      setInterval(() => {
        if (!hovered && !wrap.contains(document.activeElement) && !document.hidden) next();
      }, interval);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    init();
  }
  window.flxAnnounceInit = init;
})();
