const scripts = [
  "css-accordion.js",
  "marquee.js",
  "tab-autoplay.js",
  "timeline.js"
];

const baseUrl = "https://cdn.jsdelivr.net/gh/Stalcreatiefbureau/Flextender@main/";

(async () => {
  for (const script of scripts) {
    await new Promise((resolve, reject) => {
      const element = document.createElement("script");

      element.src = baseUrl + script;
      element.onload = resolve;
      element.onerror = reject;

      document.body.appendChild(element);
    });
  }
})();
