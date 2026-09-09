# rasho.dev

My résumé, as a site. Developer-tool aesthetic, no game, no scroll gimmicks.
The page is the résumé; the only interactive parts are demos that show how
the projects actually work.

Live at <https://rasho.dev>.

## Run it locally

Double-click `index.html`. No install, no server, no build step, no
dependencies.

To match production behaviour exactly:

```bash
python -m http.server 8000 --directory .
```

## Editing content

**`src/content.js` is the only file you normally touch.** Profile, experience,
projects, education and skills all render from it. Add a project and it
appears, with its demo pane if one is registered for that name.

Also worth updating when they change:

- `index.html`: the `<title>`, description and the `og:` / `twitter:` tags.
  These are static so crawlers and link previews see them.
- `assets/Elmar_Rasho_Resume.pdf`: re-export from the master `.docx` whenever
  it changes. It is served directly, not generated from `content.js`.

## The project demos

Each project gets a pane demonstrating its mechanism rather than describing it.

| Project | Pane |
| --- | --- |
| PokeDropz | Streaming monitor log, architecture diagram, running counters |
| Morph | The prompt chain stepping stage by stage, with the JSON contract |
| GPT Mini | Data-flow diagram showing nothing leaves the browser |
| Anything else | Falls back to a stack strip and its links |

### The PokeDropz console is a replay, not a live feed

**It says so in its own title bar, and that label must stay.**

PokeDropz runs on a private box with no public endpoint, so there is nothing
to stream from. The pane reproduces the real log format faithfully: proxy
rotation, SKU polling with latencies, availability parsing, the occasional
429 with backoff, a stock transition, the S3 state write, and the role-routed
Discord webhook.

If asked "is that live?" in an interview, the honest answer is no, it is a
replay of the log format, and the page already said so. Presenting invented
telemetry as production data is the kind of thing that unravels badly.

**To make it genuinely live:** expose a read-only JSON status endpoint from
PokeDropz and set `FEED_URL` at the top of `src/demos.js`. The pane is built
to swap sources with that one change.

## Design rules

Terminal aesthetics usually fail by being unreadable. The constraints:

- One accent colour, used for structure, never decoration
- No glow, no scanlines, no typewriter effect on body copy
- Monospace throughout, but at 15px with 1.65 line-height. Prose sizes, not
  terminal sizes
- Hierarchy from weight and spacing, not colour
- The falling code sits behind a veil that darkens the reading column, and
  freezes for `prefers-reduced-motion` and when the tab is hidden
- The console is the only other animated element, and it pauses when scrolled
  out of view

## Layout

```
index.html        page shell, meta tags, JSON-LD
styles/main.css   all styling
src/
  content.js      résumé data. the file you edit
  demos.js        the per-project panes
  rain.js         the falling code background
  main.js         renders the page from content.js
assets/
  Elmar_Rasho_Resume.pdf
  social-card.jpg   1200x630, used by og:image
robots.txt, sitemap.xml, vercel.json, netlify.toml
```

## Deploying

Connected to Vercel; pushing to `main` deploys. `vercel.json` sets the
security headers and cache policy. DNS lives at Namecheap, with the apex
pointing at Vercel and `www` redirecting to it.

## History

Earlier versions of this site live in the git history: an explorable 2D game
world, and a Windows XP desktop. Both were complete and working. This one
replaced them because a résumé should lead with the résumé.
