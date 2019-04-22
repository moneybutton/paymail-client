class EndpointResolver {
  constructor (dns, fetch) {
    this.dns = dns
    this.fetch = fetch
    this._cache = {}
  }

  async getIdentityUrlFor (aPaymail) {
    const [alias, domain] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, 'pki')
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const identityUrl = apiDescriptor.capabilities.pki
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return identityUrl
  }

  async getAddressUrlFor (aPaymail) {
    const [ alias, domain ] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, 'paymentDestination')
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const addressUrl = apiDescriptor.capabilities.paymentDestination
      .replace('{alias}', alias).replace('{domain.tld}', domain)
    return addressUrl
  }

  async getVerifyUrlFor (aPaymail, aPubkey) {
    const [ alias, domain ] = aPaymail.split('@')
    await this.ensureCapabilityFor(domain, 'verifyPublicKeyOwner')
    const apiDescriptor = await this.getApiDescriptionFor(domain)
    const url = apiDescriptor.capabilities.verifyPublicKeyOwner
      .replace('{alias}', alias).replace('{domain.tld}', domain).replace('{pubkey}', aPubkey)
    return url
  }

  async domainHasCapability (aDomain, capability) {
    const apiDescriptor = await this.getApiDescriptionFor(aDomain)
    return !!apiDescriptor.capabilities[capability]
  }

  async getApiDescriptionFor (aDomain) {
    let finish
    let fail
    if (this._cache[aDomain]) {
      return this._cache[aDomain]
    }

    const result = new Promise((resolve, reject) => {
      finish = resolve
      fail = reject
    })

    this.dns.resolveSrv(`_bsvalias._tcp.${aDomain}`, async (err, result) => {
      if (err) {
        fail(err)
      }

      const { name, port } = result[0]
      const protocol = name === 'localhost' ? 'http' : 'https'
      const wellKnown = await this.fetch(`${protocol}://${name}:${port}/.well-known/bsvalias`)
      const apiDescriptor = await wellKnown.json()
      this._cache[aDomain] = apiDescriptor
      finish(apiDescriptor)
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
