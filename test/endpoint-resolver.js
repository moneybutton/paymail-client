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

describe('EndpointResolver', () => {
  def('dns', () => new MockDNS())
  def('resolver', () => new EndpointResolver(get.dns, fetch))
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

    describe('when the srv record is not present', () => {
      beforeEach(() => {
        get.dns.registerError(`_bsvalias._tcp.${get.aDomain}`, 'ENOTFOUND')
        mockResponse(`https://${get.aDomain}:443/.well-known/bsvalias`,
          get.apiDescriptor
        )
      })

      it('returns the api descriptor', async () => {
        const apiDescriptor = await get.resolver.getApiDescriptionFor(get.aDomain)
        expect(apiDescriptor).to.be.eql(get.apiDescriptor)
      })

      it('queries the right url', async () => {
        await get.resolver.getApiDescriptionFor(get.aDomain)
        const numberOfRequests = amountOfRequestFor(`https://${get.aDomain}:443/.well-known/bsvalias`)
        expect(numberOfRequests).to.be.eql(1)
      })
    })

    describe('when the srv record is not present and the well known file is not present', () => {
      beforeEach(() => {
        get.dns.registerError(`_bsvalias._tcp.${get.aDomain}`, 'ENOTFOUND')
        mockResponse(`https://${get.aDomain}:443/.well-known/bsvalias`,
          'not found',
          404
        )
      })

      it('fails', async () => {
        try {
          await get.resolver.getApiDescriptionFor(get.aDomain)
          assert.fail('Should fail')
        } catch (err) {
          const numberOfRequests = amountOfRequestFor(`https://${get.aDomain}:443/.well-known/bsvalias`)
          expect(numberOfRequests).to.be.eql(1)
        }
      })
    })
  })
})
