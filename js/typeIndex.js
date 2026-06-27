/* The type navigator: the site's primary navigation. Builds the index of types,
   renders the reading pane for the active type, and handles click / keyboard
   selection. Reads global TYPES; uses Atmosphere for selection-feedback ripples. */
window.TypeIndex = (function () {
  "use strict";

  const indexEl = document.getElementById("index");
  const reading = document.getElementById("reading");
  const posEl = document.getElementById("pos");
  let active = 0;
  let initialized = false;
  const wordEls = [];

  function build() {                         // one button per type, in the left-hand index
    TYPES.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "word";
      b.innerHTML = `<span class="mark">›</span>` +
        `<span class="w-name">${t.label}</span>` +
        `<span class="w-meta">~/${t.id} · ${String(t.items.length).padStart(2, "0")} · ${t.touched}</span>`;
      b.addEventListener("click", () => select(i));
      indexEl.appendChild(b);
      wordEls.push(b);
    });
  }

  function render() {                        // paint the reading pane for the active type
    const t = TYPES[active];
    [...indexEl.querySelectorAll(".word")].forEach((b, i) => {
      const on = i === active;
      b.classList.toggle("active", on);
      b.setAttribute("aria-current", on ? "true" : "false");
    });

    let html = `<h2 class="r-tag" id="r-title"><span class="cap">┌─</span><span>${t.title}</span><span class="ln"></span><span class="ct">[ ${String(t.items.length).padStart(2, "0")} ]</span></h2>`;
    html += `<p class="r-blurb">${t.blurb}</p>`;
    t.items.forEach((it, i) => {
      html += `<div class="entry">
        <span class="no">${String(i + 1).padStart(2, "0")}</span>
        <div class="col">
          <div class="top"><h3>${it.h}</h3><span class="meta">${it.year} · ${it.tag}</span></div>
          <p>${it.p}</p>
          <span class="state">${it.state}</span>
        </div>
      </div>`;
    });
    html += `<div class="fleuron">❧</div>`;
    html += `<div class="into"><div class="lbl">currently into</div>`;
    t.feed.forEach((f, i) => {
      const last = i === t.feed.length - 1;
      html += `<div class="into-row"><span class="branch">${last ? "└─" : "├─"}</span><span class="when">${f.when}</span><span class="what">${f.what}</span></div>`;
    });
    html += `</div>`;

    reading.innerHTML = html;
    reading.classList.remove("fade");
    void reading.offsetWidth;                // reflow so the fade animation restarts
    reading.classList.add("fade");

    posEl.innerHTML = `[ ${active + 1} / ${TYPES.length} ] <b>${t.label}</b>`;
  }

  function select(i) {                       // wraps around both ends of the list
    const next = (i + TYPES.length) % TYPES.length;
    if (next === active) return;
    active = next;
    render();
    Atmosphere.tapAt(wordEls[active]);
  }

  function onKey(e) {
    if (e.key === "ArrowDown") { select(active + 1); e.preventDefault(); }
    else if (e.key === "ArrowUp") { select(active - 1); e.preventDefault(); }
    else if (e.key >= "1" && e.key <= "9") {  // jump to type N, bounded by the actual count
      const n = parseInt(e.key, 10);
      if (n <= TYPES.length) select(n - 1);
    }
    else if (e.key === "Enter") {
      reading.focus({ preventScroll: true });
      reading.scrollIntoView({ behavior: Atmosphere.reduce ? "auto" : "smooth", block: "start" });
    }
  }

  function init() {
    if (initialized) return;
    if (!indexEl || !reading || !posEl) return;
    initialized = true;
    build();
    render();
    document.addEventListener("keydown", onKey);
  }

  return { init };
})();
