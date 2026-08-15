import cloudsearch from './routes/cloudsearch.js'
import songUrlV1 from './routes/song-url-v1.js'
import runtime from './runtime.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const jsonResponse = (body, status = 200, useCors = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...(useCors ? corsHeaders : {}),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

const handleError = (error) => {
  if (error && error.status && error.body) {
    return jsonResponse(error.body, error.status, true)
  }

  console.error('Worker upstream request failed', error)
  return jsonResponse(
    { code: 502, message: 'Upstream request failed' },
    502,
    true,
  )
}

export default {
  async fetch(request, env, ctx) {
    void env
    void ctx
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'GET') {
      return jsonResponse({ code: 404, message: 'Not Found' }, 404)
    }

    if (url.pathname === '/__health') {
      return jsonResponse({
        ok: true,
        service: 'pudding-music-source',
        runtime: 'cloudflare-worker',
      }, 200, true)
    }

    try {
      if (url.pathname === '/cloudsearch') {
        const result = await cloudsearch(url, runtime)
        return jsonResponse(result.body, result.status, true)
      }

      if (url.pathname === '/song/url/v1') {
        const result = await songUrlV1(url, runtime)
        return jsonResponse(result.body, result.status, true)
      }
    } catch (error) {
      return handleError(error)
    }

    return jsonResponse({ code: 404, message: 'Not Found' }, 404)
  },
}
