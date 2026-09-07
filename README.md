# A portfolio you walk around in

A 2D explorable world where every district is a section of a CV. No framework,
no build step, no image files. Every tree, terminal and campfire is drawn with
canvas primitives at runtime.

Open `index.html` by double-clicking it. That's the whole dev setup.

---

## Editing your content

**You only ever need to edit one file: `src/content.js`.**

The world builds itself from it:

| Add this to `content.js` | What appears in the world |
| --- | --- |
| a `projects[]` entry | a new terminal in **The Workshop** |
| an `experience[]` entry | a new monolith in **The Ledger** |
| an `education[]` entry | a new blackboard in **The Academy** |
| a `life[]` entry | a new framed memory in **Origin** |
| a `funFacts[]` entry | another line at the campfire |
| a `passions[]` entry | a new totem in **Origin** |
| a `skills[]` group | another section on the plaza board |

Props are laid out automatically, so you never touch the map.

When the text is genuinely yours, set `meta.contentReady = true` to remove the
orange "sample content" badge at the bottom of the screen.

Content is inserted as HTML, so you can use `<b>`, `<a href>` and entities
inside your strings. It is your own file, but don't paste in text you haven't
read from somewhere else.

### Media

A `passions[]` entry can carry a photo, a video clip or an audio snippet via
its `media` field. Files go in `assets/`, see [assets/README.md](assets/README.md)
for filenames and size limits.

Missing files are handled for you: on the live site the block removes itself,
so nothing ever renders broken. Opening the site locally shows a dashed
placeholder naming the file that's still outstanding.

### The résumé download

The **Download résumé** button in the résumé view serves
`assets/Elmar_Rasho_Resume.pdf` directly. It is your master `.docx` exported to
PDF. It is *not* generated from `content.js`.

**So when you update your master résumé, re-export it.** In Word: File →
Save As → PDF, save over `assets/Elmar_Rasho_Resume.pdf`. Otherwise the site
keeps serving the old one.

The in-site résumé view (`R`) is still generated from `content.js`, so it
stays current automatically. The two can drift, and that's fine, they're for
different readers.

### Background music

Off until the visitor presses `B` or the ♫ button, and the choice is
remembered. Nothing autoplays: browsers block it, and a portfolio that starts
making noise at a recruiter is a portfolio they close.

Music needs **both** the preference and the context. It plays only inside the
world, never over the title screen or the résumé. Entering the world is a real
user gesture, which is what lets a remembered "on" actually start playing;
without that the browser blocks the first `play()` and the button appears to
need pressing twice.

It ducks to ~12% volume automatically whenever a panel plays its own audio or
video, so the track snippet is never fighting the background loop, and pauses
when the tab is hidden.

Set the file in `meta.music.src` in `content.js`.

**The loop is crossfaded.** A single `<audio loop>` splices the end straight
onto the start, so any mismatch at the seam clicks audibly every pass.
Instead two elements ping-pong: as one nears its end the other starts from
zero and they overlap for `meta.music.crossfade` seconds (default 2.6). The
fade is equal-power (sine-shaped) rather than linear, so the combined level
stays flat across the crossover instead of dipping through the middle.

Raise `crossfade` if you can still hear the seam; lower it if the overlap
muddies. If you swap the track for one that loops cleanly, you can drop it to
around 0.5 and it'll behave like a normal loop.

### Getting the audio balance right

Two numbers, and they have to be tuned against each other:

| What | Where | Now |
| --- | --- | --- |
| Background music level | `meta.music.volume` in `content.js` | `0.12` |
| Footstep level | `SFX.step` in `src/audio.js` | `0.05` |

Music is a *bed*. If you raise it much past `0.12` the footsteps and
interaction blips stop cutting through and the world goes silent under it.
If you want music more present, raise the effects to match rather than
lifting music alone.

### Also worth editing once

- `index.html`: the `<title>`, `<meta name="description">` and the `og:` tags.
  These are static so link previews and search engines see them; they don't read
  from `content.js`.
- `index.html`: the email in the `<noscript>` block.

---

## Controls

| | |
| --- | --- |
| Move | `W A S D` / arrow keys / drag the on-screen stick / click where you want to go |
| Ride the snowboard | hold `Shift` (once found), or the 🏂 button on touch |
| Interact | `E`, `Space`, `Enter`, click a prop, or the touch button |
| World map + fast travel | `M` |
| Plain résumé view | `R` |
| Background music on/off | `B` |
| Sound effects on/off | `T` |
| Close a window | `Esc` |
| Flip between entries in a window | `←` `→` |

There are 10 fragments hidden across the islands. Collect them all and a sixth
island unlocks, with a snowboard on it. Take the board and holding `Shift`
rides it: about 3.5× walking speed, and it carries momentum, so you drift past
where you stop steering. Letting go of `Shift` brakes hard.

Progress is saved in `localStorage` under `world-progress-v1`: per browser,
per device, never sent anywhere. That means *you* keep seeing 10/10 on refresh
while every new visitor starts at 0/10, which is the intended behaviour. To
experience it fresh, open a private window or run
`localStorage.clear()` in the console.

**The résumé view (`R`) matters.** Recruiters in a hurry get the whole CV as a
plain, printable document, no game required. It's also the accessible path,
since a canvas world isn't screen-reader friendly. Don't delete it.

---

## Deploying

The site is static files. There is nothing to build.

### Vercel (recommended)

Easiest, no terminal:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Drag this whole folder onto the page
3. Done. You get a `something.vercel.app` URL immediately

To connect a custom domain: Vercel dashboard → your project → **Settings** →
**Domains** → add your domain, then set the DNS records Vercel shows you at
your registrar.

With Git instead (so every push redeploys):

```bash
git init && git add -A && git commit -m "Portfolio" && git branch -M main
```

Then create an empty repo on GitHub, push to it, and hit "Import Project" on
Vercel.

### Netlify

Drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
`netlify.toml` is already configured.

### GitHub Pages

Push to a repo, then Settings → Pages → deploy from `main` / root.

---

## Project layout

```
index.html          page shell: title screen, HUD, panels, résumé view
styles/main.css     all UI chrome (the world itself is canvas, not CSS)
assets/             your photos / clips / audio. See assets/README.md
src/
  content.js        ← YOUR CONTENT. the only file you normally edit
  world.js          builds islands, bridges and props from content.js
  draw.js           every sprite, drawn procedurally. no image assets
  player.js         movement, collision, footstep dust
  input.js          keyboard, virtual stick, click-to-move
  ui.js             content panels, world map, résumé view, media, toasts
  main.js           boot, camera, game loop, interaction, save/load
  audio.js          Web Audio blips. off by default
  music.js          looping background music. off by default, ducks for media
vercel.json         deploy config for Vercel
netlify.toml        deploy config for Netlify
```

## Notes

- The engine is around 150 KB and loads instantly. Your media in `assets/`
  is what will actually determine page weight, so respect the size limits.
- Audio and video use `preload="metadata"`, so nothing downloads until a
  visitor opens that panel.
- Works offline from `file://`, no server needed, scripts are classic
  (non-module) for exactly this reason.
- Respects `prefers-reduced-motion`: particles and drifting motes switch off.
- Sound is off until the visitor turns it on, so nothing autoplays.
