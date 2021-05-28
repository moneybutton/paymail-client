import { CapabilityCodes } from './constants'
import { DnsClient } from './dns-client'
import { DnsOverHttps } from './dns-over-https'
import { Http } from './http'

class EndpointResolver {
  constructor (dns = null, fetch) {
    this.dnsClient = new DnsClient(dns, new DnsOverHttps(fetch, { baseUrl: 'https://dns.google.com/resolve' }))

    this.http = new Http(fetch)
    this._cache = {}
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

  async getP2pPatmentDestinationUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, CapabilityCodes.p2pPaymentDestination)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[CapabilityCodes.p2pPaymentDestination]
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return url
  }

  async domainHasCapability (aDomain, capability) {
    const apiDescriptor = await this.getApiDescriptionFor(aDomain)
    return !!apiDescriptor.capabilities[capability]
  }

  async getApiDescriptionFor (aDomain) {
    if (this._cache[aDomain]) {
      return this._cache[aDomain]
    }
    const { domain, port } = await this.getWellKnownBaseUrl(aDomain)
    const apiDescriptor = this.fetchApiDescriptor(domain, port)
    this._cache[aDomain] = apiDescriptor
    return apiDescriptor
  }

  async fetchApiDescriptor (domain, port) {
    const protocol = (domain === 'localhost' || domain === 'localhost.') ? 'http' : 'https'
    const requestPort = port.toString() === '443' ? '' : `:${port}`
    const requestDomain = /^(.*?)\.?$/.exec(domain)[1] // Get value from capture group
    if (!requestDomain) {
      throw new Error(`Invalid domain: ${domain}`)
    }
    const wellKnown = await this.http.get(`${protocol}://${requestDomain}${requestPort}/.well-known/bsvalias`)
    const apiDescriptor = await wellKnown.json()
    return apiDescriptor
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
