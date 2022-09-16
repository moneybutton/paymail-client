---
id: paymail-02-02-capability-discovery
title: Capability Discovery
---

Following on from [Host Discovery](paymail-02-01-host-discovery.md), the next step a paymail client performs is Capability Discovery.

Capability Discovery is the process by which a paymail client learns the supported features of a paymail service and their respective endpoints and configurations.

Drawing inspiration from [RFC 5785](https://tools.ietf.org/html/rfc5785) and IANA's [Well-Known URIs](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml) resource, the Capability Discovery protocol dictates that a machine-readable document is placed in a predictable location on a web server.

## Setup

A paymail service operator creates a JSON formatted text file at the following location:

`https://<host-discovery-target>:<host-discovery-port>/.well-known/bsvalias`.

* The file name `bsvalias` is chosen to allow implementers to move forward with a stable specification whilst the final product name is under consideration
* The file _MUST_ be served over HTTPS
* The value of the HTTP `Content-Type` header _MUST_ be set to `application/json` and optionally _MAY_ indicate a schema as an attribute, for example `application/json; schema="https://schemas.nchain.com/bsvalias/1.0/capability-discovery"`
* The successful response status code _MUST_ be either `200` (OK) if the `bsvalias` file exists, or `304` (Not Modified) if valid cache query headers are supplied within the request.
* The response _MAY_ indicate the document's validity via standard HTTP caching and expiry related headers. Operators are advised to consider configuring their web server to support the broadest range of supported client caching mechanisms, including `Cache-Control`, `Last-Modified`/`If-Modified-Since`, `Etag`, and `Expires`. Many standard clients and libraries implement standards-compliant caching behaviour. Further details are available from [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
* The `bsvalias` file must conform to the following format:
    ```json
    {
      "bsvalias": "1.0",
      "capabilities": {
        "pki": "https://bsvalias.example.org/{alias}@{domain.tld}/id",
        "paymentDestination": "https://bsvalias.example.org/{alias}@{domain.tld}/payment-destination"
      }
    }
    ```
* The template values `{alias}` and `{domain.tld}` refer to the components of paymail handle format `<alias>@<domain>.<tld>` and are literal; clients are expected to replace them wherever they appear in the endpoint URI with the actual values from the paymail handle
* Additional BRFCs may extend this document. It is a matter for each specification author to describe the data structure required for their particular protocol, however the location of that data structure must be a key within the `capabilities` object named after the BRFC ID. As an example, a (fictional) BRFC with ID `001122334455` requires a simple boolean flag in addition to an endpoint URI. It would extend the `.well-known/bsvalias` document like this:
    ```json
    {
      "bsvalias": "1.0",
      "capabilities": {
        "001122334455": {
          "endpoint": "https://bsvalias.example.org/{alias}@{domain.tld}/example",
          "flag": true
        }
      }
    }
    ```
    Note that the capabilities `pki` and `paymentDestination` are not named for their BRFC IDs, as these are the minimum set of capabilities required for a service to qualify as a paymail service and are treated as special cases.

## Client Queries

Having retrieved a `Target`:`Port` pair using Host Discovery, a paymail client constructs an HTTP GET request to `https://<target>:<port>/.well-known/bsvalias`, including caching hints from previous requests (if any).

Following a successful request, clients have now discovered all configuration information required for interacting with a paymail service and are aware of all supported extension protocols offered by the remote.

## Changes from previous versions

In the original drafts, the `bsvalias` file was a text based, tab-delimited list of `<domain>.<tld> \tab https://<base-uri>` pairs.

* This was removed to avoid data leakage about domains hosted by a given paymail service
* The format was changed from tab-delimited text to JSON
* Capability Discovery was merged into the previous Address Discovery base URI approach
* A paymail (`bsvalias`) version field was added for forward compatibility, although its interpretation is unspecified at this time

## Design Considerations

In a previous version of this specification, this step of the service discovery returned a base URI from which all request URIs would be built. It was suggested that the `.well-known/bsvalias` document merge a separate capability discovery which was originally planned to exist at `<base-uri>/capabilities`. In doing so, the following points were considered:

### Capabilities differ by domain and by user within a domain

  * Service providers hosting multiple domains may offer different capabilities at different price points
  * Administrators may enable or disable capabilities on a per-user bases

A single `.well-known/bsvalias` document cannot describe the per-alias/per-domain capabilities. Instead it describes the services supported by the implementation, regardless of account-level availability. Where a paymail implementation supports a particular protocol but it is not enabled for a given account, upon receiving a request that will not be fulfilled, a `404` (Not Found) response should be given. This is (deliberately) indistinguishable from `{alias}`/`{domain.tld}` not found.

### Simplified client/request flow

Merging capability discovery reduces the amount of requests made in order to locate a given service endpoint, and simplifies client implementations. 

### More complicated deployment

One drawback of merging the two phases of discovery is that `.well-known/bsvalias` is no longer _set-and-forget_.

Prior to merging these to functions, a redeployment of the paymail service implementation may deliver new capabilities. These would be automatically discovered by clients.

Having merged service location and capability discovery into `.well-known/bsvalias`, this file must also be updated when a service deployment delivers enhanced capabilities. It is recommended that implementers of server software deliver an endpoint that can generate a valid `.well-known/bsvalias` response, and that operators configure a proxy to transparently service this implementation-provided endpoint when a request for the well known capabilities file is received.
