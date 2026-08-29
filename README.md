# Docks Overseas — website

A static site for an India-based fresh produce export house, run by three
partners: Darshan KS, Sai Harsha Anne and Rachana HM. No build tools, no
dependencies, no server code. Four HTML files, one stylesheet, one script. It
will run from any web host, a shared cPanel account, Netlify, Vercel, GitHub
Pages, or straight off a USB stick.

```
index.html      Home — the scrolling story
produce.html    The five lines, with full specs
about.html      Who you are and how you work
contact.html    Enquiry form + direct details
assets/css/     style.css   — all styling and motion
assets/js/      main.js     — scroll, reveal, tilt, counters, rotator, form
assets/img/     logo.png       — the mark in brand navy, for light backgrounds
                logo-light.png — knocked out to near-white, used across the site
                favicon.png    — the mark on a navy tile, for browser tabs
partials/       sprite.html — the produce illustrations (shared)
                footer.html — the site footer (shared)
build.sh        copies the two partials into every page
```

## Running it locally

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. (Opening the files directly with `file://`
also works — nothing here needs a server.)

## Before you go live — replace the placeholders

Contact details and location are live. What is left to revisit:

| Placeholder | Where |
| --- | --- |
| The four stat figures | `index.html`, marked with a comment above the `.stats` block — kept as placeholders for now; revisit once you have real numbers behind them |
| Growing belts on the routes map (`Maharashtra`, `Karnataka`, `Kerala coast`) | `index.html` |

The produce specifications (seasons, calibres, carton weights, loadabilities)
are sensible industry defaults, not your numbers. Read through `produce.html`
and correct anything that does not match what you actually ship — buyers will
quote these back at you.

After editing anything in `partials/`, run:

```bash
sh build.sh
```

That copies the partial into all four pages. Editing the pages directly is fine
too; just do not edit the region between `<!--SPRITE:start-->` and
`<!--SPRITE:end-->` (or the same for `FOOTER`), because `build.sh` overwrites it.

## The enquiry form

Right now the form opens the visitor's email app with everything filled in and
addressed to the `data-to` address on the `<form>` tag. That works everywhere
and needs no account, but it depends on the visitor having mail set up.

To collect submissions properly instead, pick a form service (Formspree,
Netlify Forms, Basin) and:

1. Put their endpoint on the form: `<form action="https://…" method="POST">`
2. Delete the `enquiry form` block near the bottom of `assets/js/main.js`.

## The produce rotator

The home page shows the produce on a ring you can spin — drag it, click a piece
of fruit, use the arrows, or tab to it and press the left/right arrow keys. It
advances on its own every few seconds, and stops doing that as soon as you touch
or hover it.

The six description panels are ordinary HTML sitting in `.rot-panel`. With
JavaScript switched off they simply stack and stay readable, so nothing is
hidden behind the animation.

## Adding a produce line

1. Add a `<symbol id="p-yourfruit">` to `partials/sprite.html`, then `sh build.sh`.
2. In `index.html`, copy one `.pod` button inside `.ring` and one matching
   `.rot-item` in `.rot-panel`. Both are numbered with `data-i`, and the pod's
   `--a` is its angle on the ring — renumber all of them so the angles divide
   360° evenly (six items = 60° apart, seven = 51deg, and so on).
3. Copy a `.panel` block in `produce.html`, changing `#p-pom` to `#p-yourfruit`.
4. Add it to the `<select id="f-produce">` list in `contact.html`.

## Replacing the logo

`assets/img/` holds three generated files. To regenerate them from a new
source image, recolour the artwork to near-white for `logo-light.png` (the site
runs on a dark ground, so the navy original disappears against it) and keep the
navy version as `logo.png`. The site references `logo-light.png` in the header,
the footer and the loading screen, and `favicon.png` in the tab.

## The palette

The site runs on warm paper with the logo navy as its primary. Everything is
driven by tokens at the top of `assets/css/style.css` — change those and the
whole site follows:

| Token | Role |
| --- | --- |
| `--ground` / `--ground-2` | the beige page and its recessed bands |
| `--surface` / `--surface-2` | cards and panels |
| `--text` / `--text-dim` / `--text-faint` | the three text weights |
| `--brand` | logo navy — buttons, the ship, the ink of the whole thing |
| `--gold`, `--pom`, `--leaf`, `--sea` | accents, muted so they sit on paper |
| `--film` | an rgb triplet used for subtle washes; flips in inverted blocks |

Two context classes re-point those tokens for a whole block, so no component
needs a variant of its own:

- `class="deep"` drops a section a shade below the page onto a heavier sand,
  darkening the accents to hold their contrast there. The footer uses it.
- `class="invert"` flips a block onto brand navy with gold buttons. The closing
  call-to-action uses it.

All text combinations meet WCAG AA (the smallest, `--text-faint`, sits at
4.6:1). If you lighten `--gold` or `--text-faint`, check them again — both were
darkened specifically to clear that bar on a light ground.

The logo ships in two versions. `logo.png` (navy) is the one the site uses
everywhere. `logo-light.png` is knocked out to near-white and is kept for
anywhere the mark has to sit on a dark ground — a dark slide, a letterhead, a
social avatar — but nothing on the site currently uses it.

## Notes on the motion

Everything animates with CSS and a small amount of vanilla JavaScript — no
libraries, so there is nothing to keep updated and nothing to slow the page down.

- The whole site honours `prefers-reduced-motion`. Visitors who have asked their
  operating system to reduce animation get the same site, held still.
- Without JavaScript the page still reads: content is visible, links work, and
  the form falls back to a plain mail link.
- The illustrations are hand-drawn SVG, so they stay sharp at any size and add
  almost nothing to the page weight. If you later have real photographs of your
  produce and pack house, they will lift the site further — swap them into the
  `.produce-art` and `.panel-art` boxes.
