---
id: paymail-04-04-payto-protocol-prefix
title: Payment Addressing (PayTo Protocol Prefix)
---

```
title: bsvalias Payment Addressing (PayTo Protocol Prefix)
author: andy (nChain)
version: 1
```

The PayTo Protocol Prefix specification defines the URI prefix `payto:` to mean _launch a paymail payment to the specified paymail handle_. Additional query string parameters _MAY_ be included; these are defined below.

paymail client implementers _SHOULD_ ensure that their application is registered with the target device operating system as a protocol/deeplink handler for the `payto:` protocol prefix.

## Full Specification

```
payto:<receiver>?amount=<amount>&purpose=<purpose>
```

| Token | Required | Description |
|-|-|-|
| `receiver` | ✓ | `<alias>@<domain>.<tld>` formatted paymail handle, for example `payments@example.org` |
| `amount` | | Integer number of satoshis to be paid. |
| `purpose` | | Human-readable description of the purpose of the payment  |

## Capability Discovery

This specification governs client-side behaviour. No specific capabilities are delivered by paymail implementations.
