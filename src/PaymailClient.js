import { EndpointResolver } from './EndpointResolver'
import { VerifiableMessage } from './VerifiableMessage'
import { RequestBodyFactory } from './RequestBodyFactory'
import { Clock } from './Clock'
import { PaymailNotFound } from './errors/PaymailNotFound'
import { CapabilityCodes } from './constants'
import fetch from 'isomorphic-fetch'
import { BrowserDns } from './BrowserDns'
import { Http } from './http'
import HttpStatus from 'http-status-codes'
import { ProtocolNotSupported } from './errors/ProtocolNotSupported'
import { AssetNotAccepted } from './errors/AssetNotAccepted'
import { AuthoriserNotFound } from './errors/AuthoriserNotFound'

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
    this.VerifiableMessage = VerifiableMessage
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
    let senderPubKey
    if (paymail) {
      if (pubkey && await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.verifyPublicKeyOwner)) {
        if (await this.verifyPubkeyOwner(pubkey, paymail)) {
          senderPubKey = this.bsv.PubKey.fromString(pubkey)
        } else {
          return false
        }
      } else {
        const hasPki = await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.pki)
        if (hasPki) {
          const identityKey = await this.getPublicKey(paymail)
          senderPubKey = this.bsv.PubKey.fromString(identityKey)
        } else {
          return false
        }
      }
    }

    const senderKeyAddress = this.bsv.Address.fromPubKey(senderPubKey || pubkey)
    try {
      const verified = message.verify(senderKeyAddress.toString(), signature)
      return verified
    } catch (err) {
      // console.log(err)
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
    let receiveTxUrl = await this.resolver.getSendTxUrlFor(targetPaymail)
    const response = await this.http.postJson(
      receiveTxUrl,
      this.requestBodyFactory.buildBodySendTx(hexTransaction, reference, metadata)
    )
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Server failed with: ${body}`)
    }
    return response.json()
  }

  async getP2pPaymentDestination (targetPaymail, satoshis) {
    if (!satoshis) {
      throw new Error('Amount in satohis needs to be specified')
    }
    let paymentDestinationUrl = await this.resolver.getP2pPaymentDestinationUrlFor(targetPaymail)
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

  async getP2pPaymentDestinationWithTokensSupport (targetPaymail, amount, asset, protocol) {
    const UNAVAILABLE_FOR_LEGAL_REASONS = 451
    if (!amount) {
      throw new Error('Amount needs to be specified')
    }
    let paymentDestinationUrl = await this.resolver.getP2pPaymentDestinationWithTokensSupportUrlFor(targetPaymail)
    const response = await this.http.postJson(
      paymentDestinationUrl,
      {
        amount,
        asset,
        protocol
      }
    )
    if (response.status === HttpStatus.NOT_ACCEPTABLE) {
      throw new ProtocolNotSupported(`Protocol ${protocol} is not supported by paymail ${targetPaymail}`, protocol)
    }
    if (response.status === UNAVAILABLE_FOR_LEGAL_REASONS) {
      throw new AssetNotAccepted(`Paymail ${targetPaymail} cannot accept asset ${asset}`)
    }
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

  async sendSfpBuildAction (targetAssetPaymail, params) {
    let buildActionUrl
    try {
      buildActionUrl = await this.resolver.getSfpBuildActionUrlFor(targetAssetPaymail)
    } catch (err) {
      if (err.message.includes('Unexpected token')) {
        throw new AuthoriserNotFound(`Invalid authoriser for ${targetAssetPaymail}`)
      }
    }
    const response = await this.http.postJson(buildActionUrl, params)

    if (!response.ok) {
      const body = await response.json()
      throw new Error(body.message)
    }

    return response.json()
  }

  async sendSfpAuthoriseAction (targetAssetPaymail, params) {
    let authoriseActionUrl = await this.resolver.getSfpAuthoriseActionUrlFor(targetAssetPaymail)
    const response = await this.http.postJson(authoriseActionUrl, params)

    if (!response.ok) {
      const body = await response.json()
      throw new Error(body.message)
    }

    return response.json()
  }

  async getAssetInformation (assetTargetPaymail) {
    let assetInformationUrl = await this.resolver.getAssetInformationUrlFor(assetTargetPaymail)
    const response = await this.http.get(assetInformationUrl)

    if (response.status === HttpStatus.NOT_FOUND) {
      throw new Error(`Asset ${assetTargetPaymail} was not found`)
    }
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Server failed with: ${body}`)
    }

    return response.json()
  }
}

export { PaymailClient }
