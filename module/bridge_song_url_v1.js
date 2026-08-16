const createOption = require('../util/option.js')
const request = require('../util/request.js')

module.exports = (query) => {
  const id = String(query.id || '')
  if (!/^\d+$/.test(id)) {
    return {
      status: 400,
      body: { code: 400, message: 'valid id is required' },
      cookie: [],
    }
  }

  const level = query.level || 'standard'
  if (level !== 'standard') {
    return {
      status: 400,
      body: { code: 400, message: 'level must be standard' },
      cookie: [],
    }
  }

  const data = {
    ids: `[${id}]`,
    level: 'standard',
    encodeType: 'flac',
  }
  const requestQuery = {
    id,
    level: 'standard',
    unblock: 'false',
    crypto: 'eapi',
  }

  return request(
    '/api/song/enhance/player/url/v1',
    data,
    createOption(requestQuery, 'eapi'),
  )
}
