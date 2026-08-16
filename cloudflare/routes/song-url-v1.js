const createOption = require('../../util/option')

module.exports = async (url, runtime) => {
  const id = url.searchParams.get('id')
  if (!id) {
    return {
      status: 400,
      body: { code: 400, message: 'id is required' },
    }
  }

  const level = url.searchParams.get('level') || 'standard'
  if (level !== 'standard') {
    return {
      status: 400,
      body: { code: 400, message: 'level must be standard' },
    }
  }

  const query = { id, level, unblock: 'false' }
  const data = {
    ids: `[${id}]`,
    level,
    encodeType: 'flac',
  }

  await runtime.ensureMusicRuntime()
  const result = await runtime.request(
    '/api/song/enhance/player/url/v1',
    data,
    createOption(query),
  )
  return { status: result.status, body: result.body }
}
