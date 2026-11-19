# LCARS theme — handover for the next agent

> 中文摘要：这是 `dsh-theme-lcars` 插件的交接文档。宿主半边 `index.js` 只提供四个可持久化的开关（用 DSH 自带的 schemastery 建 Config）；浏览器半边 `client.js`
> 负责全部视觉：一层 `theme.overrideTokens` 令牌 + 一张生成的样式表 + 两个槽位组件（底部常驻拖尾、设置行）。改样式的工作几乎全部在 `client.js` 的
> `buildStylesheet()` 里；改完必须同时把 `BUILD_MARKER` 与 `package.json` 的 `version` 加一版，然后跑 `test/check.mjs` 与 `test/host-check.mjs`。
> 验证只能靠用户在真实页面截图（无浏览器控制），因此每个像素级的改动都要说明自己没验证到的部分。

Everything below is what you need to continue this theme without re-deriving it from
a 1900-line `client.js`.

---

## 1. What this package is

| Fact | Value |
| --- | --- |
| Package | `dsh-theme-lcars` (workspace dir `dsh-theme-lcars/`) |
| Kind | DSH **bundle**: `package.json` declares `dsh.bundle.patch` **and** `dsh.client` |
| Host half | `index.js` — exports `Config` (4 volatile fields) and a no-op `apply()` |
| Browser half | `client.js` — one module-loader factory `{ name, inject, apply }` |
| Entries | patch row id `theme-lcars` (also the Config namespace / `ctx.configForms` key) |
| Current version | `1.63.4` in `package.json` **and** `lcars-build/1.63.4` in `client.js` |
| Relation to DSH | add-on only: it edits no profile file, registers no Host service, and adds two Client slots |

Installed layout (this machine): the package lives at
`D:\Desktop\GTA ALL\DS House\dsh-theme-lcars`, and the profile links it at
`C:\Users\zys06\.dsh\profiles\desktop\node_modules\dsh-theme-lcars`.

## 2. Install / reload rules (respect these)

* **Client-only change** (`client.js`, `locale/*.json`, `docs/*`, `icon.svg`): the page
  loads the current file on **refresh**. If the stylesheet marker does not change,
  you are looking at a stale page.
* **Host change** (`index.js`, `package.json` `dsh`/`exports`): requires disabling and
  re-enabling the plugin row (`plugin_manager` `set_plugin`, or Plugins UI) because the
  Host module is imported once per process.
* Never edit `~/.dsh/profiles/**` by hand; the profile's patch is generated from the
  bundle patch plus the row's stored config.
* Verification reality: there is **no browser control** in this environment. Offline
  harnesses (section 10) prove the sheet compiles and stays consistent; the rendered
  look is confirmed only by the user's screenshots. Say so in every report.

## 3. File map

| Path | Role |
| --- | --- |
| `index.js` | Host half: `PALETTES`, `DEFAULT_PALETTE`, `Config`, `apply()` |
| `client.js` | Browser half: tokens, stylesheet builder, components, teardown |
| `cordis.patch.yml` | Inserts the `theme-lcars` row |
| `locale/en.json`, `locale/zh.json` | `meta.title`, `meta.description`, `meta.detail` |
| `docs/DETAIL.md`, `docs/DETAIL.zh.md`, `docs/preview.svg` | Market detail page (one image, no text) |
| `docs/HANDOVER.md` | This document |
| `icon.svg` | Plugin icon (408 B, hand-written geometric mark) |
| `fonts/LCARSGTJ3.woff2` | Provenance copy of the embedded wordmark face |
| `design/proposal.png`, `design/tools/mockup.py` | Historical design mockup + its Pillow generator (not shipped) |
| `test/check.mjs` | Offline client harness (~100 assertions) |
| `test/host-check.mjs` | Host harness: imports `index.js` **without** `DSH_*` env vars |
| `test/tools/dump-stylesheet.mjs` | Writes the generated sheet to a file for review |

## 4. Host half (`index.js`)

* Builds `Config` from **DSH's own schemastery copy**, resolved from real process facts
  (`process.resourcesPath`, `process.execPath`, `process.argv[1]`, `import.meta.url`),
  because the `DSH_*` variables a model shell sees are absent in the Host process.
  The loader and the Config inspect provider brand-check with
  `Symbol.for('schemastery')`, so the resolved copy is accepted.
