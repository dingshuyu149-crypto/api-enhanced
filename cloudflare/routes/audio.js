const songUrlV1 = require('./song-url-v1')

const mediaHeaders = [
  'Content-Type',
  'Content-Length',
  'Content-Range',
  'Accept-Ranges',
  'ETag',
  'Last-Modified',
]

const isAllowedSource = (sourceUrl) => {
  let url
  try {
    url = new URL(sourceUrl)
  } catch {
    return false
  }

  const hostname = url.hostname.toLowerCase()
  const isAllowedHostname =
    hostname === 'music.126.net' ||
    hostname.endsWith('.music.126.net') ||
    hostname === 'music.163.com' ||
    hostname.endsWith('.music.163.com')

  return (url.protocol === 'http:' || url.protocol === 'https:') && isAllowedHostname
}

const errorResponse = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

module.exports = async (request, url, runtime) => {
  const id = url.searchParams.get('id')
  if (!id || !/^\d+$/.test(id)) {
    return errorResponse({ code: 400, message: 'valid id is required' }, 400)
  }

  const songUrl = new URL('/song/url/v1', url.origin)
  songUrl.searchParams.set('id', id)
  songUrl.searchParams.set('level', 'standard')
  const result = await songUrlV1(songUrl, runtime)
  const sourceUrl = result.body?.data?.[0]?.url

  if (result.status !== 200 || !sourceUrl) {
    return errorResponse({ code: 404, message: 'Audio source unavailable' }, 404)
  }

  if (!isAllowedSource(sourceUrl)) {
    return errorResponse(
      { code: 502, message: 'Invalid upstream audio source' },
      502,
    )
  }

  const headers = new Headers()
  const range = request.headers.get('Range')
  if (range) {
    headers.set('Range', range)
  }

  let upstream
  try {
    upstream = await fetch(sourceUrl, { headers, redirect: 'manual' })
  } catch {
    console.error('Audio upstream request failed')
    return errorResponse({ code: 502, message: 'Audio upstream request failed' }, 502)
  }

  if (upstream.status !== 200 && upstream.status !== 206) {
    console.error('Audio upstream request failed', upstream.status)
    return errorResponse({ code: 502, message: 'Audio upstream request failed' }, 502)
  }

  const responseHeaders = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Accept-Ranges, Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
  })
  for (const header of mediaHeaders) {
    const value = upstream.headers.get(header)
    if (value && header !== 'Content-Type') {
      responseHeaders.set(header, value)
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
