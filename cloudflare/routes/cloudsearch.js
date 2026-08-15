const cloudsearch = require('../../module/cloudsearch')

const parseInteger = (value, fallback, minimum, maximum) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(Math.max(parsed, minimum), maximum)
}

module.exports = async (url, runtime) => {
  const keywords = url.searchParams.get('keywords')
  if (!keywords) {
    return {
      status: 400,
      body: { code: 400, message: 'keywords is required' },
    }
  }

  const type = parseInteger(url.searchParams.get('type'), 1, 1, 1000)
  if (![1, 100, 1000].includes(type)) {
    return {
      status: 400,
      body: { code: 400, message: 'type must be 1, 100, or 1000' },
    }
  }

  const query = {
    keywords,
    type,
    limit: parseInteger(url.searchParams.get('limit'), 20, 1, 30),
    offset: parseInteger(url.searchParams.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER),
  }

  await runtime.ensureMusicRuntime()
  const result = await cloudsearch(query, runtime.request)
  return { status: result.status, body: result.body }
}
