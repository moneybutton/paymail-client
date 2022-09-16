---
id: paymail-02-service-discovery
title: Service Discovery
---

```
title: bsvalias Service Discovery
authors:
  - andy (nChain)
  - Ryan X. Charles (Money Button)
version: 1
```

Service discovery is separated into two phases:

* [Host Discovery](paymail-02-01-host-discovery.md) is a DNS based lookup of the responsible host for a given paymail alias
* [Capability Discovery](paymail-02-02-capability-discovery.md) resolves the paymail service endpoint URIs from the responsible DNS host and describes the capabilities supported by a given paymail service instance

## Service Discovery Process

```plantuml
boundary "Client" as c
database "DNS" as dns
entity "Discovery Endpoint" as ed
control "Paymail Service" as svc

activate c
  group Host Discovery
    c -> dns: Query
    activate dns
      dns -> c: Host/Port
    deactivate dns
  end
  group Capability Discovery
    c -> ed: Query
    activate ed
      ed -> c: Capabilities and URIs
    deactivate ed
  end
  ...
  group Protocol Flow
    c --> svc: Requests
    activate svc
      svc --> c: Responses
    deactivate svc
  end
deactivate c
```
