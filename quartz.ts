import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import * as ExternalPlugin from "./.quartz/plugins"

// Pin the top-level section order in the left-hand explorer and Title Case
// the section names; everything else keeps the default folders-first
// alphabetical sort.
// NOTE: sortFn/mapFn are serialized with toString() and re-evaluated in the
// browser — each must be fully self-contained: no references to outer scope,
// and no variable-assigned inner helpers (esbuild wraps those in a __name()
// decorator that doesn't exist client-side). Inline anonymous callbacks only.
ExternalPlugin.Explorer({
  mapFn: (node) => {
    if (node.isFolder && node.displayName) {
      const labels: Record<string, string> = {
        essays: "Essays",
        philosophy: "Philosophy",
        concepts: "Concepts",
        practical: "Practical",
        "application-architecture": "Application Architecture",
      }
      const label = labels[node.displayName.toLowerCase().replace(/ /g, "-")]
      if (label) node.displayName = label
    }
    return node
  },
  sortFn: (a, b) => {
    if (a.isFolder && b.isFolder) {
      const order = ["essays", "philosophy", "concepts", "practical", "application architecture"]
      const ai = order.indexOf(a.displayName.toLowerCase().replace(/-/g, " ").trim())
      const bi = order.indexOf(b.displayName.toLowerCase().replace(/-/g, " ").trim())
      const rankDiff = (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi)
      if (rankDiff !== 0) return rankDiff
    }
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }
    return !a.isFolder && b.isFolder ? 1 : -1
  },
})

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
