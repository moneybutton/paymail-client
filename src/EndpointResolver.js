import { CapabilityCodes } from './constants'
import { DnsClient } from './dns-client'
import { DnsOverHttps } from './dns-over-https'
import { PaymailServerError } from './errors/PaymailServerError'
import { Http } from './http'
import PureCache from 'pure-cache'

class EndpointResolver {
  constructor (dns = null, fetch, defaultCacheTTL = 0) {
    this.dnsClient = new DnsClient(dns, new DnsOverHttps(fetch, { baseUrl: 'https://dns.google.com/resolve' }))

    this.http = new Http(fetch)
    this.defaultCacheTTL = defaultCacheTTL
    if (defaultCacheTTL) {
      this.cache = new PureCache({
        expiryCheckInterval: 10000
      })
      if (this.cache.cacheExpirer.timer.unref) {
        this.cache.cacheExpirer.timer.unref()
      }
    }
  }

  static create (dnsClient, fetch) {
    const instance = new EndpointResolver(null, fetch)
    instance.dnsClient = dnsClient
    return instance
  }

  async getIdentityUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.pki)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const identityUrl = apiDescriptor.capabilities.pki
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return identityUrl
  }

  async getAddressUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.paymentDestination)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const addressUrl = apiDescriptor.capabilities.paymentDestination
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return addressUrl
  }

  async getVerifyUrlFor (aPaymail, aPubkey) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.verifyPublicKeyOwner)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.verifyPublicKeyOwner]
      .replace('{alias}', alias).replace('{domain.tld}', domain).replace('{pubkey}', aPubkey)
    return url
  }

  async getPublicProfileUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.publicProfile)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.publicProfile]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async getSendTxUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.receiveTransaction)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.receiveTransaction]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async getP2pPaymentDestinationUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.p2pPaymentDestination)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.p2pPaymentDestination]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async getP2pPaymentDestinationWithTokensSupportUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.p2pPaymentDestinationWithTokensSupport)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.p2pPaymentDestinationWithTokensSupport]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async getSfpBuildActionUrlFor (aPaymail) {
    const [, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.sfpBuildAction)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.sfpBuildAction]
    return url
  }

  async getSfpAuthoriseActionUrlFor (aPaymail) {
    const [, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.sfpAuthoriseAction)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.sfpAuthoriseAction]
    return url
  }

  async getAssetInformationUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.assetInformation)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.assetInformation]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async domainHasCapability (aDomain, capability) {
    const apiDescriptor = await this.getApiDescriptionFor(aDomain)
    return apiDescriptor.capabilities && !!apiDescriptor.capabilities[capability]
  }

  async getApiDescriptionFor (aDomain) {
    let apiDescriptor = this.cache && this.cache.get(aDomain)
    if (apiDescriptor) {
      return apiDescriptor.value
    }
    const { domain, port } = await this.getWellKnownBaseUrl(aDomain)
    apiDescriptor = await this.fetchApiDescriptor(domain, port)
    this.cache && this.cache.put(aDomain, apiDescriptor, this.defaultCacheTTL)
    return apiDescriptor
  }

  async fetchApiDescriptor (domain, port) {
    const protocol = (domain === 'localhost' || domain === 'localhost.') ? 'http' : 'https'
    const requestPort = port.toString() === '443' ? '' : `:${port}`
    const requestDomain = /^(.*?)\.?$/.exec(domain)[1] // Get value from capture group
    if (!requestDomain) {
      throw new Error(`Invalid domain: ${domain}`)
    }
    try {
      const wellKnown = await this.http.get(`${protocol}://${requestDomain}${requestPort}/.well-known/bsvalias`)
      const apiDescriptor = await wellKnown.json()
      return apiDescriptor
    } catch (err) {
      if (err.message.includes('invalid json response')) {
        throw new PaymailServerError(`Paymail server at ${domain} returned an invalid capabilities description`)
      }
      if (err.message.includes('getaddrinfo ENOTFOUND')) {
        throw new PaymailServerError(`Couldn't find domain ${domain}`)
      }
      throw err
    }
  }

  async getWellKnownBaseUrl (aDomain) {
    return this.dnsClient.checkSrv(aDomain)
  }

  async ensureCapabilityFor (aDomain, aCapability) {
    if (!await this.domainHasCapability(aDomain, aCapability)) {
      throw new Error(`Unknown capability "${aCapability}" for "${aDomain}"`)
    }
  }
}

export { EndpointResolver }
