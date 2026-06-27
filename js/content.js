/* Personal taxonomy + content. Edit this file to change what the site shows.
   Each item may carry a `more` write-up and `links` revealed when it is opened.
   Link hrefs below are "#" placeholders - replace them with real URLs. */

const TYPES = [
  {
    id: "systems", label: "systems", title: "Systems", touched: "jun",
    blurb: "Things that only make sense once you see all the moving parts at once. The moment a mess resolves into a diagram.",
    items: [
      { year: "2025", h: "Tideline", p: "A scheduling engine that treats deadlines like gravity wells. Tasks fall toward the nearest one.", tag: "infra", state: "shipped", more: "It began as a cron replacement and quietly became the thing I trust most. Deadlines exert pull; the scheduler just lets each task fall toward the nearest one.", links: [{ l: "repo", h: "#" }, { l: "notes", h: "#" }] },
      { year: "2024", h: "Quiet Queue", p: "Backpressure made visible. A dashboard that breathes faster when a service is drowning.", tag: "tooling", state: "tending", more: "Every queue dashboard I had seen showed depth; none showed strain. This one widens its breath as latency climbs, so you feel the drowning before the alert ever fires.", links: [{ l: "demo", h: "#" }] },
      { year: "2024", h: "Graphify", p: "Turns any pile of notes into a navigable knowledge graph. Links discover themselves.", tag: "graph", state: "shipped", more: "Point it at a folder of markdown and it grows a graph overnight - backlinks, orphans, clusters. I keep finding notes I had forgotten I wrote.", links: [{ l: "repo", h: "#" }] },
      { year: "2023", h: "Ledger of Small Truths", p: "An event-sourced journal where nothing is ever deleted, only superseded.", tag: "data", state: "shelved", more: "An append-only diary for a system's beliefs, where every old truth stays legible beneath the new one. Shelved because the idea outgrew the weekend, not because it was wrong.", links: [{ l: "writeup", h: "#" }] }
    ],
    feed: [
      { when: "this wk", what: "Re-reading <b>Designing Data-Intensive Applications</b> for the third time. Different book each pass." },
      { when: "jun", what: "Sketching a CRDT-backed outline editor. Conflict-free is a beautiful phrase." }
    ]
  },
  {
    id: "craft", label: "craft", title: "Craft", touched: "apr",
    blurb: "The slow, hand-tuned things. Kerning. Easing curves. The difference between fine and exactly right.",
    items: [
      { year: "2025", h: "Paper", p: "A monospace-and-serif reading theme that feels like warm e-ink. You're looking at it.", tag: "type", state: "tending", more: "The reading theme this whole site is built on - two fonts, two inks, and an embarrassing number of evenings spent on line-height.", links: [{ l: "tokens", h: "#" }] },
      { year: "2024", h: "Ripple", p: "A pond rendered with real CSS perspective. The browser does the hard part.", tag: "css", state: "shipped", more: "No canvas tricks at the start - just a perspective transform and a lot of patience. The pond at the top of this page is its descendant.", links: [{ l: "demo", h: "#" }] },
      { year: "2024", h: "Margins", p: "A study in whitespace - twelve layouts of the same essay, each breathing differently.", tag: "layout", state: "shipped", more: "The same eight-hundred-word essay, set twelve ways. A reminder that whitespace is a typographic decision, not the absence of one.", links: [{ l: "read", h: "#" }] }
    ],
    feed: [
      { when: "this wk", what: "Tuning easing on <b>cubic-bezier(.22,.61,.36,1)</b>. It's almost honest now." },
      { when: "apr", what: "Learned to set type in <b>Playfair</b> without it looking like a wedding invite." }
    ]
  },
  {
    id: "tool", label: "tool", title: "Tools", touched: "jun",
    blurb: "Small sharp things I build so I never have to do the boring part twice. Most live in my dotfiles.",
    items: [
      { year: "2025", h: "pond", p: "This site's renderer, extracted into a tiny library. Drop in pads, get a pond.", tag: "lib", state: "tending", more: "The renderer behind this page, pulled out into something you can drop into any project. Hand it a few pads and it gives you a pond.", links: [{ l: "repo", h: "#" }] },
      { year: "2024", h: "scrib", p: "A CLI that turns terminal sessions into shareable, replayable transcripts.", tag: "cli", state: "shipped", more: "Records a terminal session and replays it as clean, copy-pasteable prose. Built it the night I got tired of screen-recording my own demos.", links: [{ l: "repo", h: "#" }] },
      { year: "2024", h: "warmlint", p: "A linter that only flags things that actually bit me before. Personal and petty.", tag: "dx", state: "shipped", more: "A linter with exactly one rule set: mistakes that have personally bitten me. It is petty, it is specific, and it is never wrong about me.", links: [{ l: "repo", h: "#" }] }
    ],
    feed: [
      { when: "this wk", what: "Rewriting my <b>git aliases</b> for the hundredth time. This time is the one." }
    ]
  },
  {
    id: "rabbit-hole", label: "rabbit hole", title: "Rabbit Holes", touched: "jun",
    blurb: "Subjects I had no business spending a weekend on, and would do again. Curiosity with no exit plan.",
    items: [
      { year: "2025", h: "Lighthouse Optics", p: "Fresnel lenses, Argand lamps, and why Victorian engineers were quietly insane.", tag: "history", state: "open", more: "Fell in chasing why a Fresnel lens looks like a glass beehive, and surfaced four days later with strong opinions about Argand lamps.", links: [{ l: "notes", h: "#" }] },
      { year: "2024", h: "Pond Ecology", p: "What actually lives under a lily pad. Turns out: everything. Field notes inside.", tag: "nature", state: "open", more: "Lifted a single lily pad and found a whole vertical city underneath. These are the field notes; the pond at the top of the page is the apology.", links: [{ l: "notes", h: "#" }] },
      { year: "2024", h: "Calendars", p: "Why the week has seven days and nobody can agree when it starts.", tag: "time", state: "open", more: "Why seven days, why these names, and why no two cultures quite agree on where the week begins. There is no bottom to this particular hole.", links: [{ l: "read", h: "#" }] }
    ],
    feed: [
      { when: "this wk", what: "Down a hole on <b>medieval map sea monsters</b>. They mean 'here be tax issues'." },
      { when: "jun", what: "Reading about <b>how ice was shipped from Boston to Calcutta</b> in 1833." }
    ]
  },
  {
    id: "experiment", label: "experiment", title: "Experiments", touched: "may",
    blurb: "Unfinished on purpose. The point was the question, not the answer. Some of these will never ship.",
    items: [
      { year: "2025", h: "Slow Web", p: "A site that loads one paragraph per minute. Patience as an interface.", tag: "prototype", state: "open", more: "One paragraph per minute, no skipping. Most people leave; the few who stay say they actually read it. The question was whether patience can be an interface.", links: [{ l: "try", h: "#" }] },
      { year: "2024", h: "Echo Garden", p: "Generative ambient music seeded by your scroll speed. Mostly listenable.", tag: "audio", state: "shelved", more: "Scroll fast and the music gets anxious; scroll slow and it settles. Pleasant for about ninety seconds, which is roughly when I shelved it.", links: [{ l: "listen", h: "#" }] },
      { year: "2024", h: "Marginalia", p: "Notes that only appear when two readers underline the same line.", tag: "social", state: "open", more: "A note appears only once two strangers underline the same sentence. Quiet, rare, and occasionally moving on the rare day it fires.", links: [{ l: "notes", h: "#" }] }
    ],
    feed: [
      { when: "this wk", what: "Testing whether a page can have <b>no buttons at all</b>. Only gestures." }
    ]
  }
];
