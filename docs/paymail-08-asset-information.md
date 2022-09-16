---
id: paymail-08-asset-information
title: Asset Information
---
```
title: Asset Information
author: Fabriik
version: 1
brfc: 1300361cb2d4
```

This extension provides information about an asset that has a paymail asigned, including asset name, avatar and protocol.

## Motivation
Companies that provide tokens functionality, should provide a convenient way to get tokens information. Since, assets can be named using paymail (e.g. myasset@monneybutton.com) we have the ability to query the asset using paymail protocol. So, we will need to create an extension to represent tokens, that will allows to query basic information about the token: name, supply, description, graphical representation, etc.

## Capability Discovery
The `.well-known/bsvalias` document is updated to include a declaration of the endpoint to receive asset information:

```json
{
  "bsvalias": "1.0",
  "capabilities": {
    "1300361cb2d4": "https://example.bsvalias.tld/api/asset/{alias}@{domain.tld}"
  }
}
```

## Client request
The `capabilities.1300361cb2d4` path returns a URI template. `{alias}` and `{domain.tld}` placeholders should be replaced with a valid bsvalias handle of the asset. Then, the client can perform a http GET request to receive asset information.

## Receiver Response
The response *MUST* include the following properties: `name`, `protocol`. The response *SHOULD* contain also extra information like `description`, `avatar`, `supply`, `url`. It also *MAY* include other properties which are protocol specific, like in the example below `authorizerPubkey` for SFP protocol.
### 200 OK
```json
{
  "name": "Example Inc.",
  "protocol": "SFP@0.1",
  "protocolData": {
    "authorizerPubkey": "02629482acdae0266cc098c7d7241a2076627f21bde1a417ac348f1c3758bdaac2"
  },
  "supply": "10000000",
  "alias": "example@moneybutton.com",
  "description": "Example Inc. utility tokens.",
  "avatar": "https://www.example.com/stock.png",
  "url": "https://www.example.com/example-asset-information"
}
```

### 404 Not Found
The asset was not found.
