/**
 * Simulate the Host process to verify that the bundle's Config schema resolves
 * without any DSH_* environment variable, and that DSH's own projection accepts
 * it (not part of the package).
 *
 * usage: node _lcars-host-check.mjs <profile-package-dir> <dsh-install-dir>
 */
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const [, , packageDir, installDir] = process.argv

// The shell-env registry rebuilds DSH_* per model shell call, so the real Host
// process does not carry them: delete them to reproduce that environment.
delete process.env.DSH_INSTALL_DIR
delete process.env.DSH_PROFILE
delete process.env.DSH_PROFILE_DIR
delete process.env.DSH_NODE_EXECUTABLE

const failures = []
const check = (ok, label, detail) => {
  if (!ok) failures.push(label + (detail === undefined ? '' : ' — ' + detail))
  else console.log('ok  ' + label)
}

const anchorTest = await import(pathToFileURL(path.join(installDir, 'node_modules', '@deepseek-ai', 'dsh-app-boot', 'lib', 'index.js')).href)
const { isNativeConfigSchema, createConfigProjector } = anchorTest

const pluginUrl = pathToFileURL(path.join(packageDir, 'index.js')).href
const plugin = await import(pluginUrl)
check(typeof plugin.apply === 'function', 'host half imports without DSH_* variables')
check(plugin.Config !== undefined, 'Config schema built from process facts')

if (plugin.Config !== undefined) {
  check(isNativeConfigSchema(plugin.Config) === true, 'DSH accepts the schema brand')
  const projector = await createConfigProjector()
  const projected = projector(plugin.Config, 'config')
  const text = JSON.stringify(projected.schema)
  check(text.includes('"palette"'), 'projected schema carries palette')
  check(text.includes('"surface"'), 'projected schema carries surface')
  check(text.includes('"default":"console"'), 'projected default surface is the console')
  check(text.includes('"chrome"'), 'projected schema carries chrome')
  check(text.includes('"readout"'), 'projected schema carries readout')
  check(text.includes('"default":"blueprint"'), 'projected default palette is the blue console')
  check(text.includes('"sidebarFont"'), 'projected schema carries the sidebar face')
  check(text.includes('"default":"lcars"'), 'projected default sidebar face is LCARS GTJ3')
  for (const field of ['colorFrame', 'colorLogo', 'colorPrimary', 'colorRow', 'colorWorkspace', 'colorSession', 'colorSelected']) {
    check(text.includes('"' + field + '"'), 'projected schema carries ' + field)
  }
  const volatileCount = (text.match(/"volatile":true/g) ?? []).length
  check(volatileCount === 12, 'twelve volatile fields in the projection', String(volatileCount))
  console.log('    acceptsMissing=' + String(projected.acceptsMissing) + ' limitations=' + JSON.stringify(projected.limitations))
  // The stored section must validate, and a wrong palette or face must be rejected.
  const accepted = plugin.Config({ palette: 'classic', chrome: false, readout: true, sidebarFont: 'system', colorFrame: '#123456' })
  check(accepted !== undefined, 'a stored section resolves')
  check(accepted?.sidebarFont === 'system', 'stored sidebar face survives', String(accepted?.sidebarFont))
  check(accepted?.colorFrame === '#123456', 'stored block colour survives', String(accepted?.colorFrame))
  const fallback = plugin.Config({ palette: 'classic' })
  check(fallback?.sidebarFont === 'lcars', 'unset sidebar face falls back to lcars', String(fallback?.sidebarFont))
  check(fallback?.colorRow === '', 'unset block colour falls back to the palette', JSON.stringify(fallback?.colorRow))
  let rejected = false
  try {
    plugin.Config({ palette: 'nope' })
  } catch {
    rejected = true
  }
  check(rejected, 'an unknown palette is rejected')
  let rejectedFace = false
  try {
    plugin.Config({ sidebarFont: 'comic-sans' })
  } catch {
    rejectedFace = true
  }
  check(rejectedFace, 'an unknown sidebar face is rejected')
}

if (failures.length > 0) {
  console.error('\n' + failures.length + ' check(s) failed:')
  for (const failure of failures) console.error('  - ' + failure)
  process.exit(1)
}
console.log('\nhost checks passed')
