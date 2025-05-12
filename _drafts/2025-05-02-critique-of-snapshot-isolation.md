---
layout: post
title:  "A Critique of Snapshot Isolation"
categories: databases transactions isolation
---

[*A Critique of Snapshot Isolation*](https://arxiv.org/abs/2405.18393), published in EuroSys 2012, discussed "write-snapshot" isolation, a simple but clever approach to making snapshot isolation serializable. At the highest level, the idea of this paper is that instead of detecting and aborting "write-write" conflicts, as is done in snapshot isolation, it is sufficient to guarantee serializability by instead detecting and preventing "read-write" conflicts. That is, a conflict where one transaction writes concurrently to a key that is read by another concurrent transaction.

## Snapshot Isolation

Classic snapshot isolation ensures each trasnaction observes a consistent snapshot of the database, and prevents conflicting writes by concurrent transactions. There are standard lock-based and lock-free implementations of SI, which rely on assignment of both a "read" and "commit" timestamp to each transaction.

A basic lock-free implementaiton can be done with the use of a centralized *status oracle*, that is responisble for receiving commit requests from transactions and checking for conflicts.

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/lock-free-si.png" alt="Write-snapshot isolation lock-free algorithm" width="450px">
</div>

Essentially, this algorithm checks, for each row modified by a transaction, $$R$$, whether there is temporal overlap with any other transaction on that row i.e. has any other transaction concurrently written to it. If so, the transactino must be aborted. Otherwise, it is assigned a new commit timestamp and allowed to commit, marking each of its modified row with the newly chosen commit timestamp.

## Serializability


> In other words, write-write conflict avoidance of snapshot isolation, besides allowing some histories that are not serializable, unnecessarily lowers the concurrency of transactions by preventing some valid, serializable histories.

## Write Snapshot Isolation

Instead of detecting write-write conflicts of concurrent transactions, as done under classic snapshot isolation, they introduce *write-snapshot isolation*, which instead detects read-write conflicts. That is, if a transaction $$T_1$$ is concurrent with $$T_2$$ and writes a key $$k$$ that $$T_2$$ reads from, this is manifested as conflict and $$T_2$$ must be prevented from committing.

### Read-Only Transactions

They also point out that the simple condition of checking for read-write conflicts is not quite precise enough, and would by default lead to many, potentially unnecessary aborts of read-only transactions.


Theorem 1 establishes that write-snapshot isolation is serializable.


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