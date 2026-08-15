const registerAnonymous = require('../module/register_anonimous')
const registerXeapiPublicKey = require('../module/register_xeapikey')
const request = require('../util/request')
const { generateDeviceId } = require('../util/index')

let runtimePromise = null

const getMusicA = (cookies) => {
  for (const cookie of cookies || []) {
    const match = /(?:^|;\s*)MUSIC_A=([^;]*)/.exec(cookie)
    if (match) {
      return match[1]
    }
  }

  return ''
}

const initializeMusicRuntime = async () => {
  const deviceId = generateDeviceId()
  global.deviceId = deviceId

  const keyResult = await registerXeapiPublicKey({ deviceId }, request)
  request.setRuntimeCredentials({ xeapiPublicKey: keyResult.body })

  const anonymousResult = await registerAnonymous({}, request)
  const anonymousToken = getMusicA(anonymousResult.cookie)
  if (!anonymousToken) {
    throw new Error('anonymous token registration failed')
  }

  request.setRuntimeCredentials({ anonymousToken })
}

const ensureMusicRuntime = () => {
  if (!runtimePromise) {
    runtimePromise = initializeMusicRuntime().catch((error) => {
      runtimePromise = null
      throw error
    })
  }

  return runtimePromise
}

module.exports = {
  ensureMusicRuntime,
  request,
}
