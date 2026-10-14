(function () {
  const scripts = [
    "css-accordion.js",
    "marquee.js",
    "tab-autoplay.js",
    "timeline.js"
  ];

  const baseUrl = new URL("./", document.currentScript.src);

  async function loadScripts() {
    for (const script of scripts) {
      await new Promise((resolve, reject) => {
        const element = document.createElement("script");

        element.src = new URL(script, baseUrl).href;
        element.onload = resolve;
        element.onerror = reject;

        document.body.appendChild(element);
      });
    }
  }

  loadScripts().catch(console.error);
})();
