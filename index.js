/**
 * dsh-theme-lcars — Host half.
 *
 * The theme itself lives in the browser half (`client.js`): it is a token
 * override layer plus one stylesheet, a composer readout and a settings row.
 * This half only contributes the durable preference schema, so the three
 * switches survive a restart and a port change of the Desktop host.
 *
 * Settings transport: DSH ≥ 0.2 projects an entry's exported `Config` schema to
 * the browser through `ctx.configForms`; the browser half writes the row's
 * config by field name, and the value is stored in the profile by DSH's own
 * settings service (no localStorage, no `settings.yaml`). Every field is
 * `.volatile()` so a switch takes effect in the open page instead of waiting
 * for a plugin restart.
 *
 * Schemastery instance: the bundle declares no dependency and resolves the copy
 * DSH ships with the installation, from real process facts rather than the
 * `DSH_*` variables (the shell-env registry rebuilds those per model shell call,
 * so they are absent from this process). The loader and the Config inspect
 * provider brand-check schemas with `Symbol.for('schemastery')`, not by module
 * identity, so the resolved copy is accepted. When resolution fails the export
 * stays undefined and the theme still runs: the browser half falls back to its
 * documented defaults, and only the switches stop persisting.
 */
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Palette ids understood by the browser half, in settings-row order. */
export const PALETTES = ['blueprint', 'tng', 'classic', 'early', 'nemesis']

/** Palette used when the durable section carries no accepted value. */
export const DEFAULT_PALETTE = 'blueprint'

/**
 * Directories whose `node_modules` (or `dsh/node_modules`) can hold DSH's own
 * copy of schemastery. The `DSH_*` variables seen in a model shell call are
 * rebuilt per call by the shell-env registry and are NOT in this process's
 * environment, so the installation has to be found from real process facts:
 * Electron's `resourcesPath` (Desktop), the executable's directory, the entry
 * script (npm installs), and this package's own directory as the last resort.
 * @returns {string[]} candidate directories, most specific first.
 */
function installAnchors() {
  const anchors = []
  const push = (candidate) => {
    if (typeof candidate === 'string' && candidate !== '' && !anchors.includes(candidate)) anchors.push(candidate)
  }
  push(process.env.DSH_INSTALL_DIR)
  const resources = typeof process.resourcesPath === 'string' ? process.resourcesPath : undefined
  const execDir = typeof process.execPath === 'string' ? path.dirname(process.execPath) : undefined
  for (const base of [resources, execDir === undefined ? undefined : path.join(execDir, 'resources')]) {
    if (base === undefined) continue
    // Desktop: <resources>/app.asar/dsh ; unpacked builds: <resources>/app/dsh
    push(path.join(base, 'app.asar', 'dsh'))
    push(path.join(base, 'app', 'dsh'))
    push(path.join(base, 'app.asar'))
  }
  // npm installs: the loader was started from a script inside the dsh package.
  const entry = typeof process.argv[1] === 'string' ? process.argv[1] : undefined
  if (entry !== undefined) {
    let dir = path.dirname(entry)
    for (let step = 0; step < 6; step += 1) {
      push(dir)
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  }
  push(path.dirname(fileURLToPath(import.meta.url)))
  return anchors
}

/**
 * Resolve a module from every plausible installation anchor.
 * @param {string[]} specifiers - bare module specifiers to try, in order.
 * @returns {any} the loaded module, or undefined when no copy is reachable.
 */
function loadFromHost(specifiers) {
  const anchors = installAnchors()
  for (const anchor of anchors) {
    let requireFrom
    try {
      requireFrom = createRequire(path.join(anchor, 'noop.cjs'))
    } catch {
      continue
    }
    for (const specifier of specifiers) {
      try {
        return requireFrom(specifier)
      } catch {
        /* try the next specifier or anchor */
      }
    }
  }
  return undefined
}

/**
 * Build the preference schema with the host's schemastery.
 *
 * `isNativeConfigSchema` (the check the loader and the Config inspect provider
 * apply) only requires the `Symbol.for('schemastery')` brand, so a copy loaded
 * from the installation is accepted exactly like the loader's own.
 * @returns {any} the schema, or undefined when schemastery is unreachable.
 */
function buildConfig() {
  const schemastery = loadFromHost(['@deepseek-ai/schemastery', 'schemastery'])
  const z = schemastery?.default ?? schemastery
  if (typeof z?.object !== 'function') return undefined
  try {
    return z.object({
      /** Colour series used by the rail blocks, accents and readouts. */
      palette: z.union([...PALETTES]).default(DEFAULT_PALETTE).volatile(),
      /**
       * `console` is the black ship console (the theme's default look: it takes
       * over the theme preference so the app switches its own dark styles);
       * `auto` follows the Appearance setting, where light is a PADD-daylight
       * variant of the same series.
       */
      surface: z.union(['console', 'auto']).default('console').volatile(),
      /** LCARS chrome: left rail, pill rows, accent frame on the composer. */
      chrome: z.boolean().default(true).volatile(),
      /** Stardate readout chip under the composer. */
      readout: z.boolean().default(true).volatile(),
      /**
       * Face of the navigation column: `lcars` (the console face, uppercase),
       * `condensed` (the theme's Oswald/Bahnschrift display face) or `system`
       * (the app's own font).
       */
      sidebarFont: z.union(['lcars', 'condensed', 'system']).default('lcars').volatile(),
      /**
       * Per-role overrides for the solid navigation blocks. An empty string
       * means "use the active palette's value"; the browser half accepts only
       * `#rrggbb` (and picks the matching lettering colour by contrast).
       */
      colorFrame: z.string().default('').volatile(),
      colorLogo: z.string().default('').volatile(),
      colorPrimary: z.string().default('').volatile(),
      colorRow: z.string().default('').volatile(),
      colorWorkspace: z.string().default('').volatile(),
      colorSession: z.string().default('').volatile(),
      colorSelected: z.string().default('').volatile(),
    })
  } catch {
    return undefined
  }
}

/** Durable switches projected to the browser half as `ctx.configForms.get('theme-lcars')`. */
export const Config = buildConfig()

/** No host-side service: the browser half owns every visible part of the theme. */
export function apply() {}