* If resolution fails, `Config` stays `undefined` and only preference persistence
  degrades; the browser half falls back to its documented defaults.
* Fields, all `.volatile()` so a switch applies to the open page:

  | Field | Type | Default | Meaning |
  | --- | --- | --- | --- |
  | `palette` | union of `blueprint`, `tng`, `classic`, `early`, `nemesis` | `blueprint` | colour series |
  | `surface` | union `console`, `auto` | `console` | black ship console vs follow Appearance |
  | `chrome` | boolean | `true` | LCARS blocks / frame / condensed face |
  | `readout` | boolean | `true` | stardate chip in the bottom tail |

## 5. Browser half (`client.js`) — the parts that matter

### 5.1 Lifecycle

`apply(ctx)` resolves `theme`, `slots`, `locale`, `configForms` from `ctx.get(...)`,
then:

1. **Claim guard** — a `Symbol.for`-style claim on the page so a second mount is a
   no-op and a stale build is detectable by its `lcars-build/…` marker.
2. **Tokens** — `theme.overrideTokens(TOKEN_SOURCE, tokenOverrides())`.
3. **Theme registration** — `theme.register({ id: 'lcars', colorScheme: 'dark' })` and
   point the preference at it for the console surface; a stylesheet fallback
   (`body[data-lcars][data-lcars-console]`) paints the same night variables if the
   theme service refuses.
4. **Stylesheet** — one `<style data-lcars>`-ish node with the generated CSS.
5. **Components** — two slot registrations (below).
6. **Measurements** — `measureEndRows()` publishes pixel values as CSS variables.
7. **Teardown** — every subscription returns a cleanup; disposal removes the sheet, the
   attributes (`data-lcars`, `data-lcars-chrome`, `data-lcars-console`, palette attr),
   the caption-menu skin, and releases the page claim.

### 5.2 Slots

| Slot | Registration | What |
| --- | --- | --- |
| `shell.overlay` | `{ id: 'lcars-tail', order: 60 }` | `TailBar`: the frame-wide bottom bar (band + grey readout box). The overlay layer is outside every scroll container, so the tail stays put while the conversation scrolls. |
| `settings.general.item` | `{ id: 'lcars', order: 12 }` | `SettingsRow`: 5 palette chips + 3 switches, writing through `ctx.configForms` |

### 5.3 Functions worth knowing

| Function | Job |
| --- | --- |
| `schemeDeclarations(SCHEME_*)` | emits `--lcars-*` palette variables for a scheme (`light` / `dark`) |
| `paletteDeclarations(PALETTES[id])` | emits `--lcars-side-<role>` + `--lcars-side-on-<role>` for the active series |
| `lettering(fill)` | picks black vs white lettering for a fill by WCAG contrast (the rule the harness re-checks) |
| `sideDeclarations()` | the seven navigation roles: `frame`, `logo`, `primary`, `row`, `workspace`, `session`, `selected` |
| `tokenOverrides()` | the `--dsw-alias-* → var(--lcars-*)` map handed to `overrideTokens` |
| `buildStylesheet()` | the whole sheet, section by section, as concatenated strings |
| `normalizePrefs()` | clamps stored prefs to known values |
| `stardate()` / `clock()` | readout formatting (`LCARS 47`, stardate, `HH:MM`) |
| `markHeaderChips()` | sets `data-lcars-chip="1|2"` on the session header's action triggers (their hashed classes differ per build, so the theme marks them itself) |
| `measureEndRows()` | publishes measured halves/edges (table in 5.5) |
| `TailBar`, `Readout`, `SettingsRow` | the React components (React via `require('react')`) |

### 5.4 Token architecture

Two layers, deliberately kept separate:

* `--lcars-*` — the theme's own palette (per scheme + per series). Everything the theme
  paints reads these.
* `--dsw-alias-*` / `--dsw-*` — the app's tokens, **mapped onto** `--lcars-*` in
  `tokenOverrides()` so the shipped components inherit the LCARS colours.

