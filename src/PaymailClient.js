import { EndpointResolver } from './EndpointResolver'
import bsv from 'bsv'
import { RequestBodyFactory } from './RequestBodyFactory'
import { Clock } from './Clock'
import { PaymailNotFound } from './errors/PaymailNotFound'

class PaymailClient {
  constructor (dns, fetch, clock = null) {
    this.resolver = new EndpointResolver(dns, fetch)
    this.fetch = fetch
    this.requestBodyFactory = new RequestBodyFactory(clock !== null ? clock : new Clock())
  }

  async getPublicKey (paymail) {
    const identityUrl = await this.resolver.getIdentityUrlFor(paymail)
    const response = await this.fetch(identityUrl)
    const { pubkey } = await response.json()
    return pubkey
  }

  async getAddressFor (aPaymail, senderInfo, privateKey = null) {
    const addressUrl = await this.resolver.getAddressUrlFor(aPaymail)
    const response = await this.fetch(addressUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.requestBodyFactory.buildBodyToRequestAddress(senderInfo, privateKey))
    })
    if (!response.ok) {
      throw new PaymailNotFound(`Paymail not found: ${aPaymail}`, aPaymail)
    }
    const { output } = await response.json()
    return output
  }

  async verifyPubkeyOwner (pubkey, paymail) {
    const url = await this.resolver.getVerifyUrlFor(paymail, pubkey)
    const response = await this.fetch(url)
    const body = await response.json()
    const { match } = body
    return match
  }

  async isValidSignature (message, signature, paymail, pubkey = null) {
    let senderPublicKey
    if (pubkey && await this.resolver.domainHasCapability(paymail.split('@')[1], 'verifyPublicKeyOwner')) {
      if (await this.verifyPubkeyOwner(pubkey, paymail)) {
        senderPublicKey = bsv.PublicKey.fromString(pubkey)
      } else {
        return false
      }
    } else {
      const identityKey = await this.getPublicKey(paymail)
      senderPublicKey = bsv.PublicKey.fromString(identityKey)
    }

    const senderKeyAddress = bsv.Address.fromPublicKey(senderPublicKey)
    try {
      return message.verify(senderKeyAddress.toString(), signature)
    } catch (err) {
      return false
    }
  }
}

export { PaymailClient }
