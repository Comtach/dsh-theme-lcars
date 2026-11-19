# dsh-theme-lcars

An LCARS console theme for [DeepSeek Harness](https://github.com/deepseek-ai) — the
Library Computer Access/Retrieval System interface Michael Okuda designed for
*Star Trek: The Next Generation*: black console panels, a flat navigation column of
full-width colour blocks, the uppercase **DEEPSEEK** brand block, compact rounded
session-header chips, a framed conversation surface, and a persistent bottom bar with a
pale stardate + clock readout.

> 把 DeepSeek Harness 的网页界面换成 LCARS 控制台主题：纯黑导航列、通栏 DEEPSEEK 品牌块、
> 圆角会话标题块、被蓝框圈住并裁切滚动的对话区，以及底部常驻的浅色星历读数框。支持五套配色、
> 逐块自定义颜色、侧栏字体切换，全部保存在 profile 里。

![The LCARS theme in the DeepSeek Harness web interface](docs/preview.svg)

A web-only theme plugin: it ships a Host half with the saved preferences and a browser
half with the whole look (token layer + one generated stylesheet + a few small
components). Nothing else about the app changes.

## Features

| Part | What it does |
| --- | --- |
| Navigation column | Flat black column; every row is a two-label-line colour block (0.9 density, 39.6px), right-aligned labels, 8px gaps, hidden trailing icons, a pill-shaped right end |
| Brand block | Full-width block carrying the uppercase `DEEPSEEK` wordmark in the LCARS face, with the reference's large top-left arc |
| Session header | Session title, agent mode, subagent and background-task status as separate rounded blocks (25px tall, 8px corners), sitting 5px under the conversation frame |
| Conversation frame | A 2px console outline with 4px corners around the conversation surface; the transcript is clipped to the same box, so scrolling text disappears at the frame instead of running over it |
| Bottom bar | A 184px frame band anchored on the column edge plus a pale readout box showing the stardate and the clock |
| Settings page | **Settings › LCARS theme** with five colour series, seven per-block colours, the sidebar face and three console switches — all saved in your profile |

The black console is the default: the browser half registers a dark theme and points the
appearance preference at it, so the app switches its own dark component styles (icons,
code themes, native chrome) instead of only being repainted. Turn *Black console* off to
follow Appearance, where light is a warm PADD-daylight variant of the same series.

## Install

The package is a DSH bundle (`dsh.bundle.patch` inserts the `theme-lcars` row). It needs
a DSH build that projects a plugin's `Config` schema to the browser (`ctx.configForms`,
DSH ≥ 0.2); on older builds the theme still paints, but the settings page cannot save.

1. **From a release tarball or a checkout** — in DeepSeek Harness open
   **Plugins › Add plugin** and pick the package directory (the folder containing
   `package.json`), or install that directory from the agent side with
   `plugin_manager` `install_bundle`. A tarball unpacks to the same directory.
2. **From the plugin market** (when published): install it from the market entry, then
   open **Settings › LCARS theme** to pick a colour series.
3. Reload the page once after a manual re-install, so the browser loads the new
   `client.js`.

## Settings

Everything lives on its own page, **Settings › LCARS theme**:

| Field | Default | Effect |
| --- | --- | --- |
| `palette` | `blueprint` | Colour series: `blueprint` (blue console), `tng` (2369), `classic` (2375), `early` (2357), `nemesis` (2379) |
| `colorFrame` … `colorSelected` | `''` | Per-block colour overrides (`#rrggbb`): frame, logo, primary, row, workspace, session, selected. Empty means “use the palette” |
| `sidebarFont` | `lcars` | Navigation face: `lcars` (LCARS GTJ3, uppercase), `condensed` (Oswald/Bahnschrift), `system` (the app's own font) |
| `surface` | `console` | `console` = black ship console (takes over the appearance preference); `auto` = follow Appearance |
| `chrome` | `true` | The console chrome: framed conversation area, block styling, console faces |
| `readout` | `true` | The stardate + clock readout box in the bottom bar |

Values are written through DSH's own config form (`ctx.configForms`, namespace
`theme-lcars`) and stored in the profile by the settings service — no `localStorage`, so
the Desktop host's random port per launch cannot reset them. All fields are
`.volatile()`: a change applies in the open page without a plugin restart.

### Palette roles

