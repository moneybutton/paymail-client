---
id: paymail-02-01-host-discovery
title: Host Discovery
---

Host discovery is the process through which a domain owner optionally specifies which web host to interrogate during capability discovery. The host discovery process involves the creation and subsequent query of `SRV` DNS records.

The use of an `SRV` record was chosen for the following reasons:

* Domain owners may choose to use a third-party paymail service provider. Delegating authority to this provider is a one-time activity (the creation of a DNS `SRV` record).
* `TXT` records were considered, however should the paymail service be reconfigured (for example, the root URI change from `.../api/v1/...` to `.../api/v2/...`), the domain owner would have to coordinate with the service provider to ensure the `TXT` record (containing a full endpoint URI) was updated. With `SRV` records (plus the [Capability Discovery](paymail-02-02-capability-discovery.md) protocol), the Host Discovery phase is _set-and-forget_.
* As an optional step, if the canonical Capability Discovery host is the same as the domain found in the paymail alias, the DNS record can be omitted entirely.
* DNS records (including `SRV`) feature a TTL, which clients can use for caching responses. All common DNS clients implement this caching _out-of-the-box_, meaning implementers do not have to roll this themselves.

## Setup

A domain owner may create an `SRV` record with the following parameters:

| Parameter | Value                       |
|-----------|-----------------------------|
| Service   | `_bsvalias`                 |
| Proto     | `_tcp`                      |
| Name      | `<domain>.<tld>.`           |
| TTL       | `3600` (see notes)          |
| Class     | `IN`                        |
| Priority  | `10`                        |
| Weight    | `10`                        |
| Port      | `443`                       |
| Target    | `<endpoint-discovery-host>` |

The `TTL` parameter should be set very low for test configurations (a few seconds), whereas for production deployments this should be set higher, to allow caching to work. A value of `3600` is suggested for production deployments.

Although the DNS system allows for multiple records with a variety of priorities and weights, which allows for some level of traffic management, resilience, and load-balancing via DNS records, it is recommended by this specification that these considerations be handled by more modern infrastructure and only a single `SRV` record be created.

See [https://en.wikipedia.org/wiki/SRV_record](https://en.wikipedia.org/wiki/SRV_record) for more information on `SRV` DNS records.

## Client Queries

Given a paymail alias `<alias>@<domain>.<tld>`, a paymail client would perform a DNS lookup for an SRV record matching `_bsvalias._tcp.<domain>.<tld>`. The combination of `Target` and `Port` fields are then used for Capability Discovery. Should no record be returned, a paymail client should assume a host of `<domain>.<tld>` and a port of `443`.
