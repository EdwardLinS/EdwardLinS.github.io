# personal-site

A personal portfolio with a "warm editorial meets terminal" feel: a quiet,
typographic page fronted by an interactive ASCII pond. Lily pads and lotus
blooms drift on a perspective water surface that ripples under the cursor.

**Live:** https://edwardlins.github.io

## Design language

- **Two colours only** - warm paper (`#F5F2EB`) and near-black ink (`#1a1714`).
  No third colour, no gradients, no drop shadows.
- **Two typefaces only** - Playfair Display (serif) for editorial text and
  names, JetBrains Mono for every label, tag, and piece of UI metadata.
- **Quiet by default** - interactivity is discovered, not announced.

The organising system is a personal taxonomy of "types" (the left-hand index),
not generic categories. Each type owns a few items and a "currently into" feed.

## Stack

Deliberately boring and dependency-free:

- Plain HTML, CSS, and vanilla JavaScript. **No build step, no bundler, no
  framework.** Open `index.html` and it runs.
- Scripts are loaded with ordinary `<script src>` tags (not ES modules), so the
  page works straight off the file system. Each file is an IIFE that exposes a
  small `window.*` namespace; load order only matters for `main.js`, which is
  last and is the only script that triggers behaviour.
- The only network dependency is Google Fonts.

## Structure

```
index.html          markup only
css/
  styles.css        all styling; design tokens live in :root
js/
  content.js        TYPES - the taxonomy data (edit this to change content)
  atmosphere.js     window.Atmosphere - faint full-page ripple layer
  typeIndex.js      window.TypeIndex - the type navigator + reading pane
  pond.js           window.Pond - the self-contained ASCII pond engine
  main.js           composition root: boots the modules, runs the clock
```

`pond.js` is intentionally a single *deep* module: a simple interface
(`Pond.mount(el, opts)`) hiding the wave field, pad model, ripple rings, and
glyph renderer behind one file.

## Running locally

No tooling required. Either:

- Open `index.html` directly in a browser, or
- Serve the folder (nicer for fonts/caching):

  ```powershell
  python -m http.server 8000   # then visit http://localhost:8000
  ```

## Editing content

All site content is data in `js/content.js`. Each entry in `TYPES` is one type:

```js
{
  id: "tool", label: "tool", title: "TOOLS",
  touched: "jun", blurb: "...",
  items: [ { h: "pond", year: "2025", tag: "lib", p: "...", state: "tending" } ],
  feed:  [ { when: "this wk", what: "..." } ]
}
```

Text fields in `feed.what` may contain inline `<b>` markup. The number of pads
in the pond follows `TYPES.length` automatically.

## The pond, briefly

`pond.js` renders a perspective water field of monospace glyphs into a `<pre>`:

- A local wave rule relaxes each cell toward its neighbours; horizontal coupling
  far exceeds vertical, so a point disturbance spreads as a flattened ellipse -
  the same perspective squash the pads use, so ripples read as lying on the
  tilted surface rather than as flat circles.
- Pads are laid out from a **fresh random seed each load** (pass `opts.seed` to
  pin it) and de-overlapped with a few relaxation passes. The largest become
  standing lotus blooms.
- The cursor leaves a wake; moving pads shed cosmetic rings; the occasional
  raindrop falls and splashes.

### Performance and accessibility

- The animation loop **pauses via `IntersectionObserver`** whenever the pond
  scrolls off screen, and resumes when it returns - so it only uses CPU while
  visible (the browser also throttles it in background tabs).
- `Pond.mount` returns `{ destroy }` and tears down cleanly (cancels the frame
  loop, unbinds listeners, disconnects the observer).
- The pond is `aria-hidden`; the reading pane is a labelled region; the status
  readout is a polite live region; `prefers-reduced-motion` is honoured for the
  page's CSS transitions.

## Deployment

Hosted on GitHub Pages from the default branch of
`EdwardLinS/EdwardLinS.github.io`. Pushing to that branch publishes the site;
no build step runs.
