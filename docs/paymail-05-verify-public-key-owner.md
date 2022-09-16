---
id: paymail-05-verify-public-key-owner
title: Verify Public Key Owner
---

```
title: bsvalias public key verify (Verify Public Key Owner)
authors:
  - andy (nChain)
  - Ryan X. Charles (Money Button)
  - Miguel Duarte (Money Button)
version: 1
brfc: a9f510c16bde
```

This capability allows clients to verify if a given public key is a valid identity key for a given paymail handle.

## Motivation

The public key returned by pki flow for a given paymail handle may change over time. This situation may produce troubles to verify data signed using old keys, because even having the keys, the verifier doesn't know if the public key actually belongs to the right user.


## Capability discovery

The `.well-known/bsvalias` document is updated to include a declaration public key owner validation enpoint:

```json
{
  "bsvalias": "1.0",
  "capabilities": {
    "{{fm:brfc}}": "https://example.bsvalias.tld/api/{alias}@{domain.tld}/{pubkey}"
  }
}
```

The `capabilities.{{fm:brfc}}` is a template URL to verify the ownership of the public key.

## Client Request

The `capabilities.{{fm:brfc}}` path returns a URI template. Senders _MUST_ replace `{alias}`, `{domain.tld}` placeholders with a valid paymail handle. `{pubkey}` placeholder _MUST_ be a valid point on the secp256k1 curve, compressed, and hex-encoded. The client _MUST_ perform a GET request to the obtained URL.

## Server Response

Below are the responses that have meaning to this protocol. A server may return other status codes, for example `5xx` indicating some sort of server failure. Clients should treat status codes not specified as part of this specification as some sort of transient error and may retry at their leisure.

### 200 OK

Returned when a valid request was made. The response _MUST_ have `application/json` as content type. The response body _MUST_ follow this schema:

```json
{
  "handle":"somepaymailhandle@domain.tld",
  "pubkey":"<consulted pubkey>",
  "match": true,
}
```

| Field         |  Description |
|---------------|--------------|
| `handle`   | queried handle |
| `pubkey` | queried public key |
| `match` | `true` if pubkey belongs to paymail handle. `false` otherwise. |

This endpoint returns status 200 everytime the request is valid. If the paymail handle is unknown to the server it returns 200 anyway, but `false` in the match field.

## Changes to Address Resolution

[Basic Address Resolution](paymail-04-01-basic-address-resolution.md) is extended as follows:

In order to use this capability the client needs to send a public key. The server will verify the signature against that public key and also will verify that the signature belongs to the sender.

### Client Request

A public key is added to the body of the request. The final schema is the following:

```json
{
    "senderName": "FirstName LastName",
    "senderHandle": "<alias>@<domain.tld>",
    "dt": "<ISO-8601 timestamp>",
    "amount": 550,
    "purpose": "message to receiver",
    "signature": "<compact Bitcoin message signature>",
    "pubkey":"<valid public key>"
}
```

### Flow


```plantuml
boundary "Sender\nClient" as c
control "Sender\nPaymail Service" as svc_r
control "Receiver\nPaymail Service" as svc_e

activate c
  c -> c: Sign Request
  c -> svc_e: POST <payment destination URI>\napplication/json\n+cache hints
  activate svc_e
    svc_e -> svc_e: Timestamp check
    svc_e -> svc_e: Mandatory field check
    svc_e -> svc_e: Validate signature \n with provided key
    svc_e -> svc_r: Verify Public\n Key Owner
    activate svc_r
      svc_r -> svc_e: true/false
    deactivate svc_r
    svc_e -> svc_e: Validation
    alt Validation Passed
      svc_e -> svc_e: Key derivation
      svc_e -> svc_e: Output script construction
      svc_e -> svc_e: Sign output script
      svc_e -> c: 200; application/json
      c -> c: Verify signature over\noutput script
    else Validation Failed
      svc_e -> c: 401 Unauthorised
    end
  deactivate svc_e
deactivate c
```
