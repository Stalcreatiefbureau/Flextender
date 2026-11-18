/**
 * Flextender — Vacatureteller voor Webflow CMS.
 * Gebruik dezelfde groepsnaam in data-count-list, data-count-target
 * en data-count-label. Zet data-singular en data-plural op het label.
 */
(() => {
  function countItems() {
    const groups = new Map();

    document.querySelectorAll('[data-count-list]').forEach((list) => {
      const name = list.getAttribute('data-count-list');
      if (!groups.has(name)) groups.set(name, new Set());
      const items = groups.get(name);

      if (list.matches('.w-dyn-item')) items.add(list);
      list.querySelectorAll('.w-dyn-item').forEach((item) => items.add(item));
    });

    document.querySelectorAll('[data-count-target]').forEach((target) => {
      const items = groups.get(target.getAttribute('data-count-target'));
      if (items) target.textContent = items.size;
    });

    document.querySelectorAll('[data-count-label]').forEach((label) => {
      const items = groups.get(label.getAttribute('data-count-label'));
      if (!items) return;

      const singular = label.getAttribute('data-singular');
      const plural = label.getAttribute('data-plural');
      const text = items.size === 1 && singular ? singular : plural;
      if (text) label.textContent = text;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', countItems, { once: true });
  } else {
    countItems();
  }
  window.flxCountItems = countItems;
})();
