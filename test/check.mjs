/**
 * Offline harness for the LCARS bundle (not part of the package).
 *
 * Runs the client factory against stubs of window/document/cordis and of the
 * theme, slots, locale and configForms services, then:
 *   1. compiles the bundle and checks both components return an element tree;
 *   2. extracts the generated stylesheet and checks it is balanced CSS;
 *   3. checks WCAG contrast for the palette values in both schemes;
 *   4. imports the host half and confirms the Config schema resolves.
 *
 * usage: node _lcars-check.mjs <package-dir>
 */
import vm from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.argv[2]
if (!root) {
  console.error('usage: node _lcars-check.mjs <package-dir>')
  process.exit(2)
}

const failures = []
const check = (ok, label, detail) => {
  if (ok) return
  failures.push(label + (detail === undefined ? '' : ' — ' + detail))
}

/* ---------------- 1. compile ---------------- */
const clientPath = path.join(root, 'client.js')
const source = fs.readFileSync(clientPath, 'utf8')
let script
try {
  script = new vm.Script(source, { filename: clientPath })
} catch (error) {
  console.error('SYNTAX FAIL client.js:', error.message)
  process.exit(1)
}
console.log('ok  client.js compiles')

/* ---------------- 2. stub DOM + services ---------------- */
class FakeElement {
  constructor(tag) {
    this.tagName = tag
    this.attributes = {}
    this.children = []
    this.parentNode = null
    this.style = {}
    this.textContent = ''
  }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  getAttribute(name) { return this.attributes[name] === undefined ? null : this.attributes[name] }
  removeAttribute(name) { delete this.attributes[name] }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); child.parentNode = null; return child }
  append(...nodes) { nodes.forEach((n) => this.appendChild(n)) }
  remove() { if (this.parentNode !== null) this.parentNode.removeChild(this) }
  querySelectorAll() { return [] }
  attachShadow() {
    this.shadowRoot = new FakeShadowRoot(this)
    return this.shadowRoot
  }
}


/** Minimal open shadow root: enough for the caption menu skin. */
class FakeShadowRoot {
  constructor(host) {
    this.host = host
    this.children = []
  }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); child.parentNode = null; return child }
  querySelector(selector) {
    if (selector === 'style[data-lcars]') {
      return this.children.find((node) => node.tagName === 'style' && 'data-lcars' in node.attributes) ?? null
    }
    return null
  }
}
/** The Desktop preload's caption menu host. */
const menuHost = new FakeElement('div')
menuHost.setAttribute('data-windows-menu', '')
menuHost.attachShadow({ mode: 'open' })

const head = new FakeElement('head')
const body = new FakeElement('body')
const bodyStyle = new Map()
body.style = {
  setProperty(name, value) { bodyStyle.set(name, String(value)) },
  removeProperty(name) { bodyStyle.delete(name) },
  getPropertyValue(name) { return bodyStyle.get(name) ?? '' },
}
const documentElement = new FakeElement('html')
const document = {
  head,
  body,
  documentElement,
  createElement: (tag) => new FakeElement(tag),
  querySelectorAll: (selector) => (selector === '[data-windows-menu]' ? [menuHost] : []),
  addEventListener() {},
  removeEventListener() {},
}

const themeLayer = { source: undefined, tokens: undefined }
const mounted = []
const registered = []
const services = {
  theme: {
    overrideTokens(sourceKey, tokens) {
      themeLayer.source = sourceKey
      themeLayer.tokens = tokens
      return () => {}
    },
    register(definition) {
      themeLayer.registered = definition
      return () => {}
    },
    getTheme() {
      return { preference: themeLayer.preference ?? 'system' }
    },
    setTheme(id) {
      themeLayer.preference = id
    },
  },
  slots: {
    inject(key, callback) {
      mounted.push(key)
      const dispose = callback()
      return dispose
    },
    register(options, component) {
      registered.push({ options, component })
      return () => {}
    },
  },
  locale: {
    register() { return () => {} },
    bind() { return (key) => 'T:' + key },
  },
  configForms: {
    get(ns) {
      check(ns === 'theme-lcars', 'configForms namespace', ns)
      return {
        getSnapshot: () => ({ status: 'ready', writable: true, value: { palette: 'classic', chrome: true, readout: true } }),
        subscribe: () => () => {},
        set: async () => true,
      }
    },
  },
}

const effects = []
const ctx = {
  get(name) { return services[name] },
  effect(callback, label) {
    const dispose = callback()
    effects.push({ label, dispose })
    return dispose
  },
  on() { return () => {} },
}

let factoryResult
const windowObject = {
  __ModuleLoader__: {
    load(definition) {
      factoryResult = definition
    },
  },
}
const sandbox = { window: windowObject, document, console, setInterval: () => 0, clearInterval: () => {}, Date, Object }
vm.createContext(sandbox)
// The bundle is a classic script that touches `window.__ModuleLoader__`.
sandbox.window.__ModuleLoader__ = windowObject.__ModuleLoader__
new vm.Script(source, { filename: 'client.js' }).runInContext(sandbox)
check(factoryResult !== undefined, 'factory registered through window.__ModuleLoader__.load')
check(factoryResult?.id === 'dsh-theme-lcars', 'module id', String(factoryResult?.id))

/* ---------------- 3. run the factory ---------------- */
const reactStub = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useEffect: () => {},
  useSyncExternalStore: (subscribe, getSnapshot) => getSnapshot(),
  Fragment: 'fragment',
}
const exportsObject = factoryResult.factory((name) => {
  if (name === 'react') return reactStub
  throw new Error('unexpected require: ' + name)
})
check(exportsObject.name === 'dsh-theme-lcars', 'host name export')
check(Array.isArray(exportsObject.inject) && exportsObject.inject.includes('theme'), 'inject declares theme')

