const BASE_THRESHOLD = 4  // edits before the first nudge
const ANNOTATED_DECAY_THRESHOLD = 8  // if user has annotated this many, raise threshold

function getStorageKey(worksheetId: string) {
  return `annotate-nudged:${worksheetId}`
}

function countRecentAnnotations(): number {
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('annotate-nudged:') && localStorage.getItem(key) === 'done') count++
  }
  return count
}

export function useAnnotateNudge(worksheetId: string | null) {
  function shouldNudge(totalEdits: number): boolean {
    if (!worksheetId) return false
    const key = getStorageKey(worksheetId)
    if (localStorage.getItem(key)) return false  // already shown for this worksheet

    const threshold = countRecentAnnotations() >= ANNOTATED_DECAY_THRESHOLD
      ? BASE_THRESHOLD * 3  // regular annotators get a higher bar
      : BASE_THRESHOLD

    return totalEdits >= threshold
  }

  function markNudged() {
    if (!worksheetId) return
    localStorage.setItem(getStorageKey(worksheetId), 'shown')
  }

  function markAnnotated() {
    if (!worksheetId) return
    localStorage.setItem(getStorageKey(worksheetId), 'done')
  }

  return { shouldNudge, markNudged, markAnnotated }
}
