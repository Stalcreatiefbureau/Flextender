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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function measureItem(item) {
    const previousSize = item.style.inlineSize;
    item.style.inlineSize = 'max-content';
    const width = Math.ceil(item.getBoundingClientRect().width);
    item.style.inlineSize = previousSize;
    return width;
  }

  function init(scope = document) {
    scope.querySelectorAll('[data-announce]').forEach((wrap) => {
      if (wrap.dataset.announceReady) return;

      const items = [...wrap.querySelectorAll(':scope > [data-announce-item]')];
      if (!items.length) return;

      wrap.dataset.announceReady = 'true';
      wrap.style.gridTemplateColumns = 'minmax(0, 1fr)';
      wrap.style.textAlign = 'center';
      wrap.style.overflowWrap = 'anywhere';
      wrap.classList.add('is-ready');

      const row = wrap.closest('.nav_topbar-layout');
      const announcement = wrap.closest('.nav_announcement');
      const utility = row?.querySelector('.nav_utility');
      const dot = announcement?.querySelector('.nav_announcement-dot');
      const leavingTimers = new WeakMap();
      let widths = [];
      let index = 0;
      let hovered = wrap.matches(':hover');

      function setActiveItem() {
        items.forEach((item, itemIndex) => {
          item.classList.toggle('is-active', itemIndex === index);
          item.inert = itemIndex !== index;
        });
      }

      function sizeToActiveItem() {
        if (!widths.length) return;
        let width = widths[index];

        // Reserveer links en rechts evenveel ruimte zodat het blok in het midden blijft.
        if (row && utility && announcement && dot) {
          const rowGap = parseFloat(getComputedStyle(row).columnGap) || 0;
          const dotGap = parseFloat(getComputedStyle(announcement).columnGap) || 0;
          const available = row.clientWidth - 2 * (utility.offsetWidth + rowGap) -
            dot.getBoundingClientRect().width - dotGap;
          width = Math.max(0, Math.min(width, Math.floor(available)));
        }

        wrap.style.transition = reducedMotion.matches ? 'none' : 'inline-size .45s ease';
        wrap.style.inlineSize = `${width}px`;
      }

      function refreshWidths() {
        if (!wrap.getClientRects().length) return;
        const measured = items.map(measureItem);

        if (!widths.length && !wrap.contains(document.activeElement)) {
          index = measured.indexOf(Math.min(...measured));
          setActiveItem();
        }

        widths = measured;
        sizeToActiveItem();
      }

      setActiveItem();
      refreshWidths();
      window.addEventListener('resize', refreshWidths);
      document.fonts?.ready.then(refreshWidths);
      if (items.length < 2) return;

      const configuredInterval = parseInt(wrap.dataset.announceInterval, 10);
      const interval = configuredInterval > 0 ? configuredInterval : DEFAULT_INTERVAL;

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
        sizeToActiveItem();

        leavingTimers.set(current, setTimeout(() => {
          current.classList.remove('is-leaving');
          leavingTimers.delete(current);
        }, LEAVING_DURATION));
      }

      wrap.addEventListener('pointerenter', () => { hovered = true; });
      wrap.addEventListener('pointerleave', () => { hovered = false; });
      setInterval(() => {
        if (!hovered && !wrap.contains(document.activeElement) && !document.hidden &&
            wrap.getClientRects().length) next();
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
