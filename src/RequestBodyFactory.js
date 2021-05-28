import { VerifiableMessage } from './VerifiableMessage'

class RequestBodyFactory {
  constructor (clock) {
    this.clock = clock
  }

  buildBodyToRequestAddress (senderInfo, privateKey = null) {
    const {
      senderHandle,
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
        senderHandle,
        amount,
        dt,
        purpose
      }).sign(privateKey)
    }

    return {
      senderHandle,
      senderName,
      purpose,
      dt,
      amount: amount || null,
      pubkey,
      signature
    }
  }

  buildBodySendTx (hexTransaction, reference, metadata) {
    return { hex: hexTransaction, metadata, reference }
  }

  buildBodyP2pPaymentDestination (satoshis) {
    return { satoshis }
  }
}

export { RequestBodyFactory }
