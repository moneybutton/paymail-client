# @moneybutton/paymail-client

## Description

Javascript client to interact with BSV paymail protocol.

## Ussage.

``` javascript
import { PaymailClient, Verifi } from '@moneybutton/paymail-client'
import fetch from 'isomorphic-fetch'
import dns from 'dns'
import bsv from 'bsv'

const client = new PaymailClient(dns, fetch) // Any implementation of fetch can be used.
const somePaymailAddress = 'some_name@moneybutton.com'
client.getPublicKey(somePaymailAddress).then(pubkey => {
  console.log(`Current public key for ${somePaymailAddress} is ${pubkey}`)
})

// You can look for someones public identity key.
const senderPrivateKey = 'L3kZEuaEgdfsV7BXCrwhs8E9BuJaN67HvdkSNTfy3CmKjbXkBEjX'
client.getOutputFor(somePaymailAddress, {
    senderHandle: 'sender@moneybutton.com',
    amount: 10000, // Amount in satoshis
    senderName: 'Mr. Sender',
    purpose: 'Pay for your services.',
    pubkey: '03aa44757af33e7c9c9ceb1d5655741867ef8efea00bbc3f498424c91a16c85779'
}, senderPrivateKey).then( output => {
  console.log(`Now I can send money to ${somePaymailAddress} using this output: ${output}`)
})

// You can also use a previously created signature instead of passing in the private key.
import { VerifiableMessage } from '@moneybutton/paymail-client'

const timestamp = new Date().toISOString()
const preMadeSignature = VerifiableMessage.forBasicAddressResolution({
  senderHandle: 'sender@moneybutton.com',
  amount: 10000,
  dt: timestamp,
  purpose: 'Pay for your services.'
}).sign('senderPrivateKey')

client.getOutputFor(somePaymailAddress, {
  senderHandle: 'sender@moneybutton.com',
  amount: 10000, // Amount in satoshis
  senderName: 'Mr. Sender',
  purpose: 'Pay for your services.',
  pubkey: '03aa44757af33e7c9c9ceb1d5655741867ef8efea00bbc3f498424c91a16c85779',
  signature: preMadeSignature
}).then( output => {
  console.log(`Now I can send money to ${somePaymailAddress} using this output: ${output}`)
})

// You can check if a given key belongs to a given paymail
const somePubKey = bsv.PrivateKey.fromRandom().publicKey.toString()
client.verifyPubkeyOwner(somePubKey, 'someuser@moneybutton.com').then(aBoolean => {
  console.log(`The key ${somePubKey} ${aBoleean ? 'does' : 'doesn\'t'} belongs to someuser@moneybutton.com`)
})


// Lastly it lets you verify if certain signature is valid for certain paymail address.
const aMessage = new VerifiableMessage(['very', 'important', 'message'])
const aSignature = 'some signature for the message'
client.isValidSignature (aMessage, aSignature, 'someone@moneybutton.com').then( aBoolean => {
  if (aBoolean) {
    console.log('the signature is valid, yey!')
  } else {
    console.log('the signature is invalid, don\'t trust them')
  }
})
```
