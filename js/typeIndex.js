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
      const mid = `m-${active}-${i}`;
      const hasMore = !!it.more;
      const title = hasMore
        ? `<h3><button type="button" class="entry-toggle" aria-expanded="false" aria-controls="${mid}">${it.h}</button></h3>`
        : `<h3>${it.h}</h3>`;
      let reveal = "";
      if (hasMore) {
        const links = (it.links || [])
          .map((l) => `<a class="xlink" href="${l.h}">${l.l}</a>`).join("");
        reveal = `<div class="entry-more" id="${mid}" inert>
            <div class="em-in"><p class="more">${it.more}</p>` +
          (links ? `<div class="links">${links}</div>` : "") +
          `</div>
          </div>`;
      }
      html += `<div class="entry${hasMore ? " has-more" : ""}">
        <span class="no">${String(i + 1).padStart(2, "0")}</span>
        <div class="col">
          <div class="top">${title}<span class="meta">${it.year} · ${it.tag}</span></div>
          <p>${it.p}</p>
          <span class="state">${it.state}</span>
          ${reveal}
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
    wireEntries();
    reading.classList.remove("fade");
    void reading.offsetWidth;                // reflow so the fade animation restarts
    reading.classList.add("fade");

    posEl.innerHTML = `[ ${active + 1} / ${TYPES.length} ] <b>${t.label}</b>`;
  }

  function toggleEntry(btn) {                 // open / close one item's reveal
    const region = document.getElementById(btn.getAttribute("aria-controls"));
    if (!region) return;
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    region.classList.toggle("open", !open);
    region.inert = open;                      // collapsed content is inert (no tab / no AT)
  }

  function wireEntries() {                     // whole row toggles; links stay clickable
    reading.querySelectorAll(".entry.has-more").forEach((entry) => {
      entry.addEventListener("click", (e) => {
        if (e.target.closest(".xlink")) return;
        const btn = entry.querySelector(".entry-toggle");
        if (btn) toggleEntry(btn);
      });
    });
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
    else if (e.key === "Enter") {            // jump focus into the items; a focused item toggles itself
      const ae = document.activeElement;
      if (ae && ae.classList && ae.classList.contains("entry-toggle")) return;
      const first = reading.querySelector(".entry-toggle");
      if (first) { first.focus(); e.preventDefault(); }
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
