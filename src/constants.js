import { brfc } from './brfc'

export const CapabilityCodes = {
  pki: 'pki',
  paymentDestination: 'paymentDestination',
  requestSenderValidation: brfc(
    'bsvalias Payment Addressing (Payer Validation)',
    [ 'andy (nChain)' ],
    ''
  ),
  verifyPublicKeyOwner: brfc(
    'bsvalias public key verify (Verify Public Key Owner)',
    [],
    ''
  ),
  publicProfile: brfc(
    'Public Profile (Name & Avatar)',
    [ 'Ryan X. Charles (Money Button)' ],
    '1'
  ),
  receiveTransaction: brfc(
    'Send raw transaction',
    [ 'Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)' ],
    '1.1'
  ),
  p2pPaymentDestination: brfc(
    'Get no monitored payment destination (p2p payment destination)',
    [ 'Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)' ],
    '1.1'
  ),
  witnessPublic: brfc(
    'Public API of the Controllable UTXO Token Witness',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),
  witnessCheckBaton: brfc(
    'Check Baton API of the Controllable UTXO Token Witness',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),
  witnessCheckToken: brfc(
    'Check Token API of the Controllable UTXO Token Witness',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),
  witnessCheckSale: brfc(
    'Check Sale API of the Controllable UTXO Token Witness',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),//expect: 'c89beec44e80',
  witnessCheckBuy: brfc(
    'Check Buy API of the Controllable UTXO Token Witness',
    [ 'LI Long (ChainBow)' ],
    '1',
  ),//expect: '598b080631c4',
  tokenLogo: brfc(
    'Logo URI of the Controllable UTXO Token',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),
  tokenInformation: brfc(
    'Infomation URI of the Controllable UTXO Token',
    [ 'LI Long (ChainBow)' ],
    '1'
  ),
}
