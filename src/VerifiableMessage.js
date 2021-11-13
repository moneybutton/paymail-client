class VerifiableMessage {
  constructor (parts, bsv = null) {
    if (bsv === null) {
      bsv = require('bsv')
      bsv.Message = require('bsv/message')
    }
    this.bsv = bsv
    const concatenated = Buffer.from(parts.join(''))
    this.message = new this.bsv.Message(concatenated)
  }

  static forBasicAddressResolution ({
    senderHandle,
    amount,
    dt,
    purpose
  }) {
    if (dt && dt.toISOString) {
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
    return this.message.sign(this.bsv.PrivateKey.fromWIF(wifPrivateKey))
  }

  verify (keyAddress, signature) {
    return this.message.verify(keyAddress, signature)
  }
}

export { VerifiableMessage }
