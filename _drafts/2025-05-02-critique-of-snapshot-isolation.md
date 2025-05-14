---
layout: post
title:  "A Critique of Snapshot Isolation"
categories: databases transactions isolation
---

[*A Critique of Snapshot Isolation*](https://arxiv.org/abs/2405.18393), published in EuroSys 2012, discussed "write-snapshot" isolation, a simple but clever approach to making snapshot isolation serializable. At the highest level, the idea of this paper is that instead of detecting and aborting "write-write" conflicts, as is done in snapshot isolation, it is sufficient to guarantee serializability by instead detecting and preventing "read-write" conflicts. That is, a conflict where one transaction writes concurrently to a key that is read by another concurrent transaction.

## Snapshot Isolation

Classic snapshot isolation ensures each trasnaction observes a consistent snapshot of the database, and prevents conflicting writes by concurrent transactions. There are standard lock-based and lock-free implementations of SI, which rely on assignment of both a "read" and "commit" timestamp to each transaction. That is, a centralized *timestamp oracle* is used to assign timestamps for ordering transactions. For a transaction $$T_i$$ with read timestamp  $$T_s(T_i)$$, it will read the latest version of data with commit timestamp $$\delta < T_s(T_i)$$. Two transactions conflict if they (1) write to the same row $$r$$ and they have temporal overlap i.e. their read and commit timestamp spans intersect.

Percolator is a standard lock-based implementation of SI, which adds *lock* and *write* columns, where the *write* column maintains the commit timestamp. It runs a 2PC algorithm that first writes the data and acquires the corresponding locks.

A basic lock-free implementation can be done with the use of a centralized *status oracle*, that is responisble for receiving commit requests from transactions and checking for conflicts.

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/lock-free-si.png" alt="Write-snapshot isolation lock-free algorithm" width="450px">
</div>

Essentially, this algorithm checks, for each row modified by a transaction, $$R$$, whether there is temporal overlap with any other transaction on that row i.e. has any other transaction concurrently written to it. If so, the transactino must be aborted. Otherwise, it is assigned a new commit timestamp and allowed to commit, marking each of its modified row with the newly chosen commit timestamp.

## Serializability

The paper starts by examining the question of what role write-write conflict play in snapshot isolation and serializability. The most standard example of non-serializable snapshot isolation histories are those of *write skew*, where transactions don't write to conflicting keys, but both read from a set of keys that the other writes to.

But write-write conflicts also overly restrictive in some ways i..e they will abort transactions in some cases even if an anomly would not manifest. They use the example of *lost update* anomaly, but in a case like

$$
r_1(x) \, \, w_2(x) \, \, w_1(x) \, \, r_2(x) \, \, c_1 \, \, c_2
$$

Write-write conflicts abort one of these transactions, but unncessarily, since a lost update anomaly won't actually manifest here.

As they summarize:

> In other words, write-write conflict avoidance of snapshot isolation, besides allowing some histories that are not serializable, unnecessarily lowers the concurrency of transactions by preventing some valid, serializable histories.

## Write Snapshot Isolation

Instead of detecting write-write conflicts of concurrent transactions, as done under classic snapshot isolation, they introduce *write-snapshot isolation*, which instead detects read-write conflicts. That is, if a transaction $$T_1$$ is concurrent with $$T_2$$ and writes a key $$k$$ that $$T_2$$ reads from, this is manifested as conflict and $$T_2$$ must be prevented from committing. Notably, write-snapshot isolation strengthens snapshot isolation to be fully serializable.

### Read-Only Transactions

They also point out that the simple condition of checking for read-write conflicts is not quite precise enough, and would by default lead to many, potentially unnecessary aborts of read-only transactions. Read-only transactions needn't abort, even if they fall into the conflict detection condition for write-snapshot isolation i.e. if someone concurrently wrote into your read set.


They establish that write-snapshot isolation is serializable, by basically showing that you can use commit timestamps of transactions for a serial ordering, and that read-write conflict detection is sufficient to ensure that all transaction reads would be equivalent to those read in a serial history, since they are not allowed to proceed if they conflict with a concurrent write that is into their read set.


They present a lock-free implementation of write-snapshot isolation, which augments the classic SI approach by recording both the read sets $$R_w$$ and writes ets $$R_r$$ of each transaction that is used upon transaction commit at an "oracle".

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/write-si-lock-free-algo" alt="Write-snapshot isolation lock-free algorithm" width="450px">
</div>


## Performance and Tradeoffs vs. Snapshot Isolation 

It raises the question of how different classic SI is from write-snapshot isolation in terms of histories that are allowed or proscribed. Intuitively, it doesn't seem that there is necessarily something inherently more restrictive than the preventiong of read-write conflicts vs. write-write conflicts. 

They compare the concurrency level offered by a centralized, lock-free implementation of write-snapshot isolation with that of [standard snapshot isolation implementation](https://dl.acm.org/doi/10.1109/DSNW.2011.5958809). Their focus is on two main questions:

1. What is the overhead of checking for read-write conflicts in write-snapshot isolation compared to checking for write-write conflicts in snapshot isolation?

2. What is the level of concurrency offered by write-snapshot isolation compared to that of snapshot isolation?

## Comparison with Other Approahces

Cahill's Serializable Snapshot Isolation, and dependency cyles in Adya-style formalism??