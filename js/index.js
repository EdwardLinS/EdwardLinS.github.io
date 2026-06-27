/* Text index, reading pane, keyboard nav, clock, and ambient DOM ripples. Reads global TYPES. */


/* ---------- index + reading ---------- */
const indexEl = document.getElementById("index");
const reading = document.getElementById("reading");
let active = 0;
const wordEls = [];

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

function render() {
  const t = TYPES[active];
  [...indexEl.querySelectorAll(".word")].forEach((b, i) => {
    const on = i === active;
    b.classList.toggle("active", on);
    b.setAttribute("aria-current", on ? "true" : "false");
  });

  let html = `<div class="r-tag"><span class="cap">┌─</span><span>${t.title}</span><span class="ln"></span><span class="ct">[ ${String(t.items.length).padStart(2, "0")} ]</span></div>`;
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
  void reading.offsetWidth;
  reading.classList.add("fade");

  document.getElementById("pos").innerHTML =
    `[ ${active + 1} / ${TYPES.length} ] <b>${t.label}</b>`;
}

function select(i) {
  const next = (i + TYPES.length) % TYPES.length;
  if (next === active) return;
  active = next;
  render();
  if (!reduceMotion) tapRipple(wordEls[active]);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { select(active + 1); e.preventDefault(); }
  else if (e.key === "ArrowUp") { select(active - 1); e.preventDefault(); }
  else if (/^[1-5]$/.test(e.key)) { select(parseInt(e.key, 10) - 1); }
  else if (e.key === "Enter") {
    reading.focus({ preventScroll: true });
    reading.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
});

render();

/* ---------- a sense of now ---------- */
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
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  document.getElementById("now").textContent = `${hh}:${mm} — ${descriptor(d.getHours())}`;
}
tick();
setInterval(tick, 20000);

/* ---------- atmosphere: slow ambient ripples ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pond = document.getElementById("pond");
function ripple() {
  const r = document.createElement("div");
  r.className = "ring";
  r.style.left = (5 + Math.random() * 90) + "vw";
  r.style.top = (8 + Math.random() * 84) + "vh";
  const dur = 9000 + Math.random() * 4000;
  r.style.animation = `spread ${dur}ms ease-out forwards`;
  pond.appendChild(r);
  setTimeout(() => r.remove(), dur + 200);
}
function scheduleRipple() {
  ripple();
  setTimeout(scheduleRipple, 6500 + Math.random() * 5500);
}
function tapRipple(el) {
  if (!el) return;
  const box = el.getBoundingClientRect();
  const r = document.createElement("div");
  r.className = "ring tap";
  r.style.left = (box.left + box.width / 2) + "px";
  r.style.top = (box.top + box.height / 2) + "px";
  r.style.animation = "tap 2200ms ease-out forwards";
  pond.appendChild(r);
  setTimeout(() => r.remove(), 2400);
}
if (!reduceMotion) {
  ripple();
  setTimeout(scheduleRipple, 4000);
}
