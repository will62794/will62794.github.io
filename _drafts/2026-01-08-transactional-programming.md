---
layout: post
title:  "Models for Transactional Programming"
categories: databases transactions programming
---

*Transactions* are a defining historical feature of database systems. But, these have often been developed in a lineage partially distinct from the programming language community, with ad hoc overlap and exchange of ideas between both. Interestignly, this is perhaps also due to the fact that transactional programming is traditionally not a common feature of most mainstream programming languages, whereas for datbases it has been more or less assumed as table stakes. Transactional memory abstractions have been a somewhat well explored research area, but is still mostly far away from any programming environment most programmers have ever used in (non database oriented) programming settings.

The world and domain of transactional programming interfaces is diverse, and offers interesting possibilites for performance and correctness considerations in database systems. There also seems to be lack of convergence on best accepted interfaces here, with proliferation of different interfaces and approaches. It may be nice to see a convergence or consolidation of techniques here, but this is a starting point.

In particular, one of the key tradeoffs in transactional programming models is the "interactive" vs. "one-shot" or "batch" models. The former being naturally the more intuitive and natural way of programming with transactions for a user, but one-shot transactions potentially simplifying concurrency control mechanisms and/or boosting performance and cutting down round-trip latency between the client and server.

If we look at transactions from a programming language persepctive, rather than database or execution oriented perspective (e.g. a transaction that executes over many round trip interactions with a server), we can consider host of different models. Note that some of these catgeorizations are in terms of the *system* that introduced or uses them rather than , But, it's often that each system will introduce a somewhat custom-tailored or opinionated programming model, so it's useful to look at both underlying models and dominant systems (Spanner, DynamoDB, etc.)

### [PL/SQL](https://www.geeksforgeeks.org/sql/pl-sql-transactions/)



### DynamoDB

DynamoDB is a key-value store that recently [added support for transactions](https://www.usenix.org/system/files/atc23-idziorek.pdf) in the last few years. Notably, they essentially adopt a truly "one-shot" model, which comes with some pros and cons.
All transactions submitted as single request, using either `TransactWriteItems` or `TransactGetItems`. DynamoDB general model is basically a KV store, and you can set or update keys on a given table. A write-transaction can include, `PutItem`, `UpdateItem`, or `DeleteItem` as basic operations.

<div style="justify-content:center; gap:20px; padding-bottom:17px;">
  <img src="/assets/aws-dynamodb-1.png" alt="transactions programming models diagram" style="width:400px;" />
  <img src="/assets/aws-dynamodb-txn-api.png" alt="transactions programming models diagram" style="width:300px;" />
</div>


<img src="/assets/aws-dynamodb-ex.png" alt="transactions programming models diagram" style="width:600px;display:block;margin:auto;padding-bottom:17px;" />

This is actually more similar to the ideas from Sinfonia, and assumes the kind of low-level but sufficiently expressive primitive approach for building simple but scalable transaction systems. I'm not sure how ergonomic this interface is for developers, though, and what type of applications are willing to drop down to this lower level abstraction in practice.



### Aurora DSQL

Amazon [Aurora DSQL](https://aws.amazon.com/blogs/database/everything-you-dont-need-to-know-about-amazon-aurora-dsql-part-3-transaction-processing/) is a serverless, distributed, transactional database system that was made generally available by AWS in 2025. 

They note the following about their transactional programming model and query processing engine:

> When write operations occur, the QP stores the results of these database changes locally, effectively spooling the writes throughout the transaction’s duration. In the event of a rollback or any disconnect, the QP discards the spooled writes.



<img src="/assets/dsql-read-write-arch.png" alt="transactions programming models diagram" style="width:550px;display:block;margin:auto;padding-bottom:17px;" />

This seems more similar to original Spanner read-write transactions, which buffered all writes at the client before submitting them to the server. 



### [Convex](https://docs.convex.dev/database/advanced/occ)

Convex is not a database, strictly speaking, but is rather a full end-to-end framework for building database-backed applications in a convenient, all-in-one package. All of your application and infra code and configuration is essentially bundled together in one place, which provides nice opportunities for easily co-designing and optimizing these components together. They take a quite [opinioniated view on things](https://stack.convex.dev/not-sql), but have clearly put careful thought into how we might re-design modern application and data stacks without the baggage of (50 year old) SQL.

Their notion of transactions is called [mutations](https://docs.convex.dev/functions/mutation-functions) which are TypeScript functions that insert, update, or remove data from the database, and they execute transactionally. One of these looks something like the following:

```typescript
export default mutation(async ({ db }, email, post) => {
  // Get the user by email
  const user = await db.query("users")
    .filter(q => q.eq(q.field("email"), email))
    .first()!;
  // Insert a post and increment the users's post count
  post['user'] = user._id;
  await db.insert("posts", post);
  await db.patch(user._id, {num_posts: user.num_posts + 1});
});
```




### [Fauna Query Language (FQL)](https://faunadb-docs.netlify.app/fauna/current/learn/query/)
  - Fauna Query Language (FQL) is a TypeScript-like language for reading/writing data in Fauna.

[FaunaDB](https://faunadb.org/), (now [defunct](https://news.ycombinator.com/item?id=43414742)), was an attempt at building a production-ready distributed database on many of the concepts from the Calvin and deterministic transaction ideas.

### [Calvin](https://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf) style determinstic

TODO.

### [MongoDB](https://www.mongodb.com/docs/manual/core/transactions/) (and [aggregation update](https://www.mongodb.com/docs/manual/tutorial/update-documents-with-aggregation-pipeline/) operators)

### [Transactional memory](https://en.wikipedia.org/wiki/Transactional_memory)

### [Sinfonia](https://dl.acm.org/doi/10.1145/1294261.1294278) (minitransactions)

Sinfonia was a research system that basically asked a question of what is the minimal primitive needed to build useful transactional applications.

### Hackwrench (Dataflow Models)

[Hackwrench](https://cs.nyu.edu/~apanda/assets/papers/hackwrench-vldb23.pdf) is another research project that takes a particular view on the semantics of transactions explicitly as dataflow graphs.

[Morty](https://www.cs.cornell.edu/~matthelb/papers/morty-eurosys23.pdf) is a another project that aims to innovate on concurrency control approaches througuh a similar "re-execution" style approach, but also adopts essentially a bespoke transactional programming model to make this work. It decides on something possibly equally arcane, which is continuation-passing style representation of each transaction. This makes it easy to trace the dataflow and re-execute sub-chunks of the transactions as needed, but is also quite non-standard and is not clear in its mappability to SQL systems.

### [Spanner](https://docs.cloud.google.com/spanner/docs/transactions)
  - Appears that there is actually a special "[mutations](https://docs.cloud.google.com/spanner/docs/modify-mutation-api)" API as well, which are designed for only writing data (?) This is apparently in contrast to [DML](https://docs.cloud.google.com/spanner/docs/dml-tasks) (data manipulation language)
- RethinkDB transactions


viewing transactions largely in terms of their functional inputs/outputs and dataflow seems like a better standardization. There are cases when transactions may do "external" actions based on the results of data inside the transaction, but may not be core use cases.

There is also a question of how much programming language interface for transactions matters and impacts developer usage and adoption. Giving a lower level, one-shot API is conceptually simpler and perhaps easier to implement, but often seems a fundamental impedance mismatch with how developers actually want to write their applications i.e. in terms of standard programming language constructs and control flow.