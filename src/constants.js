import { brfc } from '@moneybutton/brfc'

export const CapabilityCodes = {
  pki: 'pki',
  paymentDestination: 'paymentDestination',
  requestSenderValidation: brfc(
    'bsvalias Payment Addressing (Payer Validation)',
    ['andy (nChain)'],
    ''
  ),
  verifyPublicKeyOwner: brfc(
    'bsvalias public key verify (Verify Public Key Owner)',
    [],
    ''
  ),
  publicProfile: brfc(
    'Public Profile (Name & Avatar)',
    ['Ryan X. Charles (Money Button)'],
    '1'
  ),
  receiveTransaction: brfc(
    'Send raw transaction',
    ['Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)'],
    '1.1'
  ),
  p2pPaymentDestination: brfc(
    'Get no monitored payment destination (p2p payment destination)',
    ['Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)'],
    '1.1'
  )
}
