---
id: paymail-99-01-recommendations
title: Recommendations
---

paymail lives on the public web. As such, it is recommended that standard defensive mechanisms are deployed. These include, but are not limited to:

* maintain access logs
* prevent information leakage, including through error messages
* do not keep sensitive information on internet-connected servers
* place limits on everything, even if they are high
  * rate limits
  * maximum message size limits
  * bad request limits (leading to a ban)
    * malformed requests
    * suspicious requests
* secure the host operating system and environment
* operate under the principle of least privilege
* do not trust any input to any API endpoint
  * assume all API calls are hostile until proven otherwise
  * sanitize _everything_
* keep software/library/dependency versions up to date

There are additional concerns that are specific to the paymail service:

* consider the meanings of request bodies
  * whilst it might be normal for an online retail store to receive a high volume of payment destination requests and pay to email posts, consider the amounts being paid. a valid transaction might not count towards some sort of ban limit, but maybe it should if the service receives thousands of dust transactions a second
  * infinite-loop payment destination requests might be valid but can lead to resource exhaustion, both CPU (during key derivation) and address space (individual Type 2 HD Wallet derivation paths, for example, are not infinite)
  * consider if the request is really probing for leaked information, rather than performing its intended function
* consider risks to funds
  * use `xpub` or nChain public key derivation for payment destination discovery. do not keep wallet seeds or private keys in paymail services, as these are a gold mine waiting to be stolen by a malicious adversary
