/* Ambient + tap ripple layer over #pond. Faint full-page atmosphere, plus a
   ripple burst centred on an element (used as type-selection feedback). This is
   a CSS-animated DOM layer, entirely separate from the ASCII pond engine. */
window.Atmosphere = (function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pond = document.getElementById("pond");

  function ring(cls, left, top, anim, life) {
    const r = document.createElement("div");
    r.className = cls;
    r.style.left = left;
    r.style.top = top;
    r.style.animation = anim;
    pond.appendChild(r);
    setTimeout(() => r.remove(), life);
  }

  function ambient() {                       // one slow ring drifting somewhere on the page
    const dur = 9000 + Math.random() * 4000;
    ring("ring", (5 + Math.random() * 90) + "vw", (8 + Math.random() * 84) + "vh",
         `spread ${dur}ms ease-out forwards`, dur + 200);
  }

  function schedule() {                      // keep the ambient cadence going, gently irregular
    ambient();
    setTimeout(schedule, 6500 + Math.random() * 5500);
  }

  function tapAt(el) {                        // ripple burst centred on an element
    if (!el || reduce) return;
    const b = el.getBoundingClientRect();
    ring("ring tap", (b.left + b.width / 2) + "px", (b.top + b.height / 2) + "px",
         "tap 2200ms ease-out forwards", 2400);
  }

  function start() {                          // begin the slow ambient ripples
    if (reduce || !pond) return;
    ambient();
    setTimeout(schedule, 4000);
  }

  return { start, tapAt, reduce };
})();
