---
id: paymail-introduction
title: Paymail Introduction
---

**paymail** is a collection of protocols for Bitcoin SV wallets that allow for a set of simplified user experiences to be delivered across all wallets in the ecosystem.

❌ No more complicated `17Dx2iAnGWPJCdqVvRFr45vL9YvT86TDsn` addresses

✅ Simple payment handles like `<alias>@<domain>.<tld>`

The goals of the paymail protocol are:

* User friendly payment destinations through memorable handles
* Permissionless implementation
* Self-hosted or delegated to a managed service
* Automatic service discovery/location
* PKI infrastructure
* Cross-wallet exchange of single-use transaction output scripts of any construction
* Request and response authentication
* Security and policy management
* Capability extensibility and discovery

## bsvalias

The family of related protocols are collectively referred to as the `bsvalias` protocols. At the time of writing, these include:

* [BRFC Specifications](paymail-01-brfc-specifications.md)
* [Service Discovery](paymail-02-service-discovery.md)
* [Public Key Infrastructure](paymail-03-public-key-infrastructure.md)
* [Payment Addressing](paymail-04-payment-addressing.md)

## paymail

**paymail** is the name for the implementation of the following protocols:

* [Service Discovery](paymail-02-service-discovery.md)
* [Public Key Infrastructure](paymail-03-public-key-infrastructure.md)
* [Basic Address Resolution](./paymail-04-01-basic-address-resolution.md) from the [Payment Addressing](paymail-04-payment-addressing.md) protocol group

The **paymail** brand is reserved for products and services that, at a minimum, implement each of the above.

## Extension Protocols

As defined in the [BRFC Specifications](paymail-01-brfc-specifications.md), anybody can propose an extension to the `bsvalias` and paymail protocols, and as per the [Capability Discovery](./paymail-02-02-capability-discovery.md) section of the [Service Discovery](./paymail-02-service-discovery.md) protocol, implementations can declare support for extensions to allow for cross-wallet processes.

Extension protocols are the collection of protocols not contained within the core paymail set defined above, but that are fully compatible with `bsvalias` protocols and paymail implementations. Notable examples presently include:

* [Sender Validation](./paymail-04-02-sender-validation.md)
* [Receiver Approvals](./paymail-04-03-receiver-approvals.md)
* [PayTo Protocol Prefix](./paymail-04-04-payto-protocol-prefix.md)
