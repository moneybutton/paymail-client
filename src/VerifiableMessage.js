import bsv from 'bsv'
import Message from 'bsv/message'

class VerifiableMessage {
  constructor (parts) {
    const concatenated = Buffer.from(parts.join(''))
    const hashed = bsv.crypto.Hash.sha256(concatenated).toString('hex')
    this.message = new Message(hashed)
  }

  static forBasicAddressResolution ({
    senderHandle,
    amount,
    dt,
    purpose
  }) {
    if (dt.toISOString) {
      dt = dt.toISOString()
    }

    return new VerifiableMessage([
      senderHandle,
      amount || '0',
      dt,
      purpose
    ])
  }

  sign (wifPrivateKey) {
    return this.message.sign(bsv.PrivateKey.fromWIF(wifPrivateKey))
  }

  verify (keyAddress, signature) {
    return this.message.verify(keyAddress, signature)
  }
}

export { VerifiableMessage }
