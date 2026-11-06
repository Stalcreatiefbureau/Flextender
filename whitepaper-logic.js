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
 * [data-download-link]  → Download link inside .w-form-done
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

  /**
   * Check whether form belongs to a download block
   */
  function isDownloadForm(form) {
    const block = form.closest(".w-form");

    return !!block?.querySelector(
      ".w-form-done [data-download-link]"
    );
  }

  /**
   * Validate email before Webflow submits the form
   */
  document.addEventListener(
    "submit",
    function (event) {
      const form = event.target;

      if (
        !(form instanceof HTMLFormElement) ||
        !isDownloadForm(form)
      ) {
        return;
      }

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
   * Get clean filename from URL
   */
  function getFileName(url) {
    try {
      const pathname = new URL(url, window.location.href).pathname;

      const filename =
        decodeURIComponent(pathname.split("/").pop()) ||
        "download";

      return filename.replace(/^[a-f0-9]{24}_/i, "");
    } catch {
      return "download";
    }
  }

  /**
   * Download file without leaving current page
   */
  async function downloadFile(url) {
    try {
      const response = await fetch(url, {
        mode: "cors"
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status}`
        );
      }

      const blob = await response.blob();

      const objectURL = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = objectURL;
      link.download = getFileName(url);

      document.body.appendChild(link);

      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(objectURL);
      }, 10000);

    } catch (error) {
      // Fallback for files that don't allow CORS
      console.warn(
        "Flextender Download: opening file directly.",
        error
      );

      window.location.href = url;
    }
  }

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

      const link = done?.querySelector(
        "[data-download-link]"
      );

      if (!done || !link) return;

      const url = link.getAttribute("href");

      if (!url || url === "#") return;

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

        downloadFile(url);
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
