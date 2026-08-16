const registerAnonymous = require('../module/register_anonimous')
const registerXeapiPublicKey = require('../module/register_xeapikey')
const request = require('../util/request')
const { generateDeviceId, generateRandomChineseIP } = require('../util/index')

let runtimePromise = null
let runtimeChineseIp = ''

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
  runtimeChineseIp = generateRandomChineseIP()
  global.cnIp = runtimeChineseIp

  const deviceId = generateDeviceId()
  global.deviceId = deviceId

  const keyResult = await registerXeapiPublicKey({ deviceId }, request)
  request.setRuntimeCredentials({ xeapiPublicKey: keyResult.body })

  const anonymousResult = await registerAnonymous({}, request)
  const anonymousToken = getMusicA(anonymousResult.cookie)
  if (!anonymousToken) {
    throw new Error('anonymous token registration failed')
  }

  const finalKeyResult = await registerXeapiPublicKey(
    { deviceId: global.deviceId },
    request,
  )
  request.setRuntimeCredentials({
    anonymousToken,
    xeapiPublicKey: finalKeyResult.body,
  })
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

const requestWithRuntimeContext = (uri, data, options = {}) =>
  request(uri, data, {
    ...options,
    ip: options.ip || runtimeChineseIp,
  })

module.exports = {
  ensureMusicRuntime,
  request: requestWithRuntimeContext,
}
