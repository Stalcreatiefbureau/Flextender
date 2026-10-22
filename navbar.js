/**
 * Flextender navbar — megamenu (desktop) + accordion (mobiel)
 * Attributes (zet in Webflow designer):
 *   [data-nav]          op nav_component
 *   [data-nav-menu]     op nav_menu (bevat de items)
 *   [data-nav-item]     op elk nav_item mét dropdown
 *   [data-nav-trigger]  op de knop/link in dat item
 *   [data-nav-panel]    op het dropdownpaneel in dat item
 *   [data-nav-burger]   op de hamburgerknop
 * Optioneel op [data-nav]:
 *   data-nav-breakpoint="991"   (px, mobiel t/m deze breedte)
 */
(() => {
  const nav = document.querySelector('[data-nav]');
  if (!nav) return;

  const BP = parseInt(nav.dataset.navBreakpoint || '991', 10);
  const mq = window.matchMedia(`(max-width: ${BP}px)`);
  const menu = nav.querySelector('[data-nav-menu]');
  const burger = nav.querySelector('[data-nav-burger]');
  const items = [...nav.querySelectorAll('[data-nav-item]')];

  const OPEN_DELAY = 80;
  const CLOSE_DELAY = 180;
  let current = null;
  let hoverTimer = null;
  let openedByHoverAt = 0;

  const isMobile = () => mq.matches;
  const getTrigger = (item) => item.querySelector('[data-nav-trigger]');
  const getPanel = (item) => item.querySelector('[data-nav-panel]');

  /* ---------- Setup ARIA ---------- */
  items.forEach((item, i) => {
    const trigger = getTrigger(item);
    const panel = getPanel(item);
    if (!trigger || !panel) return;
    if (!panel.id) panel.id = `nav-panel-${i + 1}`;
    trigger.setAttribute('aria-controls', panel.id);
    trigger.setAttribute('aria-expanded', 'false');
    if (trigger.tagName !== 'BUTTON') trigger.setAttribute('role', 'button');
  });
  if (burger && menu) {
    if (!menu.id) menu.id = 'nav-menu';
    burger.setAttribute('aria-controls', menu.id);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menu openen');
  }

  /* ---------- --nav-height automatisch zetten ---------- */
  // Meet de hoogte van nav_component (topbar telt alleen mee waar die zichtbaar is)
  // en zet hem als CSS-variabele op <html>, zodat de hele pagina hem kan gebruiken.
  const setNavHeight = () => {
    document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
  };
  setNavHeight();
  if ('ResizeObserver' in window) new ResizeObserver(setNavHeight).observe(nav);
  else window.addEventListener('resize', setNavHeight);

  /* ---------- Link Blocks als knop laten werken ---------- */
  // Webflow-Buttons kunnen geen kinderen bevatten, dus triggers en burger zijn Link Blocks.
  // Hier maken we ze semantisch en voor het toetsenbord een echte knop.
  nav.querySelectorAll('[data-nav-trigger], [data-nav-burger]').forEach((el) => {
    if (el.tagName === 'BUTTON') return;
    el.setAttribute('role', 'button');
    el.removeAttribute('href'); // geen "#" in de URL en geen spring naar boven
    el.setAttribute('tabindex', '0');
  });
  nav.addEventListener('keydown', (e) => {
    const el = e.target.closest('[data-nav-trigger], [data-nav-burger]');
    if (!el || el.tagName === 'BUTTON') return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      el.click();
    }
  });

  /* ---------- Mobiele hoogte-animatie ---------- */
  const expand = (panel) => {
    panel.style.height = '0px';
    panel.offsetHeight; // reflow, zodat de animatie altijd vanaf 0 start
    panel.style.height = panel.scrollHeight + 'px';
    const done = (e) => {
      if (e.propertyName !== 'height') return;
      panel.style.height = 'auto';
      panel.removeEventListener('transitionend', done);
    };
    panel.addEventListener('transitionend', done);
  };
  const collapse = (panel) => {
    panel.style.height = panel.scrollHeight + 'px';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { panel.style.height = '0px'; });
    });
  };

  /* ---------- Open / close ---------- */
  function open(item) {
    if (current && current !== item) close(current);
    item.classList.add('is-open');
    getTrigger(item).setAttribute('aria-expanded', 'true');
    if (isMobile()) expand(getPanel(item));
    current = item;
  }

  function close(item) {
    if (!item) return;
    item.classList.remove('is-open');
    getTrigger(item).setAttribute('aria-expanded', 'false');
    if (isMobile()) collapse(getPanel(item));
    if (current === item) current = null;
  }

  function closeAll() {
    items.forEach((item) => item.classList.contains('is-open') && close(item));
  }

  /* ---------- Events per item ---------- */
  items.forEach((item) => {
    const trigger = getTrigger(item);
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      // Muis heeft net via hover geopend: klik niet meteen weer laten sluiten
      if (!isMobile() && item === current && Date.now() - openedByHoverAt < 400) return;
      item === current ? close(item) : open(item);
    });

    item.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || isMobile()) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (current !== item) { open(item); openedByHoverAt = Date.now(); }
      }, current ? 0 : OPEN_DELAY);
    });

    item.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse' || isMobile()) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => close(item), CLOSE_DELAY);
    });

    // Toetsenbord: focus verlaat het item → sluiten (desktop)
    item.addEventListener('focusout', (e) => {
      if (isMobile()) return;
      if (!item.contains(e.relatedTarget)) close(item);
    });
  });

  // Plain links (zonder dropdown) sluiten een open paneel bij hover
  nav.querySelectorAll('[data-nav-menu] > a, [data-nav-menu] > .nav_link').forEach((link) => {
    link.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse' && !isMobile() && current) {
        clearTimeout(hoverTimer);
        close(current);
      }
    });
  });

  /* ---------- Escape + klik buiten ---------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (current) {
      const t = getTrigger(current);
      close(current);
      t.focus();
    } else if (nav.classList.contains('is-menu-open')) {
      toggleMenu(false);
      burger && burger.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (!isMobile() && current && !nav.contains(e.target)) close(current);
  });

  /* ---------- Hamburger ---------- */
  function toggleMenu(force) {
    const willOpen = typeof force === 'boolean' ? force : !nav.classList.contains('is-menu-open');
    nav.classList.toggle('is-menu-open', willOpen);
    document.documentElement.classList.toggle('nav-locked', willOpen);
    if (burger) {
      burger.setAttribute('aria-expanded', String(willOpen));
      burger.setAttribute('aria-label', willOpen ? 'Menu sluiten' : 'Menu openen');
    }
    if (!willOpen) closeAll();
  }
  burger && burger.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(); });

  // Sluit mobiel menu na klik op een echte link
  menu && menu.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]:not([data-nav-trigger])');
    if (link && isMobile()) toggleMenu(false);
  });

  /* ---------- Breakpoint-wissel: alles resetten ---------- */
  mq.addEventListener('change', () => {
    toggleMenu(false);
    items.forEach((item) => {
      item.classList.remove('is-open');
      getTrigger(item).setAttribute('aria-expanded', 'false');
      getPanel(item).style.height = '';
    });
    current = null;
  });
})();
