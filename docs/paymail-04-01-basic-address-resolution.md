---
id: paymail-04-01-basic-address-resolution
title: Payment Addressing (Basic Address Resolution)
---

```
title: bsvalias Payment Addressing (Basic Address Resolution)
authors:
  - andy (nChain)
  - Ryan X. Charles (Money Button)
version: 1
```

Given a _sender_ and a _receiver_, where the sender knows the receiver's paymail handle `<alias>@<domain>.<tld>`, the sender can perform Service Discovery against the receiver and request a payment destination from the receiver's paymail service.

The payment destination request endpoint is described in the `.well-known/bsvalias` configuration file:

```json
{
  "bsvalias": "1.0",
  "capabilities": {
    "paymentDestination": "https://bsvalias.example.org/{alias}@{domain.tld}/payment-destination",
  }
}
```

The template values `{alias}` and `{domain.tld}` refer to the components of the receiver's paymail handle `<alias>@<domain>.<tld>` and must be substituted by the client before issuing a request.

The sender will receive a Bitcoin output script, which should be used in the construction of the payment transaction to the receiver.

## Flow

```plantuml
boundary "Client" as c
control "Paymail Service" as svc

activate c
  c --> c: Service Discovery
  ...
  c -> svc: POST <payment destination URI>\napplication/json\n+cache hints
  activate svc
    svc -> svc: Key derivation
    svc -> svc: Output script construction
    svc -> c: 200; application/json
  deactivate svc
deactivate c
```

## Sender Request

The `capabilities.pki` path returns a URI template. Senders should replace the `{alias}` and `{domain.tld}` template parameters with the values from the receiver's paymail handle and then make an HTTP POST request against this URI.

The body of the POST request _MUST_ have a content type of `application/json` and _MUST_ conform to the following schema:

```json
{
    "senderName": "FirstName LastName",
    "senderHandle": "<alias>@<domain.tld>",
    "dt": "<ISO-8601 timestamp>",
    "amount": 550,
    "purpose": "message to receiver",
    "signature": "<compact Bitcoin message signature>"
}
```

| Field         | Required | Description                                                              |
|---------------|----------|--------------------------------------------------------------------------|
| `senderName`   |          | Human-readable sender display name                                        |
| `senderHandle` | ✓        | sender's paymail handle                                                   |
| `dt`          | ✓        | [ISO-8601][1] formatted timestamp; see notes                             |
| `amount`      |          | The amount, in Satoshis, that the sender intends to transfer to the receiver |
| `purpose`     |          | Human-readable description of the purpose of the payment                 |
| `signature`   |          | Compact Bitcoin message signature; see notes                             |

### Timestamp field (dt)

The timestamp field should contain the [ISO-8601][1] formatted current time at the point the receiver initiates a payment destination request. From JavaScript this can be constructed using `JSON.stringify()`:

```js
let now = JSON.stringify({'now': new Date()});
```

Which yields:

```json
{
  "now": "2013-10-21T13:28:06.419Z"
}
```

### Signature field

The Bitcoin client has long offered the ability to sign messages and verify message signatures. The Bitcoin functionality is essentially an implementation of standard ECDSA, however along with the (_r_, _s_) signature pair there is additional information to allow the Bitcoin client to verify a message signature against a P2PKH _address_ (a hash of a public key) rather than directly against a public key.

In the original draft of this specification, the signature was the raw (_r_, _s_) fields, computed over a double-SHA256 hash of the message. However in order to leverage existing Bitcoin client libraries, such as MoneyButton's [BSV library][2], it has been decided instead to follow the Bitcoin client's signing and verification protocol.

The MoneyButton BSV library's implementation is nominated as the standard message digest construction and signature encoding method for signatures included in payment destination requests. [Usage][3] and [reference][4] [implementation][5] are available from GitHub.

The message to be signed begins with the Bitcoin signature scheme's traditional preamble (as documented within the BSV library's source code) and is followed by the UTF8 string concatenation of `senderHandle`, `dt`, `amount` and `purpose` fields.

* If `amount` is present, it is converted to a string (with no leading zeros)
* If `amount` is not present, the string `"0"` is used
* If purpose is not present, an empty string `""` is used (effectively purpose is not included in the message)

[1]: https://en.wikipedia.org/wiki/ISO_8601
[2]: https://github.com/moneybutton/bsv
[3]: https://github.com/moneybutton/bsv/blob/master/docs/examples.md#sign-a-bitcoin-message
[4]: https://github.com/moneybutton/bsv/blob/786ebe54e60eecc84074e4574eef11b125ea95e3/lib/message/message.js
[5]: https://github.com/moneybutton/bsv/blob/8c63608490954627a868d0d21b2f43b60e1dd3e7/lib/crypto/signature.js

## Receiver Response

Below are the responses that have meaning to this protocol. A server may return other status codes, for example `5xx` indicating some sort of server failure. Clients should treat status codes not specified as part of this specification as some sort of transient error and may retry at their leisure.

### 200 OK

Returned when a valid request for a known paymail handle has been received. The return message _MUST_ have a content type of `application/json`. The response body _MUST_ conform to the following schema:

```json
{
  "output": "..."
}
```

The value of the `output` field _MUST_ be a hex-encoded Bitcoin script, which the sender _MUST_ use during the construction of a payment transaction.

> It is beyond the scope of this specification to describe the various possible types of output script, however it is expected that paymail services will implement at a minimum P2PKH output scripts.
>
> Wallet implementers have expressed a desire to standardise their approach to key management within paymail implementations; this desire extends beyond the scope of paymail and covers cross-wallet key and seed import/recovery processes.
>
> It is suggested that wallet implementers agree upon a mechanism for generating P2PKH output scripts, and create a BRFC to describe that scheme. Such a scheme is advised to avoid address re-use (that is, each P2PKH script includes the hash of the public key of a newly created key pair) and that existing mechanisms such as Type 2 HD Wallet key derivation be used. One advantage to this suggestion is that paymail services can be implemented such that they derive new keys from only an `xpub`. In this way, neither the wallet seed nor any private keys are held by the paymail service implementation.

To illustrate a typical `output` field value, a standard P2PKH output script is constructed and encoded below.

Given a key pair with the public key `027c1404c3ecb034053e6dd90bc68f7933284559c7d0763367584195a8796d9b0e`, a P2PKH output script for the same would be hex-encoded as:

```
76a9140806efc8bedc8afb37bf484f352e6f79bff1458c88ac
```

This can be broken down as follows:

```
76          ;OP_DUP
a9          ;OP_HASH160
14          ;Push the next 20 bytes on to the stack
08 06 ef c8 ;ripemd160(sha256(compressed_public_key))
be dc 8a fb
37 bf 48 4f
35 2e 6f 79 
bf f1 45 8c
88          ;OP_EQUALVERIFY
ac          ;OP_CHECKSIG
```

The service response body would be:

```json
{
  "output": "76a9140806efc8bedc8afb37bf484f352e6f79bff1458c88ac"
}
```

### 404 Not Found

The paymail handle was not found by this service.

## Extensions to this Specification

* [Sender Validation](./paymail-04-02-sender-validation.md) which performs a reverse PKI lookup on the sender then verifies the message signature
* [Receiver Approvals](./paymail-04-03-receiver-approvals.md) extends the payment destination process with asynchronous approvals by the receiver before yielding a payment destination script
