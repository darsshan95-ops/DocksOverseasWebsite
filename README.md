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

Configuration lives in the `ENQUIRY` block in `assets/js/main.js`. Whatever it
points at, the visitor stays on the page: the button reads "Sending…", then a
thank-you appears and the form clears. If the request fails they get an error
naming your email address, so an enquiry is never silently lost. Blank the
`endpoint` and the form falls back to opening the visitor's mail app.

The form carries a hidden "Website" field. People never see it; bots fill it
in, and any submission with it filled is dropped before it is sent.

### Currently live: your own Google Sheet

```js
var ENQUIRY = {
  endpoint:  'https://script.google.com/macros/s/AKfycbyE.../exec',
  accessKey: ''
};
```

Each enquiry appends a row to your "Enquiries" sheet and emails a copy to
docksoverseas@gmail.com, with reply-to set to the buyer so replying in Gmail
goes straight back to them. The script behind it is `tools/enquiry-endpoint.js`
— see below for how it was set up and how to change it.

The endpoint URL is public, as it has to be. The hidden honeypot field is what
keeps that from becoming a spam funnel.

**Web3Forms** was the previous setup and still works if you ever want to fall
back to it — set `endpoint` to `https://api.web3forms.com/submit` and
`accessKey` to `56c69f48-b953-49f5-93ec-b5db540d34b3`.

### How the Google Sheet endpoint was set up

`tools/enquiry-endpoint.js` is the Google Apps Script behind the live endpoint.
It writes each enquiry to a spreadsheet you own and emails you a copy. No third
party holds the data and there is no monthly cap. To rebuild or move it:

1. Create a Google Sheet — call it something like "Docks Overseas — Enquiries".
2. In that sheet: **Extensions → Apps Script**.
3. Delete the placeholder `function myFunction() {}`, paste the whole contents
   of `tools/enquiry-endpoint.js`, and save.

> **If step 2 shows "Sorry, unable to open the file at present"** that is a
> Google multi-account bug, not a problem with the sheet. Either sign out of
> every Google account except the one that owns the sheet (or open it in an
> incognito window), or skip the menu entirely: go to script.google.com, make
> a **New project**, paste the script there, and set `SHEET_ID` at the top of
> the script to the long id in your sheet's URL between `/d/` and `/edit`.
> Everything else below is identical.
4. **Deploy → New deployment**. Click the gear, choose **Web app**, then set:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. **Deploy**, then authorise it. Google will warn that the app is unverified
   because you wrote it yourself — click **Advanced → Go to (project name)
   → Allow**.
6. Copy the **Web app URL**. It ends in `/exec`.
7. Put it in the config and clear the access key:

```js
var ENQUIRY = {
  endpoint:  'https://script.google.com/macros/s/AKfy.../exec',
  accessKey: ''
};
```

The sheet builds its own header row on the first submission. Emails go to the
address in `NOTIFY_TO` at the top of the script, with reply-to set to the
buyer, so replying from Gmail goes straight back to them. Set `NOTIFY_TO` to
an empty string if you only want rows in the sheet.

The script reports a `VERSION` number from its `/exec` URL. Open that URL in a
browser: if the version shown does not match `VERSION` at the top of
`tools/enquiry-endpoint.js`, the editor has your changes but the live endpoint
does not — deploy a new version. Live at the time of writing: **v3**.

Values are written as plain text rather than left to Sheets' own parsing. A
phone number beginning with `+` would otherwise be read as a formula and land
in the sheet as `#ERROR!`, losing the number.

Two things that catch people out:

- **After editing the script you must deploy a new version.** Saving alone
  changes nothing on the live endpoint. Deploy → Manage deployments → edit →
  Version: New version.
- **The endpoint URL is public**, like the Web3Forms key. The honeypot is what
  keeps that from becoming a spam funnel.

Adding a field later means adding it to the form, then to `FIELDS` and
`LABELS` in the script — the column and the email line follow automatically.

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
