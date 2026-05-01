// Deterministic Fisher-Yates shuffle seeded from a string.
// Same seed always produces the same order — preview and PDF stay in sync.
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0
  }
  for (let i = result.length - 1; i > 0; i--) {
    h = (Math.imul(1664525, h) + 1013904223) >>> 0
    const j = h % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Extract answer words from cloze text — words wrapped in [brackets]
export function extractClozeWords(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) ?? []
  return matches.map(m => m.slice(1, -1))
}

// Replace [word] with a blank line of appropriate width
export function clozeToDisplayParts(text: string): Array<{ type: 'text' | 'blank'; value: string }> {
  const parts: Array<{ type: 'text' | 'blank'; value: string }> = []
  const regex = /\[([^\]]+)\]/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: text.slice(last, match.index) })
    }
    parts.push({ type: 'blank', value: match[1] })
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', value: text.slice(last) })
  }
  return parts
}
