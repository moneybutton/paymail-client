import { Capabilities } from './constants'

class EndpointResolver {
  constructor (dns, fetch) {
    this.dns = dns
    this.fetch = fetch
    this._cache = {}
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
    const protocol = domain === 'localhost' ? 'http' : 'https'
    const wellKnown = await this.fetch(`${protocol}://${domain}:${port}/.well-known/bsvalias`)
    const apiDescriptor = await wellKnown.json()
    return apiDescriptor
  }

  async getWellKnownBaseUrl (aDomain) {
    let finish
    let fail

    const result = new Promise((resolve, reject) => {
      finish = resolve
      fail = reject
    })

    this.dns.resolveSrv(`_bsvalias._tcp.${aDomain}`, async (err, result) => {
      try {
        if (err && (err.code === 'ENODATA' || err.code === 'ENOTFOUND')) {
          return finish({
            domain: aDomain,
            port: 443
          })
        }
        if (err) {
          return fail(err)
        }

        const { name, port } = result[0]
        finish({
          domain: name,
          port
        })
      } catch (err) {
        return fail(err)
      }
    })

    return result
  }

  async ensureCapabilityFor (aDomain, aCapability) {
    if (!await this.domainHasCapability(aDomain, aCapability)) {
      throw new Error(`Unknown capability "${aCapability}" for "${aDomain}"`)
    }
  }
}

export { EndpointResolver }
