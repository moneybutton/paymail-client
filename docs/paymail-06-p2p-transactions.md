---
id: paymail-06-p2p-transactions
title: P2P Transactions
---

```
title: Send raw transaction
authors:
  - Miguel Duarte (Money Button)
  - Ryan X. Charles (Money Button)
  - Ivan Mlinaric (Handcash)
  - Rafa (Handcash)
version: 1.1
brfc: 5f1323cddf31
```

This capability allows a paymail provider to receive a raw transaction delivered to one of its users.

## Motivation

Most Bitcoin wallets today must scan the blockchain to receive transactions. They must look at every output of every transaction on the network and compare this against a list of known outputs to see if the outputs belongs to a user. This is not scalable, because as the network grows, the wallet must scan all transactions on the network rather than just the transactions belonging to that wallet. This can be many orders of magnitude more transactions, and more work, than necessary.

Sending a transaction peer-to-peer enables creating scalable Bitcoin wallets. By sending transactions peer-to-peer, the receiving wallet needs to check the validity of the transaction and does not need to scan all transactions on the blockchain.
The possibility of sending a transaction directly between users and services is a fundamental piece to build more complex standards, like invoicing (BIP270) or on-chain messaging.

## Capability discovery

The .well-known/bsvalias document is updated to include a declaration of the endpoint to receive transactions:
```json
    {
      "bsvalias": "1.0",
      "capabilities": {
        "5f1323cddf31": "https://example.bsvalias.tld/api/receive-rawtx/{alias}@{domain.tld}"
      }
    }
```
The `capabilities.5f1323cddf31` is a URL where the sender needs to POST the tx data.

## Client request

The capabilities.5f1323cddf31 path returns a URI template. Senders MUST replace {alias}, {domain.tld} placeholders with a valid bsvalias handle. Then, the client MUST perform a POST http request with the following body:
```json
    {
      "hex": "01000000012adda020db81f2155ebba69e7c841275517ebf91674268c32ff2f5c7e2853b2c010000006b483045022100872051ef0b6c47714130c12a067db4f38b988bfc22fe270731c2146f5229386b02207abf68bbf092ec03e2c616defcc4c868ad1fc3cdbffb34bcedfab391a1274f3e412102affe8c91d0a61235a3d07b1903476a2e2f7a90451b2ed592fea9937696a07077ffffffff02ed1a0000000000001976a91491b3753cf827f139d2dc654ce36f05331138ddb588acc9670300000000001976a914da036233873cc6489ff65a0185e207d243b5154888ac00000000",
      "metadata": {
        "sender": "someone@example.tld",
        "pubkey": "<somepubkey>",
        "signature": "signature(txid)",
        "note": "Human readeble information related to the tx."
      },
      "reference": "someRefId"
    }
```
The body contains information for a single transaction. In the future we might create a standard to batch multiple transactions into a single request.
`hex`: contains the raw transaction, encoded as a hexadecimal string.
`metadata`: an object containing data associated with the transaction.
`metadata.sender (optional)`: the paymail of the person that originated the transaction.
`metadata.signature (optional)`: A signature of the tx id made by the sender.
`metadata.pubkey (optional)`: Public key to validate the signature.
`metadata.note (optional)`: A human readable information about the payment.
`reference (mandatory)`: Reference for the payment. Usually generated for the receiver to identify the payment. See the sister spec [P2P Payment Destination](paymail-07-p2p-payment-destination.md).

## Server response

The server is going to accept the transactions. This means it will do whatever it needs to accept the transactions in their system and then broadcast them to the bitcoin network.

### OK response
The server responds with the id of the accepted tx.
```json
    {
      "txid": "<sometxid>",
      "note": "Some human readable note"
    }
```
The body includes
`txid (mandatory)`: The txid of the broadcasted tx.
`note (optional)`: Some human readable note.

### Any other response

Any other response means an error. The server is free to implement any kind of error response using declarative http statuses and bodies.
