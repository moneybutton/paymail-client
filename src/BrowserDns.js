import { DnsOverHttps } from './dns-over-https'

class BrowserDns {
  constructor (fetch) {
    this.doh = new DnsOverHttps(fetch, { baseUrl: 'https://dns.google.com/resolve' })
  }

  async resolveSrv (aDomain, aCallback) {
    try {
      const response = await this.doh.resolveSrv(aDomain)
      if (response.Status === 0) {
        const data = response.Answer.map(record => {
          const [ priority, weight, port, name ] = record.data.split(' ')
          return {
            priority,
            weight,
            port,
            name,
            isSecure: response.AD
          }
        })
        aCallback(null, data)
      } else {
        aCallback(new Error('error during dns query'))
      }
    } catch (e) {
      aCallback(e)
    }
  }
}

export { BrowserDns }