`lettering()` enforces readable block lettering: white only if the fill clears 4.5:1,
otherwise near-black. Do not add a fill colour without letting `lettering()` decide.

### 5.5 Runtime measurements → CSS variables

`measureEndRows()` (runs on mount, on the caption-menu observer, and after some
mutations) publishes:

| Variable | Source | Used by |
| --- | --- | --- |
| `--lcars-brand-half` | `_logoRow` measured height / 2 | brand block's round corner |
| `--lcars-foot-half` | `_footArea` measured height / 2 | foot block's corner + notch |
| `--lcars-row-half` | `_sessionRow` measured height / 2 | session pill ends |
| `--lcars-sidebar-w` | `_sidebarCol` width | fallbacks |
| `--lcars-tail-left` | `_footArea` right edge (viewport) | tail band anchor |
| `--lcars-stardate-text` | readout string | readout width reserve |

Because the app clamps `border-radius` per box, **halves are published in px** instead
of `999px`: a big radius next to a small one would squash the small one.

### 5.6 Fonts (current state)

* `@font-face { font-family: 'LCARS GTJ3'; src: url(data:font/woff2;base64,…) }` is
  embedded at the top of the sheet (16 KB file → ~22 KB base64). `fonts/LCARSGTJ3.woff2`
  is the same file kept for provenance.
* `body { --lcars-font-ui: 'LCARS GTJ3', 'Glow Sans SC Condensed Bold', 'Glow Sans SC
  Condensed', 'Glow Sans SC Compressed', 'Microsoft YaHei', 'Segoe UI', system-ui,
  sans-serif }` — the console face as **one variable**. It is applied to the **chrome
  only**, never to the whole window: the browser resolves per glyph, so Latin uses
  LCARS GTJ3 and Han falls through to Glow Sans.
* Where `--lcars-font-ui` lands: the **navigation column** (directly, on `_sidebarCol`),
  **`_titleRow`** (directly — the session title/session tabs in the panel top bar), the
  session-header rule
  `body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"])`
  (which sets `--dsw-font-family`, `font-family` and `text-transform: uppercase` on the
  bar, so the preset label, tabs and action chips inherit it), the **composer dock row**
  `[data-composer-dock]` (token speed, cache hit, context meter — it is a sibling of the
  composer card, so the input keeps the app font), the caption-menu shadow skin
  (`var(--lcars-font-ui, …)`), the **tail readout** (`.lcars-readout`) and the brand
  wordmark (explicit `LCARS GTJ3`).
  **The conversation surface — transcript, tool output, composer card — is deliberately
  left on the app's own `--dsw-font-family` (the system stack from `base.css`).** Do not
  put a window-wide `--dsw-font-family` override back: the user asked for that split.
* **LCARS GTJ3 is caps-only** (A-Z, digits, punctuation — no lowercase), so `_sidebarCol`,
  the session header and the composer dock row also set `text-transform: uppercase`;
  without it every lowercase letter of a label ("DS House", "DeepSeek", "tok/s") would be
  drawn by the next family mid-word.
* **U+2026 is a star in the embedded face**, and the app draws the truncation ellipsis of
  a title with that title's own font. A later `@font-face` of the same family with
  `unicode-range: U+2026` and `src: local('Segoe UI'), local('Microsoft YaHei'),
  local('Arial')` claims only that code point and keeps a normal "…" in labels; if none
  of the local faces resolve, the glyph falls through to the next family (still normal).
  Keep it after the embedded face: the later face wins for the overlapping range.
