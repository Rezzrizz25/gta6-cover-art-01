# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Rezzrizz25/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Rezzrizz25/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio turns your photos and a caption into GTA-style poster cover art — 1–4 photo panels, bold stroked lettering and Vice City colour grades — and exports it as a PNG to share.

## Run it

```sh
node serve.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=v4m1pbv2&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

## What it does

- **1–4 photo panels** — add, duplicate or remove panels; each panel picks a photo from
  your uploads or the 4 built-in samples, with drag-to-pan and scroll/zoom
  cropping plus per-panel colour grade.
- **4 colour grades** — Vice City Sunset (pink/orange), Neon Night
  (magenta/cyan), Palm Dusk (teal/gold), Vice Glow (violet/pink). Built with canvas filters and
  gradient overlays, no external assets.
- **Bold poster lettering** — big stroked title in a heavy system sans
  (Arial Black / Impact stack), optional diagonal gradient banner, letterspaced
  subtitle, adjustable size and position (top / center / bottom), plus
  original vector palm silhouettes drawn in code.
- **Export sizes** — 1080×1080, 1080×1350 and 1920×1080 PNG, one click each.
  **One-click: sample cover + export** builds a 4-panel sunset cover from the
  samples and downloads it immediately.
- **Shortcuts** — Ctrl/Cmd+E exports the current cover, D duplicates the
  selected panel.
- **Offline by design** — plain static files, no network requests, no
  external fonts. Photos never leave the machine.

## Run it offline

```sh
node serve.ts
# open http://localhost:8080
```

Node 22.18+ and a desktop browser. No install step, no dependencies.

## Build the entry (dossier)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/dossier.json, out/app and out/screenshots
```

## Screenshots

| File | Scene |
| --- | --- |
| `screenshots/1-cover.jpg` | Finished 4-panel cover, Vice City Sunset, 1080×1080 |
| `screenshots/2-editor.jpg` | Editor with a photo loaded, Neon Night |
| `screenshots/3-cover.jpg` | Exported 2-panel cover, Neon Night, 1080×1350 |
| `screenshots/4-cover-wide.jpg` | Exported 3-panel cover, Vice Glow, 1920×1080 |

Screenshot scenes are reproducible from `shots.json` (`?shot=cover|editor`
with `panels`, `grade`, `caption`, `subtitle`, `size`, `pos`, `banner`,
`palms` query params).

## Credits

- Sample photos (`app/samples/neon-street.jpg`,
  `app/samples/sunset-convertible.jpg`) were AI-generated for this entry;
  `boulevard.jpg` and `pier.jpg` are the kit starter's samples, also
  AI-generated and free to use.
- All lettering, grades, palm art and UI are original code in this repo.
- No Rockstar Games logo, artwork or fonts are used. This is an unofficial
  fan-style tool, not affiliated with Rockstar Games.

## License

MIT — see [LICENSE](./LICENSE).
