---
id: paymail-07-p2p-payment-destination
title: P2P Payment Destination
---

```
title: Get no monitored payment destination (p2p payment destination)
authors:
  - Miguel Duarte (Money Button)
  - Ryan X. Charles (Money Button)
  - Ivan Mlinaric (Handcash)
  - Rafa (Handcash)
version: 1.1
brfc: 2a40af698840
```
This protocol is an alternative protocol to [basic address resolution](./paymail-04-01-basic-address-resolution.md). Instead of returning one address, it returns a list of outputs with a reference number. It is only intended to be used with [P2P Transactions](paymail-06-p2p-transactions.md) and will continue to function even after basic address resolution is deprecated.

## Motivation

For advanced uses of bitcoin one output is sometimes not enough. Event for simple payments, there is a lot of scenarios where is more convenient to specify multiple outputs to receive a payment.

In addition, the BSV ecosystem is starting to move away of the idea of monitoring addresses. After release of [Genesis](https://bitcoinsv.io/genesis-hard-fork/), there are no more "standard scripts". This means that now wallets are free to use any kind of scripts to make and receive payments.

Finally, wallets show interest in having a separate way to generate payment destinations between p2p and legacy transactions. In the legacy system, the transaction is send to the blockchain, and then the recipient must scan the blockchain to find the transaction. This means that for every payment destination that you create the weight of monitoring the blockhain is heavier. The payment destinations (usually addresses) generated for this capability don't need to be monitored because they are ment to be used only with [P2P transaction broadcasts](paymail-06-p2p-transactions.md).
If a transaction constructed with those given outputs is broadcasted only in a legacy way, the receiving wallet will most likely never receive it as it is not meant to listen to the blockchain for those outputs and might not have the ability to do so.

## Capability discovery

The `.well-known/bsvalias` document is updated to include a declaration of the endpoint to receive transactions:
```json
    {
      "bsvalias": "1.0",
      "capabilities": {
        "2a40af698840": "https://example.bsvalias.tld/api/p2p-payment-destination/{alias}@{domain.tld}"
      }
    }
```

The `capabilities.2a40af698840` is an url, where the sender need to do a POST http request requesting a payment destination for a given amount of satoshis.

## Client request

The `capabilities.2a40af698840` path returns a URI template. Senders MUST replace {alias}, {domain.tld} placeholders with a valid bsvalias handle. Then the client MUST perform a POST http request with the following body structure:
```json
    {
      "satoshis": 1000100,
    }
```
The body contains the number of satoshis that the sender wants to send to the receiver.

## Server response

The server generates a list of outputs to receive the payment. It also generates a way to identify the payment in the form of the `reference`, a string that can be used as an invoice ID.

### OK response

The server responds with the following structure:

```json
    {
      "outputs": [
        {
          "script": "76a914f32281faa74e2ac037493f7a3cd317e8f5e9673688ac",
          "satoshis": 10000
        },
        {
          "script": "76a914b919d0b2ea7e9d858fa2916409902253789c169788ac",
          "satoshis": 20000
        }
      ],
      "reference": "someref"
    }
```
The body includes:

- `outputs`: A list of outputs. Every output is made of:
    - `script`: Hex encoded locking script.
    - `satoshis`: Number of satoshis for that output.
- `reference`: A reference for the payment, created by the receiver of the transaction.

This capability is intended to be used as peer-to-peer communication between wallets with the sister spec for [P2P Transactions](paymail-06-p2p-transactions.md). The `reference` attribute allows the receiver to track the transaction. When the receiver receives the transaction it can validate it using the reference.

### Any other response
Any other response is considered an error. The server is free to use any descriptive http status and body.
