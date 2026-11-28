import type { VercelRequest } from '@vercel/node'

// The site's public origin, e.g. https://www.theworksheetproject.com. SITE_URL pins it;
// otherwise it's the host the request came in on (so previews work too).
export function siteOrigin(req: VercelRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '')
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim()
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '').split(',')[0].trim()
  return `${proto}://${host}`
}
