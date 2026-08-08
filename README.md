# Hydra Steam Foam — website

A bilingual (English / Arabic) one-page marketing site for **Hydra Steam Foam**,
an upholstery cleaning service at Empire Heights, Business Bay, Dubai — sofas,
mattresses, carpets and car interiors, cleaned by steam at the customer's own
address. Open 24 hours.

The design is taken from the owner's own printed flyer and banner: the flyer
navy and gold, the white-above / navy-below split, the gold hairline-and-diamond
divider, the navy service pill, the service cards with their navy title bar and
gold disc, the "WHY CHOOSE HYDRA STEAM FOAM?" panel sitting beside the SPECIAL
OFFER box, and the white contact strip across the foot.

Static HTML, CSS and vanilla JavaScript. **No build step and no dependencies** —
it runs from any web host, and it also works correctly when opened straight
from disk by double-clicking `index.html`.

---

## ⚠️ Before this goes live

Five things need the owner's decision. The first two are the ones that can
actually cost the business something.

| # | What | Why it matters |
| --- | --- | --- |
| 1 | **The six customer reviews are sample copy, not real customers.** | They were written to fill the section so the owner can see the layout. Publishing invented testimonials as if they were genuine is deceptive advertising and against Google's policies. Replace them with real reviews (or delete the whole `#reviews` section) before launch. They live in `js/i18n.js` under `rev.1.*` … `rev.6.*`, and there is a visible banner under the section pointing here — remove that too. |
| 2 | **Tower A or Tower B?** | The owner's flyer says *Empire Heights Tower A*; the Google Maps listing text reads *Empire Heights Tower B*. The site currently says **Tower A**, following the flyer. Someone will walk into the wrong tower if this is wrong. Fix in `js/i18n.js` (`i.address.v`) and in the JSON-LD `streetAddress` at the bottom of `index.html`. |
| 3 | **The "99.9% of germs and bacteria" and "up to 20% off" claims** are taken from the owner's own flyer. | The site repeats them as fact. The owner should be comfortable standing behind both, and the discount terms (`offer.note`) are an assumption: *one per household or vehicle*. |
| 4 | **No email address anywhere.** | The listing publishes none, so the site offers phone and WhatsApp only. If there is a business email, it belongs in the contact panel. |
| 5 | **The photography is placeholder stock** (Pexels, free for commercial use, no attribution required). | It is generic cleaning imagery, not this business. Real photos of the crew, the van and actual before/after jobs will convert far better. Drop replacements into `assets/img/` using the same filenames. |

Two smaller notes:

- The **logo is a vector redraw**, not the owner's original file. It follows
  the real badge closely — the oval with its navy ring and gold sweep, the
  Dubai skyline in gold with the Burj Al Arab and Burj Khalifa readable, the
  cream sofa with navy cushions, the bed, the rolled carpet, and the steam wand
  throwing foam — but the original is a raster illustration with photographic
  shading, and that cannot be reproduced exactly by hand in SVG.
  **If the owner sends the original PNG or AI file this is a one-line swap:**
  save it as `assets/logo.png` and point the three `<img src="assets/logo.svg">`
  in `index.html` at it. Nothing else changes.
- The **brand name** is written as *Hydra Steam Foam* throughout (from the
  logo). The Google listing is titled *HYDRA STEAM UPHOLSTERY Cleaning
  services*; that spelling is preserved in the JSON-LD `alternateName` so
  search engines connect the two.

---

## Running it

Just open `index.html`. To serve it locally instead:

```bash
python3 -m http.server 4178 --directory "hydra-steam-foam"
```

Then visit <http://localhost:4178>. You can force a language with `?lang=ar`
or `?lang=en`.

---

## What's in the box

| Path | What it is |
| --- | --- |
| `index.html` | The whole page. Text is **generated** from `js/i18n.js` — see below. |
| `js/i18n.js` | Every visible string, in English and Arabic. The single source of truth. |
| `js/main.js` | Theme, language/RTL, mobile drawer, scroll reveal, live "open now" state, WhatsApp form. **Phone numbers live in the `BIZ` block and opening hours in `HOURS`, both at the top.** |
| `css/style.css` | Design system, reskinned from the owner's flyer and banner. Light and dark themes, full RTL support. |
| `css/fonts.css` | Self-hosted variable font faces. No Google Fonts request at runtime. |
| `assets/logo.svg` | The Hydra badge, rebuilt as vector. Also `assets/favicon.svg`. |
| `assets/icons.svg` | Icon sprite (Phosphor, MIT + Simple Icons, CC0). Source for `tools/inline-icons.py`. |
| `assets/img/` | Photography — **all placeholder stock, see above.** |
| `tools/sync-i18n.py` | Regenerates the page text from the dictionary and audits both languages. |
| `tools/inline-icons.py` | Re-inlines the icon sprite into `index.html`. |

