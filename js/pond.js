/* Self-contained ASCII pond. No network, no WebGL. Renders a perspective
   water field of monospace glyphs into a <pre>, with a cursor ripple. */
(function () {
  "use strict";

  // Mount the ASCII pond into `el`. opts.count = number of type pads (default 5).
  function mount(el, opts) {
    if (!el) return null;
    opts = opts || {};
    if (el._pondDestroy) el._pondDestroy();   // idempotent: tear down a prior mount on this element

    const RAMP = " .,:;-=+ox*#%@";
    const FONT = 8;           // glyph size in px (smaller = denser grid)
    const CELL_W = FONT * 0.6; // mono advance width approx
    const CELL_H = FONT * 0.92; // tighter line height packs more rows

    const pre = document.createElement("pre");
    pre.setAttribute("aria-hidden", "true");
    // Presentation lives in CSS (.asciipond > pre). Only the two values coupled
    // to the grid math (FONT, CELL_H factor) stay here so they can't drift apart.
    pre.style.fontSize = FONT + "px";
    pre.style.lineHeight = "0.92";
    el.innerHTML = "";
    el.appendChild(pre);

    let COLS = 0, ROWS = 0, cur = null, prev = null;
    function resize() {
      const w = Math.max(el.clientWidth, 280);
      const h = Math.max(el.clientHeight, 140);
      COLS = Math.max(20, Math.floor(w / CELL_W));
      ROWS = Math.max(8, Math.floor(h / CELL_H));
      cur = new Float32Array(COLS * ROWS);
      prev = new Float32Array(COLS * ROWS);
    }
    resize();
    window.addEventListener("resize", resize);

    // ---- wave engine: each cell relaxes toward the mean of its neighbours,
    //      minus its previous value, with damping. A local rule that radiates.
    //      Horizontal coupling >> vertical, so a point disturbance spreads as a
    //      flattened ellipse — the SAME perspective squash the lily pads use, so
    //      ripples read as lying on the tilted water plane, not as flat circles. ----
    const DAMP = 0.965;   // 1 = no energy loss; lower = ripples fade sooner
    const GAIN = 0.6;     // how strongly a disturbance maps to glyph brightness
    const WAVE_X = 0.28;  // horizontal wave-speed coefficient (wide spread)
    const WAVE_Y = 0.052; // vertical coefficient — much smaller → ripples ~2.3x wider than tall

    // ---- pad-shed ring tuning (cosmetic ripples a pad emits as it bobs/drifts) ----
    const RING_DECAY   = 0.94;    // how slowly a pad's excitation bleeds off after it stops moving
    const RING_TRIG    = 0.0008;  // min excitation that still sheds a ring (lower = more sensitive)
    const RING_GAIN    = 215;     // maps excitation → strength 0..1 (higher = rings from gentler motion)
    const RING_CADENCE = 9;       // frames between successive rings from one pad
    const RING_LIFE    = 14;      // ring lifetime in frames at zero strength…
    const RING_LIFE_K  = 46;      // …plus this many more at full strength
    const RING_REACH   = 1.4;     // outward growth at zero strength…
    const RING_REACH_K = 2.4;     // …plus this much more at full strength
    const RING_RAMP    = ".:-=";  // glyphs a ring fades through (faint → bright)
    const GOV_CEILING  = 2.0;     // safety governor: bleed the field if mean |amplitude| exceeds this

    function drop(c, r, amp) {                 // bilinear deposit: spread over the 4 cells around (c,r)
      if (c < 1 || c > COLS - 2 || r < 1 || r > ROWS - 2) return;
      const c0 = Math.floor(c), r0 = Math.floor(r);
      const fc = c - c0, fr = r - r0;
      cur[r0 * COLS + c0]             += amp * (1 - fc) * (1 - fr);
      cur[r0 * COLS + c0 + 1]         += amp * fc * (1 - fr);
      cur[(r0 + 1) * COLS + c0]       += amp * (1 - fc) * fr;
      cur[(r0 + 1) * COLS + c0 + 1]   += amp * fc * fr;
    }
    function step() {
      for (let r = 1; r < ROWS - 1; r++) {
        const o = r * COLS;
        for (let c = 1; c < COLS - 1; c++) {
          const i = o + c;
          const lapx = cur[i - 1] + cur[i + 1] - 2 * cur[i];      // horizontal curvature
          const lapy = cur[i - COLS] + cur[i + COLS] - 2 * cur[i]; // vertical curvature
          let v = 2 * cur[i] - prev[i] + WAVE_X * lapx + WAVE_Y * lapy; // anisotropic wave eqn
          prev[i] = v * DAMP;
        }
      }
      const tmp = prev; prev = cur; cur = tmp;   // swap buffers
    }
    function heightAt(c, r) {
      c |= 0; r |= 0;
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return 0;
      return cur[r * COLS + c];
    }

    // cursor in grid coordinates; only a *moving* cursor leaves a wake (still mouse = calm)
    const ptr = { c: 0, r: 0, pc: 0, pr: 0, on: false, moved: false };
    el.addEventListener("pointermove", onMove);
    function onMove(ev) {
      const b = el.getBoundingClientRect();
      const nc = ((ev.clientX - b.left) / b.width) * COLS;
      const nr = ((ev.clientY - b.top) / b.height) * ROWS;
      if (!ptr.on) { ptr.pc = nc; ptr.pr = nr; }   // entering: start the trail here, no jump
      ptr.c = nc; ptr.r = nr;
      ptr.on = true;
      ptr.moved = true;
    }
    el.addEventListener("pointerleave", onLeave);
    function onLeave() { ptr.on = false; ptr.moved = false; }
    el.addEventListener("pointerdown", onDown);
    function onDown(ev) {        // click = one big ring
      const b = el.getBoundingClientRect();
      drop(((ev.clientX - b.left) / b.width) * COLS,
           ((ev.clientY - b.top) / b.height) * ROWS, 16);
    }

    // Floating lily pads (u = horizontal 0..1, v = depth 0..1 where 1 is nearest).
    // ox/oy = current drift offset from home; vx/vy = drift velocity (normalised u/v units)
    // bloom: 0 = closed bud, 1 = small open flower, 2 = full lotus bloom
    // Pads are generated from a fixed seed: deterministic (no reshuffle on reload),
    // but data-driven — change the count and the pond re-lays itself out, never overlapping.
    const PAD_SEED = 0x5eed1eaf;
    const PAD_COUNT = opts.count || 5;

    function mulberry32(a) {                            // tiny deterministic RNG
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let x = Math.imul(a ^ (a >>> 15), 1 | a);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }

    // one place that defines a pad's full shape: makePads and the decorative
    // pushes both go through this, so every pad owns the same fields from birth
    // (drift state + ripple-shedding state) — nothing gets added lazily later.
    function newPad(o) {
      return Object.assign({
        u: 0, v: 0, r: 4, ph: 0, bloom: 0,   // identity: home position, size, phase, flower stage
        ox: 0, oy: 0, vx: 0, vy: 0,          // drift: offset from home + velocity
        exc: 0, rings: [], ringCd: 0         // ripple-shedding: excitation, live rings, cooldown
      }, o);
    }

    function makePads(n, seed) {
      const rng = mulberry32(seed);
      const lerp = (a, b, k) => a + (b - a) * k;
      const clamp = (x, lo, hi) => x < lo ? lo : x > hi ? hi : x;
      // normalised on-screen footprint of a pad (mirrors the perspective squash in drawPad)
      const halfU = (p) => p.r * (0.55 + p.v * 1.1) * 0.0145;
      const halfV = (p) => halfU(p) * 1.7;

      const out = [];
      for (let i = 0; i < n; i++) {
        const col = (i + 0.5) / n;                       // evenly spread across the width…
        const u = clamp(col + (rng() - 0.5) * (0.16 / n), 0.10, 0.90); // …with only a hair of jitter so gaps stay even
        const zig = i % 2 === 0 ? 0.62 : 0.30;           // zigzag near/far so the band fills top-to-bottom
        const v = clamp(zig + (rng() - 0.5) * 0.12, 0.20, 0.74);
        const r = clamp(lerp(4.0, 8.6, v * v) * (0.9 + rng() * 0.3), 3.6, 8.8); // nearer = bigger
        const bloom = r >= 3.4 ? 1 : (rng() < 0.5 ? 1 : 0); // most pads: small flower or bud
        out.push(newPad({ u, v, r, ph: rng() * Math.PI * 2, bloom }));
      }

      // relax: nudge overlapping pads apart (a few cheap passes)
      for (let pass = 0; pass < 6; pass++) {
        for (let i = 0; i < out.length; i++) {
          for (let j = i + 1; j < out.length; j++) {
            const a = out[i], b = out[j];
            const du = a.u - b.u, dv = a.v - b.v;
            const su = halfU(a) + halfU(b), sv = halfV(a) + halfV(b);
            if (Math.abs(du) < su && Math.abs(dv) < sv) {
              const push = (sv - Math.abs(dv)) * 0.5 + 0.01;
              const dir = dv >= 0 ? 1 : -1;
              a.v = clamp(a.v + dir * push, 0.20, 0.74);
              b.v = clamp(b.v - dir * push, 0.20, 0.74);
            }
          }
        }
      }
      // the largest one or two pads become standing lotuses (bloom on a raised stem)
      const bySize = out.map((_, i) => i).sort((a, b) => out[b].r - out[a].r);
      const nLotus = out.length >= 4 ? 2 : 1;
      for (let k = 0; k < nLotus && k < bySize.length; k++) out[bySize[k]].bloom = 2;

      // closest pad sits in front: redraw order already sorts by v elsewhere
      return out;
    }

    const pads = makePads(PAD_COUNT, PAD_SEED);
    // make the far-left type pad the largest — anchors that corner of the pond
    { let lm = 0; for (let i = 1; i < pads.length; i++) if (pads[i].u < pads[lm].u) lm = i;
      pads[lm].r *= 1.28; }
    // two tiny decorative lilies tucked into the gaps — pure surface detail, not part of the type system
    pads.push(
      newPad({ u: 0.37, v: 0.48, r: 3.0, ph: 1.3, bloom: 0 }),
      newPad({ u: 0.63, v: 0.52, r: 3.2, ph: 4.1, bloom: 0 })
    );

    // ---- pad drift tuning ----
    const PAD_PUSH = 0.0026;    // how hard a passing ripple shoves a pad — pads jostle in place, not sail away
    const PAD_SPRING = 0.006;   // tether pulling each pad back to its home position (lower = slower float-back)
    const PAD_FRICTION = 0.82;  // velocity damping (lower = settles sooner)
    const PAD_MAXOFF = 0.035;   // max drift from home (fraction of band) — kept small so pads barely wander
    const PAD_BOB = 1.05;       // vertical rise/fall as a pad rides the swell (rows per unit height)
    const PAD_REF_R = 4.6;      // a "medium" pad; bigger than this feels heavier, smaller feels lighter

    // heavier pads resist the swell: a big lily pad has more mass, so it bobs and
    // drifts less and glides back home more lazily than a little one
    function padWeight(p) { return Math.pow(p.r / PAD_REF_R, 1.3); }

    // live centre of a pad: home + slow idle drift + ripple-driven offset
    function padCenter(p, t) {
      const cu = p.u + Math.sin(t * 0.08 + p.ph) * 0.022 + p.ox;
      const cv = p.v + Math.sin(t * 0.11 + p.ph) * 0.010 + p.oy;
      return [cu, cv];
    }

    function driftPad(p, t) {                           // shove from wave slope, then spring home
      const [cu, cv] = padCenter(p, t);
      const cx = cu * (COLS - 1);
      const cy = cv * (ROWS - 1);
      const gx = heightAt(cx + 1, cy) - heightAt(cx - 1, cy);   // surface slope (gradient)
      const gy = heightAt(cx, cy + 1) - heightAt(cx, cy - 1);
      const w = padWeight(p);                            // heavier = shoved less, glides longer
      const fric = Math.min(0.9, PAD_FRICTION + (w - 1) * 0.03);
      p.vx += (PAD_PUSH * gx - PAD_SPRING * p.ox) / w;
      p.vy += (PAD_PUSH * gy - PAD_SPRING * p.oy) / w;
      p.vx *= fric; p.vy *= fric;
      p.ox += p.vx; p.oy += p.vy;
      if (p.ox > PAD_MAXOFF) p.ox = PAD_MAXOFF; else if (p.ox < -PAD_MAXOFF) p.ox = -PAD_MAXOFF;
      if (p.oy > PAD_MAXOFF) p.oy = PAD_MAXOFF; else if (p.oy < -PAD_MAXOFF) p.oy = -PAD_MAXOFF;
    }

    function drawPad(grid, pad, t) {
      const [cu, cv] = padCenter(pad, t);
      const cx = cu * (COLS - 1);
      let cy = cv * (ROWS - 1);
      cy += heightAt(cx, cy) * (PAD_BOB / padWeight(pad)); // ride the ripples it sits on (heavier bobs less)

      const rx = pad.r * (0.55 + cv * 1.1);          // nearer pads are larger
      const ry = rx * 0.5 * (0.62 + 0.5 * cv);       // ellipse + perspective squash
      const NOTCH = Math.PI / 2;                      // notch faces the viewer (down)
      const SLIT = 0.16;                              // half-width of the notch slit
      const standing = pad.bloom >= 2 && rx > 2.4;    // big pad: lotus raised on a stem
      const flat = pad.bloom === 1 && rx > 2.2;       // small pad: a little flower lying on it
      const bedCore = flat ? 0.34 : 0;                 // only flat flowers clear a bed in the leaf

      const r0 = Math.max(0, Math.floor(cy - ry - 2));
      const r1 = Math.min(ROWS - 1, Math.ceil(cy + ry + 2));
      const c0 = Math.max(0, Math.floor(cx - rx - 1));
      const c1 = Math.min(COLS - 1, Math.ceil(cx + rx + 1));

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const ex = (c - cx) / rx;
          const ey = (r - cy) / ry;                  // positive = toward viewer
          const dd = ex * ex + ey * ey;

          if (dd > 1) {
            if (dd < 1.4 && ey > 0.25) grid[r][c] = "#"; // dark underside edge
            continue;
          }
          const ang = Math.atan2(ey, ex);
          if (dd > 0.28 && Math.abs(ang - NOTCH) < SLIT) continue; // thin notch slit

          if (dd > 0.82) {
            grid[r][c] = ey < -0.35 ? "=" : "@";     // upper rim catches light
          } else if (flat && dd < bedCore) {
            grid[r][c] = " ";                          // clear an open bed for a flat flower
          } else {
            grid[r][c] = "+";                          // leaf body
          }
        }
      }

      // bounds-checked plotter in absolute grid coords
      const putAt = (cc, rr, ch) => {
        cc = Math.round(cc); rr = Math.round(rr);
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) grid[rr][cc] = ch;
      };
      const spoke = (a) => {                            // stroke aligned to the radial direction
        const dx = Math.cos(a), dy = Math.sin(a);
        if (Math.abs(dx) > 2.2 * Math.abs(dy)) return "-";
        if (Math.abs(dy) > 2.2 * Math.abs(dx)) return "|";
        return dx * dy > 0 ? "\\" : "/";
      };
      const drawLotus = (lc, lr, hr, vr, layered) => { // a lotus bloom centred at (lc,lr)
        const ring = (radF, n, off, ch) => {
          for (let k = 0; k < n; k++) {
            const a = off + (k / n) * Math.PI * 2;
            putAt(lc + hr * radF * Math.cos(a), lr + vr * radF * Math.sin(a),
                  ch === null ? spoke(a) : ch);
          }
        };
        if (layered) ring(0.66, 6, Math.PI / 6, null); // outer petal layer, offset
        ring(0.34, 6, 0, null);                         // inner petal layer
        putAt(lc, lr, "@"); putAt(lc - 1, lr, "."); putAt(lc + 1, lr, "."); // seed-pod heart
      };

      const bcx = Math.round(cx), bcy = Math.round(cy);
      if (standing) {
        const stemTop = bcy - Math.max(3, Math.round(ry * 0.75 + 1.5));  // bloom sits just above its leaf
        const stemBase = bcy - Math.max(1, Math.round(ry * 0.55));        // emerges at the leaf's back rim
        for (let rr = stemTop + 1; rr <= stemBase; rr++) putAt(bcx, rr, "|"); // short stem, no skewer
        const hr = Math.max(2.8, rx * 0.62);             // bloom faces the viewer: rounder + a touch larger
        const vr = Math.max(2.2, hr * 0.8);
        drawLotus(bcx, stemTop, hr, vr, true);
      } else if (flat) {
        putAt(bcx, bcy, "o"); putAt(bcx - 1, bcy, "."); putAt(bcx + 1, bcy, "."); // little flower
      } else {
        putAt(bcx, bcy, "o");                            // closed bud
      }
    }

    const rain = [];        // raindrops currently falling: {c, r, vr, hit, amp}
    let dripT = 120;        // frames until the next raindrop

    function injectCursor() {                          // deposit a wake along the path the cursor travelled this frame
      if (!(ptr.on && ptr.moved)) return;
      const steps = Math.max(1, Math.ceil(Math.hypot(ptr.c - ptr.pc, ptr.r - ptr.pr)));
      for (let s = 1; s <= steps; s++) {
        const f = s / steps;
        drop(ptr.pc + (ptr.c - ptr.pc) * f, ptr.pr + (ptr.r - ptr.pr) * f, 0.9 / steps);
      }
      ptr.pc = ptr.c; ptr.pr = ptr.r; ptr.moved = false;
    }

    function updateRain() {                            // occasional raindrops: spawn, fall, and splash on impact
      if (--dripT <= 0) {
        const c = 2 + Math.random() * (COLS - 4);
        const hit = Math.max(3, Math.round((0.5 + Math.random() * 0.45) * (ROWS - 1))); // lands lower in the scene
        rain.push({ c, r: 0, vr: 0.6 + Math.random() * 0.5, hit, amp: 5 + Math.random() * 3 });
        dripT = 150 + Math.random() * 200;
      }
      for (let i = rain.length - 1; i >= 0; i--) {
        const d = rain[i];
        d.r += d.vr;
        if (d.r >= d.hit) { drop(d.c, d.hit, d.amp); rain.splice(i, 1); }  // strong splash ring on impact
      }
    }

    // a pad sheds a ring only when IT actually moves (gets shoved/drifts) — a wave
    // merely passing under a still pad won't trigger one.
    function emitPadRings(t) {
      for (const p of pads) {
        const [cu, cv] = padCenter(p, t);
        const cx = cu * (COLS - 1), cy = cv * (ROWS - 1);
        const activity = Math.hypot(p.vx, p.vy);       // the pad's own drift speed this frame
        p.exc = Math.max(activity, p.exc * RING_DECAY); // charges with motion, then bleeds off -> rings taper instead of cutting out
        const rx = p.r * (0.55 + cv * 1.1);
        const ry = rx * 0.5 * (0.62 + 0.5 * cv);
        p.ringCd--;
        if (p.exc > RING_TRIG && p.ringCd <= 0) {      // keeps shedding (ever fainter) for a moment after it settles
          const str = Math.min(1, p.exc * RING_GAIN);
          p.rings.push({ age: 0, maxAge: RING_LIFE + str * RING_LIFE_K, cx, cy, rx, ry, str }); // bigger disturbance -> longer, farther ring
          p.ringCd = RING_CADENCE;
        }
        for (let k = p.rings.length - 1; k >= 0; k--) { // age the rings out
          if (++p.rings[k].age > p.rings[k].maxAge) p.rings.splice(k, 1);
        }
      }
    }

    // safety governor: the field should only ever lose energy. If anything ever
    // pumps it upward, bleed the whole surface back down so nothing can run away.
    function applyGovernor() {
      let sAbs = 0;
      for (let k = 0; k < cur.length; k += 7) sAbs += Math.abs(cur[k]);
      const meanAbs = sAbs / (cur.length / 7);
      if (meanAbs > GOV_CEILING) {
        const f = GOV_CEILING / meanAbs;
        for (let k = 0; k < cur.length; k++) { cur[k] *= f; prev[k] *= f; }
      }
    }

    // map DISTURBANCE (not absolute level) to glyphs: calm water -> blank paper,
    // only ripple crests/troughs draw. A light 3x3 blur softens the step between
    // adjacent ramp glyphs so the surface reads smooth, not chunky.
    function renderWater() {
      const grid = new Array(ROWS);
      for (let r = 0; r < ROWS; r++) {
        const row = new Array(COLS);
        const o = r * COLS;
        for (let c = 0; c < COLS; c++) {
          let h;
          if (r > 0 && r < ROWS - 1 && c > 0 && c < COLS - 1) {
            h = cur[o + c] * 0.4 +
                (cur[o + c - 1] + cur[o + c + 1] + cur[o + c - COLS] + cur[o + c + COLS]) * 0.15;
          } else {
            h = cur[o + c];
          }
          let n = Math.abs(h) * GAIN;
          if (n > 1) n = 1;
          row[c] = RAMP[(n * (RAMP.length - 1)) | 0];
        }
        grid[r] = row;
      }
      return grid;
    }

    // expanding rings shed by bobbing pads — a cosmetic overlay drawn only over
    // blank water, so it never clobbers the wave glyphs or the pads themselves.
    function drawPadRings(grid) {
      for (const p of pads) {
        for (const g of p.rings) {
          const f = g.age / g.maxAge;                  // 0 (just shed) -> 1 (faded)
          const grow = 1 + f * (RING_REACH + g.str * RING_REACH_K); // stronger disturbance pushes the ring farther out
          const er = g.rx * grow, ev = g.ry * grow;
          const lvl = Math.round((1 - f) * 3 * g.str); // fades as it spreads
          if (lvl <= 0) continue;
          const ch = RING_RAMP[Math.min(RING_RAMP.length - 1, lvl)] || ".";
          const n = Math.max(14, Math.round((er + ev) * 1.5));
          for (let k = 0; k < n; k++) {
            const a = (k / n) * Math.PI * 2;
            const cc = Math.round(g.cx + Math.cos(a) * er);
            const rr = Math.round(g.cy + Math.sin(a) * ev);
            if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc] === " ")
              grid[rr][cc] = ch;
          }
        }
      }
    }

    function drawPads(grid, t) {                       // nearer (larger v) pads draw on top
      const order = pads.map((_, i) => i).sort((a, b) => padCenter(pads[a], t)[1] - padCenter(pads[b], t)[1]);
      for (const i of order) drawPad(grid, pads[i], t);
    }

    function drawRain(grid) {                          // the drop itself, falling through the air toward the water
      for (const d of rain) {
        const rr = Math.round(d.r), cc = Math.round(d.c);
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) {
          if (rr - 1 >= 0 && grid[rr - 1][cc] === " ") grid[rr - 1][cc] = "."; // faint trail above
          grid[rr][cc] = "'";                          // the teardrop
        }
      }
    }

    function serialize(grid) {                         // grid of chars -> the text the <pre> shows
      let out = "";
      for (let r = 0; r < ROWS; r++) {
        out += grid[r].join("");
        if (r < ROWS - 1) out += "\n";
      }
      return out;
    }

    function frame(t) {
      injectCursor();                                  // 1. add energy from the cursor…
      updateRain();                                    //    …and the occasional raindrop
      emitPadRings(t);                                 // 2. let moving pads shed cosmetic rings
      step();                                          // 3. advance the wave field one tick
      applyGovernor();                                 //    keep it from ever running away
      for (const p of pads) driftPad(p, t);            // 4. ripples shove pads, tether pulls them home
      const grid = renderWater();                      // 5. compose the frame, back to front:
      drawPadRings(grid);                              //    rings on the water,
      drawPads(grid, t);                               //    pads over them,
      drawRain(grid);                                  //    falling drops on top
      pre.textContent = serialize(grid);               // 6. paint
    }

    const start = performance.now();
    let rafId = 0;
    (function loop(now) {
      frame((now - start) / 1000);
      rafId = requestAnimationFrame(loop);
    })(start);

    function destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerdown", onDown);
      el.innerHTML = "";
      delete el._pondDestroy;
    }
    el._pondDestroy = destroy;
    return { destroy };
  }

  window.Pond = { mount };
})();
