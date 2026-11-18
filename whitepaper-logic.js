/**
 * Flextender — Form Download
 *
 * Compatible with:
 * - Webflow Forms
 * - Webflow CMS Collection Lists
 * - GitHub animations.js loader
 * - Finsweet Load More
 *
 * Attributes:
 * [data-download-link]  → Download link inside .w-form (typically .w-form-done)
 * [data-business-email] → Optional attribute on form
 */

(function () {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  const FREE_DOMAINS = new Set([
    "gmail.com",
    "googlemail.com",
    "hotmail.com",
    "hotmail.nl",
    "outlook.com",
    "outlook.nl",
    "live.com",
    "live.nl",
    "msn.com",
    "yahoo.com",
    "yahoo.nl",
    "icloud.com",
    "me.com",
    "ziggo.nl",
    "kpnmail.nl",
    "kpnplanet.nl",
    "planet.nl",
    "home.nl",
    "casema.nl",
    "xs4all.nl",
    "proton.me",
    "protonmail.com"
  ]);

  // Prevent duplicate global listeners
  if (window.flxDownloadInitialized) return;
  window.flxDownloadInitialized = true;

  function getDownloadLink(block, done) {
    if (!done) return null;
    return done.querySelector("[data-download-link]") ||
      block.querySelector("[data-download-link]");
  }

  /**
   * Validate email before Webflow submits the form
   */
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const block = form.closest(".w-form");
      if (!getDownloadLink(block, block?.querySelector(".w-form-done"))) return;

      const email = form.querySelector(
        'input[type="email"]'
      );

      if (!email) return;

      const value = email.value.trim();

      let message = "";

      if (!EMAIL_RE.test(value)) {
        message =
          "Vul een geldig e-mailadres in, bijvoorbeeld naam@organisatie.nl";
      } else if (form.hasAttribute("data-business-email")) {
        const domain = value.split("@")[1].toLowerCase();

        if (FREE_DOMAINS.has(domain)) {
          message = "Gebruik je zakelijke e-mailadres.";
        }
      }

      email.setCustomValidity(message);

      if (message) {
        event.preventDefault();
        event.stopImmediatePropagation();

        email.reportValidity();
      }
    },
    true
  );

  /**
   * Clear validation error when typing
   */
  document.addEventListener("input", function (event) {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.matches('input[type="email"]')
    ) {
      target.setCustomValidity("");
    }
  });

  /**
   * Initialize download forms
   */
  function initFormDownload(scope = document) {
    const blocks = [];

    if (
      scope instanceof Element &&
      scope.matches(".w-form")
    ) {
      blocks.push(scope);
    }

    blocks.push(
      ...scope.querySelectorAll(".w-form")
    );

    blocks.forEach((block) => {
      if (block.dataset.downloadReady === "true") {
        return;
      }

      const done = block.querySelector(".w-form-done");
      const link = getDownloadLink(block, done);
      const href = link?.getAttribute("href")?.trim();
      if (!href || href.startsWith("#")) return;

      let url;
      try {
        url = new URL(href, document.baseURI);
      } catch {
        return;
      }
      if (url.protocol !== "https:" && url.protocol !== "http:") return;

      // Mark initialized
      block.dataset.downloadReady = "true";

      // Configure fallback link
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener");

      let downloadStarted = false;

      /**
       * Observe Webflow success message
       */
      const observer = new MutationObserver(() => {
        const isVisible =
          getComputedStyle(done).display !== "none";

        if (!isVisible || downloadStarted) return;

        downloadStarted = true;

        observer.disconnect();

        window.location.href = url.href;
      });

      observer.observe(done, {
        attributes: true,
        attributeFilter: ["style", "class"]
      });
    });
  }

  /**
   * Initialize when DOM is ready
   */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => initFormDownload(),
      { once: true }
    );
  } else {
    initFormDownload();
  }

  /**
   * Expose initialization for dynamically loaded CMS items
   */
  window.flxDownloadInit = initFormDownload;

})();
