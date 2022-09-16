---
id: paymail-01-01-specification-documents
title: Specification Documents
---

There is no fixed format or central location for BRFC documents. They may be authored as markdown documents and hosted in a GitHub repository, published to a corporate website, embedded into the Bitcoin SV blockchain, shared on a mailing list, or distributed by any other means deemed appropriate by the author(s).

It is however recommended that at a minimum, the following metadata be included somewhere in the document:

| Field        | Required   | Description      |
|--------------|------------|------------------|
| `title`      | `required` | Proposal title   |
| `author`     |            | Free-form, could include a name, alias, paymail address, GitHub/social media handle, etc. |
| `version`    |            | No set format; could be a sequence number, publication date, or any other scheme  |
| `supersedes` |            | A BRFC ID (or list of IDs) that this document supersedes                                 |

For markdown files, it is recommended that these fields are embedded as YAML front-matter.

It is not recommended that version fields follow semver. With semver's `<major>.<minor>.<patch>` format, it is expected that only an increment to the `<major>` element indicates a breaking change. An increment of the `<minor>` field indicates that additional functionality is available but that it will not break existing clients.

This is at odds with the binary nature of implementing a specification; either the specification is supported or it is not. The preferred methods of adding new features to a specification are:

* Introduce a new extension specification describing the additional functionality
* Update the specification and include the old BRFC ID in the `supersedes` field
