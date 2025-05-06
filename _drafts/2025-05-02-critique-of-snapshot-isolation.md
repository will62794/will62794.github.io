---
layout: post
title:  "A Critique of Snapshot Isolation"
categories: databases transactions isolation
---

[A Critique of Snapshot Isolation](https://arxiv.org/abs/2405.18393), published in EuroSys 2012, discussed "write-snapshot" isolation, a simple but clever approach to making snapshot isolation serializable. At the highest level, the idea of this paper is that instead of detecting and aborting "write-write" conflicts, as is done in snapshot isolation, it is sufficient to guarantee serializability by instead detecting and preventing "read-write" conflicts. That is, a conflict where one transaction writes concurrently to a key that is read by another concurrent transaction.

## Serializability with Write-Snapshot Isolation

Instead of detecting write-write conflicts of concurrent transactions, as done under classic snapshot isolation, they introduce *write-snapshot isolation*, which instead detects read-write conflicts. That is, if a transaction $$T_1$$ is concurrent with $$T_2$$ and writes a key $$k$$ that $$T_2$$ reads from, this is manifested as conflict and $$T_2$$ must be prevented from committing.



### Read-Only Transactions

They also point out that the simple condition of checking for read-write conflicts is not quite precise enough, and would by default lead to many, potentially unnecessary aborts of read-only transactions.

### Lock-Free Implementation

They present a lock-free implementation of write-snapshot isolation, by essentially recording the read sets $$R_w$$ and writes ets $$R_r$$ of each transaction that is used upon transaction commit at an "oracle".

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/write-si-lock-free-algo" alt="Write-snapshot isolation lock-free algorithm" width="450px">
</div>


### Performance and Tradeoffs vs. Snapshot Isolation 

It raises the question of how different classic SI is from write-snapshot isolation in terms of histories that are allowed or proscribed. Intuitively, it doesn't seem that there is necessarily something inherently more restrictive than the preventiong of read-write conflicts vs. write-write conflicts. 