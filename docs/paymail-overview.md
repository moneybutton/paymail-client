---
id: paymail-overview
title: Paymail Overview
---

People should never have to see long, random, unfamiliar character strings like Bitcoin addresses. People should see names that they can easily write, type or tap into a phone.

Paymail is a new identity protocol for Bitcoin that removes Bitcoin addresses from the user experience. Instead of addresses, Paymail uses human-readable names that look exactly the same as email addresses. Paymails are much easier to write, type or tap into a phone than Bitcoin addresses.

Paymail was designed and developed collaboratively by nChain, Money Button, Handcash, Centbee, and Electrum SV for the benefit of the entire Bitcoin ecosystem. Paymail is open and free to use for any application on Bitcoin (BSV).

The main page to host the paymail spec is [bsvalias.org](https://bsvalias.org), and we mirror the spec here, along with additional extensions implemented by Money Button. [The original announcement for paymail is on the Money Button blog.](https://blog.moneybutton.com/2019/05/31/introducing-paymail-an-extensible-identity-protocol-for-bitcoin-bsv/)

## Compatibility with Email

Paymail is fully compatible with and complementary to email addresses.

People already use email addresses as an identity system, such as the ubiquitous use of Gmail single sign-on, so we wanted to find a way to use email addresses for Bitcoin identity. Luckily, email addresses themselves are already designed in a manner that is well-suited for an identity system. Email addresses are human-readable and include a domain name which can be queried by applications.

Paymails are structured exactly the same way as an email address, with a local part (the user’s name) and a domain name. The domain name in a paymail can be assumed to have a server that is always online, making it possible to query information about or send information to a paymail owner even if the owner is not online.

Paymail can be thought of as an extension to email that adds support for Bitcoin. If Google wishes to add support for Paymail, they will be able to roll out support seamlessly for all Gmail users without interrupting service or changing any of their email infrastructure. Every Gmail user will be able to send and receive Bitcoin, and perform other advanced applications, directly from Gmail, while still being able to use Gmail as an email service (and an identity service) in the same way they do currently.

Note that although paymail is compatible with email, it is not a requirement for paymail providers to also provide email. Providers can implement zero, one, or both of email and paymail.

## Bitcoin Addresses

Similar to and inspired by [Handcash](https://handcash.io/), paymail allows applications to query a Bitcoin address for the owner of a paymail to send Bitcoin. Users do not see the Bitcoin address. Users only see the paymail. The Bitcoin address is used by the software to send the transaction, but is not rendered to the screen unless the user wishes to view advanced technical details of the payment.

## Non-Custodial

Non-custodial wallets are where the provider does not see the user’s private keys. Paymail is compatible with non-custodial wallets.

Using hierarchical deterministic wallets, paymail providers can generate new addresses for users without ever seeing private keys. The paymail provider is trusted to accurately deliver the addresses, but is not trusted to hold the user’s money. Paymail does not specify by what mechanism the provider should generate addresses; any standard address generation mechanism is allowed.

Custodial wallets, which hold the user’s private keys, are also supported.

## Public Keys

Paymail is not just for sending money. Included in the launch of Paymail is an extension for sharing public keys for use in digital signatures and encryption.

Digital signatures can be used for, amongst other things, signing data or messages stored on the blockchain. For instance, content creators can sign the data they publish to the blockchain, enabling their audience to follow the work they produce and purchase or license the material. The creator fully owns the content they create, and users fully own their following list, making it possible to build a truly global, distributed, permissionless market for information.

Encryption (using ECIES) can be used to encrypt data that can only be read by the recipient. Encryption can be used for additional, advanced uses such as Diffie-Hellman based private transactions, or simply encrypting private messages.

Paymail’s support for public keys is fully compatible with non-custodial wallets. The paymail provider is trusted to accurately deliver the public key, but does not have to be trusted with the private key. Any data that is encrypted cannot be read by the provider. Digital signatures cannot be altered by the provider.

## Capitalization

The protocol is called Paymail with a capital “P”. A paymail address is called a paymail with a lowercase “p”.

## Technology Overview

Paymail is based on email addresses and domain names. A user can have a new paymail or convert an existing email address into a paymail. The domain name is queried using DNS SRV records to recover a server containing a .well-known record with a list of supported services. The services are queried using the local part (the user’s name inside the paymail) to allow per-user customized responses, such as for addresses and public keys. The services are extensible. The extensions at launch include addresses and public keys.

## Implementations

Money Button has fully implemented and launched Paymail as a part of this announcement. The implementation has been tested to be interoperable with Electrum SV and Handcash.

Money Button can be used to send money to paymails. A new output type, “PAYMAIL”, is enabled.

Furthermore, Money Button users can create, purchase, and sell paymails. Paymails are not free, unless you can prove ownership of the name on a social media account. Please see our announcement about [Why We Charge Money For Usernames.](https://blog.moneybutton.com/2019/05/31/why-we-charge-money-for-usernames/)

The Money Button implementation is open-sourced under the BSV license, which enables any application on Bitcoin (BSV) to use the implementation. Our implementation can be found on GitHub: [paymail-client](https://github.com/moneybutton/paymail-client) and [express-paymail](https://github.com/moneybutton/express-paymail).

Paymail is being implemented by Electrum SV, Handcash, and Centbee. We are hoping that every wallet and exchange adds support. We believe that once users and businesses see the user-experience advantages of Paymail that every application will want to add support.

## Conclusion

The primary goal of Paymail is to eliminate Bitcoin addresses from the user experience and to replace them with a naming system that is familiar to the user. People should be able to send money from wallet to wallet or person to person without ever having to see long, random strings. With Paymail, users can send money to a name. This is much more familiar, easier to remember, and easier to manage for users.

The secondary goal is to enable every application of identity. Paymail is extensible. Included with the main protocol at launch are additional protocols for addresses and public keys. We have several planned extensions that, altogether, make every conceivable application for identity possible.

The tertiary goal of paymail is to be compatible with existing identity systems, particularly Gmail and other popular email services, so that users and business have the option to transition seamlessly without altering their existing identity system.

We are excited to have found a solution to every problem in Paymail.
