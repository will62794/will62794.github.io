---
layout: post
title:  "Programming with Transactions"
categories: databases transactions programming
---

A defining historical feature of database systems is that of *transactions*. But, these have often been developed in a lineage partially distinct from the programming language community, with ad hoc overlap and exchange of ideas between both. Interestignly, this is perhaps also due to the fact that transactional programming is traditionally not a common feature of most mainstream programming languages, whereas for datbases it has been more or less assumed as table stakes. Transactional memory abstractions have been a somewhat well explored research area, but is still mostly far away from any programming environment most programmers have ever used in (non database oriented) programming settings.

The world and domain of transactional programming interfaces is diverse, and offers interesting possibilites for performance and correctness considerations in database systems. There also seems to be lack of convergence on best accepted interfaces here, with proliferation of different interfaces and approaches. It may be nice to see a convergence or consolidation of techniques here, but this is a starting point.

- [PL/SQL transactions](https://www.geeksforgeeks.org/sql/pl-sql-transactions/)
- [DynamoDB one-shot transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
- [Convex](https://docs.convex.dev/database/advanced/occ)
- [Calvin](https://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf) style determinstic
- [FaunaDB/FQL](https://faunadb-docs.netlify.app/fauna/current/learn/query/)
- MongoDB transactions
- [Transactional memory](https://en.wikipedia.org/wiki/Transactional_memory)
- [Sinfonia](https://dl.acm.org/doi/10.1145/1294261.1294278) (minitransactions)
- Hackwrench
- [Spanner transactions](https://docs.cloud.google.com/spanner/docs/transactions)