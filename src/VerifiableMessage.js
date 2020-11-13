class VerifiableMessage {
  constructor (parts, bsv = null) {
    if (bsv === null) {
      bsv = require('bsv')
    }
    this.bsv = bsv
    this.concatenated = Buffer.from(parts.join(''))
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

  sign (wifPrivKey) {
    let privKey = this.bsv.PrivKey.fromWif(wifPrivKey)
    let keyPair = this.bsv.KeyPair.fromPrivKey(privKey)
    return this.bsv.Bsm.sign(this.concatenated, keyPair)
  }

  verify (keyAddress, signature) {
    return this.bsv.Bsm.verify(this.concatenated, signature, this.bsv.Address.fromString(keyAddress))
  }
}

export { VerifiableMessage }
