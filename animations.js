(function () {
  console.log("🚀 Flextender gestart!");

  const scripts = [
    "navbar.js",
    "css-accordion.js",
    "marquee.js",
    "tab-autoplay.js",
    "timeline.js",
    "reveal-testimonials.js",
    "tab-slider.js",
    "image-hero-scroll.js"
  ];

  const currentScript = document.currentScript;

  if (!currentScript) {
    console.error("Flextender: currentScript ontbreekt");
    return;
  }

  const baseUrl = new URL("./", currentScript.src);

  console.log("Flextender URL:", baseUrl.href);

  scripts.forEach((script) => {
    const element = document.createElement("script");

    element.src = new URL(script, baseUrl).href;

    element.onload = () => {
      console.log("✅ Geladen:", script);
    };

    element.onerror = () => {
      console.error("❌ Niet geladen:", script);
    };

    document.body.appendChild(element);
  });
})();
