/* global def, get */
import { expect } from 'chai'
import { VerifiableMessage } from '../src/VerifiableMessage'
import moment from 'moment'

describe('VerifiableMessage', () => {
  def('aPrivKey', () => 'KxWjJiTRSA7oExnvbWRaCizYB42XMKPxyD6ryzANbdXCJw1fo4sR')
  def('messageData', () => ({
    senderHandle: 'some@paymail.com',
    amount: '500',
    dt: moment('2019-03-01'),
    purpose: 'some reason'
  }))

  describe('#forBasicAddressResolution', () => {
    it('consideres the parameters in the right order', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = new VerifiableMessage([
        get.messageData.senderHandle,
        get.messageData.amount,
        get.messageData.dt.toISOString(),
        get.messageData.purpose
      ]).sign(get.aPrivKey)

      expect(sign1).to.be.equal(sign2)
    })

    it('generates the same signature if the parameters are the same', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      expect(sign1).to.be.equals(sign2)
    })

    it('changes the signature if the paymail change', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        senderHandle: 'another@paymail'
      }).sign(get.aPrivKey)

      expect(sign1).not.to.be.equals(sign2)
    })

    it('changes the signature if the amount change', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        amount: get.messageData.amount + 10
      }).sign(get.aPrivKey)

      expect(sign1).not.to.be.equals(sign2)
    })

    it('changes the signature if the porpouse change', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        purpose: get.messageData.purpose + 'some other thing'
      }).sign(get.aPrivKey)

      expect(sign1).not.to.be.equals(sign2)
    })

    it('changes the signature if the porpouse change', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        purpose: get.messageData.purpose + 'some other thing'
      }).sign(get.aPrivKey)

      expect(sign1).not.to.be.equals(sign2)
    })

    it('ignores extra arguments', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution(get.messageData).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        extra: 'something'
      }).sign(get.aPrivKey)

      expect(sign1).to.be.equals(sign2)
    })

    it('considers the same an empty amount and 0', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        amount: undefined
      }).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        amount: 0
      }).sign(get.aPrivKey)

      expect(sign1).to.be.equals(sign2)
    })

    it('considers the same a missing porpuse and an empty string', () => {
      const sign1 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        porpuse: undefined
      }).sign(get.aPrivKey)
      const sign2 = VerifiableMessage.forBasicAddressResolution({
        ...get.messageData,
        porpuse: ''
      }).sign(get.aPrivKey)

      expect(sign1).to.be.equals(sign2)
    })
  })
})