The column paints seven named roles, each with lettering that clears WCAG AA on its
fill; the `blueprint` series is the reference console's:

| Role | Blueprint | Element |
| --- | --- | --- |
| `frame` | status blue `#3686ff` | header blocks, conversation frame, bottom band |
| `logo` | status blue `#3686ff` | DEEPSEEK brand block |
| `primary` | trajectory slate `#46606d` | New session |
| `row` | scan blue `#3686ff` | Plugins / Automations / More and the profile block |
| `workspace` | initiate blue `#3686ff` | workspace row |
| `session` | distance blue `#0947e8` | session rows |
| `selected` | operations pale `#8bdbfd` | current session and active row |

## Fonts

- **LCARS GTJ3** for Latin console text, embedded as a `woff2` data URI in the generated
  stylesheet (a provenance copy is in `fonts/LCARSGTJ3.woff2`). It is an uppercase display
  face, so the console chrome uppercases its labels; its `…` glyph is a star, so a small
  `@font-face` claims only `U+2026` and takes a normal ellipsis from a local system face.
- **Glow Sans SC Condensed Bold** for Han, referenced by family name — install it locally
  if you want the console to use it for Chinese text.
- The themes faces are applied to the **chrome only** (navigation column, panel top bar
  and chips, composer stats row, caption menu, bottom readout). The conversation surface,
  the composer card and code blocks keep the app's own fonts.

The embedded LCARS face is redistributed with the package; see
[`LICENSE`](LICENSE) for the third-party asset notes. If that is a problem for your
build, drop the `@font-face`: the stack then resolves the face from the system or falls
back to Oswald.

## Development

Requirements: the Node that ships with DSH (any Node ≥ 18 works for the offline
harnesses) and, for packaging, pnpm.

```powershell
# Style + behaviour harness: compiles the bundle, runs apply() against stub services,
# renders both components, checks the generated stylesheet (balanced, every palette
# variable declared), checks WCAG contrast over the palette pairs, and exercises the
# duplicate-mount / teardown / remount / failed-mount paths.
$env:ELECTRON_RUN_AS_NODE = '1'
& $env:DSH_NODE_EXECUTABLE test\check.mjs .

# Optional Host check: imports index.js without DSH_* variables (as the real Host
# process does) and projects the Config schema with DSH's own projector.
& $env:DSH_NODE_EXECUTABLE test\host-check.mjs <profile package dir> <dsh install dir>

# Dump the generated stylesheet for review.
& $env:DSH_NODE_EXECUTABLE test\tools\dump-stylesheet.mjs . out.css
```

Project rules: every client change bumps `BUILD_MARKER` in `client.js` **and** the
`package.json` version; the sheet carries an `lcars-build/<version>` marker so a stale
page can be told apart from a fresh build.

## Packaging

The directory is a publishable bundle — no `private` flag, exports for the client, the
locales and the icon, and a `files` allowlist that keeps tests, fonts and design sources
out of the tarball:

```powershell
pnpm pack        # → dsh-theme-lcars-<version>.tgz
tar -tf dsh-theme-lcars-<version>.tgz
```

The tarball ships `index.js`, `client.js`, `cordis.patch.yml`, `locale/*.json`,
`docs/DETAIL*.md` with the preview image, `icon.svg`, `README.md` and `LICENSE`.

## Notes and limits

- **Web interface only.** Nothing in the app's layout, data or behaviour is patched; the
  theme is one stylesheet plus a small overlay (bottom bar + conversation frame) and the
  settings page.
- **One theme at a time.** DSH stacks theme token layers and every theme plugin injects
  its own sheet, so another theme plugin enabled at the same time competes with this one.
- The navigation column paints on the sidebar grid track only; it is hidden while the
  sidebar is collapsed or shown as a narrow-window drawer.
- The conversation frame and the transcript clip are measured at runtime
  (`ResizeObserver` + DOM passes), so they follow window resizes, sidebar width changes
  and header re-renders.
- LCARS, Star Trek and related marks belong to CBS/Paramount. This is a fan theme and
  ships no Star Trek artwork beyond generic geometric shapes; palette and shape
  references come from the [LCARS_CSS_Grid](https://github.com/hmt3design/LCARS_CSS_Grid)
  template and its documented LCARS sources.

## License

MIT for the code — see [`LICENSE`](LICENSE) for the third-party asset and trademark
notes.
