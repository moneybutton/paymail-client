import { EndpointResolver } from './EndpointResolver'
import { RequestBodyFactory } from './RequestBodyFactory'
import { Clock } from './Clock'
import { PaymailNotFound } from './errors/PaymailNotFound'
import { CapabilityCodes } from './constants'
import fetch from 'isomorphic-fetch'
import { BrowserDns } from './BrowserDns'
import { Http } from './http'

class PaymailClient {
  constructor (dns = null, fetch2 = null, clock = null, bsv = null) {
    if (fetch2 === null) {
      fetch2 = fetch
    }
    if (dns === null) {
      dns = new BrowserDns(fetch2)
    }
    if (bsv === null) {
      bsv = require('bsv')
    }
    this.bsv = bsv
    this.resolver = new EndpointResolver(dns, fetch2)
    this.http = new Http(fetch2)
    this.requestBodyFactory = new RequestBodyFactory(clock !== null ? clock : new Clock())
  }

  /**
   * Uses pki flow to query for an identity key for a given paymail address.
   *
   * @param {String} paymail - a paymail address
   */
  async getPublicKey (paymail) {
    const identityUrl = await this.resolver.getIdentityUrlFor(paymail)
    const response = await this.http.get(identityUrl)
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
    const response = await this.http.postJson(
      addressUrl,
      this.requestBodyFactory.buildBodyToRequestAddress(senderInfo, privateKey)
    )
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
    const response = await this.http.get(url)
    const body = await response.json()
    const { match } = body
    return match
  }

  /**
   * Verifies if a given signature is valid for a given message. It uses
   * different strategies depending on the capabilities of the server
   * and the parameters Given. The priority order is.
   * - If paymail is not provided, then normal signature verification is performed.
   * - Use provided key (and check that belongs to given paymail address).
   * - Get a new pubkey for given paymail address using pki.
   * - If there is no way to intereact with the owner of the domain to verify the public key it returns false.
   *
   * @param {Message} message - Message to verify
   * @param {String} signature - Signature
   * @param {String} paymail - Signature owner paymail
   * @param {String} pubkey - Optional. Public key that validates the signature.
   */
  async isValidSignature (message, signature, paymail = null, pubkey = null) {
    if (paymail == null && pubkey === null) {
      throw new Error('Must specify either paymail or pubkey')
    }
    let senderPublicKey
    if (paymail) {
      if (pubkey && await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.verifyPublicKeyOwner)) {
        if (await this.verifyPubkeyOwner(pubkey, paymail)) {
          senderPublicKey = this.bsv.PublicKey.fromString(pubkey)
        } else {
          return false
        }
      } else {
        const hasPki = await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.pki)
        if (hasPki) {
          const identityKey = await this.getPublicKey(paymail)
          senderPublicKey = this.bsv.PublicKey.fromString(identityKey)
        } else {
          return false
        }
      }
    }

    const senderKeyAddress = this.bsv.Address.fromPublicKey(senderPublicKey || pubkey)
    try {
      const verified = message.verify(senderKeyAddress.toString(), signature)
      return verified
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
    const publicProfileUrl = await this.resolver.getPublicProfileUrlFor(paymail)
    const response = await this.http.get(publicProfileUrl)
    if (!response.ok) {
      const body = await response.json()
      throw new Error(`Server failed with: ${JSON.stringify(body)}`)
    }
    const { avatar, name } = await response.json()
    return { avatar, name }
  }

  async sendRawTx (targetPaymail, hexTransaction, reference, metadata = {}) {
    if (!hexTransaction) {
      throw new Error('transaction hex cannot be empty')
    }
    const receiveTxUrl = await this.resolver.getSendTxUrlFor(targetPaymail)
    const response = await this.http.postJson(
      receiveTxUrl,
      this.requestBodyFactory.buildBodySendTx(hexTransaction, reference, metadata)
    )
    if (!response.ok) {
      const body = await response.json()
      throw new Error(`Server failed with: ${JSON.stringify(body)}`)
    }
    return response.json()
  }

  async getP2pPaymentDestination (targetPaymail, satoshis) {
    if (!satoshis) {
      throw new Error('Amount in satohis needs to be specified')
    }
    const paymentDestinationUrl = await this.resolver.getP2pPatmentDestinationUrlFor(targetPaymail)
    const response = await this.http.postJson(
      paymentDestinationUrl,
      this.requestBodyFactory.buildBodyP2pPaymentDestination(satoshis)
    )
    if (!response.ok) {
      const body = await response.json()
      throw new Error(`Server failed with: ${JSON.stringify(body)}`)
    }

    const body = await response.json()
    if (!body.outputs) {
      throw new Error('Server answered with a wrong format. Missing outputs')
    }

    return body
  }
}

export { PaymailClient }