### Features

- **Two languages**: English and Arabic, with full RTL mirroring. The layout
  uses CSS logical properties, so the page flips direction without a second
  stylesheet.
- **Two themes**: light and dark. Follows the visitor's OS setting by default;
  the toggle overrides it and the choice is remembered.
- **Live "open now" line** in the hero, computed in Dubai time (UTC+4) so a
  visitor browsing from another country sees the business's state rather than
  their own. Driven by `HOURS` in `js/main.js`, currently `open24: true`.
- **WhatsApp booking form**: the form does not post anywhere. It composes a
  message from the fields and opens WhatsApp with everything pre-written, in
  whichever language the visitor is using.
- **Accessible**: AA contrast verified by script on every text style against
  every surface it sits on, in both themes (88 pairs, all ≥ 4.5:1);
  keyboard-navigable menu with a focus trap; honours `prefers-reduced-motion`.
- **SEO**: `HomeAndConstructionBusiness` structured data with the real NAP
  details and service list, a separate `FAQPage` block, Open Graph tags, and an
  areas-served section covering the Dubai neighbourhoods people actually search.

---

## Editing

| What | Where |
| --- | --- |
| Phone, WhatsApp, coordinates | `js/main.js`, the `BIZ` object at the top |
| Opening hours | `js/main.js`, the `HOURS` object — **and** the wording in `js/i18n.js` (`h.*`, `hero.open.*`, `i.hours.v`) **and** the `openingHoursSpecification` in the JSON-LD block at the bottom of `index.html` |
| All visible text, both languages | `js/i18n.js` |
| Colours, spacing, typography | `css/style.css`, the token block at the top |
| Photos | `assets/img/` |
| Icons | `assets/icons.svg`, then run `python3 tools/inline-icons.py` |

### The text is generated, not hand-edited

`js/main.js` overwrites every `[data-i18n]` element on load, so any fallback
text left in the HTML that disagrees with the dictionary is **invisible in a
browser** and can sit there wrong indefinitely. Rather than keeping the two in
sync by hand, the HTML is derived from the dictionary:

```bash
python3 tools/sync-i18n.py --write
```

Run it after any wording change. Without `--write` it only reports. It also
audits the two locales against each other, so a key added to English and
forgotten in Arabic is caught rather than silently falling back.

### The icon sprite is inlined

`assets/icons.svg` is inlined into `index.html` between the `<!--SPRITE:START-->`
and `<!--SPRITE:END-->` markers, because an external `<use href="file.svg#id">`
is blocked by browsers under `file://` — and this folder may well be handed to
the client and opened by double-clicking. After editing the sprite:

```bash
python3 tools/inline-icons.py
```

---

## Things worth knowing if you pick this up later

- **Do not name a form control `item`.** `HTMLFormControlsCollection` exposes
  its own `item()` method under that key, so `form.elements.item` hands back
  the function instead of the `<select>`, and the submit handler throws on
  every submission in every browser. The service picker is named `service` for
  this reason.
- **Phone numbers are pinned LTR.** In Arabic, without `unicode-bidi: isolate`,
  each space-separated digit group is its own bidi run and the runs get ordered
  right-to-left, so `056 779 4638` renders as `4638 779 056` — plausible enough
  to misdial from, and invisible if you only ever check the English view.
- **Gold is decorative on light.** Brand gold `#c9a227` is a 2.27:1 colour on
  the light background, so gold-coloured *text* uses `--gold-ink`, a deep
  bronze. On dark, both tokens are the metal. Gold type is only ever set on
  navy, which is where the flyer puts it too.
- **The gold diamond is a data-URI SVG, not crossed gradients.** Two 45°
  linear-gradient stripes overlaid draw an "×", not a filled rhombus. The
  colour rides on a `--diamond` custom property so each theme supplies its
  own gold without duplicating markup.
- **The service card photos take their ratio from the `<img>`, not the
  wrapper.** As a column flex item the wrapper has an indefinite height, so a
  percentage height on the image resolved to auto and the intrinsic ratio won —
  giving four cards four different photo heights.
- **The coordinates** (25.1919375, 55.2844375) are decoded from the plus code
  `57RM+QQ Dubai` on the Google listing. The "Get directions" button uses the
  listing's `place_id` instead, so it resolves exactly regardless.

---

## Credits

- Photography: [Pexels](https://www.pexels.com) — free for commercial use, no
  attribution required. Placeholders; see the sign-off list above.
- Icons: [Phosphor Icons](https://phosphoricons.com) (MIT),
  [Simple Icons](https://simpleicons.org) (CC0).
- Type: Sora, Plus Jakarta Sans, Alexandria and Playfair Display, all SIL
  Open Font License, self-hosted as variable subsets.
