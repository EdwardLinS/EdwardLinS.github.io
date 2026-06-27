/* Composition root. Loaded last; the only script that triggers behaviour.
   Wires the page's modules together and boots them. */
(function () {
  "use strict";

  /* ---- a sense of now: the time-of-day note in the header ---- */
  function descriptor(h) {
    if (h < 5) return "still hours";
    if (h < 9) return "early";
    if (h < 12) return "morning";
    if (h < 14) return "midday";
    if (h < 17) return "afternoon";
    if (h < 20) return "evening";
    if (h < 23) return "quiet hours";
    return "late";
  }
  function tick() {
    const el = document.getElementById("now");
    if (!el) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    el.textContent = `${hh}:${mm} — ${descriptor(d.getHours())}`;
  }
  function startClock() {
    tick();
    setInterval(tick, 20000);
  }

  /* ---- boot ---- */
  Atmosphere.start();
  TypeIndex.init();
  Pond.mount(document.getElementById("asciipond"), { count: TYPES.length });
  startClock();
})();
