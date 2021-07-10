/* global def, get, subject */
/* eslint no-unused-expressions: 0 */
import { expect, assert } from 'chai'
import { RequestBodyFactory } from '../src/RequestBodyFactory'
import { MockClock } from './util/MockClock'
import { VerifiableMessage } from '../src/VerifiableMessage'
import moment from 'moment'

const get=[]
function def(name,fn) {
  get[name] = fn()
}

describe('PaymailClient', () => {
  def('clock', () => new MockClock())
  def('now', () => moment('2019-03-01'))

  beforeEach(() => {
    get.clock.setCurrentTime(get.now)
  })

  subject(() => new RequestBodyFactory(get.clock))

  describe('#buildBodyToRequestAddress', () => {
    def('aDT', () => moment('2018-11-15'))
    def('aSignature', () => 'some signature')
    def('senderInfo', () => ({
      senderName: 'Some Guy',
      senderHandle: 'some@guy.org',
      purpose: 'Do some payment',
      dt: get.aDT,
      signature: get.aSignature
    }))

    describe('when no private key is provided', () => {
      it('returns right data', async () => {
        const body = get.subject.buildBodyToRequestAddress(get.senderInfo)
        expect(body).to.have.keys(
          'senderHandle',
          'senderName',
          'purpose',
          'dt',
          'pubkey',
          'signature',
          'amount'
        )
      })

      it('returns sender info', async () => {
        const body = get.subject.buildBodyToRequestAddress(get.senderInfo)
        expect(body.senderHandle).to.be.eq(get.senderInfo.senderHandle)
        expect(body.senderName).to.be.eq(get.senderInfo.senderName)
        expect(body.purpose).to.be.eq(get.senderInfo.purpose)
      })

      describe('when dt and signature given', () => {
        it('uses given dt and signature', async () => {
          const body = get.subject.buildBodyToRequestAddress(get.senderInfo)
          expect(body.nonce).to.be.eq(get.senderInfo.nonce)
          expect(body.signature).to.be.eq(get.senderInfo.signature)
        })
      })

      describe('when signature is given but dt is missing', () => {
        def('aDT', () => undefined)

        it('throws an error', async () => {
          try {
            await get.subject.buildBodyToRequestAddress(get.senderInfo)
            assert.fail('Should fail dt is missing')
          } catch (err) {
            expect(err.message).to.be.eq('missing datetime for given signature')
          }
        })
      })

      describe('when nonce is given but signature is missing', () => {
        def('aSignature', () => undefined)

        it('throws an error', async () => {
          try {
            await get.subject.buildBodyToRequestAddress(get.senderInfo)
            assert.fail('Should fail nonce is missing')
          } catch (err) {
            expect(err.message).to.be.eq('Missing private key or signature')
          }
        })
      })
    })

    describe('when private key is provided', () => {
      def('aPrivateKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
      def('senderInfo', () => ({
        senderName: 'Some Guy',
        senderHandle: 'some@guy.org',
        purpose: 'Do some payment'
      }))

      it('uses current datetime and the provided private key to sign', async () => {
        const body = get.subject.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
        expect(body.dt).to.be.eq(get.now)
        expect(body.signature).to.be.eq(new VerifiableMessage([
          get.senderInfo.senderHandle,
          '0',
          get.now.toISOString(),
          get.senderInfo.purpose
        ]).sign(get.aPrivateKey))
      })

      describe('when the signature and datetime are also given', () => {
        def('senderInfo', () => ({
          senderName: 'Some Guy',
          senderHandle: 'some@guy.org',
          purpose: 'Do some payment',
          dt: get.aDT,
          signature: get.aSignature
        }))

        it('ignores the provided private key', async () => {
          const body = get.subject.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
          expect(body.dt).to.be.eq(get.aDT)
          expect(body.signature).to.be.eq(get.aSignature)
        })
      })
    })

    describe('when an amount is provided', () => {
      def('anAmount', () => 1000)
      def('aPrivateKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
      def('senderInfo', () => ({
        senderName: 'Some Guy',
        senderHandle: 'some@guy.org',
        purpose: 'Do some payment',
        amount: get.anAmount
      }))

      it('returns the amount in the body', async () => {
        const body = get.subject.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
        expect(body).to.have.keys(
          'senderHandle',
          'senderName',
          'purpose',
          'dt',
          'pubkey',
          'signature',
          'amount'
        )
        expect(body.amount).to.be.equals(get.anAmount)
      })

      it('changes the signature', async () => {
        const senderInfoWithOtherAmount = {
          ...get.senderInfo,
          amount: get.anAmount + 1
        }
        const body1 = get.subject.buildBodyToRequestAddress(get.senderInfo, get.aPrivateKey)
        const body2 = get.subject.buildBodyToRequestAddress(senderInfoWithOtherAmount, get.aPrivateKey)
        expect(body1.signature).not.to.be.equals(body2.signature)
      })
    })
  })
})
