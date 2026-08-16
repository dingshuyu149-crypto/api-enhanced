module.exports = async (url, env) => {
  const id = url.searchParams.get('id')
  if (!id || !/^\d+$/.test(id)) {
    return {
      status: 400,
      body: { code: 400, message: 'valid id is required' },
    }
  }

  const level = url.searchParams.get('level') || 'standard'
  if (level !== 'standard') {
    return {
      status: 400,
      body: { code: 400, message: 'level must be standard' },
    }
  }

  if (!env.NODE_MUSIC_ORIGIN) {
    return {
      status: 503,
      body: { code: 503, message: 'Node music bridge is not configured' },
    }
  }

  let bridgeUrl
  try {
    const origin = new URL(env.NODE_MUSIC_ORIGIN)
    if (origin.protocol !== 'http:' && origin.protocol !== 'https:') {
      throw new Error('invalid bridge protocol')
    }
    bridgeUrl = new URL('/bridge/song/url/v1', origin)
  } catch {
    return {
      status: 503,
      body: { code: 503, message: 'Node music bridge is not configured' },
    }
  }

  bridgeUrl.searchParams.set('id', id)
  bridgeUrl.searchParams.set('level', 'standard')

  let upstream
  try {
    upstream = await fetch(bridgeUrl)
  } catch {
    return {
      status: 502,
      body: { code: 502, message: 'Node music bridge request failed' },
    }
  }

  try {
    return { status: upstream.status, body: await upstream.json() }
  } catch {
    return {
      status: 502,
      body: { code: 502, message: 'Invalid Node music bridge response' },
    }
  }
}
