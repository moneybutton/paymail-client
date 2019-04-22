import { VerifiableMessage } from './VerifiableMessage'

class RequestBodyFactory {
  constructor (clock) {
    this.clock = clock
  }
  buildBodyToRequestAddress (senderInfo, privateKey = null) {
    const {
      senderPaymail,
      amount,
      senderName,
      purpose,
      pubkey,
      signature: providedSignature
    } = senderInfo

    if (!providedSignature && privateKey === null) {
      throw new Error('Missing private key or signature')
    }

    let dt, signature
    if (providedSignature) {
      if (!senderInfo.dt) {
        throw new Error('missing datetime for given signature')
      }
      dt = senderInfo.dt
      signature = providedSignature
    } else {
      dt = this.clock.now()
      signature = VerifiableMessage.forBasicAddressResolution({
        senderPaymail,
        amount,
        dt,
        purpose
      }).sign(privateKey)
    }

    return {
      senderPaymail,
      senderName,
      purpose,
      dt,
      amount: amount || null,
      pubkey,
      signature
    }
  }
}

export { RequestBodyFactory }
