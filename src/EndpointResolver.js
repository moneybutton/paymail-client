import { Capabilities } from './constants'
import { DnsClient } from './dns-client'
import { DnsOverHttps } from './dns-over-https'

class EndpointResolver {
  constructor (dns = null, fetch) {
    this.dnsClient = new DnsClient(dns, new DnsOverHttps(fetch, { baseUrl: 'https://dns.google.com/resolve' }))

    this.fetch = fetch
    this._cache = {}
  }

  static create (dnsClient, fetch) {
    const instance = new EndpointResolver(null, fetch)
    instance.dnsClient = dnsClient
    return instance
  }

  async getIdentityUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, Capabilities.pki)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const identityUrl = apiDescriptor.capabilities.pki
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return identityUrl
  }

  async getAddressUrlFor (aPaymail) {
    const [ alias, domain ] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, Capabilities.paymentDestination)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const addressUrl = apiDescriptor.capabilities.paymentDestination
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return addressUrl
  }

  async getVerifyUrlFor (aPaymail, aPubkey) {
    const [ alias, domain ] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, Capabilities.verifyPublicKeyOwner)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[Capabilities.verifyPublicKeyOwner]
      .replace('{alias}', alias).replace('{domain.tld}', domain).replace('{pubkey}', aPubkey)
    return url
  }

  async getPublicProfileUrlFor (aPaymail) {
    const [ alias, domain ] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, Capabilities.publicProfile)
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities[Capabilities.publicProfile]
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
    const wellKnown = await this.fetch(`${protocol}://${domain}:${port}/.well-known/bsvalias`, { credentials: 'omit' })
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
