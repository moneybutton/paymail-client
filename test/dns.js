import { DnsClient } from '../src/dns-client'
import { expect } from 'chai'

describe('DNS', () => {
  describe('#domainsAreEqual', () => {
    it('domain names are case insensitive per RFC1035', () => {
      var dns = new DnsClient(null, null)
      var b = dns.domainsAreEqual('www.moneyBUTTON.com.', 'www.moneybutton.com')
      expect(b).to.be.eql(true)
    })
  })
})