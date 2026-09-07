# assets/

Drop your media here. The filenames below are what `src/content.js` already
points at. Match them exactly and everything just works, no code changes.

If a file is missing, the block hides itself on the live site. When you open
the site locally you'll see a dashed orange placeholder naming the file
instead, so you always know what's outstanding.

| File | Used by | What it is |
| --- | --- | --- |
| `gym.jpg` | The gym totem | A photo of you training |
| `track.mp3` | chestpump totem | A short snippet of your top track (size is not critical, see below) |
| `track-art.jpg` | chestpump totem | That track's cover art |
| `snowboard.mp4` | Snowboarding totem | A clip of you hitting a jump |
| `snowboard-poster.jpg` | Snowboarding totem | Still frame shown before play (optional) |

## Specs

**`gym.jpg`**: landscape works best, around 1200×800. Keep it under 400 KB.
Displayed at up to 420 px tall, cropped to fill, so keep the subject centred.

**`track.mp3`**: 20-30 seconds is plenty. **Up to ~2 MB is genuinely fine**,
so don't degrade the audio to hit a number: the player uses
`preload="metadata"`, meaning page load fetches only a few KB of header, and
the file itself downloads only when someone presses play. MP3 also streams
progressively, so playback starts in about a second no matter the size. Keep
the bitrate you're happy with.

Pick the drop, not the intro. Nothing autoplays, so the first two seconds
after someone hits play have to earn the attention.

Also update the `title` and `meta` fields in `src/content.js` under the
chestpump passion. They currently read "Your top track" and "top track ·
chestpump". Put the real title and play count in.

**`track-art.jpg`**: square, 300×300 is fine. Under 100 KB.

**`snowboard.mp4`**: H.264 MP4, under 6 seconds, under 2 MB, and no wider
than 1280 px. It's set to loop, so pick a clip that reads well repeating.
Phone footage is fine. Vertical works, it's contained rather than cropped.

**`snowboard-poster.jpg`**: optional but worth it, a still frame from the
clip, shown before playback starts. Without one the video area is black
until it loads. Around 1280 px wide, under 200 KB.

## Getting the files

- **Track snippet**: export from your DAW, or use the "Download" option on
  your own SoundCloud track if you enabled it, then trim in Audacity (free).
- **Cover art**: the image you uploaded with the track on SoundCloud.
- **Snowboard clip**: trim on your phone before exporting. It's easier than
  doing it after, and keeps the file small.

## Size, in priority order

The engine is ~150 KB and loads instantly. Your media determines real page
weight from here, but not all of it costs the same:

1. **`gym.jpg` matters most.** It downloads as soon as the gym panel opens
   and can't stream, so a heavy photo is a visible stall. Keep this lean.
2. **`snowboard.mp4` matters next.** `preload="metadata"` keeps it off the
   page load, but video starts less gracefully than audio. Under 2 MB.
3. **`track.mp3` barely matters.** Metadata only until someone presses play,
   then it streams progressively. Up to ~2 MB is fine.

Nothing in `assets/` is fetched until a visitor walks to that totem and opens
it, so none of this affects how fast the site feels on arrival.
