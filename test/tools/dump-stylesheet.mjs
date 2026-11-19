/**
 * Dump the stylesheet that client.js generates, for review (not part of the package).
 * usage: node _lcars-dump.mjs <package-dir> <out-file>
 */
import vm from 'node:vm'
import fs from 'node:fs'
import path from 'node:path'

const [, , root, outFile] = process.argv
const source = fs.readFileSync(path.join(root, 'client.js'), 'utf8')

class FakeElement {
  constructor(tag) { this.tagName = tag; this.attributes = {}; this.children = []; this.parentNode = null; this.style = {}; this.textContent = '' }
  setAttribute(name, value) { this.attributes[name] = String(value) }
  getAttribute(name) { return this.attributes[name] ?? null }
  removeAttribute(name) { delete this.attributes[name] }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child }
  removeChild(child) { this.children = this.children.filter((c) => c !== child); return child }
  remove() { if (this.parentNode) this.parentNode.removeChild(this) }
  querySelectorAll() { return [] }
}
const head = new FakeElement('head')
const body = new FakeElement('body')
body.style = { setProperty() {}, removeProperty() {}, getPropertyValue() { return '' } }
const document = { head, body, documentElement: new FakeElement('html'), createElement: (t) => new FakeElement(t), querySelectorAll: () => [] }

let captured
const sandbox = {
  window: { __ModuleLoader__: { load: (definition) => { captured = definition } } },
  document,
  console,
  setInterval: () => 0,
  clearInterval: () => {},
  Date,
  Object,
}
vm.createContext(sandbox)
vm.runInContext(source, sandbox)

const react = {
  createElement: () => null,
  useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
  useEffect: () => {},
  useSyncExternalStore: (s, g) => g(),
}
const plugin = captured.factory((name) => (name === 'react' ? react : (() => { throw new Error(name) })()))
plugin.apply({
  get: (name) => ({
    theme: { overrideTokens: () => () => {} },
    slots: { inject: (key, cb) => cb(), register: () => () => {} },
    locale: { register: () => () => {}, bind: () => (key) => key },
    configForms: { get: () => ({ getSnapshot: () => ({ status: 'ready', writable: true, value: {} }), subscribe: () => () => {}, set: async () => true }) },
  }[name]),
  effect: (cb) => { const dispose = cb(); return dispose },
  on: () => () => {},
})
const sheet = head.children.find((node) => node.tagName === 'style')?.textContent ?? ''
fs.writeFileSync(outFile, sheet, 'utf8')
console.log('wrote ' + outFile + ' (' + sheet.length + ' bytes, ' + sheet.split('\n').length + ' lines)')