let applyError
try {
  exportsObject.apply(ctx)
} catch (error) {
  applyError = error
}
check(applyError === undefined, 'apply() runs without throwing', applyError?.message)

/* ---------------- 4. what mount produced ---------------- */
check(themeLayer.source === 'lcars-theme', 'token layer source', String(themeLayer.source))
const tokenNames = themeLayer.tokens === undefined ? [] : Object.keys(themeLayer.tokens)
check(tokenNames.length >= 90, 'token layer size', String(tokenNames.length))
check(String(themeLayer.tokens?.['--dsw-specific-bubble']?.dark ?? '').includes('--lcars-block-4'), 'user bubble uses a colour block')
for (const [name, value] of Object.entries(themeLayer.tokens ?? {})) {
  check(typeof value.light === 'string' && typeof value.dark === 'string', 'token pair shape for ' + name)
}
check(body.getAttribute('data-lcars') === 'classic', 'palette attribute from stored config', String(body.getAttribute('data-lcars')))
check(body.getAttribute('data-lcars-chrome') !== null, 'chrome attribute honours stored true')
check(body.getAttribute('data-lcars-readout') !== null, 'readout attribute honours stored true')
check(body.getAttribute('data-lcars-console') !== null, 'console surface is the default')
check(body.getAttribute('data-lcars-sidefont') === 'lcars', 'sidebar face attribute from stored config', String(body.getAttribute('data-lcars-sidefont')))
check(themeLayer.registered?.id === 'lcars', 'dark console theme registered', String(themeLayer.registered?.id))
check(themeLayer.registered?.colorScheme === 'dark', 'registered theme is dark')
check(themeLayer.preference === 'lcars', 'console takes over the theme preference', String(themeLayer.preference))

