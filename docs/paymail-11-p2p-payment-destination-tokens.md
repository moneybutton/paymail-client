---
id: paymail-11-p2p-payment-destination-tokens
title: P2P Payment Destination with Tokens Support
---

```
title: P2P Payment Destination with Tokens Support
authors: Fabriik
version: 1
brfc: f792b6eff07a
```
This extension adds tokens support to [payment destination](./paymail-07-p2p-payment-destination.md) extension.
by adding two new properties to the request: `asset` and `protocol`. 

Given a _sender_ and a _receiver_, where the sender knows the receiver's paymail handle `<alias>@<domain>.<tld>` and
wants to send _tokens_ using a particular _protocol_, the sender can perform Service Discovery against the receiver 
and request a payment destination from the receiver's paymail service for that _asset_ and _protocol_.

## Motivation

Sending tokens requires for both _receiver_ and _sender_ wallets to be able to support the underlying protocol
in order for users to see their tokens being transferred from one wallet to the other. Sending
a transaction that has scripts built using a particular protocol to a wallet that doesn't understands and
supports that protocol may cause for tokens to be "lost".

Adding parameters `asset` and `protocol` allows the _receiver_ to verify first that it supports those
and also to return the right outputs for them.

## Capability discovery

The `.well-known/bsvalias` document is updated to include a declaration of the endpoint to receive transactions:
```json
{
  "bsvalias": "1.0",
  "capabilities": {
    "f792b6eff07a": "https://bsvalias.example.org/{alias}@{domain.tld}/payment-destination-tokens",
  }
}
```

The template values `{alias}` and `{domain.tld}` refer to the components of the receiver's paymail handle `<alias>@<domain>.<tld>` and must be substituted by the client before issuing a request.

The receiver will verify first if it supports the _protocol_ and second, if it allows to receive the particular _asset_.
In case those conditions are met and the paymail exists, the sender will receive a Bitcoin output script, 
which should be used in the construction of the payment transaction to the receiver.

> Receiver's wallet should build an output script that is supported by the `protocol` specified in the request

## Sender Request

The `capabilities.pki` path returns a URI template. Senders should replace the `{alias}` and `{domain.tld}` template parameters with the values from the receiver's paymail handle and then make an HTTP POST request against this URI.

The body of the POST request _MUST_ have a content type of `application/json` and _MUST_ conform to the following schema:

Method: `POST`

Body `application/json`:

```json
{
    "amount": 550,
    "asset": "apples@fabriik.me",
    "protocol": "SFP"
}
```

| Field          | Required | Description                                                                  |
|----------------|----------|------------------------------------------------------------------------------|
| `amount`       | ✓        | The amount, in Satoshis, that the sender intends to transfer to the receiver |
| `asset`        |          | Identification for the asset being sent                                      |
| `protocol`     |          | Identification for the protocol being used in the UTXOs                      |

### Asset field
The asset identification will depend on the protocol being used and how it identifies different assets.
For example, for [Simple Fabriik Protocol for Tokens](sfp/protocol-overview.md), assets are identified using a paymail address.
If this is a regular BSV transfer, use _bsv_.

### Protocol field
The protocol identification field will have the short name or ID that each protocol publishes for
recognizing it (for example for Simple Fabriik Protocol for Tokens is just "sfp").

> Fields `asset` and `protocol` are not required since this extension may be used also to receiver regular bsv payments

## Server response

The server generates a list of outputs to receive the payment. It also generates a way to identify the payment in the form of the `reference`, a string that can be used as an invoice ID.

### 200 OK

Returned when a valid request for a known paymail handle has been received. The return message _MUST_ have a content type of `application/json`. The response body _MUST_ conform to the following schema:

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

| Field               | Description                                                             |
| outputs             | Outputs to be used for the payment                                      |
| outputs[n].script   | Hex encoded locking script valid for the protocol                       |
| outputs[n].satoshis | Number of satoshis for that output                                      |
| reference           | A reference for the payment, created by the receiver of the transaction |

### 404 Not Found

The paymail handle was not found by this service.

### 406 Not Acceptable

The receiver doesn't support the corresponding _protocol_ indicated in the request.

### 451 Unavailable For Legal Reasons

The receiver doesn't support the _asset_ indicated for some legal reason. A description _MAY_ be
added with more information for the user:

```json
{
  "description": "The asset is being used for illegal payments"
}
```
