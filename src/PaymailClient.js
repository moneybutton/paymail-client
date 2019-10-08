import { EndpointResolver } from './EndpointResolver'
import bsv from 'bsv'
import { RequestBodyFactory } from './RequestBodyFactory'
import { Clock } from './Clock'
import { PaymailNotFound } from './errors/PaymailNotFound'
import { Capabilities } from './constants'
import fetch from 'isomorphic-fetch'
import { BrowserDns } from './BrowserDns'

class PaymailClient {
  constructor (dns = null, fetch2 = null, clock = null) {
    if (fetch2 === null) {
      fetch2 = fetch
    }
    if (dns === null) {
      dns = new BrowserDns(fetch2)
    }
    this.resolver = new EndpointResolver(dns, fetch2)
    this.fetch = fetch2
    this.requestBodyFactory = new RequestBodyFactory(clock !== null ? clock : new Clock())
  }

  /**
   * Uses pki flow to query for an identity key for a given paymail address.
   *
   * @param {String} paymail - a paymail address
   */
  async getPublicKey (paymail) {
    const identityUrl = await this.resolver.getIdentityUrlFor(paymail)
    const response = await this.fetch(identityUrl, { credentials: 'omit' })
    const { pubkey } = await response.json()
    return pubkey
  }

  /**
   * Uses `Basic Address Resolution` flow to query for a payment for output for the
   * given paymail address.
   *
   * @param {String} aPaymail - a paymail address
   * @param {Object} senderInfo - Object containing sender info
   * @param {String} senderInfo.senderHandle - Sender paymail address
   * @param {String} senderInfo.amount - Optional. Required amount.
   * @param {String} senderInfo.senderName - Optional. Sender name.
   * @param {String} senderInfo.purpose - Optional. Purpose of the payment.
   * @param {String} senderInfo.pubkey - Optional. Public key used to sign the message.
   * @param {String} senderInfo.signature - Optional. Valid signature according to paymail specification.
   * @param {String} privateKey - Optional. private key to sign the request.
   */
  async getOutputFor (aPaymail, senderInfo, privateKey = null) {
    const addressUrl = await this.resolver.getAddressUrlFor(aPaymail)
    const response = await this.fetch(addressUrl, {
      method: 'POST',
      credentials: 'omit',
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

  /**
   * Verify if the given public address belongs to the given
   * paymail address.
   *
   * @param {String} pubkey - Public key to check.
   * @param {String} paymail - a paymail address
   */
  async verifyPubkeyOwner (pubkey, paymail) {
    const url = await this.resolver.getVerifyUrlFor(paymail, pubkey)
    const response = await this.fetch(url, { credentials: 'omit' })
    const body = await response.json()
    const { match } = body
    return match
  }

  /**
   * Verifies if a given signature is valid for a given message. It uses
   * different strategies depending on the capabilities of the server
   * and the parameters Given. The priority order is.
   * - Use provided key (and check that belongs to given paymail address)
   * - Get a new pubkey for given paymail address using pki.
   * - If there is no way to intereact with the owner of the domain to verify the public key it returns false.
   *
   * @param {Message} message - Message to verify
   * @param {String} signature - Signature
   * @param {String} paymail - Signature owner paymail
   * @param {String} pubkey - Optional. Public key that validates the signature.
   */
  async isValidSignature (message, signature, paymail, pubkey = null) {
    let senderPublicKey
    if (pubkey && await this.resolver.domainHasCapability(paymail.split('@')[1], Capabilities.verifyPublicKeyOwner)) {
      if (await this.verifyPubkeyOwner(pubkey, paymail)) {
        senderPublicKey = bsv.PublicKey.fromString(pubkey)
      } else {
        return false
      }
    } else {
      const hasPki = await this.resolver.domainHasCapability(paymail.split('@')[1], Capabilities.pki)
      if (hasPki) {
        const identityKey = await this.getPublicKey(paymail)
        senderPublicKey = bsv.PublicKey.fromString(identityKey)
      } else {
        return false
      }
    }

    const senderKeyAddress = bsv.Address.fromPublicKey(senderPublicKey)
    try {
      return message.verify(senderKeyAddress.toString(), signature)
    } catch (err) {
      return false
    }
  }

  /**
   * Gets the public profile information using the "Public Profile" protocol.
   *
   * @param {String} paymail - a paymail address
   * @param {String} s - the preferred size of the image
   */
  async getPublicProfile (paymail) {
    let publicProfileUrl = await this.resolver.getPublicProfileUrlFor(paymail)
    const response = await this.fetch(publicProfileUrl, { credentials: 'omit' })
    if (!response.ok) {
      const body = await response.json()
      throw new Error(`Server failed with: ${JSON.stringify(body)}`)
    }
    const { avatar, name } = await response.json()
    return { avatar, name }
  }
}

export { PaymailClient }
