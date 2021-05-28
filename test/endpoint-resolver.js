/* global def, get */
/* eslint no-unused-expressions: 0 */
import { expect, assert } from 'chai'
import { EndpointResolver } from '../src/EndpointResolver'
import {
  fetch,
  mockResponse,
  amountOfRequestFor,
  resetFetch
} from './util/MockFetch'
import { MockDNS } from './util/MockDNS'
import { DnsClient } from '../src/dns-client'
import { DnsOverHttps } from '../src/dns-over-https'

describe('EndpointResolver', () => {
  def('dns', () => new MockDNS())
  def('dohUrl', () => 'https://doh.com/resolve')
  def('doh', () => new DnsOverHttps(fetch, {
    baseUrl: get.dohUrl
  }))
  def('dnsClient', () => new DnsClient(get.dns, get.doh))
  def('resolver', () => EndpointResolver.create(get.dnsClient, fetch))
  def('aDomain', () => 'somedomain.tld')

  beforeEach(() => resetFetch())

  describe('#getApiDescriptionFor', () => {
    def('apiDescriptor', () => ({
      bsvalias: '1.0',
      capabilities: {
        pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
        paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`
      }
    }))

    describe('when everything is defined', () => {
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.aDomain,
          port: '80'
        })
        mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, points to other domain but it doesn\'t use dnssec', () => {
      def('apiDomain', () => `api.${get.aDomain}`)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 0,
            TC: false,
            RD: true,
            RA: true,
            AD: false,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Answer: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33,
                TTL: 299,
                data: `1 10 443 ${get.apiDomain}.`
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
      })

      it('raises an error', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          expect(err.message).to.be.eql('Insecure domain.')
          const numberOfRequests = amountOfRequestFor(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })

    describe('when the srv record is present, points to other domain but it uses dnssec', () => {
      def('apiDomain', () => `api.${get.aDomain}`)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}/.well-known/bsvalias`,
          get.apiDescriptor
        )
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 0,
            TC: false,
            RD: true,
            RA: true,
            AD: true,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Answer: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33,
                TTL: 299,
                data: `1 10 443 ${get.apiDomain}.`
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, points to other domain but doh call fails', () => {
      def('apiDomain', () => `api.${get.aDomain}`)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 3,
            TC: false,
            RD: true,
            RA: true,
            AD: false,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
      })

      it('fails', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          expect(err.message).to.be.eql('Insecure domain.')
          const numberOfRequests = amountOfRequestFor(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but the domain is the same', () => {
      def('apiDomain', () => get.aDomain)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but the domain is a www subdomain', () => {
      def('apiDomain', () => `www.${get.aDomain}`)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, it doesn\'t use dnssec but the domain is a moneybutton.com', () => {
      def('apiDomain', () => 'moneybutton.com')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, it doesn\'t use dnssec but the domain is a www.moneybutton.com', () => {
      def('apiDomain', () => 'www.moneybutton.com')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but the domain is an arbitrary subdomain and doesnt use dnsssec', () => {
      def('apiDomain', () => `www2.${get.aDomain}`)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 0,
            TC: false,
            RD: true,
            RA: true,
            AD: false,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Answer: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33,
                TTL: 299,
                data: `1 10 443 ${get.apiDomain}.`
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
      })

      it('fails', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          expect(err.message).to.be.eql('Insecure domain.')
          const numberOfRequests = amountOfRequestFor(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but its handcash', () => {
      def('aDomain', () => 'handcash.io')
      def('apiDomain', () => 'handcash-paymail-production.herokuapp.com')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but its handcash using its own domain', () => {
      def('aDomain', () => 'handcash.io')
      def('apiDomain', () => 'handcash.io')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`https://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record present it doesn\'t use dnssec and its handcash but the url is not actual handcash api url', () => {
      def('aDomain', () => 'handcash.io')
      def('apiDomain', () => 'fake-url.not-handcash.io')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 0,
            TC: false,
            RD: true,
            RA: true,
            AD: false,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Answer: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33,
                TTL: 299,
                data: `1 10 443 ${get.apiDomain}.`
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
      })

      it('fails', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          expect(err.message).to.be.eql('Insecure domain.')
          const numberOfRequests = amountOfRequestFor(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })

    describe('when the srv record present it doesn\'t use dnssec but the domain is the same but differs in a dot', () => {
      def('apiDomain', () => get.aDomain)
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: `${get.apiDomain}.`,
          port: '80'
        })
        mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, doesnt use dns sec but is localhost', () => {
      def('apiDomain', () => 'localhost')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: '80'
        })
        mockResponse(`http://${get.apiDomain}:80/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is present, uses dnssec and a non standard port', () => {
      def('apiDomain', () => 'api.example.tld')
      def('port', () => '1200')
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.apiDomain,
          port: get.port
        })
        mockResponse(`${get.dohUrl}?name=_bsvalias._tcp.${get.aDomain}&type=SRV&cd=0`,
          {
            Status: 0,
            TC: false,
            RD: true,
            RA: true,
            AD: true,
            CD: false,
            Question: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33
              }
            ],
            Answer: [
              {
                name: `_bsvalias._tcp.${get.aDomain}.`,
                type: 33,
                TTL: 299,
                data: `1 10 ${get.port} ${get.apiDomain}.`
              }
            ],
            Comment: 'Response from 205.251.198.76.'
          }
        )
        mockResponse(`https://${get.apiDomain}:${get.port}/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })
    })

    describe('when the srv record is not present', () => {
      beforeEach(() => {
        get.dns.registerError(`_bsvalias._tcp.${get.aDomain}`, 'ENOTFOUND')
        mockResponse(`https://${get.aDomain}/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })

      it('queries the right url', async () => {
        await get.resolver.getApiDescriptionFor(get.aDomain)
        const numberOfRequests = amountOfRequestFor(`https://${get.aDomain}/.well-known/bsvalias`)
        expect(numberOfRequests).to.be.eql(1)
      })
    })

    describe('when the srv record is not present and the well known file is not present', () => {
      beforeEach(() => {
        get.dns.registerError(`_bsvalias._tcp.${get.aDomain}`, 'ENOTFOUND')
        mockResponse(`https://${get.aDomain}/.well-known/bsvalias`,
          'not found',
          404
        )
      })

      it('fails', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          const numberOfRequests = amountOfRequestFor(`https://${get.aDomain}/.well-known/bsvalias`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })
  })
})
