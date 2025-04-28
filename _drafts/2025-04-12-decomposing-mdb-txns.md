---
layout: post
title:  "Decomposing Transactions in MongoDB"
categories: databases transactions isolation
---

## Single Node WiredTiger Transactions

WiredTiger is a multi-version (optimistic) concurrency control system that supports snapshot isolated transactions. In MongoDB, at a single node, these transactions are ordered based on timestamps assigned above the storage layer, and these commit timestamps are used to order transactions in the storage layer. Commit timestamps selection occurs essentially via an "oracle", which at the single node level is effectively an atomic counter. These timestamps are assigned at some point near the start of the transaction, and when a transaction commits, it uses this timestamp to determine its visibility ordering. Validation of concurrency/isolation semantics happens online in these transactions, with write conflicts manifested eagerly at the time the conflict occurs. Similarly, persistence occurs upon commit, which requires a flush to the WiredTiger WAL (?)

## Single Replica Set Transactions

Single replica set transactions don't really change the underlying picture, since essentially all behaviors are the same except they occur at the primary while a transaction is being executed. Once a transaction commits, it will be written into the oplog and replicated to a secondary, which serves a higher level durability/persistence guarantee. 

## Distributed, Cross-Shard Transactions

Distributed transactions generalize a few of the components in the lower level transaction models e.g. validation and execution essentialyl occurr concurrently, and for mostly the same windows of time. Once a transaction is ready to commit, it initiates a 2PC process, which conducts the ordering and persistence aspects for the transaction. Commit timestamp selection in MongoDB transactinos is essentially a partially distributed process, since there is no centralized timestamp oracle, but prepare phase serves as a decentralized timestamp reservation mechanism. 