* `--lcars-font-display` / `--lcars-font-readout` are the theme's **design** tokens
  (Oswald/Bahnschrift…, ending in `var(--lcars-font-ui)`) — the display stack survives only
  as the brand fallback (`--dsw-font-family-brand`, `_logoRow::before`), the readout stack
  is currently unused. The sidebar's stardate filler panel **does** use `--lcars-font-ui`
  (measured at 11px/0.14em: its longest line is 196.4px in LCARS GTJ3 vs 210px in
  Bahnschrift, and the panel's inner width is ~217px, so it fits without wrapping).
* The tail readout's `LCARS 47` chip sets `font-weight: 400`: the face ships a single
  weight and a synthetic bold smears at 10px; the chip's fill already separates it from
  the readings.
* The **wordmark** `DEEPSEEK` is `_logoRow::before` (absolute, right 8px, bottom 0,
  `pointer-events: none` so clicks reach the shipped brand button). `_brandIdentity`
  is hidden.

### 5.7 Current geometry (the numbers the user tuned)

| Element | Value |
| --- | --- |
| Sidebar column | flat black, no outer band; `padding: 0`; square corners |
| Navigation rows (new session, plugins, tasks, more, workspace, sessions) | `--lcars-row-line: calc(22px * var(--lcars-block-scale, 1))` = **19.8px** at the shipped `0.9`; `height: calc(var(--lcars-row-line, 22px) * 2)` = **39.6px**, `padding-top: var(--lcars-row-line)` (label on the lower line), `line-height: var(--lcars-row-line)` so the label fits that shorter line, `padding-bottom: 0`, `padding-right: 8px`, right-aligned, icons hidden |
| Row gap | 8px (one-sided `margin-bottom`, `_panelList` gap) |
| Brand block | `height: calc(var(--lcars-brand-word-line) * 2)` = **54px** at `0.9` (`--lcars-brand-word-size` / `--lcars-brand-word-line` = `calc(30px * var(--lcars-block-scale, 1))`); `border-radius: var(--lcars-brand-half) 2px 2px 2px` |
| Foot block | `border-radius: 2px 2px 0 var(--lcars-foot-half)` + `::after` notch |
| Header | `[class*="_header"]:has([class*="_titleRow"])` = 40px tall, transparent, boxes flush to the panel edge |
| Header chips | `[data-lcars-chip]`: 40px tall, `--lcars-side-primary`, 2px corners, 8px gaps |
| Tail | `.lcars-tail` fixed overlay 32px tall; bar `left: var(--lcars-tail-left)`, `bottom: 6px`, 156×26, `0 2px 2px 0`; readout box 8px to its right, 26px tall, `padding: 0 14px` |
| Composer | `[data-composer-dock] { margin-bottom: 34px }` so the tail never covers it |
| Radius | **2px** everywhere except the measured half-height ends; every rounded rule sets `corner-shape: round` (the app's global `superellipse(1.5)` otherwise squashes radii) |

## 6. DSH internals this theme reaches into

The theme styles the shipped UI by **hashed class fragments** (`[class*="_panelList"]`)
and a few data attributes. On a DSH upgrade these are the first things to re-verify
(`dump-stylesheet.mjs` + a fresh screenshot). The ones in use:

`_sidebarCol`, `_root`, `_logoRow`, `_brandIdentity`, `_brandMark`, `_brandName`,
`_panelList`, `_panelEntry`, `_panelRow`, `_panelGlyph`, `_panelTitle`, `_panelUnpin`,
`_moreAnchor`, `_newSessionRow`, `_newSession`, `_newSessionContent`,
`_newSessionLabelMask`, `_newSessionShortcut`, `_footArea`, `_regionArea`,
`_sectionHeader`, `_headerActions`, `_sectionLabel`, `_projectRow`, `_projectText`,
`_folder`, `_sessionRow`, `_title`, `_time`, `_scroller`, `_composerSeat`,
`_centerCol`, `_header`, `_titleRow`, `_titleCluster`, `_crumbs`, `_headerActions`.

Data hooks: `[data-composer-dock]`, `[data-composer-card]`, `[data-windows-menu]`
(shadow root, skinned by injected CSS), `html[data-windows-titlebar]`,
`body[data-ds-dark-theme]`, `[data-sidebar-collapsed]`, and the theme's own
`body[data-lcars]`, `data-lcars-chrome`, `data-lcars-console`, `data-lcars-chip`.

App values the theme assumes: `--dsh-sidebar-inline-padding: 8px`,
`--dsh-sidebar-row-padding: 12px`, `--dsh-sidebar-paint-inset: 3px`, row
`line-height: 22px` (the theme now overrides it with the scaled `--lcars-row-line`),
header chips 40px, logo row 40px on Windows, and the app's own `--dsw-font-family`
(`dsh-client-ui-theme/src/styles/base.css`: `body { --dsw-font-family: …,
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
'Microsoft YaHei', …).` plus `body { font-family: var(--dsw-font-family, …) }`) — that
is the conversation font the theme must leave alone.

## 7. Editing workflow (this is where past agents lost time)

1. Read the rule you are about to change (the sheet is generated, so the target is a
   JS string inside `buildStylesheet()`, not the CSS you see in devtools).
2. Patch with a **one-off script** that asserts a single exact match and aborts
   without writing on any mismatch — see the pattern used throughout this project:
   build needles with `String.fromCharCode(39|34|92)` instead of typing escaped
   quotes, and always keep `+ '}\n'` bookkeeping in mind (the harness fails on
   unbalanced braces).
3. Bump **both** `BUILD_MARKER` (`lcars-build/x.y.z`) and `package.json` `version` in
   the same change. The marker is the only way to tell a reloaded page from a stale one.
4. Run the harnesses (section 10) and `dump-stylesheet.mjs`; grep the generated sheet
   for the rule you just wrote before reporting.
5. Report what is verified offline vs what only the user's screenshot can confirm.

Escaping pitfalls that already bit this project:

* The builder is a chain of single-quoted JS strings; a CSS line containing `'` must be
  written `\'`, so a naive search for `--dsw-font-family: '` never matches.
* Multi-selector rules are emitted as consecutive `+ SIDEBAR + ' …,'` lines; the rule's
  "start" is the last selector line, so removal code must walk back over the
  preceding selector lines.
* A duplicated `}` from a hand-inserted block is the most common breakage; the harness
  catches it, so never skip it.

## 8. Theming contract (what the user expects)

* Black console, no blue band around the sidebar; colour lives in the blocks.
* Every navigation block: **39.6px** (`0.9` of 44px, `--lcars-block-scale` on the themed body), label on the lower of two 19.8px lines, right-aligned,
  8px from the right edge, no icons, 8px gaps.
* Brand block 54px (same `0.9` factor) with the lowercase-hidden `DEEPSEEK` wordmark bottom-right.
* Bottom tail fixed to the window edge, 6px breathing room, readout box 8px to its right.
* Header boxes flush left, 40px tall, 8px gaps, blue/selected/pale fills.
* 2px corners except the measured half-height ends; `corner-shape: round` everywhere.
* LCARS GTJ3 for Latin and Glow Sans SC Condensed Bold for Han on the **chrome**
  (`--lcars-font-ui`: navigation column, panel top bar and chips, composer dock row,
  caption menu, tail readout); the conversation surface and the composer card keep the
  app's system font. This split is user-requested — never restore a window-wide
  `--dsw-font-family` override.
* The **navigation column, the panel top bar and the composer dock row are LCARS GTJ3 for
  Latin** (user-requested) and therefore **uppercase** (the face is caps-only, see 5.6);
  Han there is still Glow Sans, and truncation ellipses come from the U+2026 override face.

If a future request contradicts one of these, confirm with the user rather than
"fixing" silently — most of them were argued over multiple rounds.

## 9. What is unverified / risky

| Risk | Detail |
| --- | --- |
| Font licensing | `LCARSGTJ3` is a fan-made LCARS face from the user's `LCARSGTJ3.zip`; it is embedded as base64, i.e. redistributed. Glow Sans is OFL and merely referenced by family name (it must be installed on the machine). If the market rejects the embedded face: drop the `@font-face`, keep `'LCARS GTJ3'` in the stack (it resolves to the installed font, registry name `LCARSGTJ3`), or remove the face entirely and accept the Oswald fallback. |
| Hard-coded px | The two-line row base (22px), the brand's 30px line, chip height 40px, logo row 40px and header paddings are app assumptions. A DSH upgrade can shift them; the blocks would then be 2×(wrong base line) tall. Re-measure with a screenshot before changing the base lines or `--lcars-block-scale`. |
| Hashed selectors | See section 6. An upgrade may rename `_panelList` → `_abc123`; the theme then silently stops painting. `dump-stylesheet.mjs` + one screenshot detects it. |
| Shadow-root menu skin | The 应用/编辑 skin is injected once into `[data-windows-menu]`'s shadow root and only re-installed when the element appears; after an upgrade the button may lose the font. Re-toggle the plugin if the caption buttons revert. |
| Theme stacking | Another theme plugin (e.g. `dsh-theme-endfield`) injects its own token layer and sheet; two themes fight. The Endfield bundle is disabled in this profile by the user's choice. |
| No browser control | Anything pixel-specific is confirmed only by the user's screenshots. Never claim visual success from the harness alone. |

## 10. Verification harness

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
$node = $env:DSH_NODE_EXECUTABLE
$root = 'D:\Desktop\GTA ALL\DS House\dsh-theme-lcars'

# 1. client: compile, stub-apply, render components, stylesheet invariants,
#    WCAG contrast for every series in both schemes, mount/teardown/remount,
#    failed-mount claim release (~100 assertions)
& $node "$root\test\check.mjs" $root

# 2. host: import index.js with NO DSH_* variables and project the Config schema
& $node "$root\test\host-check.mjs" '<profile package dir>' '<dsh install dir>'

# 3. review the generated sheet (rule-by-rule greps)
& $node "$root\test\tools\dump-stylesheet.mjs" $root out.css
```

`test/host-check.mjs` needs the running installation, e.g.
`C:\Users\zys06\AppData\Local\Programs\DeepSeek Harness\resources\app.asar\dsh`, and
the linked profile package directory.

When you add a rule that the user argued for, add an assertion to `check.mjs` so the
next refactor cannot silently drop it (that is how the sidebar geometry survives).

## 11. Market packaging (this is already done — keep it that way)

* `package.json`: `exports` include `.`, `./client`, `./locale/*.json`, `./icon`;
  `files` lists `index.js`, `client.js`, `cordis.patch.yml`, `locale/*.json`, `docs`,
  `icon.svg`, `README.md`. `private` is **removed** so the package can be published.
* Locale `meta` blocks carry `title`, `description` (behaviour + how to reach the
  settings + limitations) and `detail` (`docs/DETAIL.md`, `docs/DETAIL.zh.md`).
* `docs/DETAIL*.md` is exactly one image line pointing at `preview.svg`; the image is a
  self-contained 640×300 SVG with no text, fonts, scripts or remote resources.
* `icon.svg` is a 408-byte geometric mark (no copied artwork).
* Build the upload artifact from the package directory:

  ```powershell
  cd 'D:\Desktop\GTA ALL\DS House\dsh-theme-lcars'
  pnpm pack        # or: npm pack  → dsh-theme-lcars-<version>.tgz
  tar -tf dsh-theme-lcars-<version>.tgz   # verify the packed list
  ```

  The tarball must contain the patch, `index.js`, `client.js`, locales, `icon.svg`,
  `docs/` and `README.md`, and must NOT contain `test/`, `design/` or `fonts/`
  (`files` already excludes them; verify anyway after changing the manifest).
* Detail-page rules that are easy to break: keep the document to **one** image line,
  keep `meta.detail` paths package-relative with `/`, and keep every declared file in
  the package.

## 12. Suggested next steps

1. Make the embedded face optional (a `Config` switch would need a Host change and a
   sheet variant; simpler: keep the face and document it).
2. Font scope is now **chrome-only** (`--lcars-font-ui`); the conversation keeps the
   app's font. If the user later wants the theme's own dialogs/rows (Settings › General ›
   LCARS theme) back in the console face, add `--lcars-font-ui` to those components — do
   not reintroduce the window-wide `--dsw-font-family` override.
3. Row density is the theme's `--lcars-block-scale` (currently `0.9`, declared in the
   `body[data-lcars][data-lcars-chrome]` rule right above the `_panelList` rule): it
   scales the two label lines *and* the brand block, so one
   number resizes every block in the column. Keep the gaps (8px) as they are unless the
   user asks for a different rhythm, and re-check that `line-height` still follows
   `--lcars-row-line` (a line box taller than the shortened content box clips the label).
4. Palette work: `PALETTES` in `index.js` must stay in sync with the browser half's
   palette map and with `locale/*.json` descriptions (all five ids are user-visible).
5. Anything touching the tail must keep the composer dock's 34px bottom margin, or the
   composer will slide under the bar again.
