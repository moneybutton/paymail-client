class DnsOverHttps {
  constructor (fetch, config) {
    this.fetch = fetch
    this.config = config
  }

  async resolveSrv (aDomain) {
    const response = await this.fetch(`${this.config.baseUrl}?name=${aDomain}&type=SRV&cd=0`)
    const body = await response.json()
    return body
  }

  async queryBsvaliasDomain (aDomain) {
    return this.resolveSrv(`_bsvalias._tcp.${aDomain}`)
  }
}

export { DnsOverHttps }
