---
layout: post
title:  "Decomposing Transactions in MongoDB"
categories: databases transactions isolation
---

Distributed transactions in MongoDB were developed incrementally, starting at the level of single-node WiredTiger transactions, and building up to single replica set transactions and finally distributed, cross-shard transactions which were first introduced in version 4.2. In the [EOVP framework](https://transactional.blog/blog/2025-decomposing-transactional-systems) recently discussed by Alex Miller, transactions at each layer conform to slightly different classifications within this framework.

## Single Node and Replica Set Transactions

[WiredTiger](https://source.wiredtiger.com/develop/overview.html) is a multi-version (optimistic) concurrency control system that supports snapshot isolated transactions. At a single MongoDB node, transactions are executed against WiredTiger and are ordered based on commit timestamps assigned above the storage layer, and these commit timestamps are used to order transactions in the storage layer. Commit timestamp selection occurs essentially via an "oracle", which at the single node level is effectively an atomic counter. These timestamps are assigned at some point near the start of the transaction, and when a transaction commits, it uses this timestamp to determine its visibility ordering. Validation of concurrency/isolation semantics happens online in these transactions, with write conflicts manifested eagerly at the time the conflict occurs. Similarly, persistence occurs upon commit, which requires a flush to the WiredTiger WAL (?)

Replica set transactions don't really change the underlying picture, since essentially all behaviors are the same except they occur at the primary while a transaction is being executed. Once a transaction commits, it will be written into the oplog and replicated to a secondary, which serves a higher level (consensus level) durability/persistence guarantee.



<div style="text-align: center">
<svg version="1.1" width="37ch" height="95.0px" xmlns="http://www.w3.org/2000/svg">
<defs>
    <style type="text/css">
        @media (prefers-color-scheme: dark) {
            text {
                fill: #eceff4;
            }
            line {
                stroke: #eceff4;
            }
        }
    </style>
</defs>
<text x="6ch" y="31.0px" text-anchor="end" alignment-baseline="middle"></text>
<line x1="10ch" y1="59.0px" x2="10ch" y2="3.0px" stroke="black"></line>
<line x1="14ch" y1="21px" x2="23ch" y2="21px" stroke="black"></line>
<line x1="14ch" y1="13px" x2="14ch" y2="29px" stroke="black"></line>
<line x1="23ch" y1="13px" x2="23ch" y2="29px" stroke="black"></line>
<text x="18.5ch" y="15px" text-anchor="middle" alignment-baseline="baseline">Validate</text>
<line x1="14ch" y1="51px" x2="23ch" y2="51px" stroke="black"></line>
<line x1="14ch" y1="43px" x2="14ch" y2="59px" stroke="black"></line>
<line x1="23ch" y1="43px" x2="23ch" y2="59px" stroke="black"></line>
<text x="18.5ch" y="45px" text-anchor="middle" alignment-baseline="baseline">Execute</text>
<line x1="27ch" y1="21px" x2="36ch" y2="21px" stroke="black"></line>
<line x1="27ch" y1="13px" x2="27ch" y2="29px" stroke="black"></line>
<line x1="36ch" y1="13px" x2="36ch" y2="29px" stroke="black"></line>
<text x="31.5ch" y="15px" text-anchor="middle" alignment-baseline="baseline">Order</text>
<line x1="27ch" y1="51px" x2="36ch" y2="51px" stroke="black"></line>
<line x1="27ch" y1="43px" x2="27ch" y2="59px" stroke="black"></line>
<line x1="36ch" y1="43px" x2="36ch" y2="59px" stroke="black"></line>
<text x="31.5ch" y="45px" text-anchor="middle" alignment-baseline="baseline">Persist</text>
</svg>
</div>

<!-- 

[
Actor: Validate A
Actor: Execute B
]
[
Actor: END A
Actor: END B
]

[
Actor: Order C
Actor: Persist D
]
[
Actor: END C
Actor: END D
]

-->




## Distributed, Cross-Shard Transactions

Distributed transactions in MongoDB generalize a few of the components in the lower level transaction models e.g. validation and execution essentially occur concurrently, and for mostly the same windows of time. As a transaction proceeds in its *execution* phase, its operations are routed to the appropriate shards that own keys for the data being read/written, and *validation* occurs online, at each shard. In particular, this involves checking of write-write conflicts per SI requirements and also *prepare* conflicts, which are manifested in MongoDB as a way to ensure that concurrent transactions become visible atomically across shards. 

Once a transaction is ready to commit, it initiates a variant of two-phase commit, which conducts the main sections of the *ordering* and *persistence* phases for the transaction. Commit timestamp selection for distributed transactions in MongoDB is a partially distributed process, since there is no centralized timestamp oracle. That is, during the prepare phase, the transaction coordinator will collect prepare timestamps from each shard participating in the transaction, and a commit timestamp is then computed as some timestamps $$\geq$$ the maximum of these prepare timestamps. This serves as a way to guarantee monotonicity of commit timestamps between dependent transactions across shards, without requiring a centralized timestamp oracle. Once this commit timestamp is computed, determining visibility ordering, the transaction can commit at each shard, making its commit record durable/persistent within a replica set and becoming visible to other transactions.

TODO: Read timestamp chosen upfront also plays a part in ordering, as mentioned by Marc and Alex.