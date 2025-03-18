---
layout: post
title:  "On Models of Transaction Isolation"
categories: formal-methods specification
---

Transaction isolation is a messy topic with a lot of history. It seemed to start out messy, and it is not always clear if every attempt to clarify things really helps the problem or just adds more notation, new concepts to the domain. The rise of distributed systems and the need to reason about isolation in these contexts has worsened the problem over the past decade or so.

One thing that is relatively clear is that in order to say anything precise about transaction isolation, we need some formal model in which to reason about it. 

The tricky thing, though, is that even if we want to reason formally about transaction isolation, there are a host of different formalisms that all approach the problem from subtly different angles, with different goals, notation, frameworks, etc.

Any transaction isolation model can basically be viewed as a condition over a set of committed transactions. That is, given some set of transactions that were committed by a database, these transactions either satisfy a given isolation level or not, based on the (read/write) operations present in each of these transactions.

Note that isolation really only makes sense to define with respect to how *reads observe database state*. If we have a set of transactions that only perform writes, we might intuitively have some notion of a correctness for a database executing these transactions, but we such definitions really don't mean anything unless we have some type of read operation that occurs to observe the effect of other transaction's writes. So, we could say that transaction isolation should really fundamentally be related to **conditions on the possible set of values that any transaction can read/observe**. 

There are two notable, modern models of transaction isolation that try to capture some of this intuition formally: [Crooks 2017 client-centric model](https://dl.acm.org/doi/10.1145/3087801.3087802), and also the slightly earlier [2015 model of Cerone et al.](https://drops.dagstuhl.de/storage/00lipics/lipics-vol042-concur2015/LIPIcs.CONCUR.2015.58/LIPIcs.CONCUR.2015.58.pdf). 

If we consider transaction isolation under the above intuitive view, then when we think about how to define an isolation level, we should really be thinking about how we define *what values a transaction can read*. If our isolation level makes no restrictions, then a transaction can read any value (in practice what a level like *read uncommitted* may give you). But, more sensibly, we would expect a transaction to read states that are *reasonable*, in some sense. More concretely, we should expect that transactions actually read values written by other transactions! This could, in fact, be on possible isolation definition, that is extremely weak, but stronger than allowing transactions to read *any* value. 

There are some other reasonable constraints, though. Basically, we *probably* expect that the possible states we read from came about through some "reasonable" execution of the transactions we gave to the database. One "reasonable" type of execution would be to execute these transactions in some sequential order. This is, for example, what we would expect out of a database system if we gave it a series of transactions one-by-one, with no concurrent overlapping between transactions.

The Cerone paper simply takes the simplyifying assumption of *atomic visibility*, which is simply that either all or none of the operations of a transaction can become visible to other transactions. This means that their model essentially cannot represent isolation notions like *read committed*, which is weaker than the weakest model they represent, *read atomic*. The *read atomic* model is basically defined by saying 

The read atomic model was actually first introduced in [Bailis' 2014 paper](http://www.bailis.org/papers/ramp-sigmod2014.pdf) on RAMP transactions. Note that Read Atomic is something similar to Snapshot Isolation but with an allowance for concurrent updates (e.g. allows write-write conflicts). This was preceded by their earlier proposal of [*monotonic atomic view*](https://www.vldb.org/pvldb/vol7/p181-bailis.pdf) which is strictly weaker than Read Atomic.

Also, *why* does snapshot isolation actually need to enforce write-write conflict checking? If it didn't, how would this be observable to other transaction reads?

```
t1: r(x,init) w(y,1) w(z, 1)
t2: r(x,init) w(z,2) w(y, 2)
```

If you don't prevent a certain anomaly, is the effect of this anomaly actually observable to the reads of any other transactions?

Do we actually care about how writes are abitrated between concurrent/conflicting transactions?

what if both transactions were allowed to commit? How do we arbitrate between them?

It seems that certain anomalies, like "Lost Updates", are really only representable/observable if you include in your transactions model the ability of a write inside a transaction to use some value previously read within the transaction i.e. having a first-class semantic notion of an "update".


### Adya's formalism 

I would argue that Adya style formalization perhaps moved slightly in the right direction, but ultimately still strayed far from any intuitive notion of how a user or client might being to understand or reason about an isolation level.

But, I also somewhat disagree with Crooks' assertion that the client-centric model is:

> the first to specify isolation without relying on some notion of history.

since I feel the notion of a history (i.e. an ordering of transactions) is still quite central to the client-centric model, but it avoids the complexities and unintuitive details around partial ordered events and serialization graphs.