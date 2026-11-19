/**
 * dsh-theme-lcars — browser half (client bundle).
 *
 * The interface of the LCARS computer system as designed by Michael Okuda for
 * Star Trek: The Next Generation — black panels, amber readouts, pill-shaped
 * colour blocks, a condensed uppercase display face, and a stardate strip
 * under the composer.
 *
 * Shapes, palettes and proportions are taken from the LCARS_CSS_Grid template
 * (endcap / elbow / button_1 sprites and the 2357-2379 colour series, itself
 * built on Michael Okuda's LCARS and the LCARS 47 shape specification).
 *
 * Four parts, all of them reversible:
 *
 *   1) `theme.overrideTokens` — one token layer whose values are `var()`
 *      references into the palette variables this stylesheet declares. That is
 *      what makes a palette switch a single attribute write instead of a
 *      re-registration, and why light/dark still work: the surface variables
 *      are redefined under `body[data-ds-dark-theme]`, so the same token layer
 *      resolves to the night palette or to the PADD-daylight palette.
 *   2) One injected stylesheet — palette variables, the LCARS chrome (left
 *      rail, pill rows, composer accent, condensed face) and the two
 *      components this bundle renders.
 *   3) A stardate readout under the composer (`conversation.composer.dock`,
 *      a list slot: additive, never shadows shipped UI).
 *   4) The console itself: a dark theme registered as `lcars` and made the
 *      preference while `surface` is `console`, so the app switches its own
 *      dark component styles instead of only being repainted.
 *   5) One settings page of its own (Settings › LCARS theme, `settings.section`)
 *      that writes the durable palette, block colours, sidebar face and chrome
 *      switches through `ctx.configForms`.
 *
 * Everything the run owns is released through `ctx.effect`, including the
 * page-level idempotency claim: this bundle can be mounted twice on one boot
 * (boot loader + cordis composition) and can be swapped in place by the client
 * module loader without a dispose, so a build marker — not a bare boolean —
 * decides whether a second mount is a duplicate or a stale build.
 */
