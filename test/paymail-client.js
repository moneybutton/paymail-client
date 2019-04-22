/* global def, get */
/* eslint no-unused-expressions: 0 */
import { expect, assert } from 'chai'
import { PaymailClient } from '../src/PaymailClient'
import { fetch, mockResponse, amountOfRequestFor, requestsMadeTo } from './util/MockFetch'
import { MockDNS } from './util/MockDNS'
import { MockClock } from './util/MockClock'
import { VerifiableMessage } from '../src/VerifiableMessage'
import moment from 'moment'
import bsv from 'bsv'
import { RequestBodyFactory } from '../src/RequestBodyFactory'

describe('PaymailClient', () => {
  def('dns', () => new MockDNS())
  def('clock', () => new MockClock())
  def('aClient', () => new PaymailClient(get.dns, fetch, get.clock))
  def('now', () => moment('2019-03-01'))

  beforeEach(() => {
    get.clock.setCurrentTime(get.now)
  })

  describe('#getPublicKey', async () => {
    def('aDomain', () => 'example.tld')
    def('aPaymail', () => `somename@${get.aDomain}`)

    def('apiCapabilities', () => ({
      pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
      paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`
    }))

    beforeEach(() => {
      get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
        name: get.aDomain,
        port: '80'
      })
      mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
        {
          bsvalias: '1.0',
          capabilities: get.apiCapabilities
        }
      )
      mockResponse(`https://${get.aDomain}:80/api/v1/id/${get.aPaymail}`,
        {
          bsvalias: '1.0',
          handle: get.aPaymail,
          pubkey: 'some identity'
        }
      )
    })

    it('returns a public key', async () => {
      const publicKey = await get.aClient.getPublicKey(get.aPaymail)
      expect(publicKey).to.be.equal('some identity')
    })

    it('performs the right dns query and only once', async () => {
      await get.aClient.getPublicKey(get.aPaymail)
      expect(get.dns.timesFor(`_bsvalias._tcp.${get.aDomain}`)).to.be.equal(1)
    })

    it('performs only dns query when request the same domain twice', async () => {
      mockResponse(`https://${get.aDomain}:80/api/v1/id/another@${get.aDomain}`, { publicKey: 'another identity' })
      await get.aClient.getPublicKey(get.aPaymail)
      await get.aClient.getPublicKey(`another@${get.aDomain}`)
      expect(get.dns.timesFor(`_bsvalias._tcp.${get.aDomain}`)).to.be.equal(1)
    })

    it('queries the well-known file', async () => {
      await get.aClient.getPublicKey(get.aPaymail)
      expect(amountOfRequestFor(`https://${get.aDomain}:80/.well-known/bsvalias`)).to.be.equal(1)
    })

    it('when the same domain is queried more than once only perform once well-known query', async () => {
      mockResponse(`https://${get.aDomain}:80/api/v1/id/another@${get.aDomain}`, { publicKey: 'another identity' })
      await get.aClient.getPublicKey(get.aPaymail)
      await get.aClient.getPublicKey(`another@${get.aDomain}`)
      expect(amountOfRequestFor(`https://${get.aDomain}:80/.well-known/bsvalias`)).to.be.equal(1)
    })

    describe('when pki capability is not defined', () => {
      def('apiCapabilities', () => ({
        pki: undefined,
        paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`
      }))

      it('raises an error', async () => {
        try {
          await get.aClient.getPublicKey(get.aPaymail)
          assert.fail('should raise error is capability is not defined')
        } catch (err) {
          expect(err.message).to.be.eq(`Unknown capability "pki" for "${get.aDomain}"`)
        }
      })
    })
  })

  describe('#getAddressFor', async () => {
    def('aDomain', () => 'example.tld')
    def('aPaymail', () => `somename@${get.aDomain}`)
    def('aPrivateKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
    def('senderInfo', () => ({
      senderName: 'Some Guy',
      senderPaymail: 'some@guy.org',
      purpose: 'Do some payment'
    }))

    def('apiCapabilities', () => (
      {
        pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
        paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`
      }
    ))

    def('serverResponseBody', () => ({ output: 'some output' }))
    def('serverResponseStatus', () => 200)
    beforeEach(() => {
      get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
        name: get.aDomain,
        port: '80'
      })
      mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
        {
          bsvalias: '1.0',
          capabilities: get.apiCapabilities
        }
      )
      mockResponse(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`, get.serverResponseBody, get.serverResponseStatus)
    })

    it('returns an output', async () => {
      const resultOutput = await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      expect(resultOutput).to.be.equal('some output')
    })

    it('queries the right endpoint', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const amountOfRequests = amountOfRequestFor(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)
      expect(amountOfRequests).to.be.equal(1)
    })

    it('makes a post request', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      expect(requestDetails.method).to.be.equal('POST')
    })

    it('sends content type json', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      expect(requestDetails.headers).to.have.property('Content-Type')
      expect(requestDetails.headers['Content-Type']).to.match(/application\/json/)
    })

    it('sends a json with right properties', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      const body = JSON.parse(requestDetails.body)
      expect(body).to.have.keys('senderPaymail', 'senderName', 'purpose', 'dt', 'signature', 'amount')
    })

    it('sends sends the info of the sender', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      const body = JSON.parse(requestDetails.body)
      expect(body.senderPaymail).to.be.equal(get.senderInfo.senderPaymail)
      expect(body.senderName).to.be.equal(get.senderInfo.senderName)
      expect(body.purpose).to.be.equal(get.senderInfo.purpose)
    })

    it('sets amounts to null if not specified', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      const requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      const body = JSON.parse(requestDetails.body)
      expect(body.amount).to.be.null
    })

    it('sends a valid signature', async () => {
      await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
      let requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
      let body = JSON.parse(requestDetails.body)
      expect(body.signature).to.be.equal(new VerifiableMessage([
        get.senderInfo.senderPaymail,
        '0',
        get.now.toISOString(),
        get.senderInfo.purpose
      ]).sign(get.aPrivateKey))
    })

    describe('when the server returns a non ok status', () => {
      def('serverResponseBody', () => 'error')
      def('serverResponseStatus', () => 400)

      it('raises an error', async () => {
        try {
          await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
          assert.fail('should fail because the server returns an error')
        } catch (err) {
          expect(err.message).to.be.eql(`Paymail not found: ${get.aPaymail}`)
        }
      })
    })

    describe('if nonce and signature are provided', async () => {
      def('aDT', () => moment('2018-11-15'))
      def('aSignature', () => 'some signature')
      def('senderInfo', () => ({
        senderName: 'Some Guy',
        senderPaymail: 'some@guy.org',
        purpose: 'Do some payment',
        dt: get.aDT,
        signature: get.aSignature
      }))

      it('those dt and signatures are used', async () => {
        await get.aClient.getAddressFor(get.aPaymail, get.senderInfo)
        let requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
        let body = JSON.parse(requestDetails.body)
        expect(body.dt).to.be.equal(get.aDT.toISOString())
        expect(body.signature).to.be.equal(get.aSignature)
      })

      describe('if only dt is present (not signature)', async () => {
        def('aSignature', () => undefined)

        it('ignores the dt and uses current datetime', async () => {
          await get.aClient.getAddressFor(get.aPaymail, get.senderInfo, get.aPrivateKey)
          let requestDetails = requestsMadeTo(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)[0]
          let body = JSON.parse(requestDetails.body)
          expect(body.dt).to.be.eq(get.now.toISOString())
        })

        it('fails if the private key is not provided', async () => {
          try {
            await get.aClient.getAddressFor(get.aPaymail, get.senderInfo)
            assert.fail('should not work with no private key or signature')
          } catch (err) {
            const amountOfRequests = amountOfRequestFor(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)
            expect(amountOfRequests).to.be.equal(0)
          }
        })
      })

      describe('if only signature is present', async () => {
        def('aDT', () => undefined)

        it('fails', async () => {
          try {
            await get.aClient.getAddressFor(get.aPaymail, get.senderInfo)
            assert.fail('should not work if signature is provided but the used nonce')
          } catch (err) {
            const amountOfRequests = amountOfRequestFor(`https://${get.aDomain}:80/api/v1/address/${get.aPaymail}`)
            expect(amountOfRequests).to.be.equal(0)
          }
        })
      })
    })

    describe('when paymentDestination capability is not defined', () => {
      def('apiCapabilities', () => (
        {
          pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
          paymentDestination: undefined
        }
      ))

      it('raises an error', async () => {
        try {
          await get.aClient.getAddressFor(get.aPaymail, get.senderInfo)
          assert.fail('should raise error is capability is not defined')
        } catch (err) {
          expect(err.message).to.be.eq(`Unknown capability "paymentDestination" for "${get.aDomain}"`)
        }
      })
    })
  })

  describe('#verifyPubkeyOwner', () => {
    def('aDomain', () => 'example.tld')
    def('aPaymail', () => `somename@${get.aDomain}`)
    def('aPrivateKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
    def('correspondingPublicKey', () => {
      const privateKey = bsv.PrivateKey.fromWIF(get.aPrivateKey)
      const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
      return publicKey
    })

    def('apiCapabilities', () => (
      {
        pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
        verifyPublicKeyOwner: `https://${get.aDomain}:80/api/v1/verifypubkey/{alias}@{domain.tld}/{pubkey}`
      }
    ))

    beforeEach(() => {
      get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
        name: get.aDomain,
        port: '80'
      })
      mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
        {
          bsvalias: '1.0',
          capabilities: get.apiCapabilities
        }
      )
      mockResponse(
        `https://${get.aDomain}:80/api/v1/verifypubkey/${get.aPaymail}/${get.correspondingPublicKey}`,
        {
          bsvalias: '1.0',
          handle: get.aPaymail,
          match: true
        }
      )
    })

    describe('when verifyPublicKeyOwner capability is not defined', () => {
      def('apiCapabilities', () => (
        {
          pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
          paymentDestination: undefined
        }
      ))

      it('raises an error', async () => {
        await get.aClient.verifyPubkeyOwner(get.correspondingPublicKey, get.aPaymail).then(
          () => assert.fail('sholdnt finish if capability is missing'),
          (error) => expect(error.message).to.be.equals(`Unknown capability "verifyPublicKeyOwner" for "${get.aDomain}"`)
        )
      })
    })
  })

  describe('#isValidSignature', () => {
    def('aPrivateKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
    def('correspondingPublicKey', () => {
      const privateKey = bsv.PrivateKey.fromWIF(get.aPrivateKey)
      const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
      return publicKey
    })
    def('correspondingAddress', () => {
      return bsv.Address.fromPublicKey(get.correspondingPublicKey)
    })

    def('aDomain', () => 'example.tld')
    def('aPaymail', () => `somename@${get.aDomain}`)
    def('bodyFactory', () => new RequestBodyFactory(get.clock))

    def('verifyPubkeyResponse', () => (
      {
        bsvalias: '1.0',
        handle: get.aPaymail,
        match: true
      }
    ))

    describe('if api includes verify capability', () => {
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.aDomain,
          port: '80'
        })
        mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
          {
            bsvalias: '1.0',
            capabilities: {
              pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
              paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`,
              verifyPublicKeyOwner: `https://${get.aDomain}:80/api/v1/verifypubkey/{alias}@{domain.tld}/{pubkey}`
            }
          }
        )
        mockResponse(
          `https://${get.aDomain}:80/api/v1/verifypubkey/${get.aPaymail}/${get.correspondingPublicKey}`,
          get.verifyPubkeyResponse
        )
      })

      def('senderInfo', () => ({
        senderName: 'Some Guy',
        senderPaymail: get.aPaymail,
        purpose: 'Do some payment',
        pubkey: get.correspondingPublicKey.toString()
      }))

      def('petition', () => {
        return get.bodyFactory.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
      })

      describe('the message is valid', () => {
        it('returns true', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail, get.correspondingPublicKey.toString())
          expect(result).to.be.true
        })
      })

      describe('when the signature does not belong to the paymail', () => {
        def('verifyPubkeyResponse', () => (
          {
            bsvalias: '1.0',
            handle: get.aPaymail,
            match: false
          }
        ))

        it('returns false', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail, get.correspondingPublicKey.toString())
          expect(result).to.be.false
        })
      })

      describe('when the signature was created with another key', () => {
        def('petition', () => {
          return get.bodyFactory.buildBodyToRequestAddress(get.senderInfo, bsv.PrivateKey.fromRandom().toString())
        })

        it('returns false', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail, get.correspondingPublicKey.toString())
          expect(result).to.be.false
        })
      })

      describe('when the content was changed', () => {
        it('returns false', async () => {
          const data = {
            ...get.petition,
            amount: get.petition.amount + 1
          }
          const message = VerifiableMessage.forBasicAddressResolution(data)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail, get.correspondingPublicKey.toString())
          expect(result).to.be.false
        })
      })
    })

    describe('if api does not include verify capability', () => {
      beforeEach(() => {
        get.dns.registerRecord(`_bsvalias._tcp.${get.aDomain}`, {
          name: get.aDomain,
          port: '80'
        })
        mockResponse(`https://${get.aDomain}:80/.well-known/bsvalias`,
          {
            bsvalias: '1.0',
            capabilities: {
              pki: `https://${get.aDomain}:80/api/v1/id/{alias}@{domain.tld}`,
              paymentDestination: `https://${get.aDomain}:80/api/v1/address/{alias}@{domain.tld}`
            }
          }
        )
        mockResponse(
          `https://${get.aDomain}:80/api/v1/id/${get.aPaymail}`,
          {
            bsvalias: '1.0',
            handle: get.aPaymail,
            pubkey: get.correspondingPublicKey.toString()
          }
        )
      })

      def('senderInfo', () => ({
        senderName: 'Some Guy',
        senderPaymail: get.aPaymail,
        purpose: 'Do some payment'
      }))

      describe('when the petition is valid', () => {
        def('petition', () => {
          return get.bodyFactory.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
        })

        it('returns true', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail)
          expect(result).to.be.true
        })
      })

      describe('when the signature is invalid', () => {
        def('petition', () => {
          const petition = {
            ...get.bodyFactory.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey),
            signature: 'invalid signature'
          }
          return petition
        })

        it('returns false', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail)
          expect(result).to.be.false
        })
      })

      describe('when the signature is valid but it doesnt match with the content', () => {
        def('petition', () => {
          const petition = {
            ...get.bodyFactory.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey),
            purpose: 'another purpose that changes the signature'
          }
          return petition
        })

        it('returns false', async () => {
          const message = VerifiableMessage.forBasicAddressResolution(get.petition)
          const result = await get.aClient.isValidSignature(message, get.petition.signature, get.aPaymail)
          expect(result).to.be.false
        })
      })
    })
  })
})
