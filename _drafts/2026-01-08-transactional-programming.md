---
layout: post
title:  "Programming with Transactions"
categories: databases transactions programming
---

*Transactions* are a defining historical feature of database systems. But, these have often been developed in a lineage partially distinct from the programming language community, with ad hoc overlap and exchange of ideas between both. Interestignly, this is perhaps also due to the fact that transactional programming is traditionally not a common feature of most mainstream programming languages, whereas for datbases it has been more or less assumed as table stakes. Transactional memory abstractions have been a somewhat well explored research area, but is still mostly far away from any programming environment most programmers have ever used in (non database oriented) programming settings.

The world and domain of transactional programming interfaces is diverse, and offers interesting possibilites for performance and correctness considerations in database systems. There also seems to be lack of convergence on best accepted interfaces here, with proliferation of different interfaces and approaches. It may be nice to see a convergence or consolidation of techniques here, but this is a starting point.

In particular, one of the key tradeoffs in transactional programming models is the "interactive" vs. "one-shot" or "batch" models. The former being naturally the more intuitive and natural way of programming with transactions for a user, but one-shot transactions potentially simplifying concurrency control mechanisms and/or boosting performance and cutting down round-trip latency between the client and server.

- [PL/SQL transactions](https://www.geeksforgeeks.org/sql/pl-sql-transactions/)
- [DynamoDB transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
  - All transactions submitted as single request, using either `TransactWriteItems` or `TransactGetItems`. DynamoDB general model is basically a KV store, and you can set or update keys on a given table. A write-transaction can include, `PutItem`, `UpdateItem`, or `DeleteItem` as basic operations.
- [Convex](https://docs.convex.dev/database/advanced/occ)
  - Defines [mutations](https://docs.convex.dev/functions/mutation-functions) as TypeScript functions that insert, update, or remove data from the database, and they execute transactionally
- [Calvin](https://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf) style determinstic
- [FaunaDB/FQL](https://faunadb-docs.netlify.app/fauna/current/learn/query/)
  - Fauna Query Language (FQL) is a TypeScript-like language for reading/writing data in Fauna.
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/) (and [aggregation update](https://www.mongodb.com/docs/manual/tutorial/update-documents-with-aggregation-pipeline/) operators)
- [Transactional memory](https://en.wikipedia.org/wiki/Transactional_memory)
- [Sinfonia](https://dl.acm.org/doi/10.1145/1294261.1294278) (minitransactions)
- Hackwrench
- [Spanner transactions](https://docs.cloud.google.com/spanner/docs/transactions)
  - Appears that there is actually a special "[mutations](https://docs.cloud.google.com/spanner/docs/modify-mutation-api)" API as well, which are designed for only writing data (?) This is apparently in contrast to [DML](https://docs.cloud.google.com/spanner/docs/dml-tasks) (data manipulation language)