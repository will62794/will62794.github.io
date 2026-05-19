---
layout: post
title:  "Transactional Programming Interfaces"
categories: databases transactions programming
---

Transactions are a defining historical feature of database systems, but have often developed in a lineage somewhat distinct from the programming language community, with ad hoc exchange of ideas between both. This is perhaps also affected by the fact that transactional programming is traditionally not a common feature of most mainstream programming languages, whereas for databases it has been more or less assumed as table stakes. The use of [transactional memory abstractions](https://en.wikipedia.org/wiki/Software_transactional_memory) is a somewhat well explored research area, but is still an esoteric feature for mainstream programming language environments. Thus, the world of transactional programming interfaces is quite diverse, and offers interesting possibilites for performance and correctness considerations in database systems. There also seems to be lack of convergence on accepted interfaces here, with proliferation of different, often system or domain-specific approaches.



## Programming with Transactions

<!-- One key tradeoffs in transactional programming models is the "interactive" vs. "one-shot" or "batch" models. The former being naturally the more intuitive and natural way of programming with transactions for a user, but one-shot transactions potentially simplifying concurrency control mechanisms and/or boosting performance and cutting down round-trip latency between the client and server. -->

If we look at transactions from a programming language perspective, rather than database or execution oriented perspective (e.g. a transaction that executes over many round trip interactions with a server), we can consider host of different models. Note that some of these catgeorizations are in terms of the *system* that introduced or uses them rather than the language or technique itself. But, it's often that each system will introduce a somewhat custom-tailored or opinionated programming model, so it's useful to look at both underlying models and dominant systems (Spanner, DynamoDB, etc.)


### SQL

SQL is probably the most classic and widely used transactional programming interface, as it is the de facto standard for interacting with most classic relational database systems. Running a simple interactive style transaction in SQL might look like the following:

```sql
BEGIN TRANSACTION;

-- Deduct $150 from Account A
UPDATE Accounts
SET Balance = Balance - 150
WHERE AccountID = 'A';

-- Add $150 to Account B
UPDATE Accounts
SET Balance = Balance + 150
WHERE AccountID = 'B';

-- Commit the transaction if both operations succeed
COMMIT;
```

[PL/SQL](https://www.geeksforgeeks.org/sql/pl-sql-transactions/) embeds standard sequential/imperative programming constructs into SQL. It extends classic SQL with loops, conditionals, error handling, and allows for transactions to be expressed in a *stored procedure* style. A simple stored procedure might look like the following:

```sql
DECLARE
     -- taking input for variable a
     a integer := &a ; 
      
     -- taking input for variable b
     b integer := &b ; 
     c integer ;
  BEGIN
     c := a + b ;
  END;
```

### Spanner

Like BigTable, writes in [Spanner](https://docs.cloud.google.com/spanner/docs/transactions) that occur in a read-write transaction are buffered at the client until commit, so reads will not observe the effects of the transaction's writes. Modern versions of Spanner also support a *[mutations](https://docs.cloud.google.com/spanner/docs/modify-mutation-api)* API, which is dedicated for writing data within transactions. They also include a dedicated language for manipulating data, [DML](https://docs.cloud.google.com/spanner/docs/dml-tasks). 



### DynamoDB

<a name="dynamodb"></a>

DynamoDB is a key-value store that somewhat recently [added support for transactions](https://www.usenix.org/system/files/atc23-idziorek.pdf) (USENIX ATC 2023).  They essentially adopt a truly "one-shot" model, which comes with some pros and cons.
All transactions submitted as single request, using either a `TransactWriteItems` or `TransactGetItems` command. The general model of DynamoDB is basically a flat KV store, and you can set or update keys on a given table. A write-transaction can include, `PutItem`, `UpdateItem`, or `DeleteItem` as basic operations.

<div style="justify-content:center; gap:20px; padding-bottom:17px;">
  <img src="/assets/aws-dynamodb-1.png" alt="transactions programming models diagram" style="width:400px;" />
  <img src="/assets/aws-dynamodb-txn-api.png" alt="transactions programming models diagram" style="width:300px;" />
</div>


<img src="/assets/aws-dynamodb-ex.png" alt="transactions programming models diagram" style="width:680px;display:block;margin:auto;padding-bottom:17px;" />


### Calvin

[Calvin](https://dl.acm.org/doi/10.1145/2213836.2213838) (SIGMOD 2012) was not directly a proposal for a transactional programming model itself, but relied on some core assumptions about the underlying model to make its key ideas work. In particular, it made assumptions that transactions were expressed as C++ functions that access data using a basic CRUD interface. This facilitates analysis of a transaction's full static read/write sets for deterministic scheduling and conflict avoidance. Transactions that must perform reads in order to determine their full read/write sets are not natively supported, but they can kind of work around this with *reconnaissance queries*, that run a first round of reads to determine these sets. The important aspect here, though, is the strong assumption on static read/write set analysis, which is often not easy in practice for transactions normally written in a dynamic/interactive approach.

### Fauna Query Language (FQL)

[FaunaDB](https://faunadb.org/), (now [defunct](https://news.ycombinator.com/item?id=43414742)), was an attempt at building a production-ready distributed database on many of the concepts from the Calvin and deterministic transaction ideas. The [Fauna Query Language ](https://faunadb-docs.netlify.app/fauna/current/learn/query/)(FQL) was a proprietary, TypeScript-like language they developed for reading/writing data in Fauna.


### Aurora DSQL

Amazon [Aurora DSQL](https://aws.amazon.com/blogs/database/everything-you-dont-need-to-know-about-amazon-aurora-dsql-part-3-transaction-processing/) is a serverless, distributed, transactional database system that was made generally available by AWS in 2025. 

They note the following about their transactional programming model and query processing engine:

> When write operations occur, the QP stores the results of these database changes locally, effectively spooling the writes throughout the transaction’s duration. In the event of a rollback or any disconnect, the QP discards the spooled writes.



<img src="/assets/dsql-read-write-arch.png" alt="transactions programming models diagram" style="width:550px;display:block;margin:auto;padding-bottom:17px;" />

This seems more similar to original Spanner read-write transactions, which buffered all writes at the client before submitting them to the server. 



### MongoDB

For several years MongoDB has provided [multi-document transactions](https://www.mongodb.com/docs/manual/core/transactions/) that run at up to snapshot isolation. MongoDB provides a fairly standard, imperative style interface for programming with transactions, since transactional operations are expressed as standard CRUD queries within existing driver programming interfaces. So, this leads to a slightly more natural mapping to standard programming language constructs and control flow. 

```javascript
// Start transaction.
session.startTransaction();

db.collection.find({ _id: "123" })

// Update document.
db.collection.updateOne(
  { _id: "123" },
  { $set: { name: "John" } }
)

// Commit transaction.
session.commitTransaction();
```
There are also a few subtle interface choices one can make when programming in this manner, in particular with regards to how updates are expressed. For example, in general, you have access to the full feature set of the host programming language, and so could express updates in any way you might express mutation in that language. Alternatively, you can also represent updates more "natively" using MongoDB specific [update operators](https://www.mongodb.com/docs/manual/reference/mql/update/). This encodes the full semantic content of the update to the database in a more explicit way.


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





### Transactional Memory

Software Transactional Memory, originally [explored](https://www.microsoft.com/en-us/research/publication/beautiful-concurrency/) in the context of Haskell, was an attempt to provide a concurrent programming model that avoided the use of locks. This essentially provides an optimistic like transactional concurrency control mechanism within a standard programming language environment. There have also been experimental attempts at integrating these techniques into other programming languages e.g. in [Python](https://dl.acm.org/doi/abs/10.1145/3359619.3359747). None of these appear mainstream, though.

### Sinfonia

[Sinfonia](https://dl.acm.org/doi/10.1145/1294261.1294278) (SOSP 2007) was a research system that basically asked a question of what is the minimal primitive needed to build useful transactional applications. The ideas was to provide a single, *minitransaction* primitive on which to build more complex transactional applications or components. Essentially, this provides atomic access and conditional modifications at multiple memory nodes. It consists simply of a set of *compare items*, *read items*, and *write items*. Upon execution, if any comparison items fail to match the values specified, the transactions fails and aborts. 

<img src="/assets/sinfonia-minitxns.png" alt="transactions programming models diagram" style="width:460px;display:block;margin:auto;padding-bottom:17px;" />

These ideas are actually quite similar to the modern form of transactions implemented in [DynamoDB](#dynamodb). It assumes the kind of low-level but sufficiently expressive primitive approach for building simple but scalable transaction systems. I'm not sure how ergonomic this interface is for developers, though, and what type of applications are willing to drop down to this lower level abstraction in practice. On the other hand, perhaps there are better programming interfaces/models that can be built on top of this, with tools for translation into these lower level primitive operations.


### Dataflow Models

There are a subset of research projects that take a similar, dataflow-oriented perspective on representing transactions. [Hackwrench](https://cs.nyu.edu/~apanda/assets/papers/hackwrench-vldb23.pdf) is a recent project that takes a particular view on the semantics of transactions explicitly as dataflow graphs. [Morty](https://www.cs.cornell.edu/~matthelb/papers/morty-eurosys23.pdf) is a another project that aims to innovate on concurrency control approaches througuh a similar "re-execution" style approach, but also adopts essentially a bespoke transactional programming model to make this work. It decides on something possibly equally arcane, which is continuation-passing style representation of each transaction. This makes it easy to trace the dataflow and re-execute sub-chunks of the transactions as needed, but is also quite non-standard and is not clear in its mappability to SQL systems.

<!-- viewing transactions largely in terms of their functional inputs/outputs and dataflow seems like a better standardization. There are cases when transactions may do "external" actions based on the results of data inside the transaction, but may not be core use cases. -->

## Unified Perspective

A lot of these techniques and systems take quite a specific perspective on how to model and program transactions. 
In the most abstract view, though, we can in some sense view transactions as *functions* that operate over database state i.e. they transform the database from one *input* state to another *output* state. The way in which these functions are expressed is the more pertinent and interesting question, with the approaches above taking varying levels of perpsectives on this. There seems to be a reasonable abstraction of transactions that essentially still follows teh functional view, but rather breaks down the overall transaction function into a series of common sub-components. In the *read phase* we have a function $$f_R$$ that takes in the current database state and returns both a set of new keys to be read $$f_R'$$, a set of keys to be written $$f_W$$, along with the associated values that need to be fed in to those writes. In the write phase, we can imagine we have functions $f_W$ that take in the current set of values produced from $$f_R$$ and output the database state produced by applying these transformation functions on each relevant key.


There is also a question of how much programming language interface for transactions matters and impacts developer usage and adoption. Giving a lower level, one-shot API is conceptually simpler and perhaps easier to implement, but often seems a fundamental impedance mismatch with how developers actually want to write their applications i.e. in terms of standard programming language constructs and control flow.