const styleNodes = head.children.filter((node) => node.tagName === 'style')
check(styleNodes.length === 1, 'exactly one stylesheet node', String(styleNodes.length))
const sheet = styleNodes[0]?.textContent ?? ''
for (const role of ['frame', 'logo', 'primary', 'row', 'workspace', 'session', 'selected']) {
  check(sheet.includes('--lcars-side-' + role + ':'), 'sidebar role declared: ' + role)
  check(sheet.includes('--lcars-side-on-' + role + ':'), 'sidebar lettering declared: ' + role)
}
check(sheet.includes('lcars-build/'), 'sheet carries the build marker')
const open = (sheet.match(/\{/g) ?? []).length
const close = (sheet.match(/\}/g) ?? []).length
check(open === close && open > 20, 'stylesheet braces balanced', open + ' open / ' + close + ' close')
check(/body\[data-ds-dark-theme\]/.test(sheet), 'dark scheme block present')
check(sheet.includes('[data-composer-card]'), 'composer card targeted by its data hook')
check(sheet.includes('body[data-lcars][data-lcars-console]'), 'console fallback block present')
check(sheet.includes('--lcars-chrome:'), 'chrome colour variable declared')
check(sheet.includes('--lcars-on-chrome:'), 'chrome lettering variable declared')
check(sheet.includes('--lcars-accent-bright:'), 'bright accent variable declared')
check(sheet.includes('_panelList') && sheet.includes('--lcars-side-row'), 'navigation rows use the row role')
check(!sheet.includes('))body'), 'block selectors are well formed')
check(sheet.includes(':not(:has([data-sidebar-collapsed])) [class*="_panelList"]'), 'block rules scoped to the expanded column')
check(!sheet.includes('padding: 20px 0 12px 22px'), 'no elbow band: the column is not inset')
check(!sheet.includes('border-radius: 16px 0 0 16px'), 'no inner corner radius on the content root')
check(!sheet.includes('border-radius: 22px 0 0 22px'), 'no outer corner radius on the column')
check(!sheet.includes('[class*="_sidebarCol"]::before'), 'flat rail replaced by the elbow band')
check((sheet.match(/corner-shape: round/g) ?? []).length >= 12, 'pill ends opt out of the superellipse corner', String((sheet.match(/corner-shape: round/g) ?? []).length))
check((sheet.match(/border-radius: 2px/g) ?? []).length >= 3, 'the plain sidebar rows share one corner radius', String((sheet.match(/border-radius: 2px/g) ?? []).length))
check(sheet.includes('border-radius: 2px var(--lcars-row-half, 16px) var(--lcars-row-half, 16px) 2px'), 'conversation rows keep the left radius and get the swatch arc on the right')
// The column's density knob (user-tuned): rows and the brand block are drawn at
// 0.9 of their designed two-line height, i.e. 39.6px rows and a 54px brand block.
check(sheet.includes('--lcars-block-scale: 0.9'), 'the column carries the 0.9 density knob')
check(sheet.includes('--lcars-row-line: calc(22px * var(--lcars-block-scale, 1))'), 'row height derives from the scaled label line')
check(sheet.includes('--lcars-brand-word-line: calc(30px * var(--lcars-block-scale, 1))'), 'brand block follows the same density')
check(sheet.includes('height: calc(var(--lcars-brand-word-line) * 2 + 30px)'), 'brand block bottom edge is extended 30px')
check(sheet.includes('line-height: var(--lcars-row-line, 22px)'), 'row line-height follows the scaled line')
check((sheet.match(/border-radius: 0 999px/g) ?? []).length === 1, 'only the stardate tail keeps a pill end', String((sheet.match(/border-radius: 0 999px/g) ?? []).length))
check(!sheet.includes('margin-left: calc(-1 * var(--dsh-sidebar-inline-padding'), 'rows stay inside the column')
check(sheet.includes('border-radius: 31px 0 0 0'), 'brand row: one outer arc, square ends')
const brandRule = (sheet.match(/\[class\*="_logoRow"\] \{([^}]*)\}/) ?? [])[1] ?? ''
check(/margin-right: calc\(-1 \* var\(--dsh-sidebar-inline-padding, 8px\)\)/.test(brandRule), 'brand row bleeds to the column edge and joins the title block', brandRule.slice(0, 120))
const brandBg = brandRule.indexOf('background: var(--lcars-side-logo)')
const brandClip = brandRule.indexOf('background-clip: padding-box')
check(/border: 4px solid transparent/.test(brandRule) && brandBg >= 0 && brandClip > brandBg, 'brand block floats 4px inside its row (fill clipped after its own shorthand)', brandRule.slice(0, 160))
check(/border-top-width: 0/.test(brandRule), 'brand block starts on the row top, level with the title block')
check(/border-left-width: 0/.test(brandRule), 'the brand block starts on the navigation rows left edge')
check(/border-right-width: 16px/.test(brandRule), 'the brand block ends on the navigation rows right edge (no trailing tail)')
check(/margin-bottom: 4px/.test(brandRule), 'the gap to the next row is 8px (4px margin + 4px fill inset)')
check(/margin-top: var\(--lcars-brand-top, 0px\)/.test(brandRule), 'brand row follows the measured title-block top', brandRule.slice(0, 120))
const brandNotch = (sheet.match(/\[class\*="_logoRow"\]::after \{([^}]*)\}/) ?? [])[1] ?? ''
check(brandNotch === '', 'the trailing-bar cut is gone')
const brandBefore = (sheet.match(/\[class\*="_logoRow"\]::before \{([^}]*)\}/) ?? [])[1] ?? ''
check(/right: 8px/.test(brandBefore) && !/left:/.test(brandBefore), 'the wordmark ends on the rows labels right edge', brandBefore.slice(0, 80))
check(sheet.includes('[class*="_buildVersion"]'), 'build badge on the brand row is restyled')
check(sheet.includes('@font-face') && sheet.includes('LCARS GTJ3'), 'the LCARS face is embedded')
check(sheet.includes('Glow Sans SC Condensed Bold'), 'Han text uses Glow Sans SC Condensed Bold')
check(sheet.includes('--lcars-font-ui: \'LCARS GTJ3\''), 'the console face is one variable')
check(sheet.includes('body[data-lcars][data-lcars-chrome] [class*="_header"]:has([class*="_titleRow"]) {\n  --dsw-font-family: var(--lcars-font-ui);'), 'the console face is scoped to the chrome bar')
check(!sheet.includes('body[data-lcars][data-lcars-chrome] {\n  --dsw-font-family:'), 'the conversation keeps the app font (no window-wide face)')
check(sheet.includes('body[data-lcars] [class*="_sidebarCol"] {\n  font-family: var(--lcars-font-ui);\n  text-transform: uppercase;'), 'the navigation column draws Latin in the console face and uppercases its labels')
check(sheet.includes('unicode-range: U+2026'), 'the truncation ellipsis comes from a local face, not the LCARS star glyph')
check(sheet.includes('[data-lcars-sidefont="condensed"]') && sheet.includes('[data-lcars-sidefont="system"]'), 'the sidebar face switch has its stylesheet variants')
check(sheet.includes('.lcars-page') && sheet.includes('.lcars-color-input') && sheet.includes('.lcars-color-grid'), 'the settings page styles ship')
// The top and bottom bars joined the column (user request): the session title
// row, the composer dock row (stats + context meter) and the tail readout all
// read the console face, and uppercase because the face has no lowercase.
check(sheet.includes('body[data-lcars] [class*="_titleRow"] {\n  font-family: var(--lcars-font-ui);\n  text-transform: uppercase;'), 'the panel top bar uses the console face')
check(sheet.includes('body[data-lcars][data-lcars-chrome] [data-composer-dock] {\n  font-family: var(--lcars-font-ui);\n  text-transform: uppercase;'), 'the bottom dock row uses the console face')
check(/\.lcars-readout \{[^}]*font-family: var\(--lcars-font-ui\)/.test(sheet), 'the tail readout uses the console face')
check(/\.lcars-readout \{[^}]*font-size: 14px/.test(sheet), 'the readout uses the navigation label size')
check(sheet.includes('content: "DEEPSEEK"'), 'the brand row renders the uppercase wordmark')
check(sheet.includes('background: var(--lcars-side-selected)'), 'build badge uses the pale console chip')
check(sheet.includes('--dsw-alias-label-primary-inverted: var(--lcars-ink-bright'), 'brand badge lettering is light on its dark pill')
check(sheet.includes('border-radius: 2px 2px 0 var(--lcars-foot-half, 40px)'), 'profile block: square top-right, arc bottom-left')
check(sheet.includes('margin-right: calc(-1 * var(--dsh-sidebar-inline-padding, 8px))'), 'the profile block bleeds to the column edge')
check(sheet.includes('width: var(--lcars-foot-w, auto) !important'), 'the profile block width follows the navigation rows right edge')
check(/\[class\*="_footArea"\]::before \{\s*\n\s*content: "";[\s\S]{0,240}?inset: 0;/.test(sheet), 'the profile block fill is repainted over its own box')
check(/\[class\*="_footerActions"\],/.test(sheet) && /\[class\*="_settingsArea"\] \{\s*\n\s*flex-direction: column;/.test(sheet), 'the profile and update seats stack vertically')
check(/\[class\*="_footerActions"\] > \*,/.test(sheet) && /\[class\*="_settingsArea"\] > \* \{/.test(sheet), 'the foot seats stretch to the full block width')
check(/\[data-slot\^="sidebar\.footer\.action"\]/.test(sheet) && /\[data-slot\^="sidebar\.settings"\]/.test(sheet), 'the seat outlets are forced into a column too')
check(sheet.includes('[class*="_footArea"]::after'), 'profile block carries the sketched top-right notch')
check(sheet.includes('border-radius: 0 0 0 20px'), 'the notch has the fillet on its inner corner')
check(sheet.includes('.lcars-tail-box'), 'the readout box is part of the persistent bar')
check(/\[class\*="_header"\]:has\(\[class\*="_titleRow"\]\) \{[^}]*border-radius: 2px/.test(sheet), 'panel top bar takes the 4px corner')
check(sheet.includes('[class*="_moreAnchor"] {'), 'the more row is painted as a block')
check(sheet.includes('.lcars-tail-bar'), 'the persistent tail bar is styled')
check(sheet.includes('margin-bottom: 34px'), 'the composer dock row is lifted above the bar')
check(sheet.includes('left: calc(var(--lcars-tail-left, var(--lcars-sidebar-w, 282px)) - 28px)'), 'the tail starts on the profile block edge')
check(sheet.includes('.lcars-tail-box') && /\.lcars-tail-box \{[^}]*background: var\(--lcars-side-selected\)/.test(sheet), 'the readout box is the pale console panel')
check(/\.lcars-tail-box \{[^}]*width: 392px/.test(sheet), 'the readout box is the long console bar')
check(sheet.includes('[class*="_panelEntry"] > *') && sheet.includes('justify-content: flex-end'), 'navigation labels are right-aligned')
check(sheet.includes('margin-left: -3px'), 'conversation rows share the column width')
check(!sheet.includes('html[data-windows-titlebar] body[data-lcars][data-lcars-chrome] [class*="_frame"]::before'), 'caption strip is left black')
check(sheet.includes('--lcars-menu-item-fill: var(--lcars-side-frame)'), 'menu blocks read the frame colour')
check(sheet.includes('--lcars-menu-item-hover: var(--lcars-side-selected)'), 'menu hover reads the selected colour')
check(sheet.includes('font-variant-numeric: tabular-nums'), 'session rows use tabular digits')
check(sheet.includes('[class*="_regionArea"]::after'), 'filler panel painted after the workspace list')
check(sheet.includes(':not(:has([class*="_searchExpanded"])) [class*="_headerActions"]'), 'section header actions are not clamped')
check(sheet.includes('max-width: none'), 'header action group may grow')
check(sheet.includes('padding-right: 12px'), 'section header pulled away from the column edge')
check(sheet.includes('[data-composer-card]::before'), 'composer gets its left colour cap')
check(sheet.includes('repeating-linear-gradient(to right, var(--lcars-grid)'), 'console graticule painted on the conversation surface')
check(/^"STARDATE \d+\.\d"$/.test(bodyStyle.get('--lcars-stardate-text') ?? ''), 'client supplies the stardate caption', String(bodyStyle.get('--lcars-stardate-text')))
const menuSkin = menuHost.shadowRoot.children.find((node) => node.tagName === 'style')
check(menuSkin !== undefined, 'caption menu skin injected into its shadow root')
const skinText = menuSkin?.textContent ?? ''
check(skinText.includes('gap: 6px'), 'menu items are separated by a black gap')
check(skinText.includes('border-radius: 8px'), 'menu items round all four corners')
check(skinText.includes('var(--lcars-menu-item-fill'), 'menu skin reads the document colour variables')
check(sheet.includes('[class*="_header"]:has([class*="_titleRow"])'), 'session header is the panel top block')
check(sheet.includes('height: var(--lcars-logo-h, 40px)'), 'the panel top block matches the brand block height')
check(sheet.includes('--lcars-logo-h: 35px'), 'the header row is 35px')
check(sheet.includes('--lcars-chip-h: 25px'), 'the header blocks are 25px tall')
check(/title\.getBoundingClientRect\(\)\.top - base - 5/.test(source), 'the brand row sits 5px above the title block, so the blocks keep a 5px gap under the frame line')
check(/\[class\*="_crumbs"\] \{\s*\n\s*background: var\(--lcars-side-frame\);\s*\n\s*border-radius: 8px;/.test(sheet), 'the session title block has 8px circular corners')
check(/\[data-lcars-chip\] \{\s*\n\s*display: inline-flex;[\s\S]{0,220}?border-radius: 8px;/.test(sheet), 'the status chips have 8px circular corners')
check(sheet.includes('margin-top: 6px'), 'the panel top block is offset to the brand block top')
check(sheet.includes('[data-lcars-chip="1"]'), 'header action entries are separate coloured chips')
// The agent-preset label beside the title is a block in the same role as the
// title box, so one custom "frame / top bar" colour repaints the pair.
check(sheet.includes('[class*="_headerActions"] [data-slot="conversation.session.header.actions"] > span'), 'the agent-preset label is boxed')
const agentLabelRule = (sheet.match(/\[class\*="_headerActions"\] > span \{([^}]*)\}/) ?? [])[1] ?? ''
check(/background: var\(--lcars-side-frame\)/.test(agentLabelRule) && /height: var\(--lcars-chip-h, 25px\)/.test(agentLabelRule), 'the agent label binds to the session-title block colour', agentLabelRule.slice(0, 120))
check(sheet.includes('button[class*="_newSession"]'), 'new-session pill scoped to the button')
check(!sheet.includes('[class*="_headline"]'), 'no headline-wide font rule')
check(!sheet.includes('lcars-readout-grow'), 'readout has no grow spacer')
check(!sheet.includes('lcars-switch-mark'), 'switches use a track and knob')
for (const id of ['tng', 'classic', 'early', 'nemesis']) {
  check(sheet.includes('--lcars-swatch-' + id + ':'), 'swatch variable for ' + id)
}
for (const paletteId of ['blueprint', 'tng', 'classic', 'early', 'nemesis']) {
  check(sheet.includes('body[data-lcars="' + paletteId + '"]'), 'palette block ' + paletteId)
  check(sheet.includes('body[data-lcars="' + paletteId + '"][data-ds-dark-theme]'), 'night palette block ' + paletteId)
}
check(/\.lcars-conf-frame \{/.test(sheet) && /border: 2px solid var\(--lcars-side-frame\)/.test(sheet) && /border-radius: 4px/.test(sheet), 'the conversation frame is drawn in the overlay with 4px corners')
check(sheet.includes('left: var(--lcars-frame-left, 0px)'), 'the frame follows the measured conversation panel')
check(sheet.includes('--lcars-frame-inset-bottom: 38px'), 'the frame bottom inset is single-sourced')
check(sheet.includes('top: var(--lcars-frame-top, 0px)') && sheet.includes('height: var(--lcars-frame-h, 0px)'), 'the frame top comes from the brand block, the height from the panel bottom')
check(/\[class\*="_root"\]\[data-phase\] \{[^}]*clip-path: inset\(var\(--lcars-root-inset-top/.test(sheet), 'the transcript root is clipped to the frame')
check(!/\[class\*="_mainPanel"\] \{\s*\n\s*clip-path/.test(sheet), 'the panel (and its header chips) is not clipped')
check(sheet.includes('--lcars-side-session: #0947e8'), 'blueprint session fill is the distance blue')
check(sheet.includes('--lcars-side-on-session: #ffffff'), 'session lettering is white on distance blue')
check(sheet.includes('--lcars-side-on-row: #0a0a0a'), 'row lettering is black on the bright blue')
check(sheet.includes('--lcars-readout-ink: #a09858'), 'blueprint readout numerals are gold')

// Every variable the stylesheet or the token layer reads has to be declared by
// the stylesheet; a dashed/camel slip otherwise fails silently in the browser.
const declared = new Set([...sheet.matchAll(/(--lcars-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
const referenced = new Set([
  ...[...sheet.matchAll(/var\((--lcars-[a-z0-9-]+)/g)].map((m) => m[1]),
  ...Object.values(themeLayer.tokens ?? {}).flatMap((pair) => [...pair.dark.matchAll(/var\((--lcars-[a-z0-9-]+)/g)].map((m) => m[1])),
])
// Properties the client writes at runtime (they carry a CSS fallback).
const RUNTIME_PROPERTIES = new Set(['--lcars-stardate-text', '--lcars-brand-half', '--lcars-brand-top', '--lcars-foot-half', '--lcars-foot-w', '--lcars-frame-left', '--lcars-frame-top', '--lcars-frame-w', '--lcars-frame-h', '--lcars-root-inset-top', '--lcars-root-inset-bottom', '--lcars-row-half', '--lcars-sidebar-w', '--lcars-tail-left', '--lcars-logo-h'])
const missing = [...referenced].filter((name) => !declared.has(name) && !RUNTIME_PROPERTIES.has(name))
check(missing.length === 0, 'every referenced palette variable is declared', missing.join(', '))
console.log('ok  ' + declared.size + ' palette variables declared, ' + referenced.size + ' referenced')

check(mounted.includes('shell.overlay'), 'persistent tail injected into the overlay layer')
check(mounted.includes('settings.section'), 'settings page injected')
const optionsById = Object.fromEntries(registered.map((entry) => [entry.options.id, entry.options]))
check(optionsById['lcars-tail']?.name === 'shell.overlay', 'tail registration name')
check(optionsById.lcars?.name === 'settings.section', 'settings registration name')
check(optionsById.lcars?.locale === 'theme.lcars', 'settings registration locale')
check(typeof optionsById.lcars?.label === 'function', 'settings nav label is localized')
check(optionsById.lcars?.order !== undefined, 'settings nav order set')
check(!registered.some((entry) => entry.options.name === 'settings.general.item'), 'the theme no longer adds a General row')

/* ---------------- 5. render both components with the stubs ---------------- */
const render = (component, label) => {
  let tree
  let error
  try {
    tree = component({ t: (key) => 'T:' + key })
  } catch (caught) {
    error = caught
  }
  check(error === undefined, label + ' renders without throwing', error?.message)
  return tree
}
/** React flattens nested children arrays; the stub does not, so do it here. */
const flat = (nodes) => (nodes ?? []).flat(Infinity).filter((node) => node !== null && node !== undefined && node !== false)
const findByClass = (tree, className) => flat(tree?.children).find((child) => child?.props?.className === className)
/** Same lookup, but through the section cards the settings page nests its rows in. */
const findDeep = (tree, className) => {
  for (const child of flat(tree?.children)) {
    if (child?.props?.className === className) return child
    const nested = findDeep(child, className)
    if (nested !== undefined) return nested
  }
  return undefined
}

const tailTree = render(registered.find((entry) => entry.options.id === 'lcars-tail').component, 'tail bar')
check(tailTree?.type === 'div', 'tail bar returns an element')
check(tailTree?.props?.className === 'lcars-tail', 'tail bar root class')
const tailChildren = flat(tailTree?.children)
check(tailChildren.some((child) => child?.props?.className === 'lcars-tail-bar'), 'tail bar paints the frame band')
const tailBox = tailChildren.find((child) => child?.props?.className === 'lcars-tail-box')
check(tailBox !== undefined, 'tail bar carries the readout box')
const boxChild = flat(tailBox?.children)[0]
check(typeof boxChild?.type === 'function', 'tail box hosts a component')
const readoutTree = boxChild.type({ t: (key) => 'T:' + key })
check(readoutTree?.props?.className === 'lcars-readout', 'readout root class')
check(flat(readoutTree?.children).length === 4, 'readout cells', String(flat(readoutTree?.children).length))
check(!JSON.stringify(readoutTree).includes('LCARS 47'), 'the readout box carries no LCARS 47 id chip')
check(!JSON.stringify(readoutTree).includes('lcars-readout-cap'), 'the readout box carries no leading cap')
const readoutChildren = flat(readoutTree?.children)
check(readoutChildren[0]?.props?.className === 'lcars-readout-cell' && String(readoutChildren[0]?.children?.[0] ?? '').startsWith('T:readout.stardate'), 'readout starts on the stardate', String(readoutChildren[0]?.children?.[0]))
const settingsTree = render(registered.find((entry) => entry.options.id === 'lcars').component, 'settings page')
check(settingsTree?.type === 'div', 'settings page returns an element')
check(settingsTree?.props?.className === 'lcars-page', 'settings page root class')
const chipRow = findDeep(settingsTree, 'lcars-chip-row')
check(flat(chipRow?.children).length === 5, 'five palette chips', String(flat(chipRow?.children).length))
check(flat(chipRow?.children).every((chip) => /^var\(--lcars-swatch-/.test(String(flat(chip?.children)[0]?.props?.style?.background ?? ''))), 'chip dots use scheme-aware swatch variables')
check(flat(chipRow?.children).find((chip) => chip?.props?.['aria-pressed'] === true) !== undefined, 'one chip selected')
const colorGrid = findDeep(settingsTree, 'lcars-color-grid')
const colorRows = flat(colorGrid?.children)
check(colorRows.length === 7, 'seven solid block colour rows', String(colorRows.length))
check(colorRows.every((row) => findDeep(row, 'lcars-color-input') !== undefined), 'every colour row carries a picker')
const frameRow = colorRows[0]
const frameName = findDeep(frameRow, 'lcars-color-name')
check(typeof frameName?.children?.[0] === 'string' || typeof flat(frameName?.children)[0] === 'string', 'colour row carries its role label')
const framePicker = findDeep(frameRow, 'lcars-color-input')
check(framePicker?.props?.type === 'color', 'colour picker is a native colour input', String(framePicker?.props?.type))
check(/^#[0-9a-f]{6}$/i.test(String(framePicker?.props?.value ?? '')), 'colour picker falls back to the palette hex', String(framePicker?.props?.value))
check(findDeep(frameRow, 'lcars-color-reset') === undefined, 'no reset button while the palette value is in use')
check(findDeep(frameRow, 'lcars-color-swatch')?.props?.style?.background === 'var(--lcars-side-frame)', 'colour row previews the live role variable')
const fontGrid = findDeep(settingsTree, 'lcars-font-grid')
const fontChips = flat(fontGrid?.children)
check(fontChips.length === 3, 'three sidebar faces offered', String(fontChips.length))
check(fontChips.some((chip) => chip?.props?.['aria-pressed'] === true), 'one sidebar face selected')
const toggles = findDeep(settingsTree, 'lcars-switch-row')
check(flat(toggles?.children).length === 3, 'three console switches', String(flat(toggles?.children).length))
check(toggles?.props?.role === 'group' && typeof toggles?.props?.['aria-label'] === 'string', 'switch row is a labelled group')
const surfaceSwitch = flat(toggles?.children)[0]
check(surfaceSwitch?.props?.['aria-checked'] === true, 'surface switch reflects the console default')
const chromeSwitch = flat(toggles?.children)[1]
check(chromeSwitch?.props?.['aria-checked'] === true, 'chrome switch reflects stored true')
check(chromeSwitch?.props?.role === 'switch', 'switch role')
check(chromeSwitch?.props?.type === 'button', 'switch is a button')

/* ---------------- 5b. the page's write path ---------------- */
// A picked colour is painted on <body> (inline, so it wins over the palette
// block) together with the lettering colour that clears contrast on it.
framePicker.props.onChange({ target: { value: '#00ff00' } })
check(bodyStyle.get('--lcars-side-frame') === '#00ff00', 'a picked block colour is painted', String(bodyStyle.get('--lcars-side-frame')))
check(bodyStyle.get('--lcars-side-on-frame') === '#0a0a0a', 'lettering follows the picked colour by contrast', String(bodyStyle.get('--lcars-side-on-frame')))
check(bodyStyle.get('--lcars-side-logo') === undefined, 'untouched roles keep the palette value', String(bodyStyle.get('--lcars-side-logo')))
const pageAfterColor = render(registered.find((entry) => entry.options.id === 'lcars').component, 'settings page after a colour')
const frameRowAfter = flat(findDeep(pageAfterColor, 'lcars-color-grid')?.children)[0]
const resetAfter = findDeep(frameRowAfter, 'lcars-color-reset')
check(resetAfter !== undefined, 'a custom colour shows its reset')
check(findDeep(frameRowAfter, 'lcars-color-input')?.props?.value === '#00ff00', 'the picker shows the stored colour', String(findDeep(frameRowAfter, 'lcars-color-input')?.props?.value))
resetAfter.props.onClick()
check(bodyStyle.get('--lcars-side-frame') === undefined, 'reset hands the role back to the palette', String(bodyStyle.get('--lcars-side-frame')))
// The sidebar face switch writes the body attribute the stylesheet keys off.
const systemChip = flat(findDeep(pageAfterColor, 'lcars-font-grid')?.children).find((chip) => chip?.props?.key === 'system')
systemChip.props.onClick()
check(body.getAttribute('data-lcars-sidefont') === 'system', 'the sidebar face switch applies', String(body.getAttribute('data-lcars-sidefont')))
// Leave a colour set so the dispose path has something to clean up.
framePicker.props.onChange({ target: { value: '#112233' } })
check(bodyStyle.get('--lcars-side-frame') === '#112233', 'second colour write lands', String(bodyStyle.get('--lcars-side-frame')))

/* ---------------- 6. duplicate mount, teardown, remount, failure ---------------- */
// The boot loader and the cordis composition can both mount this bundle: the
// second mount of the SAME build must be a no-op, not a second sheet.
registered.length = 0
exportsObject.apply(ctx)
check(head.children.filter((node) => node.tagName === 'style').length === 1, 'duplicate mount does not stack a sheet', String(head.children.filter((node) => node.tagName === 'style').length))
check(registered.length === 0, 'duplicate mount registers no slot entries', String(registered.length))

const ownership = effects.filter((entry) => entry.label === 'lcars: document ownership')
check(ownership.length === 1, 'one ownership effect', String(ownership.length))
let teardownError
try {
  ownership[0]?.dispose?.()
} catch (caught) {
  teardownError = caught
}
check(teardownError === undefined, 'teardown runs without throwing', teardownError?.message)
check(body.getAttribute('data-lcars') === null, 'palette attribute removed on dispose')
check(body.getAttribute('data-lcars-console') === null, 'console attribute removed on dispose')
check(body.getAttribute('data-lcars-sidefont') === null, 'sidebar face attribute removed on dispose')
check(bodyStyle.get('--lcars-side-frame') === undefined, 'picked block colour removed on dispose')
check(bodyStyle.get('--lcars-side-on-frame') === undefined, 'picked lettering removed on dispose')
check(bodyStyle.get('--lcars-stardate-text') === undefined, 'stardate caption removed on dispose')
check(menuHost.shadowRoot.children.length === 0, 'caption menu skin removed on dispose')
check(head.children.filter((node) => node.tagName === 'style').length === 0, 'sheet removed on dispose')
check(windowObject.__dshThemeLcarsBuild === undefined, 'page claim released on dispose')

// A disposed page must accept a fresh run: this is what a profile re-enable,
// a rebuilt module and a re-applied bundle all do.
exportsObject.apply(ctx)
check(head.children.filter((node) => node.tagName === 'style').length === 1, 'remount installs one sheet again')
check(registered.length === 2, 'remount re-registers both slots', String(registered.length))
effects.filter((entry) => entry.label === 'lcars: document ownership').at(-1)?.dispose?.()

// A mount that throws must not take the plugin down or leave the page claimed.
const warned = []
const realWarn = console.warn
console.warn = (...args) => { warned.push(args.join(' ')) }
const failingCtx = {
  get: (name) => (name === 'theme'
    ? { overrideTokens() { throw new Error('boom') } }
    : ctx.get(name)),
  effect: ctx.effect,
  on: ctx.on,
}
let failureThrew
try {
  exportsObject.apply(failingCtx)
} catch (caught) {
  failureThrew = caught
} finally {
  console.warn = realWarn
}
check(failureThrew === undefined, 'a failing mount does not throw out of apply', failureThrew?.message)
check(warned.some((line) => line.includes('theme mount failed')), 'a failing mount warns once', warned.join(' | '))
check(windowObject.__dshThemeLcarsBuild === undefined, 'a failing mount releases the page claim')
effects.filter((entry) => entry.label === 'lcars: document ownership').at(-1)?.dispose?.()

/* ---------------- 7. contrast ---------------- */
const srgb = (value) => {
  const channel = value / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}
const luminance = (hex) => {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match === null) throw new Error('not a hex colour: ' + hex)
  const int = parseInt(match[1], 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}
const contrast = (a, b) => {
  const la = luminance(a)
  const lb = luminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}

// Values mirrored from client.js (the harness cannot read its closures).
const SCHEMES = {
  light: { bg: '#f6f2e8', layer1: '#fdfbf5', ink: '#241c12', inkDim: '#6d5a45', inkFaint: '#7a6852' },
  dark: { bg: '#000000', layer1: '#0a0a0a', ink: '#ffcc99', inkDim: '#cf9160', inkFaint: '#b0794a' },
}
const SERIES = {
  tng: { light: '#a85500', dark: '#ff9900' },
  classic: { light: '#a24d16', dark: '#ee9955' },
  early: { light: '#8f6200', dark: '#ffcc66' },
  nemesis: { light: '#1f5fbf', dark: '#5599ff' },
}
const NIGHT_INK = { tng: '#ffcc99', classic: '#ffcc99', early: '#ffd9a8', nemesis: '#ccddff' }
// Series that repaint the faint tier in the night scheme (2379 is blue, not peach).
const NIGHT_FAINT = { nemesis: '#5d7fa3' }
// Lettering on a colour block: dark in the night scheme, light in daylight.
const ON_ACCENT = { light: '#fdfbf5', dark: '#0a0a0a' }
const rows = []
for (const scheme of ['light', 'dark']) {
  const surface = SCHEMES[scheme]
  for (const id of Object.keys(SERIES)) {
    const accent = SERIES[id][scheme]
    const ink = scheme === 'dark' ? NIGHT_INK[id] : surface.ink
    rows.push({ scheme, id, what: 'primary text / background', value: contrast(ink, surface.bg), min: 4.5 })
    rows.push({ scheme, id, what: 'primary text / panel', value: contrast(ink, surface.layer1), min: 4.5 })
    rows.push({ scheme, id, what: 'secondary text / background', value: contrast(surface.inkDim, surface.bg), min: 4.5 })
    const faint = scheme === 'dark' && NIGHT_FAINT[id] !== undefined ? NIGHT_FAINT[id] : surface.inkFaint
    rows.push({ scheme, id, what: 'tertiary text / background', value: contrast(faint, surface.bg), min: 4.5 })
    rows.push({ scheme, id, what: 'tertiary text / panel', value: contrast(faint, surface.layer1), min: 4.5 })
    rows.push({ scheme, id, what: 'accent / background', value: contrast(accent, surface.bg), min: 3 })
    rows.push({ scheme, id, what: 'block lettering / accent block', value: contrast(ON_ACCENT[scheme], accent), min: 4.5 })
  }
}
for (const row of rows) {
  if (row.value < row.min) failures.push('contrast ' + row.scheme + '/' + row.id + ' ' + row.what + ' = ' + row.value.toFixed(2) + ' < ' + row.min)
}
// Blocks carry near-black lettering in both schemes, so the block fills are
// held to AA against it. The 4n+4 row uses color-mix(block-4 55%, white), which
// is a linear sRGB blend and is reproduced here.
const mixWhite = (hex, keep) => {
  const int = parseInt(hex.slice(1), 16)
  const channel = (shift) => Math.round(((int >> shift) & 255) * keep + 255 * (1 - keep))
  return '#' + [channel(16), channel(8), channel(0)].map((value) => value.toString(16).padStart(2, '0')).join('')
}
const BLOCKS = {
  tng: ['#cc6666', '#ffcc66', '#cc99cc', '#9999cc'],
  classic: ['#dd6644', '#ee9955', '#9977aa', '#6688cc'],
  early: ['#ffcc66', '#99ccff', '#cc99cc', '#3366cc'],
  nemesis: ['#5599ff', '#ccddff', '#bbaa55', '#3366ff'],
}
const CHROME = { tng: '#ff9900', classic: '#ee9955', early: '#ffcc66', nemesis: '#5599ff' }
const blockRows = []
for (const id of Object.keys(BLOCKS)) {
  const [b1, b2, b3, b4] = BLOCKS[id]
  for (const [what, fill] of [['block 1', b1], ['block 2', b2], ['block 3', b3], ['block 4 soft', mixWhite(b4, 0.55)], ['chrome', CHROME[id]]]) {
    blockRows.push({ scheme: 'both', id, what: 'lettering on ' + what, value: contrast('#0a0a0a', fill), min: 4.5 })
  }
}
for (const row of blockRows) {
  if (row.value < row.min) failures.push('block contrast ' + row.id + ' ' + row.what + ' = ' + row.value.toFixed(2) + ' < ' + row.min)
}
const worstBlock = blockRows.reduce((acc, row) => (row.value < acc.value ? row : acc), blockRows[0])
console.log('ok  block lettering checked over ' + blockRows.length + ' fills (lowest ' + worstBlock.value.toFixed(2) + ' at ' + worstBlock.id + ' ' + worstBlock.what + ')')
const worst = rows.reduce((acc, row) => (row.value < acc.value ? row : acc), rows[0])
console.log('ok  contrast checked over ' + rows.length + ' pairs (lowest ' + worst.value.toFixed(2) + ' at ' + worst.scheme + '/' + worst.id + ' ' + worst.what + ')')

/* ---------------- 8. host half ---------------- */
const hostUrl = pathToFileURL(path.join(root, 'index.js')).href
let host
try {
  host = await import(hostUrl)
} catch (error) {
  failures.push('host import failed — ' + error.message)
}
if (host !== undefined) {
  check(typeof host.apply === 'function', 'host exports apply')
  check(host.Config !== undefined, 'host Config schema resolved')
  check(Array.isArray(host.PALETTES) && host.PALETTES.length === 5, 'host palette list', String(host.PALETTES?.length))
  check(host.PALETTES[0] === 'blueprint' && host.DEFAULT_PALETTE === 'blueprint', 'blueprint is the default palette')
  if (host.Config !== undefined) {
    // The DSH loader resolves volatile fields into live handles, so calling the
    // schema directly is not the value path; the serialized schema is: one
    // volatile marker per switch plus its default.
    const spec = JSON.stringify(host.Config)
    const volatileFields = (spec.match(/"volatile":true/g) ?? []).length
    check(volatileFields === 12, 'twelve volatile fields', String(volatileFields))
    check(spec.includes('"default":"blueprint"'), 'palette default in schema')
    check(spec.includes('"default":true'), 'boolean defaults in schema')
    check(spec.includes('"sidebarFont"'), 'sidebar face field in schema')
    check(spec.includes('"default":"lcars"'), 'lcars is the default sidebar face')
    for (const field of ['colorFrame', 'colorLogo', 'colorPrimary', 'colorRow', 'colorWorkspace', 'colorSession', 'colorSelected']) {
      check(spec.includes('"' + field + '"'), 'block colour field in schema: ' + field)
    }
  }
}

/* ---------------- report ---------------- */
if (failures.length > 0) {
  console.error('\n' + failures.length + ' check(s) failed:')
  for (const failure of failures) console.error('  - ' + failure)
  process.exit(1)
}
console.log('\nall checks passed')
