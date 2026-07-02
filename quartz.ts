import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import * as ExternalPlugin from "./.quartz/plugins"

// Pin the top-level section order in the left-hand explorer; everything else
// keeps the default folders-first alphabetical sort.
const SECTION_ORDER = ["philosophy", "concepts", "practical", "application architecture"]
const sectionRank = (name: string) => {
  const idx = SECTION_ORDER.indexOf(name.toLowerCase().replace(/-/g, " ").trim())
  return idx === -1 ? SECTION_ORDER.length : idx
}

ExternalPlugin.Explorer({
  sortFn: (a, b) => {
    if (a.isFolder && b.isFolder) {
      const rankDiff = sectionRank(a.displayName) - sectionRank(b.displayName)
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
