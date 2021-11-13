/* global def, get */
/* eslint no-unused-expressions: 0 */
import { expect, assert } from 'chai'
import { PaymailClient } from '../src/PaymailClient'

const get=[]
function def(name,fn) {
  get[name] = fn()
}

describe('Real PaymailClient', () => {
  def('aPaymail', () => 'lilong@moneybutton.com')
  def('aClient', () => new PaymailClient())

  beforeEach(() => {
  })

  describe('#getPublicKey', async () => {
    it('returns a public key', async () => {
      const publicKey = await get.aClient.getPublicKey(get.aPaymail)
      console.log(publicKey)
      expect(publicKey).to.be.equal('some identity')
    }).timeout(200000)
  })

})