window.__ModuleLoader__.load({
  id: 'dsh-theme-lcars',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports

    /** Bump on every stylesheet change: it identifies which build owns the sheet. */
    const BUILD_MARKER = 'lcars-build/1.64.58'
    /** Page-level claim written by the running build (see module doc). */
    const CLAIM = '__dshThemeLcarsBuild'
    /** `data-plugin` value of this bundle's stylesheet node. */
    const SHEET_ATTR = 'dsh-theme-lcars'
    /** Bundle id: the entry id of `cordis.patch.yml`, hence the Config namespace. */
    const ENTRY_ID = 'theme-lcars'
    /** Locale namespace of the copy this bundle registers. */
    const NS = 'theme.lcars'
    /** Theme override layer identity (one layer per source). */
    const TOKEN_SOURCE = 'lcars-theme'
    /** Id of the dark console registered in the theme registry. */
    const THEME_ID = 'lcars'

    /* ------------------------------------------------------------------ *
     * Palettes
     *
     * `dark` is the broadcast palette: the series colours are used at full
     * brightness against black. `light` darkens the same hues just enough to
     * hold contrast on the warm paper background, so the PADD-daylight variant
     * still reads as LCARS rather than as a pastel theme. Each series carries
     * an ink colour because the 2379 (Nemesis) palette is blue, not peach.
     * ------------------------------------------------------------------ */
    const PALETTES = {
      // Sampled from the supplied blue console screenshot: status/scan/initiate
      // blue, trajectory slate, distance blue, operations pale, location orange,
      // gold readout numerals. The navigation column is assigned per role.
      blueprint: {
        dark: {
          accent: '#3686ff', 'accent-2': '#8bdbfd', 'accent-3': '#a09858', 'accent-4': '#0947e8',
          'accent-bright': '#3686ff',
          'block-1': '#d36010', 'block-2': '#3686ff', 'block-3': '#8bdbfd', 'block-4': '#0947e8',
          ink: '#e6f0ff', inkBright: '#ffffff', inkDim: '#a8c4e6', inkFaint: '#6f8fb8',
        },
        light: {
          accent: '#1c5fd0', 'accent-2': '#24518f', 'accent-3': '#6b6220', 'accent-4': '#1236c0',
          'accent-bright': '#3686ff',
          'block-1': '#d36010', 'block-2': '#3686ff', 'block-3': '#8bdbfd', 'block-4': '#0947e8',
        },
        sidebar: {
          frame: '#3686ff',
          logo: '#3686ff',
          primary: '#46606d',
          row: '#3686ff',
          workspace: '#3686ff',
          session: '#0947e8',
          selected: '#8bdbfd',
          readout: '#a09858',
        },
      },
      tng: {
        dark: {
          accent: '#ff9900', 'accent-2': '#ff9966', 'accent-3': '#cc99cc', 'accent-4': '#9999ff',
          'accent-bright': '#ff9900',
          'block-1': '#cc6666', 'block-2': '#ffcc66', 'block-3': '#cc99cc', 'block-4': '#9999cc',
          ink: '#ffcc99', inkBright: '#ffe6cf', inkDim: '#d29a68',
        },
        light: {
          accent: '#a85500', 'accent-2': '#a8452c', 'accent-3': '#7d5a94', 'accent-4': '#3f55a5',
          'accent-bright': '#ff9900',
          'block-1': '#cc6666', 'block-2': '#ffcc66', 'block-3': '#cc99cc', 'block-4': '#9999cc',
        },
      },
      classic: {
        dark: {
          accent: '#ee9955', 'accent-2': '#dd6644', 'accent-3': '#9977aa', 'accent-4': '#6688cc',
          'accent-bright': '#ee9955',
          'block-1': '#dd6644', 'block-2': '#ee9955', 'block-3': '#9977aa', 'block-4': '#6688cc',
          ink: '#ffcc99', inkBright: '#ffe6cf', inkDim: '#cd9670',
        },
        light: {
          accent: '#a24d16', 'accent-2': '#8f3b22', 'accent-3': '#6a4a7d', 'accent-4': '#3d5c99',
          'accent-bright': '#ee9955',
          'block-1': '#dd6644', 'block-2': '#ee9955', 'block-3': '#9977aa', 'block-4': '#6688cc',
        },
      },
      early: {
        dark: {
          accent: '#ffcc66', 'accent-2': '#ffcc99', 'accent-3': '#99ccff', 'accent-4': '#3366cc',
          'accent-bright': '#ffcc66',
          'block-1': '#ffcc66', 'block-2': '#99ccff', 'block-3': '#cc99cc', 'block-4': '#3366cc',
          ink: '#ffd9a8', inkBright: '#fff0d6', inkDim: '#cfa476',
        },
        light: {
          accent: '#8f6200', 'accent-2': '#a97a2f', 'accent-3': '#2f6f9e', 'accent-4': '#2f5ea8',
          'accent-bright': '#ffcc66',
          'block-1': '#ffcc66', 'block-2': '#99ccff', 'block-3': '#cc99cc', 'block-4': '#3366cc',
        },
      },
      nemesis: {
        dark: {
          accent: '#5599ff', 'accent-2': '#ccddff', 'accent-3': '#bbaa55', 'accent-4': '#3366ff',
          'accent-bright': '#5599ff',
          'block-1': '#5599ff', 'block-2': '#ccddff', 'block-3': '#bbaa55', 'block-4': '#3366ff',
          ink: '#ccddff', inkBright: '#e8f1ff', inkDim: '#93b3d8', inkFaint: '#5d7fa3',
        },
        light: {
          accent: '#1f5fbf', 'accent-2': '#3d6fa8', 'accent-3': '#8a7a20', 'accent-4': '#1236c0',
          'accent-bright': '#5599ff',
          'block-1': '#5599ff', 'block-2': '#ccddff', 'block-3': '#bbaa55', 'block-4': '#3366ff',
        },
      },
    }

    /** Palette ids in settings-row order. */
    const PALETTE_IDS = ['blueprint', 'tng', 'classic', 'early', 'nemesis']
    /** Palette of a profile that has never written the switch. */
    const DEFAULT_PALETTE = 'blueprint'
    /** Faces offered for the navigation column by its settings page. */
    const SIDEBAR_FONTS = ['lcars', 'condensed', 'system']
    /**
     * Solid colour blocks the settings page can recolour: the config field that
     * stores the override and the CSS role the stylesheet reads. An empty field
     * keeps the palette's value.
     */
    const COLOR_ROLES = [
      { field: 'colorFrame', role: 'frame' },
      { field: 'colorLogo', role: 'logo' },
      { field: 'colorPrimary', role: 'primary' },
      { field: 'colorRow', role: 'row' },
      { field: 'colorWorkspace', role: 'workspace' },
      { field: 'colorSession', role: 'session' },
      { field: 'colorSelected', role: 'selected' },
    ]
    /** `#rrggbb` only: the colour inputs and the stored section agree on one shape. */
    const COLOR_PATTERN = /^#[0-9a-f]{6}$/i

    /* ------------------------------------------------------------------ *
     * Surface variables, one set per colour scheme.
     *
     * These are the only literals below: the token layer, the chrome and the
     * components reference them, so both schemes and all four series are
     * resolved by CSS rather than by JavaScript.
     * ------------------------------------------------------------------ */
    const SCHEME_LIGHT = {
      'bg': '#f7f4ec',
      'layer-1': '#fffdf9',
      'layer-2': '#f0ebdf',
      'layer-3': '#e6e0d2',
      'overlay': '#fffdf9',
      'field': '#fffdf9',
      'code': '#f2ede1',
      'code-banner': '#eae4d5',
      // The navigation column is a bar of its own, not a tint of the page.
      'sidebar': '#e8e1d2',
      'menu': 'rgba(255, 253, 249, 0.94)',
      'menu-header': 'rgba(240, 235, 223, 0.97)',
      'ink': '#14100a',
      'ink-bright': '#0a0704',
      'ink-dim': '#57472f',
      'ink-faint': '#7a6852',
      'ink-inverse': '#fffdf9',
      // Lettering on a chrome bar. Chrome bars are the bright broadcast
      // colours in BOTH schemes, so the lettering is always near-black.
      'on-accent': '#fffdf9',
      'chrome': 'var(--lcars-accent-bright)',
      'on-chrome': '#0a0a0a',
      'line-1': 'rgba(20, 16, 10, 0.14)',
      'line-2': 'rgba(20, 16, 10, 0.22)',
      'line-3': 'rgba(20, 16, 10, 0.32)',
      'line-4': 'rgba(20, 16, 10, 0.42)',
      'hover': 'rgba(20, 16, 10, 0.06)',
      'hover-strong': 'rgba(20, 16, 10, 0.12)',
      'press': 'rgba(20, 16, 10, 0.18)',
      'scroll': '#bfb39a',
      'scroll-hover': '#9a8b70',
      'success': '#3f7a1e',
      'error': '#a83232',
      'warn': '#8f6200',
      'info': '#245e96',
      'done': '#6a4a8a',
    }

    const SCHEME_DARK = {
      'bg': '#000000',
      'layer-1': '#0a0a0a',
      'layer-2': '#101010',
      'layer-3': '#171717',
      'overlay': '#0c0c0c',
      'field': '#070707',
      'code': '#0a0a0a',
      'code-banner': '#141414',
      'sidebar': '#000000',
      'menu': 'rgba(12, 12, 12, 0.88)',
      'menu-header': 'rgba(22, 22, 22, 0.96)',
      'ink': '#ffcc99',
      'ink-bright': '#ffe6cf',
      'ink-dim': '#cf9160',
      'ink-faint': '#b0794a',
      'ink-inverse': '#0a0a0a',
      'on-accent': '#0a0a0a',
      'chrome': 'var(--lcars-accent-bright)',
      'on-chrome': '#0a0a0a',
      'line-1': 'rgba(255, 204, 153, 0.13)',
      'line-2': 'rgba(255, 204, 153, 0.22)',
      'line-3': 'rgba(255, 204, 153, 0.30)',
      'line-4': 'rgba(255, 204, 153, 0.42)',
      'hover': 'rgba(255, 204, 153, 0.07)',
      'hover-strong': 'rgba(255, 204, 153, 0.15)',
      'press': 'rgba(255, 204, 153, 0.22)',
      'scroll': '#3d2612',
      'scroll-hover': '#6d4522',
      'success': '#9bcc66',
      'error': '#cc6666',
      'warn': '#ffcc66',
      'info': '#99ccff',
      'done': '#cc99cc',
    }

    /**
     * Turn one scheme map into custom properties.
     * @param {Record<string, string>} map - suffix to CSS value.
     * @returns {string} newline-prefixed declarations.
     */
    function schemeDeclarations(map) {
      return Object.keys(map)
        .map((key) => '  --lcars-' + key + ': ' + map[key] + ';')
        .join('\n')
    }

    /**
     * Palette declarations for one series and one scheme.
     * @param {object} series - the palette entry.
     * @param {'dark'|'light'} scheme - scheme whose values to emit.
     * @returns {string} newline-prefixed declarations.
     */
    function paletteDeclarations(series, scheme) {
      const values = series[scheme]
      const keys = Object.keys(values)
      return keys.map((key) => '  --lcars-' + kebab(key) + ': ' + values[key] + ';').join('\n')
    }

    /**
     * camelCase to kebab-case for the palette value keys.
     * @param {string} value - camelCase key.
     * @returns {string} kebab-case key.
     */
    function kebab(value) {
      return value.replace(/[A-Z]/g, (letter) => '-' + letter.toLowerCase())
    }

    /**
     * Build the palette blocks: one per series in the light scheme, one per
     * series in the dark scheme. Two attribute selectors on `body` keep them
     * scoped and let a scheme flip repaint without any JavaScript.
     * @returns {string} CSS text.
     */
    /**
     * Lettering that stays legible on one block fill: white only where it clears
     * AA, near-black otherwise (the bright console blues want black lettering).
     * @param {string} fill - CSS colour value of the block.
     * @returns {string} the lettering colour.
     */
    function lettering(fill) {
      const match = /^#([0-9a-f]{6})$/i.exec(fill)
      if (match === null) return 'var(--lcars-ink)'
      const int = parseInt(match[1], 16)
      const channel = (shift) => {
        const value = ((int >> shift) & 255) / 255
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      }
      const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0)
      return 1.05 / (luminance + 0.05) >= 4.5 ? '#ffffff' : '#0a0a0a'
    }

    /**
     * The navigation column's named roles and their lettering. A palette without
     * a `sidebar` set falls back to its own blocks, so every series keeps a
     * readable column.
     * @param {object} series - palette entry.
     * @returns {string} newline-prefixed declarations.
     */
    function sideDeclarations(series) {
      const side = series.sidebar ?? {}
      const roles = {
        frame: side.frame ?? 'var(--lcars-block-2)',
        logo: side.logo ?? 'var(--lcars-block-2)',
        primary: side.primary ?? 'var(--lcars-accent-bright)',
        row: side.row ?? 'var(--lcars-block-2)',
        workspace: side.workspace ?? 'var(--lcars-block-soft)',
        session: side.session ?? 'color-mix(in srgb, var(--lcars-block-4) 26%, transparent)',
        selected: side.selected ?? 'var(--lcars-block-2)',
      }
      const lines = Object.keys(roles).map((role) => '  --lcars-side-' + role + ': ' + roles[role] + ';\n'
        + '  --lcars-side-on-' + role + ': ' + lettering(roles[role]) + ';')
      lines.push('  --lcars-readout-ink: ' + (side.readout ?? 'var(--lcars-ink-faint)') + ';')
      return lines.join('\n')
    }

    function paletteBlocks() {
      return Object.keys(PALETTES).map((id) => {
        const series = PALETTES[id]
        return ''
          + 'body[data-lcars="' + id + '"] {\n' + paletteDeclarations(series, 'light') + '\n'
          + sideDeclarations(series) + '\n}\n'
          + 'body[data-lcars="' + id + '"][data-ds-dark-theme] {\n' + paletteDeclarations(series, 'dark') + '\n'
          + sideDeclarations(series) + '\n}\n'
      }).join('\n')
    }

    /**
     * Swatch variables: one per series and scheme, so a settings chip previews
     * the series in the scheme the user is actually looking at.
     * @returns {string} CSS text.
     */
    function swatchBlocks() {
      const light = PALETTE_IDS.map((id) => '  --lcars-swatch-' + id + ': ' + PALETTES[id].light.accent + ';').join('\n')
      const dark = PALETTE_IDS.map((id) => '  --lcars-swatch-' + id + ': ' + PALETTES[id].dark.accent + ';').join('\n')
      return 'body {\n' + light + '\n}\nbody[data-ds-dark-theme] {\n' + dark + '\n}\n'
    }

    /* ------------------------------------------------------------------ *
     * Theme token layer.
     *
     * Every mapping points at a palette variable, so the layer never needs
     * re-registration when the palette or the scheme changes. The second
     * argument of each `var()` is the same neutral value the app would use, so
     * an unexpected early paint (stylesheet not yet parsed) degrades to a plain
     * dark surface instead of an invalid property.
     * ------------------------------------------------------------------ */
    const TOKEN_EXPRESSIONS = {
      // surfaces
      '--dsw-alias-bg-base': 'var(--lcars-bg, #050505)',
      '--dsw-alias-bg-layer-1': 'var(--lcars-layer-1, #0a0a0a)',
      '--dsw-alias-bg-layer-2': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-bg-layer-3': 'var(--lcars-layer-3, #171717)',
      '--dsw-alias-bg-overlay': 'var(--lcars-overlay, #0c0c0c)',
      '--dsw-alias-bg-document-preview': 'var(--lcars-bg, #050505)',
      '--dsw-alias-bg-document-selection': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 32%, transparent)',
      '--dsw-alias-label-document-preview': 'var(--lcars-ink-dim, #cf9160)',
      '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.42)',
      '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.18)',
      '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.62)',
      '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
      '--dsw-alias-bg-mask-drop': 'rgba(0, 0, 0, 0.55)',
      '--dsw-alias-bg-skeleton': 'var(--lcars-hover, rgba(255, 204, 153, 0.07))',
      '--dsw-alias-bg-multi-select': 'var(--lcars-layer-3, #171717)',
      '--dsw-alias-bg-module-platform': 'var(--lcars-layer-2, #101010)',

      // lines
      '--dsw-alias-border-l1': 'var(--lcars-line-1, rgba(255, 204, 153, 0.13))',
      '--dsw-alias-border-l2': 'var(--lcars-line-2, rgba(255, 204, 153, 0.22))',
      '--dsw-alias-border-l2-darkmode-thin': 'var(--lcars-line-2, rgba(255, 204, 153, 0.22))',
      '--dsw-alias-border-l3': 'var(--lcars-line-3, rgba(255, 204, 153, 0.30))',
      '--dsw-alias-border-l4': 'var(--lcars-line-4, rgba(255, 204, 153, 0.42))',
      '--dsw-alias-border-inverted': 'var(--lcars-line-1, rgba(255, 204, 153, 0.13))',
      '--dsw-alias-border-inverted2': 'var(--lcars-line-2, rgba(255, 204, 153, 0.22))',
      '--dsw-alias-border-selected': 'var(--lcars-accent, #ff9900)',

      // text
      '--dsw-alias-label-primary': 'var(--lcars-ink, #ffcc99)',
      '--dsw-alias-label-primary-bluish': 'var(--lcars-ink, #ffcc99)',
      '--dsw-alias-label-primary-dimmed': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 76%, var(--lcars-bg, #050505))',
      '--dsw-alias-label-primary-foreground': 'var(--lcars-ink-inverse, #0a0a0a)',
      '--dsw-alias-label-primary-inverted': 'var(--lcars-ink-inverse, #0a0a0a)',
      '--dsw-alias-label-secondary': 'var(--lcars-ink-dim, #cf9160)',
      '--dsw-alias-label-tertiary': 'var(--lcars-ink-faint, #8f5f36)',
      '--dsw-alias-label-caption': 'var(--lcars-ink-faint, #8f5f36)',
      '--dsw-alias-label-dimmed': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 32%, transparent)',
      '--dsw-alias-label-on-color': 'var(--lcars-on-accent, #0a0a0a)',
      '--dsw-alias-label-shimmer': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 42%, transparent)',
      '--dsw-alias-label-deep-diving': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-label-deep-diving-shimmer': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 55%, var(--lcars-ink, #ffcc99))',
      '--dsw-alias-link': 'var(--lcars-info, #99ccff)',
      '--dsw-alias-menu-icon': 'var(--lcars-ink-dim, #cf9160)',

      // brand and buttons
      '--dsw-alias-brand-primary': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-brand-primary-invert': 'var(--lcars-ink-inverse, #0a0a0a)',
      '--dsw-alias-brand-primary-new-colorprimary-new-color': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-brand-text': 'var(--lcars-ink, #ffcc99)',
      '--dsw-alias-button-primary-fill': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-button-primary-hover': 'var(--lcars-accent-2, #ff9966)',
      '--dsw-alias-button-primary-dimmed': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-button-contrast-fill': 'var(--lcars-ink, #ffcc99)',
      '--dsw-alias-button-elevated-fill': 'var(--lcars-layer-1, #0a0a0a)',
      '--dsw-alias-button-floating-fill': 'var(--lcars-layer-1, #0a0a0a)',
      '--dsw-alias-button-floating-hover': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-button-ghost-active-fill': 'var(--lcars-layer-3, #171717)',
      '--dsw-alias-button-ghost-active-hover': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-button-ghost-active-border': 'var(--lcars-line-4, rgba(255, 204, 153, 0.42))',
      '--dsw-alias-button-info-fill': 'var(--lcars-info, #99ccff)',
      '--dsw-alias-button-info-hover': 'var(--lcars-accent-4, #9999ff)',
      '--dsw-alias-switch-thumb': 'var(--lcars-ink-dim, #cf9160)',

      // cards, menus, overlays
      '--dsw-alias-card-fill': 'var(--lcars-layer-1, #0a0a0a)',
      '--dsw-alias-card-fill-hover': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-card-tile-fill': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 8%, transparent)',
      '--dsw-alias-hovercard-bg': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-hovercard-label-primary': 'var(--lcars-ink-bright, #ffe6cf)',
      '--dsw-alias-hovercard-label-secondary': 'var(--lcars-ink-dim, #cf9160)',
      '--dsw-alias-hovercard-label-tertiary': 'var(--lcars-ink-faint, #8f5f36)',
      '--dsw-alias-hovercard-state-done': 'var(--lcars-done, #cc99cc)',
      '--dsw-alias-hovercard-state-error': 'var(--lcars-error, #cc6666)',
      '--dsw-alias-toast-bg': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-toast-label': 'var(--lcars-ink-bright, #ffe6cf)',
      '--dsw-alias-toast-action': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-tooltip-bg': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-tooltip-label': 'var(--lcars-ink-bright, #ffe6cf)',
      '--dsw-alias-tooltip-key-bg': 'var(--lcars-layer-3, #171717)',
      '--dsw-menu-surface-fill': 'var(--lcars-menu, rgba(12, 12, 12, 0.88))',
      '--dsw-specific-menu': 'var(--lcars-menu, rgba(12, 12, 12, 0.88))',
      '--dsw-alias-menu-group-header-fill': 'var(--lcars-menu-header, rgba(22, 22, 22, 0.96))',
      '--dsw-alias-turn-trigger-bg': 'var(--lcars-layer-1, #0a0a0a)',
      '--dsw-alias-turn-trigger-bg-hover': 'var(--lcars-hover, rgba(255, 204, 153, 0.07))',
      '--dsw-alias-trajectory-accent': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-chart-messages': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-chart-system': 'var(--lcars-ink-dim, #cf9160)',
      '--dsw-alias-chart-tools': 'var(--lcars-accent-3, #cc99cc)',

      // interaction
      '--dsw-alias-interactive-bg-hover': 'var(--lcars-hover, rgba(255, 204, 153, 0.07))',
      '--dsw-alias-interactive-bg-hover-solid': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-interactive-bg-hover-accent': 'var(--lcars-hover-strong, rgba(255, 204, 153, 0.15))',
      '--dsw-alias-interactive-bg-hover-danger': 'color-mix(in srgb, var(--lcars-error, #cc6666) 16%, transparent)',
      '--dsw-alias-interactive-bg-active': 'var(--lcars-press, rgba(255, 204, 153, 0.22))',

      // states
      '--dsw-alias-state-error-primary': 'var(--lcars-error, #cc6666)',
      '--dsw-alias-state-error-secondary': 'color-mix(in srgb, var(--lcars-error, #cc6666) 72%, var(--lcars-ink, #ffcc99))',
      '--dsw-alias-state-idle-primary': 'var(--lcars-ink-faint, #8f5f36)',
      '--dsw-alias-state-success-primary': 'var(--lcars-success, #9bcc66)',
      '--dsw-alias-state-success-secondary': 'color-mix(in srgb, var(--lcars-success, #9bcc66) 72%, var(--lcars-ink, #ffcc99))',
      '--dsw-alias-state-success-tertiary': 'color-mix(in srgb, var(--lcars-success, #9bcc66) 18%, transparent)',
      '--dsw-alias-state-warn-primary': 'var(--lcars-warn, #ffcc66)',
      '--dsw-alias-state-warn-secondary': 'color-mix(in srgb, var(--lcars-warn, #ffcc66) 72%, var(--lcars-ink, #ffcc99))',
      '--dsw-alias-state-warn-label': 'var(--lcars-warn, #ffcc66)',
      '--dsw-alias-state-warn-tertiary': 'color-mix(in srgb, var(--lcars-warn, #ffcc66) 18%, transparent)',
      '--dsw-alias-state-done-primary': 'var(--lcars-done, #cc99cc)',
      '--dsw-alias-state-business-primary': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-state-business-tertiary': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 20%, transparent)',

      // sidebar, composer, code, scrollbars
      '--dsw-specific-sidebar-fill': 'var(--lcars-sidebar, #000000)',
      '--dsw-specific-sidebar-nav-item-active': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 14%, transparent)',
      '--dsw-specific-sidebar-nav-item-active-accent': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 26%, transparent)',
      '--dsw-specific-sidebar-right-flash': 'var(--lcars-accent, #ff9900)',
      '--dsw-specific-input-major': 'var(--lcars-field, #070707)',
      '--dsw-specific-login-input': 'var(--lcars-field, #070707)',
      '--dsw-specific-bubble': 'color-mix(in srgb, var(--lcars-block-4, #9999cc) 24%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-specific-bubble-highlight': 'color-mix(in srgb, var(--lcars-block-4, #9999cc) 38%, var(--lcars-layer-2, #101010))',
      '--dsw-specific-selector': 'var(--lcars-layer-2, #101010)',
      '--dsw-specific-tip': 'var(--lcars-layer-2, #101010)',
      '--dsw-specific-guide-hero': 'var(--lcars-layer-2, #101010)',
      '--dsw-specific-file-upload-track': 'var(--lcars-line-2, rgba(255, 204, 153, 0.22))',
      '--dsw-alias-markdown-code-block': 'var(--lcars-code, #0a0a0a)',
      '--dsw-alias-markdown-code-block-banner': 'var(--lcars-code-banner, #141414)',
      '--dsw-alias-markdown-code-segment-selected': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-markdown-code-segment-unselected': 'var(--lcars-code, #0a0a0a)',
      '--dsw-alias-markdown-inline-code': 'color-mix(in srgb, var(--lcars-accent, #ff9900) 12%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-alias-markdown-tag': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-markdown-placeholder': 'var(--lcars-layer-3, #171717)',
      '--dsw-alias-markdown-citation': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-scrollbar-bg-l1': 'var(--lcars-scroll, #3d2612)',
      '--dsw-alias-scrollbar-bg-l2': 'var(--lcars-scroll, #3d2612)',
      '--dsw-alias-scrollbar-hover-l1': 'var(--lcars-scroll-hover, #6d4522)',
      '--dsw-alias-scrollbar-hover-l2': 'var(--lcars-scroll-hover, #6d4522)',
      '--dsw-alias-code-diff-added': 'color-mix(in srgb, var(--lcars-success, #9bcc66) 16%, transparent)',
      '--dsw-alias-code-diff-deleted': 'color-mix(in srgb, var(--lcars-error, #cc6666) 16%, transparent)',

      // secondary families that would otherwise keep the stock palette
      '--dsw-alias-illustration-background': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-illustration-surface': 'var(--lcars-layer-3, #171717)',
      '--dsw-alias-illustration-backing': 'var(--lcars-line-2, rgba(255, 204, 153, 0.22))',
      '--dsw-alias-illustration-detail': 'var(--lcars-ink-faint, #b0794a)',
      '--dsw-alias-illustration-inset': 'var(--lcars-layer-2, #101010)',
      '--dsw-alias-illustration-shadow': 'var(--lcars-bg, #050505)',
      '--dsw-alias-json-tree-hover': 'var(--lcars-hover, rgba(255, 204, 153, 0.07))',
      '--dsw-alias-json-tree-icon': 'var(--lcars-ink-dim, #cf9160)',
      '--dsw-alias-json-tree-keyword': 'var(--lcars-accent, #ff9900)',
      '--dsw-alias-json-tree-number': 'var(--lcars-accent-2, #ff9966)',
      '--dsw-alias-json-tree-property': 'var(--lcars-info, #99ccff)',
      '--dsw-alias-json-tree-punctuation': 'var(--lcars-ink, #ffcc99)',
      '--dsw-alias-json-tree-string': 'var(--lcars-warn, #ffcc66)',
      '--dsw-alias-file-diff-added-bg': 'color-mix(in srgb, var(--lcars-success, #9bcc66) 16%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-alias-file-diff-added-gutter': 'color-mix(in srgb, var(--lcars-success, #9bcc66) 10%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-alias-file-diff-added-marker': 'var(--lcars-success, #9bcc66)',
      '--dsw-alias-file-diff-deleted-bg': 'color-mix(in srgb, var(--lcars-error, #cc6666) 16%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-alias-file-diff-deleted-gutter': 'color-mix(in srgb, var(--lcars-error, #cc6666) 10%, var(--lcars-layer-1, #0a0a0a))',
      '--dsw-alias-file-diff-deleted-marker': 'var(--lcars-error, #cc6666)',
      '--dsw-alias-button-tool-bar-fill': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 16%, transparent)',
      '--dsw-alias-button-tool-bar-hover': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 24%, transparent)',
      '--dsw-alias-button-tool-bar-fill-invisible': 'color-mix(in srgb, var(--lcars-ink, #ffcc99) 10%, transparent)',

      // shapes: LCARS panels are pills, so every radius step grows a little
      '--dsw-radius-xs': '5px',
      '--dsw-radius-sm': '9px',
      '--dsw-radius-md': '14px',
      '--dsw-radius-lg': '20px',
      '--dsw-radius-xl': '26px',
      '--dsw-radius-panel': '34px',
    }

    /** Token-name to per-scheme value pairs, as `overrideTokens` requires. */
    function tokenOverrides() {
      const overrides = {}
      for (const [token, value] of Object.entries(TOKEN_EXPRESSIONS)) {
        overrides[token] = { light: value, dark: value }
      }
      return overrides
    }

    /* ------------------------------------------------------------------ *
     * Stylesheet
     * ------------------------------------------------------------------ */
    function buildStylesheet() {
      // Every colour-block rule belongs to the EXPANDED navigation column. In the
      // collapsed rail (56px) the app's own icon-button styling has to survive, so
      // the rules are switched off by the frame's collapsed attribute — resetting
      // them one by one also erased the rail's hover and active states.
      const SIDEBAR = 'body[data-lcars][data-lcars-chrome]:not(:has([data-sidebar-collapsed]))'
      return ''
        + '/* ' + BUILD_MARKER + ' */\n'
        + '@font-face { font-family: \'LCARS GTJ3\'; src: url(data:font/woff2;base64,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) format(\'woff2\'); font-display: swap; }\n'
        // The embedded face draws U+2026 as a star, and the app renders the
        // truncation ellipsis of a title with that title's own font. A later face
        // of the same family claims only U+2026 and takes a normal ellipsis from a
        // system font, so truncated labels keep "..." instead of a star.
        + '@font-face { font-family: \'LCARS GTJ3\'; src: local(\'Segoe UI\'), local(\'Microsoft YaHei\'), local(\'Arial\'); unicode-range: U+2026; }\n'
        + '/* ---------- 1. scheme surfaces ---------- */\n'
        + 'body {\n'
        // The console face as one variable: LCARS GTJ3 for Latin, Glow Sans SC
        // Condensed Bold for Han. Only the chrome reads it (the navigation column,
        // the panel top bar and its chips, the caption menu, the tail readout); the
        // conversation surface keeps the app's own font, see the header rule below.
        + '  --lcars-font-ui: \'LCARS GTJ3\', \'Glow Sans SC Condensed Bold\', \'Glow Sans SC Condensed\', \'Glow Sans SC Compressed\', \'Microsoft YaHei\', \'Segoe UI\', system-ui, sans-serif;\n'
        + '  --lcars-font-display: \'Oswald\', \'Bahnschrift\', \'Bahnschrift SemiCondensed\', \'Antonio\', \'Impact\', \'Haettenschweiler\', \'Arial Narrow\', var(--lcars-font-ui);\n'
        + '  --lcars-font-readout: \'Bahnschrift\', \'DIN Alternate\', \'Roboto Condensed\', var(--lcars-font-ui);\n'
        + schemeDeclarations(SCHEME_LIGHT) + '\n'
        + '}\n'
        + 'body[data-ds-dark-theme] {\n'
        + schemeDeclarations(SCHEME_DARK) + '\n'
        + '}\n'
        // Black console without the theme service: the same night variables,
        // forced, so the console surface still paints when setTheme is refused.
        + 'body[data-lcars][data-lcars-console] {\n'
        + schemeDeclarations(SCHEME_DARK) + '\n'
        + '}\n'
        + '\n/* ---------- 2. palette accents ---------- */\n'
        + paletteBlocks()
        + swatchBlocks()
        + '\n/* ---------- 3. chrome ---------- */\n'
        + 'body[data-lcars] {\n'
        + '  --dsw-focus-ring-color: var(--lcars-accent);\n'
        + '  --dsw-font-family-brand: var(--lcars-font-display);\n'
        + '}\n'
        + 'body[data-lcars] {\n'
        + '  --dsw-alias-settings-card-fill: var(--lcars-layer-1);\n'
        + '  --dsw-alias-settings-card-stroke: var(--lcars-line-3);\n'
        + '}\n'
        // The console face on the navigation column: LCARS GTJ3 for Latin, Glow
        // Sans SC Condensed Bold for Han (the face has no Han, so the browser falls
        // through per glyph). LCARS GTJ3 is an uppercase display face — A-Z, digits
        // and punctuation only, no lowercase — so the column uppercases its labels;
        // without that, the lowercase letters of a label would silently drop back to
        // another family mid-word. Conversation text keeps the reader's own font.
        + 'body[data-lcars] [class*="_sidebarCol"] {\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  text-transform: uppercase;\n'
        + '  letter-spacing: 0.03em;\n'
        + '}\n'
        // Sidebar face switch (Settings › LCARS theme): the console face is the
        // shipped look; the other two keep their own case because both have
        // lowercase glyphs.
        + 'body[data-lcars][data-lcars-sidefont="condensed"] [class*="_sidebarCol"] {\n'
        + '  font-family: var(--lcars-font-display);\n'
        + '  text-transform: none;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-sidefont="system"] [class*="_sidebarCol"] {\n'
        + '  font-family: var(--dsw-font-family);\n'
        + '  text-transform: none;\n'
        + '}\n'
        + 'body[data-lcars] [class*="_sidebarCol"] [class*="_brandName"] {\n'
        + '  text-transform: uppercase;\n'
        + '  letter-spacing: 0.12em;\n'
        + '}\n'
        + 'body[data-lcars] [class*="_brandMark"] svg,\n'
        + 'body[data-lcars] [class*="_railMark"] svg,\n'
        + 'body[data-lcars] [class*="_brandMark"] {\n'
        + '  color: var(--lcars-accent);\n'
        + '}\n'
        // The session title row in the panel top bar carries the console face too
        // (the user wants the whole frame — column, top bar, bottom bar — in LCARS
        // GTJ3). It is uppercase for the same reason as the column: the face has no
        // lowercase, so mixed-case Latin would otherwise drop to another family.
        + 'body[data-lcars] [class*="_titleRow"] {\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  text-transform: uppercase;\n'
        + '  letter-spacing: 0.05em;\n'
        + '}\n'
        // The title itself is a crumb (<span class="_crumb _crumbCurrent">); name it
        // directly so the face also lands when the row wrapper is restyled by a
        // future app build.
        + 'body[data-lcars][data-lcars-chrome] [class*="_crumb"] {\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  text-transform: uppercase;\n'
        + '}\n'
        // No band around the column: the black navigation column runs to the
        // window edge and the colour lives only in the rows. Every block below
        // reads a NAMED sidebar role (frame / logo / primary / row / workspace /
        // session / selected), so one palette assigns the console's colours.
        + SIDEBAR + ' [class*="_sidebarCol"] {\n'
        + '  position: relative;\n'
        + '  padding: 0;\n'
        + '  background: var(--lcars-sidebar);\n'
        + '  border-radius: 0;\n'
        // No divider line between the column and the conversation: the brand block
        // bleeds to this edge and must not be cut by it.
        + '  border-right: none;\n'
        + '  --lcars-block-soft: color-mix(in srgb, var(--lcars-block-4) 55%, #ffffff);\n'
        + '}\n'
        // The caption row stays black: nothing is painted across the strip, and the
        // two menu items become blocks of their own with a black gap between
        // them. Their styling lives in a shadow root the Desktop preload created,
        // so it is injected by the client half and reads these variables, which
        // keep a palette switch live without new JavaScript.
        + 'body[data-lcars][data-lcars-chrome] {\n'
        + '  --lcars-menu-item-fill: var(--lcars-side-frame);\n'
        + '  --lcars-menu-item-ink: #0a0a0a;\n'
        + '  --lcars-menu-item-hover: var(--lcars-side-selected);\n'
        + '}\n'
        // Navigation rows are one colour block each. The block bleeds left into
        // the screen edge (negative inline margin, no layout effect on siblings)
        // and its right end is a pill.
        // Console type on the chrome only: LCARS for Latin and Glow Sans for Han on
        // the panel top bar (session title, crumbs, the action chips) and, through
        // the face variables, on the navigation column, the caption menu and the
        // tail. The conversation surface — transcript, tool output and composer —
        // is deliberately left on the app's own --dsw-font-family (the system font),
        // so long reading text and the input keep the reader's font.
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) {\n'
        + '  --dsw-font-family: var(--lcars-font-ui);\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  text-transform: uppercase;\n'
        + '}\n'

        // Row density (user-tuned): every navigation block, and the brand block
        // above them, is drawn at 0.9 of its designed two-line height — 39.6px
        // rows and a 54px brand block instead of 44px / 60px. It lives on the
        // themed body so the factor reaches the rows wherever they are nested;
        // the 8px gaps between the blocks are deliberately left alone.
        + 'body[data-lcars][data-lcars-chrome] {\n'
        + '  --lcars-block-scale: 0.9;\n'
        + '}\n'

        + SIDEBAR + ' [class*="_panelList"] {\n'
        + '  gap: 8px;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] {\n'
        + '  margin-right: 8px;\n'
        + '  border-inline-width: 0;\n'
        + '  padding-left: 0;\n'
        + '  border-radius: 2px;\n'
        + '  corner-shape: round;\n'
        + '  background-color: var(--lcars-side-row);\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] > * {\n'
        + '  justify-content: flex-end;\n'
        + '  padding-left: 0;\n'
        + '  padding-right: 8px;\n'
        + '  text-align: right;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] * {\n'
        + '  color: var(--lcars-side-on-row) !important;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelEntryActive"],\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntryActive"]:nth-child(n) {\n'
        + '  background-color: var(--lcars-side-selected);\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelEntryActive"] * {\n'
        + '  color: var(--lcars-side-on-selected) !important;\n'
        + '}\n'
        // The new-session row carries its own inline margin (the app insets it by
        // the paint inset + 1px); drop it so the block lines up with the others.
        + SIDEBAR + ' [class*="_newSessionRow"] {\n'
        + '  margin-left: 0;\n'
        + '  margin-right: 0;\n'
        + '  margin-top: 0;\n'
        // The row box is taller than the button, so its 12px of slack plus the
        // button margin made the gap 20px; this pulls it back to the 8px rhythm.
        + '  margin-bottom: -4px;\n'
        + '}\n'
        + SIDEBAR + ' button[class*="_newSession"] {\n'
        + '  margin-right: 8px;\n'
        + '  justify-content: flex-end;\n'
        + '  padding-left: 0;\n'
        + '  padding-right: 8px;\n'
        + '  border-radius: 2px;\n'
        + '  corner-shape: round;\n'
        + '  border-color: var(--lcars-side-primary);\n'
        + '  background: var(--lcars-side-primary);\n'
        + '  color: var(--lcars-side-on-primary);\n'
        + '  text-transform: uppercase;\n'
        + '  letter-spacing: 0.08em;\n'
        + '  font-weight: 700;\n'
        + '  margin-bottom: 0;\n'
        + '}\n'
        // Hover-only affordances lead their labels: the panel pin sits on the left
        // edge of its row, and the New Session shortcut becomes the leading item.
        + SIDEBAR + ' [class*="_panelUnpin"] {\n'

        + '  left: 18px;\n'
        + '  right: auto;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_newSessionLabelMask"] {\n'

        + '  flex: 0 1 auto;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_newSessionContent"] {\n'

        + '  justify-content: flex-end;\n'
        + '  width: auto;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_newSessionShortcut"] {\n'

        + '  order: -1;\n'
        + '  margin-right: 8px;\n'
        + '}\n'
        + SIDEBAR + ' button[class*="_newSession"] * {\n'
        + '  color: var(--lcars-side-on-primary) !important;\n'
        + '}\n'
        + SIDEBAR + ' button[class*="_newSession"]:hover {\n'
        + '  background: color-mix(in srgb, var(--lcars-side-primary) 82%, #000000);\n'
        + '}\n'
        // The empty lower half of the column is filled with the console's filler
        // panel: three colour bars, the gold stardate and the segment row. It is
        // a flow element after the workspace list, so a long list pushes it below
        // the fold instead of letting it cover session rows.
        + SIDEBAR + ' [class*="_regionArea"]::after {\n'
        + '  content: var(--lcars-stardate-text, "STARDATE") "\\A LCARS 47 · SUBSYSTEM NOMINAL";\n'
        + '  white-space: pre-line;\n'
        + '  display: block;\n'
        + '  flex: none;\n'
        + '  margin-top: 16px;\n'
        + '  margin-right: 8px;\n'
        + '  box-sizing: border-box;\n'
        + '  padding: 74px 14px 44px;\n'
        + '  min-height: 190px;\n'
        + '  border: 1px solid color-mix(in srgb, var(--lcars-side-frame) 22%, transparent);\n'
        + '  border-radius: 10px;\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  font-size: 11px;\n'
        + '  letter-spacing: 0.14em;\n'
        + '  line-height: 20px;\n'
        + '  color: var(--lcars-readout-ink);\n'
        + '  background-repeat: no-repeat;\n'
        + '  background-image:'
        + ' linear-gradient(var(--lcars-side-session), var(--lcars-side-session)),'
        + ' linear-gradient(var(--lcars-side-selected), var(--lcars-side-selected)),'
        + ' linear-gradient(var(--lcars-block-1, #d36010), var(--lcars-block-1, #d36010)),'
        + ' repeating-linear-gradient(90deg, var(--lcars-side-selected) 0 12px, transparent 12px 18px);\n'
        + '  background-size: 58% 10px, 82% 10px, 34% 10px, 96px 12px;\n'
        + '  background-position: 14px 16px, 14px 34px, 14px 52px, 14px 150px;\n'
        + '}\n'
        // The workspace section header sits flush against the column's right edge
        // (the app gives it margin-right: -4px; padding-right: 1px) and clamps its
        // action group to 60px, so the last button (add workspace) is cut. Pull the
        // whole header inward and let it and the group show their children; the
        // search-expanded state keeps the app's own layout and animation.
        + SIDEBAR + ' [class*="_sectionHeader"]:not(:has([class*="_searchExpanded"])) {\n'
        + '  margin-right: 0;\n'
        + '  padding-right: 12px;\n'
        + '  overflow: visible;\n'
        + '  margin-bottom: 10px;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_sectionHeader"]:not(:has([class*="_searchExpanded"])) [class*="_headerActions"] {\n'
        + '  max-width: none;\n'
        + '  overflow: visible;\n'
        + '  position: relative;\n'
        + '  right: 10px;\n'
        + '}\n'
        // "More" is a Menu trigger: its wrapper is the block, so the row stays
        // transparent and the block spans exactly like a panel entry.
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] {\n'
        + '    margin-right: 8px;\n'
        + '    border-radius: 2px;\n'
        + '    corner-shape: round;\n'
        + '    background-color: var(--lcars-side-row);\n'
        + '}\n'
        // Line the trigger glyph up with the entries: their wrapper adds 18px and
        // their row the row padding minus the paint inset, so the bare trigger row
        // gets that sum as its own leading padding.
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] [class*="_panelRow"] {\n'
        + '  justify-content: flex-end;\n'
        + '  padding-left: 0;\n'
        + '  padding-right: 8px;\n'
        + '  text-align: right;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] * {\n'
        + '  color: var(--lcars-side-on-row) !important;\n'
        + '}\n'
        // The brand row is the column's top block.
        // The build badge is an ink-on-inverted-ink chip in the app; with the row's
        // lettering forced to the panel ink it turns into a black block. Give it
        // the pale console chip (dark ink on the operations tint) instead, and a
        // legible size — the stock chip is 10px tall with 6px type.
        + SIDEBAR + ' [class*="_logoRow"] [class*="_buildVersion"] {\n'
        + '  background: var(--lcars-side-selected);\n'
        + '  color: var(--lcars-side-on-logo) !important;\n'
        + '  height: 12px;\n'
        + '  margin-left: 2px;\n'
        + '  padding: 0 5px;\n'
        + '  border-radius: 3px;\n'
        + '  corner-shape: round;\n'
        + '  font-size: 8px;\n'
        + '  line-height: 12px;\n'
        + '  letter-spacing: 0.06em;\n'
        + '}\n'
        // The brand row is the reference elbow: a thick top bar that trails right into
        // the session-title block, a wide leg down the left holding the wordmark, a
        // large outer arc on the top-left and a filleted inside corner. Geometry is
        // taken from the reference shape (bar 33% of the height, leg 50% of the
        // width, outer arc 68%, inside fillet 39%) and drawn on a block inset 4px
        // inside its row: the transparent border owns that inset and background-clip
        // keeps the fill inside it.
        + SIDEBAR + ' [class*="_logoRow"] {\n'
        + '  --dsw-alias-label-primary-inverted: var(--lcars-ink-bright, #ffffff);\n'
        + '  position: relative;\n'
        // The session-title block is centred in the header, so its top edge is
        // measured (--lcars-brand-top) and the row shifts by the difference: the
        // brand block's top then sits level with it.
        + '  margin-top: var(--lcars-brand-top, 0px);\n'
        + '  margin-right: calc(-1 * var(--dsh-sidebar-inline-padding, 8px));\n'
        // 4px here, not 8: the fill sits 4px above the row's bottom edge, so the gap
        // between the block and the row below reads as 8px like every other gap.
        + '  margin-bottom: 4px;\n'
        + '  padding-left: 20px;\n'
        // The wordmark and its line follow the theme's density factor, and the row
        // carries an extra 30px of height: the block's bottom edge is extended that
        // far, and the wordmark (anchored to the bottom) travels with it.
        + '  --lcars-brand-word-size: calc(30px * var(--lcars-block-scale, 1));\n'
        + '  --lcars-brand-word-line: calc(30px * var(--lcars-block-scale, 1));\n'
        + '  height: calc(var(--lcars-brand-word-line) * 2 + 30px);\n'
        + '  box-sizing: border-box;\n'
        // No top inset: the fill starts on the row's top edge so it lines up with the
        // session-title block beside it. The right inset is 16px — the same right edge
        // every navigation row ends on — so the block lines up with them; the bottom
        // keeps 4px so the gap to the row below reads as 8px.
        + '  border: 4px solid transparent;\n'
        + '  border-top-width: 0;\n'
        + '  border-right-width: 16px;\n'
        // No left inset either: the fill starts on the same left edge every navigation
        // row starts on, so the column reads as one flush stack.
        + '  border-left-width: 0;\n'
        // Only the top-left is rounded: the 31px on the border box is the reference
        // arc's 68% of the block height (27px inside the border).
        + '  border-radius: 31px 0 0 0;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--lcars-side-logo);\n'
        // After the shorthand, not before: `background` resets background-clip, so
        // this must stay the last word or the fill paints over the border inset.
        + '  background-clip: padding-box;\n'
        + '}\n'

        // The brand is the wordmark alone: the LCARS face, uppercase and low, set at
        // the block's right end like every other block label — 8px in from the fill's
        // edge, which is the same right edge the navigation rows' labels end on.
        + SIDEBAR + ' [class*="_brandIdentity"] {\n'

        + '  display: none;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_logoRow"]::before {\n'

        + '  content: "DEEPSEEK";\n'
        + '  position: absolute;\n'
        + '  right: 8px;\n'
        + '  bottom: 0;\n'
        + '  pointer-events: none;\n'
        + '  font-family: \'LCARS GTJ3\', var(--lcars-font-display);\n'
        + '  font-size: var(--lcars-brand-word-size, 30px);\n'
        + '  line-height: var(--lcars-brand-word-line, 30px);\n'
        + '  letter-spacing: 0.06em;\n'
        + '  color: var(--lcars-side-on-logo);\n'
        + '}\n'

        + SIDEBAR + ' [class*="_logoRow"] * {\n'
        + '  color: var(--lcars-side-on-logo) !important;\n'
        + '}\n'
        // The foot (settings and account) is the column's bottom block.
        + SIDEBAR + ' [class*="_footArea"] {\n'
        // Bleed to the column edge: the profile block is the tail's root, so it
        // must meet the dock with no black gap between them. The width is set from
        // the navigation rows' right edge at runtime (--lcars-foot-w), so the block's
        // painted right edge lands exactly on their column whatever the app's own
        // footer padding does.
        + '  position: relative;\n'
        + '  margin-right: calc(-1 * var(--dsh-sidebar-inline-padding, 8px));\n'
        + '  margin-top: 6px;\n'
        + '  box-sizing: border-box;\n'
        // !important: the app can put its own inline width on this row, which would
        // otherwise win over the measured one.
        + '  width: var(--lcars-foot-w, auto) !important;\n'
        + '  padding: 6px 8px 6px 20px;\n'
        // The foot row closes the column: its bottom-left corner is the same big
        // outer arc (--lcars-foot-half); the other three use the reference radius.
        + '  border-radius: 2px 2px 0 var(--lcars-foot-half, 40px);\n'
        + '  corner-shape: round;\n'
        + '  background: var(--lcars-side-row);\n'
        + '}\n'
        // The block's fill is repainted by its own pseudo-element, exactly over the
        // block's box, so the visible block ends on the same right edge the width rule
        // sets (the navigation rows' edge) even if the app paints an inner element.
        // Contents paint above it, so the row's text and buttons stay on top.
        + SIDEBAR + ' [class*="_footArea"]::before {\n'
        + '  content: "";\n'
        + '  position: absolute;\n'
        + '  inset: 0;\n'
        + '  background: var(--lcars-side-row);\n'
        + '  border-radius: 2px 2px 0 var(--lcars-foot-half, 40px);\n'
        + '  corner-shape: round;\n'
        + '  pointer-events: none;\n'
        + '}\n'
        // The foot's two seats (the footer-action slot holding the update button and the
        // settings slot holding the account row) are stacked, and their contents get the
        // full width: side by side the update label ran out of room and got clipped.
        + SIDEBAR + ' [class*="_footerActions"],\n'
        + SIDEBAR + ' [class*="_settingsArea"] {\n'
        + '  flex-direction: column;\n'
        + '  align-items: stretch;\n'
        + '  gap: 4px;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_footerActions"] > *,\n'
        + SIDEBAR + ' [class*="_settingsArea"] > * {\n'
        + '  width: 100%;\n'
        + '  box-sizing: border-box;\n'
        + '}\n'
        // The seats fill their slots: forcing the outlet itself into a column covers
        // builds where the slot items sit in their own row wrapper.
        + SIDEBAR + ' [class*="_footerActions"] [data-slot^="sidebar.footer.action"],\n'
        + SIDEBAR + ' [class*="_settingsArea"] [data-slot^="sidebar.settings"] {\n'
        + '  display: flex;\n'
        + '  flex-direction: column;\n'
        + '  align-items: stretch;\n'
        + '  gap: 4px;\n'
        + '  width: 100%;\n'
        + '}\n'
        // The sketched cut: a black panel over the block's top-right corner. It
        // reaches down to the tail bar and its bottom-left corner is rounded, so the
        // block's right edge turns into the bar's top edge with a fillet — the
        // reference displays' joint between a vertical bar and a horizontal one.
        + SIDEBAR + ' [class*="_footArea"]::after {\n'
        + '  content: "";\n'
        + '  position: absolute;\n'
        + '  top: 0;\n'
        + '  right: 0;\n'
        + '  width: 26px;\n'
        + '  height: calc(100% - 26px);\n'
        + '  background: var(--lcars-sidebar);\n'
        + '  border-radius: 0 0 0 20px;\n'
        + '  pointer-events: none;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_footArea"] * {\n'
        + '  color: var(--lcars-side-on-row) !important;\n'
        + '}\n'
        // Workspace row: a bar; session rows: filled blocks; the current session
        // takes the selected colour.
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectText"] {\n'

        + '  flex: 0 1 auto;\n'
        + '  margin-left: auto;\n'
        + '  text-align: right;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_folder"] {\n'

        + '  order: 2;\n'
        + '  margin-right: 0;\n'
        + '}\n'
        // Every glyph follows its label, so the block closes on its icon.
        + SIDEBAR + ' [class*="_panelGlyph"] {\n'

        + '  order: 1;\n'
        + '}\n'
        // No trailing icons in the navigation blocks: the labels end on the right
        // edge, as the reference panels do.
        + SIDEBAR + ' [class*="_panelList"] [class*="_panelGlyph"] {\n'

        + '  display: none;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_newSessionContent"] > svg {\n'

        + '  display: none;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_folder"] {\n'

        + '  display: none;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_newSessionContent"] > svg {\n'

        + '  order: 1;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectRow"] {\n'
        + '  margin-right: 8px;\n'
        + '  justify-content: flex-end;\n'
        + '  padding-left: 0;\n'
        + '  padding-right: 8px;\n'
        + '  border-radius: 2px;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--lcars-side-workspace);\n'
        + '  margin-bottom: 8px;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectRow"] * {\n'
        + '  color: var(--lcars-side-on-workspace) !important;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] {\n'
        + '  background-color: var(--lcars-side-session);\n'
        + '  margin-bottom: 8px;\n'
        // The tree wrapper indents its rows by 3px; pull them back so every
        // block in the column shares one width.
        + '  margin-left: -3px;\n'
        + '  margin-right: 5px;\n'
        // All four corners share one radius: the right end stays rounded and the
        // left edge is not a bare right angle either.
        // The reference swatch: the left corners keep the 8px radius, the right end
        // is a semicircle. Both survive only because the right radii are published
        // as the measured half height (see the client half), so the right side's
        // radii sum exactly to the row height and nothing is scaled down.
        + '  border-radius: 2px var(--lcars-row-half, 16px) var(--lcars-row-half, 16px) 2px;\n'
        + '  corner-shape: round;\n'
        // Tabular digits keep the right-hand times in one column.
        + '  font-variant-numeric: tabular-nums;\n'
        + '}\n'
        // The conversation title right-aligns against its trailing time.
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] [class*="_title"] {\n'
        + '  text-align: right;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] * {\n'
        + '  color: var(--lcars-side-on-session) !important;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_selected"] {\n'
        + '  background-color: var(--lcars-side-selected) !important;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_selected"] * {\n'
        + '  color: var(--lcars-side-on-selected) !important;\n'
        + '}\n'
        // Composer card: an LCARS input panel — a 2px frame border with a rounded
        // colour cap on the left edge, like the end cap of a console readout.
        + 'body[data-lcars][data-lcars-chrome] [data-composer-card] {\n'
        + '  border: 2px solid var(--lcars-chrome);\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-composer-card]::before {\n'
        + '  content: "";\n'
        + '  position: absolute;\n'
        + '  left: -2px;\n'
        + '  top: 50%;\n'
        + '  width: 10px;\n'
        + '  height: 46%;\n'
        + '  transform: translateY(-50%);\n'
        + '  background: var(--lcars-chrome);\n'
        + '  border-radius: 10px 0 0 10px;\n'
        + '  corner-shape: round;\n'
        + '  pointer-events: none;\n'
        + '}\n'
        // The console graticule: 1px frame-coloured lines every 96px on the black
        // conversation surface, as in the reference displays. The conversation
        // root is the element that paints the base background, so the grid has to
        // live on it — on the centre column it would be hidden underneath.
        + 'body[data-lcars][data-lcars-chrome] [class*="_mainPanel"] > [data-slot="main"] > [class*="_root"],\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_root"][data-phase] {\n'
        + '  --lcars-grid: color-mix(in srgb, var(--lcars-side-frame) 12%, transparent);\n'
        + '  background-image:'
        + ' repeating-linear-gradient(to right, var(--lcars-grid) 0 1px, transparent 1px 96px),'
        + ' repeating-linear-gradient(to bottom, var(--lcars-grid) 0 1px, transparent 1px 96px);\n'
        + '  background-attachment: local, local;\n'
        // The transcript itself is clipped to the conversation frame, so messages
        // scrolling up disappear at the frame's edge. The panel is not clipped: the
        // header chips (session title, agent mode, subagent and task status) live
        // above the transcript and must stay untouched.
        + '  clip-path: inset(var(--lcars-root-inset-top, 0px) 0 var(--lcars-root-inset-bottom, 0px) 0);\n'
        + '}\n'
        // The conversation frame's remaining inset relative to the measured panel: the
        // bottom edge stays 38px above it. The top edge is not inset — it is published
        // directly from the brand block's top, so the two lines match exactly.
        // --lcars-logo-h is the header row's height (35px) and the brand block's
        // trailing bar height; the blocks inside the header are shorter
        // (--lcars-chip-h, 25px) and the header centres them, which leaves a 5px gap
        // above and below every block — so the frame's top line clears them by 5px.
        + 'body[data-lcars][data-lcars-chrome] {\n'
        + '  --lcars-frame-inset-bottom: 38px;\n'
        + '  --lcars-logo-h: 35px;\n'
        + '  --lcars-chip-h: 25px;\n'
        + '}\n'
        // The conversation frame is drawn in the overlay layer (above every column, on
        // top of the transcript), positioned from the measured conversation panel:
        // an outline on the panel itself would be covered by its own opaque content,
        // and one on the transcript scroller is washed out by the app's bottom fade.
        // The same two insets also clip the conversation panel, so the transcript is
        // cut off exactly at the frame instead of scrolling past it.
        + '.lcars-conf-frame {\n'
        + '  position: fixed;\n'
        + '  left: var(--lcars-frame-left, 0px);\n'
        // Both coordinates are published by the client: the top is the brand block's
        // top edge, the height reaches the panel's bottom minus the tuned inset.
        + '  top: var(--lcars-frame-top, 0px);\n'
        + '  width: var(--lcars-frame-w, 0px);\n'
        + '  height: var(--lcars-frame-h, 0px);\n'
        + '  box-sizing: border-box;\n'
        + '  border: 2px solid var(--lcars-side-frame);\n'
        + '  border-radius: 4px;\n'
        + '  corner-shape: round;\n'
        + '  pointer-events: none;\n'
        + '}\n'
        // The session header is the main panel's top block: a frame-tinted bar
        // closed by a frame-coloured rule. The app's own grid/padding is kept, so
        // nothing inside the header moves.
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) {\n'
        + '  background: transparent;\n'
        + '  border-bottom: 0;\n'
        + '  border-radius: 2px;\n'
        // The block matches the navigation column's brand block height, which the
        // client measures as --lcars-logo-h.
        + '  box-sizing: border-box;\n'
        + '  height: var(--lcars-logo-h, 40px);\n'
        // The brand block starts 6px down (the column root pads its top), so the
        // header takes the same offset: equal heights only align if the tops do.
        + '  margin-top: 6px;\n'
        + '  padding-left: 0;\n'
        + '  padding-right: 20px;\n'
        // With the shorter box the shipped top padding would push the title row
        // off centre, so centre the grid content instead.
        + '  align-content: center;\n'
        + '  min-height: 0;\n'
        + '  align-items: center;\n'
        + '}\n'
        // The header reads as separate console blocks: the session title, then each
        // action entry (agent mode, job count, subagent count) marked by the client
        // as data-lcars-chip, coloured here by position.
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_titleCluster"] {\n'
        + '  mask-image: none;\n'
        + '}\n'
        // Flush against the navigation column: the title box starts at the panel
        // edge and the chips follow at 8px intervals. The 5px leading inset shifts
        // the three blocks (title, agent mode, status chips) right as a group.
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_titleRow"] {\n'
        + '  padding-inline-start: 5px;\n'
        + '  gap: 8px;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_titleCluster"] {\n'
        + '  margin: 0;\n'
        + '  padding: 0;\n'
        + '  gap: 8px;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_headerActions"] {\n'
        + '  margin-left: 0;\n'
        + '  gap: 8px;\n'
        + '}\n'
        // The centre column rounds its top-left corner, which clipped the header's
        // first block; square that corner so the block keeps its own 2px radius.
        + 'body[data-lcars][data-lcars-chrome] [class*="_centerCol"] {\n'
        + '  border-radius: 0;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_crumbs"] {\n'
        + '  background: var(--lcars-side-frame);\n'
        + '  border-radius: 8px;\n'
        + '  corner-shape: round;\n'
        + '  height: var(--lcars-chip-h, 25px);\n'
        + '  padding: 0 10px;\n'
        + '  align-items: center;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_crumbs"] * {\n'
        + '  color: var(--lcars-side-on-frame) !important;\n'
        + '}\n'
        // The agent-preset label beside the title is header chrome too: one solid
        // block in the same role as the session-title box. Both read
        // `--lcars-side-frame`, so a custom "frame / top bar" colour repaints the
        // pair. The label is a span inside the header-actions slot outlet.
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_headerActions"] [data-slot="conversation.session.header.actions"] > span,\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_headerActions"] > span {\n'
        + '  box-sizing: border-box;\n'
        + '  align-items: center;\n'
        + '  gap: 6px;\n'
        + '  max-width: 240px;\n'
        + '  height: var(--lcars-chip-h, 25px);\n'
        + '  padding: 0 10px;\n'
        + '  border-radius: 8px;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--lcars-side-frame);\n'
        + '  font-size: 14px;\n'
        + '  line-height: 1;\n'
        + '  color: var(--lcars-side-on-frame);\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_headerActions"] [data-slot="conversation.session.header.actions"] > span *,\n'
        + 'body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) [class*="_headerActions"] > span * {\n'
        + '  color: var(--lcars-side-on-frame) !important;\n'
        + '}\n'
        // Action entries: one chip each, coloured by position. The subagent count
        // and the background-job count share one long block: both use the same
        // fill, butt together and square off at the join.
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip] {\n'
        + '  display: inline-flex;\n'
        + '  align-items: center;\n'
        + '  height: var(--lcars-chip-h, 25px);\n'
        + '  padding: 0 10px;\n'
        + '  border-radius: 8px;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--lcars-side-primary);\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip] * {\n'
        + '  color: var(--lcars-side-on-primary) !important;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip="1"] {\n'
        + '  border-radius: 8px;\n'
        + '  margin-right: 0;\n'
        + '  background: var(--lcars-side-session);\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip="1"]:last-child {\n'
        + '  border-radius: 8px;\n'
        + '  margin-right: 0;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip="1"] * {\n'
        + '  color: var(--lcars-side-on-session) !important;\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip="2"] {\n'
        + '  border-radius: 8px;\n'
        + '  background: var(--lcars-side-session);\n'
        + '}\n'
        + 'body[data-lcars][data-lcars-chrome] [data-lcars-chip="2"] * {\n'
        + '  color: var(--lcars-side-on-session) !important;\n'
        + '}\n'

        // Every navigation block is two label lines tall, drawn at the theme's
        // density factor (0.9 = 19.8px lines, 39.6px blocks, from the shipped
        // 22px line) — the same rule the brand block follows — with the label on
        // the lower line, 8px from the right edge; label-only rows also pack to
        // the right. The line-height follows the scaled line so the label sits on
        // that lower line instead of overflowing the shorter content box.
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] > *,\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] [class*="_panelRow"],\n'
        + SIDEBAR + ' button[class*="_newSession"] {\n'
        + '  box-sizing: border-box;\n'
        + '  height: calc(var(--lcars-row-line, 22px) * 2);\n'
        + '  --lcars-row-line: calc(22px * var(--lcars-block-scale, 1));\n'
        + '  padding-top: var(--lcars-row-line, 22px);\n'
        + '  padding-bottom: 0;\n'
        + '  padding-right: 8px;\n'
        + '  padding-left: 0;\n'
        + '  line-height: var(--lcars-row-line, 22px);\n'
        + '  justify-content: flex-end;\n'
        + '  align-items: center;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectRow"],\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] {\n'
        + '  box-sizing: border-box;\n'
        + '  height: calc(var(--lcars-row-line, 22px) * 2);\n'
        + '  --lcars-row-line: calc(22px * var(--lcars-block-scale, 1));\n'
        + '  padding-top: var(--lcars-row-line, 22px);\n'
        + '  padding-bottom: 0;\n'
        + '  line-height: var(--lcars-row-line, 22px);\n'
        + '  align-items: center;\n'
        + '}\n'
        // Slightly larger labels: 14px on the row containers, inherited by their
        // descendants so the shipped per-component sizes do not win.
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] > *,\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] [class*="_panelRow"],\n'
        + SIDEBAR + ' button[class*="_newSession"],\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectRow"],\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] {\n'
        + '  font-size: 14px;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_panelEntry"] > * *,\n'
        + SIDEBAR + ' [class*="_panelList"] > [class*="_moreAnchor"] [class*="_panelRow"] *,\n'
        + SIDEBAR + ' button[class*="_newSession"] *,\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_projectRow"] *,\n'
        + SIDEBAR + ' [class*="_regionArea"] [class*="_sessionRow"] * {\n'
        + '  font-size: inherit;\n'
        + '}\n'
        + SIDEBAR + ' [class*="_sectionLabel"] {\n'

        + '  font-size: 14px;\n'
        + '}\n'
        // Sidebar section captions (workspace / group labels) in the accent.
        + 'body[data-lcars] [class*="_regionArea"] [class*="_sectionLabel"] {\n'
        + '  color: var(--lcars-accent);\n'
        + '  letter-spacing: 0.1em;\n'
        + '}\n'
        // The console tail: the composer dock becomes the frame-coloured bottom
        // bar. Its left edge sits against the navigation column and its right end
        // is a pill cap, so it reads as one sweep across the bottom of the frame.
        // The persistent tail: a frame-wide overlay occupant (registered by the
        // client half) draws it outside every column scroll container, so it stays
        // put while the conversation scrolls or the composer hides. Its left end is
        // anchored on the navigation column width the client measures.
        + '\n'
        + '/* ---------- 4b. persistent tail ---------- */\n'
        + '.lcars-tail-bar {\n'
        + '  position: absolute;\n'
        // The bar starts 28px left of the profile block's measured edge, so it slides
        // under that block and its label shows no black seam: the two blues meet.
        + '  left: calc(var(--lcars-tail-left, var(--lcars-sidebar-w, 282px)) - 28px);\n'
        + '  bottom: 6px;\n'
        + '  width: calc(156px + 28px);\n'
        + '  height: 26px;\n'
        + '  background: var(--lcars-side-frame);\n'
        + '  border-radius: 0 2px 2px 0;\n'
        + '  corner-shape: round;\n'
        + '}\n'
        + '.lcars-tail-box {\n'
        + '  position: absolute;\n'
        + '  left: calc(var(--lcars-tail-left, 282px) + 156px + 8px);\n'
        + '  bottom: 6px;\n'
        + '  box-sizing: border-box;\n'
        // The reference console draws this panel as a long bar: 392px outer
        // length, padding included (the user's red frame in the screenshot).
        + '  width: 392px;\n'
        + '  height: 26px;\n'
        + '  display: flex;\n'
        + '  align-items: center;\n'
        + '  padding: 0 14px;\n'
        + '  border-radius: 2px;\n'
        + '  corner-shape: round;\n'
        // Pale console panel: the same light blue the "selected" blocks use, so
        // the box follows the palette (and the custom selected colour) with the
        // dark lettering above.
        + '  background: var(--lcars-side-selected);\n'
        + '}\n'
        // The composer keeps its own dock row; lift it clear of the overlay bar.
        + 'body[data-lcars][data-lcars-chrome] [data-composer-dock] {\n'
        + '  margin-bottom: 34px;\n'
        + '}\n'
        // The dock under the composer card is the bottom bar's readout row (token
        // speed, cache hit, context meter): console face and uppercase like the
        // column. The dock is a sibling of the composer card, so the input itself
        // stays on the app font.
        + 'body[data-lcars][data-lcars-chrome] [data-composer-dock] {\n'
        + '  font-family: var(--lcars-font-ui);\n'
        + '  text-transform: uppercase;\n'
        + '}\n'
        // Focus rings follow the accent.
        + 'body[data-lcars] :focus-visible {\n'
        + '  outline-color: var(--lcars-accent);\n'
        + '}\n'
        + '\n/* ---------- 4. stardate readout ---------- */\n'
        + '.lcars-readout {\n'
        + '  display: flex;\n'
        + '  align-items: center;\n'
        + '  gap: 6px;\n'
        + '  height: 20px;\n'
        + '  min-width: 0;\n'
        + '  max-width: 100%;\n'
        + '  margin-top: 2px;\n'
        // The bottom bar's readout is part of the console frame too: same face as
        // the column and the top bar, and the same 14px step as the navigation
        // labels the user asked it to match.
        + '  font-family: var(--lcars-font-ui);\n'
        + '  font-size: 14px;\n'
        + '  line-height: 1;\n'
        + '  letter-spacing: 0.14em;\n'
        + '  text-transform: uppercase;\n'
        // Pale readout panel: dark console lettering, keyed to the same role as
        // the box fill so a palette or custom colour keeps the pair readable.
        + '  color: var(--lcars-side-on-selected);\n'
        + '  pointer-events: none;\n'
        + '  user-select: none;\n'
        + '  white-space: nowrap;\n'
        + '  overflow: hidden;\n'
        + '}\n'
        + '.lcars-readout-cell {\n'
        + '  flex: none;\n'
        + '  color: var(--lcars-side-on-selected);\n'
        + '}\n'
        + '.lcars-readout-rule {\n'
        + '  flex: none;\n'
        + '  width: 1px;\n'
        + '  height: 10px;\n'
        + '  background: color-mix(in srgb, var(--lcars-side-on-selected) 35%, transparent);\n'
        + '}\n'

        + '.lcars-readout-tail {\n'
        + '  flex: 1 1 24px;\n'
        + '  min-width: 0;\n'
        + '  max-width: 96px;\n'
        + '  height: 14px;\n'
        + '  border-radius: 0 999px 999px 0;\n'
        + '  corner-shape: round;\n'
        + '  background-image: repeating-linear-gradient(90deg,'
        + ' color-mix(in srgb, var(--lcars-side-on-selected) 38%, transparent) 0 9px, transparent 9px 12px);\n'
        + '  opacity: 0.7;\n'
        + '}\n'

        + '\n/* ---------- 5. settings page ---------- */\n'
        + '.lcars-chip-row {\n'
        + '  display: flex;\n'
        + '  flex-wrap: wrap;\n'
        + '  gap: 8px;\n'
        + '}\n'
        + '.lcars-chip {\n'
        + '  box-sizing: border-box;\n'
        + '  display: inline-flex;\n'
        + '  align-items: center;\n'
        + '  gap: 8px;\n'
        + '  height: 34px;\n'
        + '  padding: 0 14px;\n'
        + '  border: 0.5px solid var(--dsw-alias-border-l4);\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '  background: transparent;\n'
        + '  font: inherit;\n'
        + '  font-size: 13px;\n'
        + '  color: var(--dsw-alias-label-primary);\n'
        + '  cursor: pointer;\n'
        + '}\n'
        + '.lcars-chip[aria-pressed="true"] {\n'
        + '  border-color: var(--dsw-alias-border-selected);\n'
        + '  background: var(--dsw-alias-bg-module-platform);\n'
        + '}\n'
        + '.lcars-chip:disabled {\n'
        + '  opacity: 0.5;\n'
        + '  cursor: default;\n'
        + '}\n'
        + '@media (hover: hover) {\n'
        + '  .lcars-chip:not([aria-pressed="true"]):not(:disabled):hover {\n'
        + '    background: var(--dsw-alias-interactive-bg-hover);\n'
        + '  }\n'
        + '}\n'
        + '.lcars-dot {\n'
        + '  flex: none;\n'
        + '  width: 9px;\n'
        + '  height: 9px;\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '}\n'
        + '.lcars-switch-row {\n'
        + '  display: flex;\n'
        + '  align-items: center;\n'
        + '  flex-wrap: wrap;\n'
        + '  gap: 8px;\n'
        + '}\n'
        // The switch is a plain <button>: without this base it would keep the
        // browser's default face. The checked state below only recolours it.
        + '.lcars-switch {\n'
        + '  box-sizing: border-box;\n'
        + '  display: inline-flex;\n'
        + '  align-items: center;\n'
        + '  gap: 8px;\n'
        + '  height: 32px;\n'
        + '  padding: 0 12px;\n'
        + '  border: 0.5px solid var(--dsw-alias-border-l3);\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '  background: transparent;\n'
        + '  font: inherit;\n'
        + '  font-size: 13px;\n'
        + '  color: var(--dsw-alias-label-secondary);\n'
        + '  white-space: nowrap;\n'
        + '  cursor: pointer;\n'
        + '}\n'
        + '.lcars-switch[aria-checked="true"] {\n'
        + '  border-color: var(--dsw-alias-border-selected);\n'
        + '  color: var(--dsw-alias-label-primary);\n'
        + '}\n'
        + '.lcars-switch:disabled {\n'
        + '  opacity: 0.5;\n'
        + '  cursor: default;\n'
        + '}\n'
        + '.lcars-switch-track {\n'
        + '  position: relative;\n'
        + '  flex: none;\n'
        + '  width: 26px;\n'
        + '  height: 14px;\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--dsw-alias-interactive-bg-active);\n'
        + '  transition: background 150ms ease;\n'
        + '}\n'
        + '.lcars-switch-knob {\n'
        + '  position: absolute;\n'
        + '  top: 2px;\n'
        + '  left: 2px;\n'
        + '  width: 10px;\n'
        + '  height: 10px;\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '  background: var(--dsw-alias-label-tertiary);\n'
        + '  transition: transform 150ms ease, background 150ms ease;\n'
        + '}\n'
        + '.lcars-switch[aria-checked="true"] .lcars-switch-track {\n'
        + '  background: color-mix(in srgb, var(--lcars-accent) 40%, transparent);\n'
        + '}\n'
        + '.lcars-switch[aria-checked="true"] .lcars-switch-knob {\n'
        + '  transform: translateX(12px);\n'
        + '  background: var(--lcars-accent);\n'
        + '}\n'
        + '@media (hover: hover) {\n'
        + '  .lcars-switch:not(:disabled):hover {\n'
        + '    background: var(--dsw-alias-interactive-bg-hover);\n'
        + '  }\n'
        + '}\n'
        + '@media (prefers-reduced-motion: reduce) {\n'
        + '  .lcars-switch-track, .lcars-switch-knob { transition: none; }\n'
        + '}\n'
        + '.lcars-note {\n'
        + '  font-size: 12px;\n'
        + '  line-height: 18px;\n'
        + '  color: var(--dsw-alias-label-caption);\n'
        + '}\n'
        // The theme's own settings page (Settings › LCARS theme). It is a normal
        // settings section, so it draws its own heading and cards instead of
        // borrowing a General row's chrome.
        + '\n/* ---------- 5b. theme settings page ---------- */\n'
        + '.lcars-page {\n'
        + '  display: flex;\n'
        + '  flex-direction: column;\n'
        + '  gap: 16px;\n'
        + '  padding: 8px 0 16px;\n'
        + '  font-size: 13px;\n'
        + '  line-height: 22px;\n'
        + '  color: var(--dsw-alias-label-primary);\n'
        + '}\n'
        + '.lcars-page-head {\n'
        + '  display: flex;\n'
        + '  flex-direction: column;\n'
        + '  gap: 2px;\n'
        + '}\n'
        + '.lcars-page-title {\n'
        + '  font-size: 16px;\n'
        + '  line-height: 24px;\n'
        + '  font-weight: 500;\n'
        + '}\n'
        + '.lcars-page-sub {\n'
        + '  font-size: 12px;\n'
        + '  line-height: 18px;\n'
        + '  color: var(--dsw-alias-label-tertiary);\n'
        + '}\n'
        + '.lcars-card {\n'
        + '  display: flex;\n'
        + '  flex-direction: column;\n'
        + '  gap: 10px;\n'
        + '  padding: 12px 16px;\n'
        + '  border: 0.5px solid var(--dsw-alias-settings-card-stroke);\n'
        + '  border-radius: var(--dsw-radius-xl);\n'
        + '  background: var(--dsw-alias-settings-card-fill);\n'
        + '}\n'
        + '.lcars-card-title {\n'
        + '  font-size: 13px;\n'
        + '  line-height: 22px;\n'
        + '  font-weight: 500;\n'
        + '}\n'
        + '.lcars-card-hint {\n'
        + '  font-size: 12px;\n'
        + '  line-height: 18px;\n'
        + '  color: var(--dsw-alias-label-tertiary);\n'
        + '}\n'
        + '.lcars-color-grid {\n'
        + '  display: grid;\n'
        + '  grid-template-columns: repeat(2, minmax(0, 1fr));\n'
        + '  gap: 6px 18px;\n'
        + '}\n'
        + '.lcars-color-row {\n'
        + '  display: flex;\n'
        + '  align-items: center;\n'
        + '  gap: 8px;\n'
        + '  min-width: 0;\n'
        + '  min-height: 32px;\n'
        + '}\n'
        + '.lcars-color-name {\n'
        + '  flex: 1;\n'
        + '  min-width: 0;\n'
        + '  font-size: 13px;\n'
        + '  color: var(--dsw-alias-label-secondary);\n'
        + '}\n'
        + '.lcars-color-swatch {\n'
        + '  flex: none;\n'
        + '  width: 18px;\n'
        + '  height: 18px;\n'
        + '  border-radius: 4px;\n'
        + '  corner-shape: round;\n'
        + '  border: 0.5px solid var(--dsw-alias-border-l3);\n'
        + '}\n'
        + '.lcars-color-input {\n'
        + '  flex: none;\n'
        + '  width: 30px;\n'
        + '  height: 24px;\n'
        + '  padding: 0;\n'
        + '  border: 0.5px solid var(--dsw-alias-border-l4);\n'
        + '  border-radius: 6px;\n'
        + '  background: transparent;\n'
        + '  cursor: pointer;\n'
        + '}\n'
        + '.lcars-color-input::-webkit-color-swatch-wrapper { padding: 2px; }\n'
        + '.lcars-color-input::-webkit-color-swatch { border: none; border-radius: 4px; }\n'
        + '.lcars-color-reset {\n'
        + '  flex: none;\n'
        + '  height: 24px;\n'
        + '  padding: 0 8px;\n'
        + '  border: 0.5px solid var(--dsw-alias-border-l3);\n'
        + '  border-radius: 999px;\n'
        + '  corner-shape: round;\n'
        + '  background: transparent;\n'
        + '  font: inherit;\n'
        + '  font-size: 11px;\n'
        + '  color: var(--dsw-alias-label-tertiary);\n'
        + '  cursor: pointer;\n'
        + '}\n'
        + '@media (hover: hover) {\n'
        + '  .lcars-color-reset:hover { background: var(--dsw-alias-interactive-bg-hover); }\n'
        + '}\n'
        + '.lcars-font-grid {\n'
        + '  display: flex;\n'
        + '  flex-wrap: wrap;\n'
        + '  gap: 8px;\n'
        + '}\n'
    }

    /* ------------------------------------------------------------------ *
     * Copy
     * ------------------------------------------------------------------ */
    const LOCALE_EN = {
      'settings.nav': 'LCARS theme',
      'settings.title': 'LCARS theme',
      'settings.subtitle': 'The console palette, its solid blocks and the navigation face. The black console ignores the light/dark appearance setting.',
      'settings.groupPalette': 'Colour series',
      'settings.groupColors': 'Block colours',
      'settings.groupColorsHint': 'Recolour each solid block of the console. “Default” falls back to the current colour series.',
      'settings.groupFont': 'Sidebar face',
      'settings.groupFontHint': 'Face used by the navigation column and its rows.',
      'settings.groupDisplay': 'Console details',
      'settings.switches': 'Console details',
      'settings.surface': 'Black console',
      'settings.chrome': 'Console chrome',
      'settings.readout': 'Stardate readout',
      'settings.unavailable': 'Settings cannot be saved in this profile.',
      'palette.blueprint': 'Blue console',
      'palette.tng': '2369 series',
      'palette.classic': '2375 series',
      'palette.early': '2357 series',
      'palette.nemesis': '2379 series',
      'color.frame': 'Frame / top bar',
      'color.logo': 'Brand block',
      'color.primary': 'New conversation',
      'color.row': 'Navigation rows',
      'color.workspace': 'Workspace row',
      'color.session': 'Session rows',
      'color.selected': 'Current session',
      'color.reset': 'Default',
      'font.lcars': 'LCARS GTJ3',
      'font.condensed': 'Condensed',
      'font.system': 'System font',
      'readout.stardate': 'Stardate',
    }

    const LOCALE_ZH = {
      'settings.nav': 'LCARS 主题',
      'settings.title': 'LCARS 主题',
      'settings.subtitle': '控制台配色、实心色块与导航列字体。打开「黑色控制台」时不跟随「外观」的浅色/深色设置。',
      'settings.groupPalette': '配色系列',
      'settings.groupColors': '色块颜色',
      'settings.groupColorsHint': '逐个调整控制台的实心色块；点「默认」回到当前配色。',
      'settings.groupFont': '侧边栏字体',
      'settings.groupFontHint': '导航列及其行使用的字体。',
      'settings.groupDisplay': '控制台细节',
      'settings.switches': '控制台细节',
      'settings.surface': '黑色控制台',
      'settings.chrome': '控制台装饰',
      'settings.readout': '星历读数',
      'settings.unavailable': '此 profile 无法保存这些设置。',
      'palette.blueprint': '蓝色控制台',
      'palette.tng': '2369 系列',
      'palette.classic': '2375 系列',
      'palette.early': '2357 系列',
      'palette.nemesis': '2379 系列',
      'color.frame': '框架 / 顶栏',
      'color.logo': '品牌块',
      'color.primary': '新会话',
      'color.row': '导航插件行',
      'color.workspace': '工作区行',
      'color.session': '会话行',
      'color.selected': '当前会话',
      'color.reset': '默认',
      'font.lcars': 'LCARS GTJ3',
      'font.condensed': '主题窄体',
      'font.system': '系统字体',
      'readout.stardate': '星历',
    }

    /* ------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------ */

    /**
     * Normalize a stored section onto the shape this build understands.
     * @param {unknown} value - accepted config section or undefined.
     * @returns {{palette: string, surface: string, chrome: boolean, readout: boolean,
     *   sidebarFont: string, colorFrame: string, colorLogo: string, colorPrimary: string,
     *   colorRow: string, colorWorkspace: string, colorSession: string,
     *   colorSelected: string}} frozen preferences.
     */
    function normalizePrefs(value) {
      const section = value !== null && typeof value === 'object' ? value : {}
      const palette = PALETTE_IDS.indexOf(section.palette) >= 0 ? section.palette : DEFAULT_PALETTE
      const color = (name) => {
        const raw = section[name]
        return typeof raw === 'string' && COLOR_PATTERN.test(raw) ? raw.toLowerCase() : ''
      }
      return Object.freeze({
        palette,
        // 'console' is the black ship console the theme is named after; 'auto'
        // follows the Appearance preference (light = PADD daylight).
        surface: section.surface === 'auto' ? 'auto' : 'console',
        chrome: section.chrome !== false,
        readout: section.readout !== false,
        // The console face is the shipped look; the other two are alternatives
        // offered by the section page.
        sidebarFont: SIDEBAR_FONTS.indexOf(section.sidebarFont) >= 0 ? section.sidebarFont : 'lcars',
        colorFrame: color('colorFrame'),
        colorLogo: color('colorLogo'),
        colorPrimary: color('colorPrimary'),
        colorRow: color('colorRow'),
        colorWorkspace: color('colorWorkspace'),
        colorSession: color('colorSession'),
        colorSelected: color('colorSelected'),
      })
    }

    /**
     * The palette's own colour for each navigation role, as `#rrggbb`, mirroring
     * the fallbacks of `sideDeclarations()` for the colour pickers.
     * @param {string} paletteId - one of PALETTE_IDS.
     * @returns {Record<string, string>} role → hex, in COLOR_ROLES order.
     */
    function paletteRoleColors(paletteId) {
      const series = PALETTES[paletteId] ?? PALETTES[DEFAULT_PALETTE]
      const dark = series.dark
      const side = series.sidebar ?? {}
      const block2 = dark['block-2']
      const block4 = dark['block-4']
      const mix = (hex, other, weight) => {
        const parse = (value) => {
          const int = parseInt(value.slice(1), 16)
          return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
        }
        const from = parse(hex)
        const onto = parse(other)
        const channel = (index) => Math.round(from[index] * weight + onto[index] * (1 - weight))
        return '#' + [0, 1, 2].map((index) => channel(index).toString(16).padStart(2, '0')).join('')
      }
      return {
        frame: side.frame ?? block2,
        logo: side.logo ?? block2,
        primary: side.primary ?? dark['accent-bright'],
        row: side.row ?? block2,
        workspace: side.workspace ?? mix(block4, '#ffffff', 0.55),
        session: side.session ?? mix(block4, '#000000', 0.26),
        selected: side.selected ?? block2,
      }
    }

    /**
     * TNG-era stardate for one moment: 41000 at New Year, 42000 at the next one.
     * @param {Date} now - moment to convert.
     * @returns {string} five digits and one decimal, as in a console readout.
     */
    function stardate(now) {
      const year = now.getFullYear()
      const start = Date.UTC(year, 0, 1)
      const end = Date.UTC(year + 1, 0, 1)
      const fraction = (now.getTime() - start) / (end - start)
      return (41000 + fraction * 1000).toFixed(1)
    }

    /**
     * Zero-padded 24 hour clock.
     * @param {Date} now - moment to format.
     * @returns {string} `HH:MM`.
     */
    function clock(now) {
      const pad = (value) => (value < 10 ? '0' + value : String(value))
      return pad(now.getHours()) + ':' + pad(now.getMinutes())
    }

    /**
     * Mount the theme for one plugin run.
     * @param {any} ctx - client cordis context.
     */
    function apply(ctx) {
      const theme = ctx.get('theme')
      if (theme === undefined || typeof theme.overrideTokens !== 'function') return
      if (typeof document === 'undefined') return

      // A second mount of the SAME build is the boot loader and the cordis
      // composition racing: the first owner keeps the sheet. A different build
      // means the module was swapped into a live page without a dispose, so the
      // stale sheet is dropped and this run takes over.
      if (window[CLAIM] !== undefined) {
        if (window[CLAIM] === BUILD_MARKER) return
        for (const node of document.querySelectorAll('style[data-plugin="' + SHEET_ATTR + '"]')) node.remove()
      }
      window[CLAIM] = BUILD_MARKER

      const React = typeof require === 'function' ? require('react') : undefined
      const h = React === undefined ? undefined : React.createElement

      /* ---------- copy ---------- */
      const locale = ctx.get('locale')
      let localeReady = false
      let t = (key) => (Object.prototype.hasOwnProperty.call(LOCALE_EN, key) ? LOCALE_EN[key] : key)
      if (locale !== undefined && typeof locale.register === 'function' && typeof locale.bind === 'function') {
        try {
          ctx.effect(() => locale.register(NS, { en: LOCALE_EN, zh: LOCALE_ZH }))
        } catch {
          // A previous build of this bundle was swapped in place without a
          // dispose: its dictionaries are still registered, and the service
          // rejects the duplicate. Binding below still works.
        }
        const bound = locale.bind(NS)
        if (typeof bound === 'function') {
          t = bound
          localeReady = true
        }
      }

      /* ---------- durable switches ---------- */
      let form
      const forms = ctx.get('configForms')
      if (forms !== undefined && typeof forms.get === 'function') {
        try {
          form = forms.get(ENTRY_ID)
        } catch {
          form = undefined
        }
      }
      let prefs = normalizePrefs(form === undefined ? undefined : form.getSnapshot().value)
      const listeners = new Set()
      const publish = () => {
        for (const listener of [...listeners]) {
          try {
            listener()
          } catch {
            /* one crashed subscriber must not stop the others */
          }
        }
      }
      const getPrefs = () => prefs
      const subscribePrefs = (listener) => {
        listeners.add(listener)
        return () => { listeners.delete(listener) }
      }
      const writePref = (field, value) => {
        prefs = normalizePrefs({ ...prefs, [field]: value })
        // Repaint first, then persist: the palette is a body attribute, so the
        // click shows immediately instead of after the settings round trip. The
        // durable section stays the authority — its echo repaints the row again,
        // and a refusal restores the stored value.
        syncDocument()
        applySurface()
        publish()
        if (form === undefined) return
        try {
          form.set(field, value).catch(() => {})
        } catch {
          /* form disposed between render and click */
        }
      }
      // A colour picker streams values while the user drags it. Repaint on every
      // change, but coalesce the writes so the settings service is not flooded.
      const colorTimers = new Map()
      const writeColor = (field, value) => {
        prefs = normalizePrefs({ ...prefs, [field]: value })
        syncDocument()
        publish()
        if (form === undefined) return
        const persist = () => {
          try {
            form.set(field, value).catch(() => {})
          } catch {
            /* form disposed between render and change */
          }
        }
        if (typeof setTimeout !== 'function') {
          persist()
          return
        }
        const pending = colorTimers.get(field)
        if (pending !== undefined) clearTimeout(pending)
        colorTimers.set(field, setTimeout(() => {
          colorTimers.delete(field)
          persist()
        }, 250))
      }

      /**
       * Point the theme preference at the registered dark console, or hand it
       * back to the Appearance preference when the surface switch says 'auto'.
       * Never throws: a refused write leaves the previous preference in place.
       */
      const applySurface = () => {
        if (typeof theme.setTheme !== 'function' || typeof theme.getTheme !== 'function') return
        let preference
        try {
          preference = theme.getTheme().preference
        } catch {
          return
        }
        const want = prefs.surface === 'console' ? THEME_ID : 'system'
        if (preference === want) return
        if (want === 'system' && preference !== THEME_ID) return
        try {
          theme.setTheme(want)
        } catch {
          /* not registered yet, or the preference is not writable */
        }
      }

      /* ---------- document ---------- */
      const syncDocument = () => {
        const body = document.body
        if (body === null) return
        body.setAttribute('data-lcars', prefs.palette)
        if (prefs.chrome) body.setAttribute('data-lcars-chrome', '')
        else body.removeAttribute('data-lcars-chrome')
        if (prefs.readout) body.setAttribute('data-lcars-readout', '')
        else body.removeAttribute('data-lcars-readout')
        if (prefs.surface === 'console') body.setAttribute('data-lcars-console', '')
        else body.removeAttribute('data-lcars-console')
        // Sidebar face: the stylesheet keys its three stacks off this attribute,
        // so a switch repaints without re-registering anything.
        body.setAttribute('data-lcars-sidefont', prefs.sidebarFont)
        // Per-block recolouring: the palette blocks declare the role variables on
        // `body[data-lcars=…]`, which the inline style on the same element wins
        // over. An empty field hands the role back to the palette.
        for (const { field, role } of COLOR_ROLES) {
          const value = prefs[field]
          if (value === '') {
            body.style.removeProperty('--lcars-side-' + role)
            body.style.removeProperty('--lcars-side-on-' + role)
          } else {
            body.style.setProperty('--lcars-side-' + role, value)
            body.style.setProperty('--lcars-side-on-' + role, lettering(value))
          }
        }
        // The filler panel's caption is a CSS string property: the browser lays
        // out the glyphs, the client only supplies the stardate.
        body.style.setProperty('--lcars-stardate-text', '"STARDATE ' + stardate(new Date()) + '"')
      }

      /* ---------- ownership ----------
         Registered before the mount: whatever fails while mounting is still
         released when this fiber is disposed, so a half-applied theme cannot
         leave a sheet, a token layer or body attributes behind in the page. */
      let sheet
      let disposeTokens = () => {}
      let disposeTheme = () => {}
      let menuSkin
      let menuObserver
      let endRowObserver
      let endRowListener
      let headerObserver
      ctx.effect(() => () => {
        listeners.clear()
        for (const pending of colorTimers.values()) {
          if (typeof clearTimeout === 'function') clearTimeout(pending)
        }
        colorTimers.clear()
        try {
          disposeTokens()
        } catch {
          /* the theme service is gone with the client tree */
        }
        try {
          disposeTheme()
        } catch {
          /* the theme registry is gone with the client tree */
        }
        if (sheet !== undefined && sheet.parentNode !== null) sheet.parentNode.removeChild(sheet)
        const body = document.body
        if (body !== null && body !== undefined) {
          body.removeAttribute('data-lcars')
          body.removeAttribute('data-lcars-chrome')
          body.removeAttribute('data-lcars-readout')
          body.removeAttribute('data-lcars-console')
          body.removeAttribute('data-lcars-sidefont')
          body.style.removeProperty('--lcars-stardate-text')
          for (const { role } of COLOR_ROLES) {
            body.style.removeProperty('--lcars-side-' + role)
            body.style.removeProperty('--lcars-side-on-' + role)
          }
        }
        if (menuObserver !== undefined) menuObserver.disconnect()
        if (menuSkin !== undefined && menuSkin.parentNode !== null) menuSkin.parentNode.removeChild(menuSkin)
        if (endRowObserver !== undefined) endRowObserver.disconnect()
        if (headerObserver !== undefined) headerObserver.disconnect()
        if (endRowListener !== undefined && typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
          window.removeEventListener('resize', endRowListener)
        }
        {
          const body = document.body
          if (body !== null && body !== undefined) {
            body.style.removeProperty('--lcars-brand-half')
            body.style.removeProperty('--lcars-foot-half')
            body.style.removeProperty('--lcars-row-half')
            body.style.removeProperty('--lcars-sidebar-w')
            body.style.removeProperty('--lcars-tail-left')
            body.style.removeProperty('--lcars-logo-h')
          }
        }
        if (window[CLAIM] === BUILD_MARKER) delete window[CLAIM]
      }, 'lcars: document ownership')

      try {
        syncDocument()
        const sheetNode = document.createElement('style')
        sheetNode.setAttribute('data-plugin', SHEET_ATTR)
        sheetNode.textContent = buildStylesheet()
        ;(document.head ?? document.documentElement).appendChild(sheetNode)
        sheet = sheetNode
        disposeTokens = theme.overrideTokens(TOKEN_SOURCE, tokenOverrides())

          // Register the console as a real dark theme so the app itself switches
          // to its dark component styles (icons, code themes, native chrome) and
          // the black console is not just a repaint. A stale build may already
          // own the id; that registration works for setTheme all the same.
          try {
            disposeTheme = theme.register({ id: THEME_ID, colorScheme: 'dark', tokens: {} })
          } catch {
            disposeTheme = () => {}
          }
          applySurface()

          /* ---------- the Windows caption menu ----------
             Its two items live in a shadow root, out of reach of document styles;
             the skin is appended inside that root. Only the shape is hard-coded
             there — the fills/inks are document custom properties, so a palette or
             scheme change repaints the menu without re-injection. */
          const MENU_SKIN = ''
            + '[role=menubar] { gap: 6px; padding: 0 2px; }\n'
            + 'button { height: 26px; padding: 0 12px; border-radius: 8px;\n'
            + '  font-family: var(--lcars-font-ui, var(--dsw-font-family, sans-serif));\n'
            + '  background: var(--lcars-menu-item-fill, #3686ff);\n'
            + '  color: var(--lcars-menu-item-ink, #0a0a0a); }\n'
            + 'button:hover, button[aria-expanded=true] {\n'
            + '  background: var(--lcars-menu-item-hover, #8bdbfd);\n'
            + '  color: var(--lcars-menu-item-ink, #0a0a0a); }\n'
            + 'button:focus-visible {\n'
            + '  outline: 2px solid var(--lcars-menu-item-hover, #8bdbfd); outline-offset: -2px; }\n'
          const findMenu = () => {
            const nodes = typeof document.querySelectorAll === 'function'
              ? document.querySelectorAll('[data-windows-menu]') : []
            return nodes.length > 0 ? nodes[0] : undefined
          }
          const installMenuSkin = () => {
            const host = findMenu()
            if (host === undefined || host.shadowRoot === null || host.shadowRoot === undefined) return false
            if (host.shadowRoot.querySelector('style[data-lcars]') !== null) return true
            const node = document.createElement('style')
            node.setAttribute('data-lcars', '')
            node.textContent = MENU_SKIN
            host.shadowRoot.appendChild(node)
            menuSkin = node
            return true
          }
          // The preload may mount the menu after this plugin; watch for it once.
          if (!installMenuSkin() && typeof MutationObserver !== 'undefined' && document.body != null) {
            const observer = new MutationObserver(() => {
              try {
                measureEndRows()
              } catch {
                /* layout not ready */
              }
              if (installMenuSkin()) observer.disconnect()
            })
            observer.observe(document.body, { childList: true, subtree: true })
            menuObserver = observer
          }

          /* ---------- half-height curvature for the two end rows ----------
             The swatch rounds its end at half the block height. Both rows have
             elastic heights, so they are measured and the halves published as
             custom properties; the stylesheet's fallbacks cover the first paint. */
          const endRowSelector = '[class*="_logoRow"], [class*="_footArea"], [class*="_sessionRow"]'
          const endRows = () => (typeof document.querySelectorAll === 'function'
            ? document.querySelectorAll(endRowSelector) : [])
          const measureEndRows = () => {
            const body = document.body
            if (body === null || body === undefined) return
            // The bar must meet the profile block exactly, so publish that edge too
            // (viewport coordinates: the bar is fixed).
            if (typeof document.querySelectorAll === 'function') {
              for (const foot of document.querySelectorAll('[class*="_footArea"]')) {
                if (typeof foot.getBoundingClientRect !== 'function') continue
                const right = foot.getBoundingClientRect().right
                if (right > 0) body.style.setProperty('--lcars-tail-left', right.toFixed(1) + 'px')
              }
            }
            // The tail is anchored on the column edge, so publish the column width.
            if (typeof document.querySelectorAll === 'function') {
              for (const column of document.querySelectorAll('[class*="_sidebarCol"]')) {
                if (typeof column.getBoundingClientRect !== 'function') continue
                const columnWidth = column.getBoundingClientRect().width
                if (columnWidth > 0) body.style.setProperty('--lcars-sidebar-w', columnWidth.toFixed(1) + 'px')
              }
            }
            // The conversation frame is drawn in the overlay (viewport coordinates:
            // it is fixed). Its top edge is the brand block's top edge — the same line
            // as the session-title block — and its bottom is the panel's bottom minus
            // the tuned inset. The transcript root is then clipped to that same box,
            // so text scrolling up stops at the frame while the header above the root
            // stays untouched. Measured after the brand-top shift so the row's rect is
            // already at its final place.
            if (typeof document.querySelectorAll === 'function') {
              const style = typeof getComputedStyle === 'function' ? getComputedStyle(body) : undefined
              const cssBottom = style === undefined ? NaN : parseFloat(style.getPropertyValue('--lcars-frame-inset-bottom'))
              const insetBottom = Number.isFinite(cssBottom) ? cssBottom : 38
              const brandRow = typeof document.querySelector === 'function'
                ? document.querySelector('[class*="_logoRow"]') : undefined
              for (const panel of document.querySelectorAll('[class*="_mainPanel"]')) {
                if (typeof panel.getBoundingClientRect !== 'function') continue
                const rect = panel.getBoundingClientRect()
                if (!(rect.width > 0 && rect.height > 0)) continue
                const brandTop = brandRow !== null && brandRow !== undefined && typeof brandRow.getBoundingClientRect === 'function'
                  ? brandRow.getBoundingClientRect().top : NaN
                // The frame's top line is the logo block's top edge (the brand row is
                // lifted 5px above the header blocks by the brand-top pass, so the
                // blocks keep a 5px gap under the line).
                const frameTop = Number.isFinite(brandTop) && brandTop > 0 ? brandTop : rect.top
                const frameBottom = rect.top + rect.height - insetBottom
                body.style.setProperty('--lcars-frame-left', rect.left.toFixed(1) + 'px')
                body.style.setProperty('--lcars-frame-top', frameTop.toFixed(1) + 'px')
                body.style.setProperty('--lcars-frame-w', rect.width.toFixed(1) + 'px')
                body.style.setProperty('--lcars-frame-h', Math.max(0, frameBottom - frameTop).toFixed(1) + 'px')
                for (const root of document.querySelectorAll('[class*="_root"][data-phase]')) {
                  if (typeof root.getBoundingClientRect !== 'function') continue
                  const rootRect = root.getBoundingClientRect()
                  if (!(rootRect.height > 0)) continue
                  const top = Math.max(0, frameTop - rootRect.top)
                  const bottom = Math.max(0, rootRect.bottom - frameBottom)
                  body.style.setProperty('--lcars-root-inset-top', top.toFixed(1) + 'px')
                  body.style.setProperty('--lcars-root-inset-bottom', bottom.toFixed(1) + 'px')
                }
              }
            }
            // The brand block's top must sit on the session-title block's top. The
            // title block is centred inside the header, so its edge is measured
            // against the row's own natural top (row top minus the margin we apply)
            // and the difference is published for the stylesheet.
            if (typeof document.querySelector === 'function' && typeof getComputedStyle === 'function') {
              const title = document.querySelector('[class*="_header"] [class*="_crumbs"]')
              const brand = document.querySelector('[class*="_logoRow"]')
              if (title !== null && title !== undefined && brand !== null && brand !== undefined
                && typeof title.getBoundingClientRect === 'function'
                && typeof brand.getBoundingClientRect === 'function') {
                const applied = parseFloat(getComputedStyle(brand).marginTop)
                const base = brand.getBoundingClientRect().top - (Number.isFinite(applied) ? applied : 0)
                // 5px above the title block: the frame's top line rides the brand
                // block's top edge, and the header blocks keep their 5px gap under it.
                const delta = title.getBoundingClientRect().top - base - 5
                if (Number.isFinite(delta)) {
                  body.style.setProperty('--lcars-brand-top', delta.toFixed(1) + 'px')
                }
              }
            }
            // The foot block's painted right edge has to land on the navigation rows'
            // right edge. Its own width is set from the widest row instead of a margin,
            // so the fill ends exactly there (the app's footer padding differs from the
            // rows' by more than the CSS margins can express). A column-edge fallback
            // covers builds where the row selectors match nothing, and the width rule
            // carries !important so an app-side inline width cannot win.
            if (typeof document.querySelectorAll === 'function') {
              let rowsRight = 0
              const rowSelectors = ['[class*="_panelEntry"]', '[class*="_newSession"]', '[class*="_sessionRow"]']
              for (const selector of rowSelectors) {
                for (const row of document.querySelectorAll(selector)) {
                  if (typeof row.getBoundingClientRect !== 'function') continue
                  const right = row.getBoundingClientRect().right
                  if (right > rowsRight) rowsRight = right
                }
                if (rowsRight > 0) break
              }
              if (!(rowsRight > 0)) {
                for (const column of document.querySelectorAll('[class*="_sidebarCol"]')) {
                  if (typeof column.getBoundingClientRect !== 'function') continue
                  const columnRight = column.getBoundingClientRect().right
                  if (columnRight > 0) rowsRight = columnRight - 16
                }
              }
              for (const foot of document.querySelectorAll('[class*="_footArea"]')) {
                if (typeof foot.getBoundingClientRect !== 'function') continue
                const footLeft = foot.getBoundingClientRect().left
                if (rowsRight > 0 && footLeft > 0) {
                  // 27px past the rows' edge (28 − 1): the block reaches out toward the
                  // column edge (the column clips anything beyond it).
                  const width = rowsRight + 27 - footLeft
                  if (Number.isFinite(width) && width > 0) {
                    body.style.setProperty('--lcars-foot-w', width.toFixed(1) + 'px')
                  }
                }
              }
            }
            for (const row of endRows()) {
              if (typeof row.getBoundingClientRect !== 'function' || typeof row.className !== 'string') continue
              const height = row.getBoundingClientRect().height
              if (!(height > 0)) continue
              const name = row.className.includes('_logoRow')
                ? '--lcars-brand-half'
                : row.className.includes('_footArea') ? '--lcars-foot-half' : '--lcars-row-half'
              body.style.setProperty(name, (height / 2).toFixed(1) + 'px')

            }
          }
          measureEndRows()
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(measureEndRows)

          /* ---------- header chips ----------
             The action entries beside the title come from several packages with
             per-build class names, so they are marked by position instead: the
             stylesheet colours [data-lcars-chip]. A debounced mutation pass keeps
             the marks current when a count appears or the header re-renders. */
          const markHeaderChips = () => {
            if (typeof document.querySelectorAll !== 'function') return
            for (const header of document.querySelectorAll('[class*="_header"]')) {
              if (typeof header.querySelector !== 'function') continue
              if (header.querySelector('[class*="_titleRow"]') === null) continue
              for (const group of header.querySelectorAll('[class*="_headerActions"]')) {
                if (group.children === null || group.children === undefined) continue
                // The entries wrap their real trigger; mark the trigger so the
                // chip styles land on the painted element.
                const triggers = typeof group.querySelectorAll === 'function'
                  ? group.querySelectorAll('button, a, [role="button"]') : []
                const targets = triggers.length > 0 ? triggers : group.children
                let index = 0
                for (const target of targets) {
                  if (typeof target.setAttribute === 'function') target.setAttribute('data-lcars-chip', String(index))
                  index += 1
                }
              }
            }
          }
          markHeaderChips()
          if (typeof requestAnimationFrame === 'function') requestAnimationFrame(markHeaderChips)
          if (typeof MutationObserver !== 'undefined' && document.body !== null && document.body !== undefined) {
            let chipFrame
            // The layout is remeasured on the same debounced pass: the sidebar (and
            // with it the foot block and the session title) mounts after this plugin,
            // so the first measurement runs before those nodes exist.
            headerObserver = new MutationObserver(() => {
              if (chipFrame !== undefined) return
              if (typeof requestAnimationFrame !== 'function') { markHeaderChips(); measureEndRows(); return }
              chipFrame = requestAnimationFrame(() => {
                chipFrame = undefined
                markHeaderChips()
                measureEndRows()
              })
            })
            headerObserver.observe(document.body, { childList: true, subtree: true })
          }
          if (typeof ResizeObserver !== 'undefined' && typeof document.querySelectorAll === 'function') {
            endRowObserver = new ResizeObserver(measureEndRows)
            for (const column of document.querySelectorAll('[class*="_sidebarCol"]')) {
              try {
                endRowObserver.observe(column)
              } catch {
                /* an element this observer can watch */
              }
            }
            for (const row of endRows()) {
              try {
                endRowObserver.observe(row)
              } catch {
                /* not an element this observer can watch */
              }
            }
          }
          if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('resize', measureEndRows)
            endRowListener = measureEndRows
          }

        if (form !== undefined && typeof form.subscribe === 'function') {
          ctx.effect(() => form.subscribe(() => {
            prefs = normalizePrefs(form.getSnapshot().value)
            syncDocument()
            applySurface()
            publish()
          }), 'lcars: settings adoption')
        }

        /* ---------- components ---------- */
        const slots = ctx.get('slots')

        /**
         * Subscribe a slot component to the switch store.
         * @returns {{palette: string, chrome: boolean, readout: boolean}} current switches.
         */
        function usePrefs() {
          return React.useSyncExternalStore(subscribePrefs, getPrefs, getPrefs)
        }

        /**
         * Stardate chip under the composer: LCARS identification block, stardate,
         * local clock and the segmented tail bar. A compact dock chip, not a
         * full-width bar: the composer dock is a centred row that also carries
         * the shipped activity and usage entries. The segmented tail is the only
         * shrinkable part, so a narrow composer shortens the bars instead of
         * clipping a cell mid-glyph.
         * @returns {any} the strip element, or null while the switch is off.
         */
        function Readout() {
          const current = usePrefs()
          const [now, setNow] = React.useState(() => new Date())
          React.useEffect(() => {
            const timer = setInterval(() => setNow(new Date()), 15000)
            return () => clearInterval(timer)
          }, [])
          if (!current.readout) return null
          // The box is a pale readout panel: stardate and clock only, no cap and
          // no id chip.
          return h('div', { className: 'lcars-readout', 'aria-hidden': 'true' },
            h('span', { className: 'lcars-readout-cell' }, t('readout.stardate') + ' ' + stardate(now)),
            h('span', { className: 'lcars-readout-rule' }),
            h('span', { className: 'lcars-readout-cell' }, clock(now)),
            h('span', { className: 'lcars-readout-tail' }),
          )
        }

        /**
         * The persistent bottom bar: a frame-coloured tail anchored on the navigation
         * column, and a grey console box on the right that carries the stardate
         * readout. It is registered in the frame-wide overlay slot, which sits
         * outside every column scroll container, so scrolling the conversation or
         * hiding the composer leaves it in place.
         * @returns {any} the bar element, or null while the chrome switch is off.
         */
        function TailBar() {
          const current = usePrefs()
          if (!current.chrome) return null
          return h('div', { className: 'lcars-tail', 'aria-hidden': 'true' },
            h('span', { className: 'lcars-conf-frame' }),
            h('span', { className: 'lcars-tail-bar' }),
            h('span', { className: 'lcars-tail-box' }, h(Readout)),
          )
        }

        /**
         * The theme's own settings page (Settings › LCARS theme): the colour
         * series, one colour per solid block, the sidebar face and the console
         * switches. Values are written through the shared config form, so the
         * profile owns them and a page reload restores the same console.
         * @returns {any} the page element.
         */
        function SettingsSection() {
          const current = usePrefs()
          const snapshot = form === undefined ? undefined : form.getSnapshot()
          // 'loading' is not 'unavailable': the settings mirror is still in
          // flight and the page is disabled for a moment. Only a settled-but-
          // read-only or absent namespace means the settings cannot be saved.
          const status = snapshot === undefined ? 'unavailable' : snapshot.status
          const writable = status === 'ready' && snapshot.writable === true
          const paletteRoles = paletteRoleColors(current.palette)
          const isOn = (field) => (field === 'surface' ? current.surface === 'console' : current[field] === true)
          const nextValue = (field) => {
            if (field === 'surface') return current.surface === 'console' ? 'auto' : 'console'
            return !current[field]
          }
          const switchButton = (field, label) => h('button', {
            type: 'button',
            role: 'switch',
            className: 'lcars-switch',
            'aria-checked': isOn(field),
            disabled: !writable,
            onClick: () => { writePref(field, nextValue(field)) },
          },
          h('span', { className: 'lcars-switch-track' }, h('span', { className: 'lcars-switch-knob' })),
          label)
          const colorRow = ({ field, role }) => h('div', { className: 'lcars-color-row', key: role },
            h('span', { className: 'lcars-color-name' }, t('color.' + role)),
            // The swatch reads the live variable, so it also previews a value
            // painted by the palette when no override is stored.
            h('span', { className: 'lcars-color-swatch', style: { background: 'var(--lcars-side-' + role + ')' } }),
            h('input', {
              type: 'color',
              className: 'lcars-color-input',
              'aria-label': t('color.' + role),
              value: current[field] === '' ? paletteRoles[role] : current[field],
              disabled: !writable,
              onChange: (event) => { writeColor(field, event.target.value) },
            }),
            current[field] === ''
              ? null
              : h('button', {
                type: 'button',
                className: 'lcars-color-reset',
                disabled: !writable,
                onClick: () => { writeColor(field, '') },
              }, t('color.reset')),
          )
          return h('div', { className: 'lcars-page' },
            h('div', { className: 'lcars-page-head' },
              h('div', { className: 'lcars-page-title' }, t('settings.title')),
              h('div', { className: 'lcars-page-sub' }, t('settings.subtitle')),
            ),
            h('section', { className: 'lcars-card' },
              h('div', { className: 'lcars-card-title' }, t('settings.groupPalette')),
              h('div', { className: 'lcars-chip-row', role: 'group', 'aria-label': t('settings.groupPalette') },
                PALETTE_IDS.map((id) => h('button', {
                  key: id,
                  type: 'button',
                  className: 'lcars-chip',
                  'aria-pressed': current.palette === id,
                  disabled: !writable,
                  onClick: () => { writePref('palette', id) },
                },
                // The dot reads a scheme-aware swatch variable, so the preview is
                // the series in the palette the user is looking at, not its twin.
                h('span', { className: 'lcars-dot', style: { background: 'var(--lcars-swatch-' + id + ')' } }),
                t('palette.' + id))),
              ),
            ),
            h('section', { className: 'lcars-card' },
              h('div', { className: 'lcars-card-title' }, t('settings.groupColors')),
              h('div', { className: 'lcars-card-hint' }, t('settings.groupColorsHint')),
              h('div', { className: 'lcars-color-grid' }, COLOR_ROLES.map(colorRow)),
            ),
            h('section', { className: 'lcars-card' },
              h('div', { className: 'lcars-card-title' }, t('settings.groupFont')),
              h('div', { className: 'lcars-card-hint' }, t('settings.groupFontHint')),
              h('div', { className: 'lcars-font-grid', role: 'group', 'aria-label': t('settings.groupFont') },
                SIDEBAR_FONTS.map((id) => h('button', {
                  key: id,
                  type: 'button',
                  className: 'lcars-chip',
                  'aria-pressed': current.sidebarFont === id,
                  disabled: !writable,
                  onClick: () => { writePref('sidebarFont', id) },
                }, t('font.' + id))),
              ),
            ),
            h('section', { className: 'lcars-card' },
              h('div', { className: 'lcars-card-title' }, t('settings.groupDisplay')),
              h('div', { className: 'lcars-switch-row', role: 'group', 'aria-label': t('settings.switches') },
                switchButton('surface', t('settings.surface')),
                switchButton('chrome', t('settings.chrome')),
                switchButton('readout', t('settings.readout')),
              ),
            ),
            status !== 'loading' && !writable
              ? h('div', { className: 'lcars-note' }, t('settings.unavailable'))
              : null,
          )
        }

        if (slots !== undefined && h !== undefined) {
          // `slots.inject` owns the registrations on this context: they retire
          // with the run, and come back when the owning declaration returns.
          // The bar is a frame-wide surface: the overlay layer sits above every column
          // and outside their scroll containers, which is why the tail no longer
          // scrolls away with the conversation.
          slots.inject('shell.overlay', () => slots.register({
            name: 'shell.overlay', id: 'lcars-tail', order: 60,
          }, TailBar))
          // The theme owns a whole settings page (not a General row): the page
          // carries its own heading and groups, so it sits beside the app's other
          // sections in the settings navigation.
          slots.inject('settings.section', () => slots.register({
            name: 'settings.section', id: 'lcars',
            order: 30,
            label: () => t('settings.nav'),
            ...(localeReady ? { locale: NS } : {}),
          }, SettingsSection))
        }

      } catch (error) {
        // Release the claim so a later mount (a reload, or a fresh fiber after
        // a rebuild) can try again instead of finding the page claimed.
        if (window[CLAIM] === BUILD_MARKER) delete window[CLAIM]
        console.warn('[dsh-theme-lcars] theme mount failed:', error)
      }
    }

    exports.name = 'dsh-theme-lcars'
    exports.inject = ['theme', 'slots', 'locale']
    exports.apply = apply
    return module.exports
  },
})
