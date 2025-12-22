import { join } from 'node:path'
import process from 'node:process'

const repoRoot = new URL('..', import.meta.url)
const browserDir = join(repoRoot.pathname, 'tests/browser')
const distDir = join(repoRoot.pathname, 'dist')
const port = Number(process.env.PLAYWRIGHT_PORT || 4173)

function resolveFile(pathname: string): string {
  if (pathname.startsWith('/dist/'))
    return join(distDir, pathname.replace('/dist/', ''))

  const relative = pathname === '/' ? 'memory-cache.html' : pathname.slice(1)
  return join(browserDir, relative)
}

const server = Bun.serve({
  port,
  fetch: async (request) => {
    const url = new URL(request.url)
    const filePath = resolveFile(url.pathname)
    const file = Bun.file(filePath)

    if (!(await file.exists()))
      return new Response('Not Found', { status: 404 })

    const type = file.type || 'application/octet-stream'
    return new Response(file, {
      headers: {
        'Content-Type': type,
        'Cache-Control': 'no-store',
      },
    })
  },
})

console.log(`Playwright static server running on http://127.0.0.1:${server.port}`)
