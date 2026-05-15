---
layout: post
title:  "Transaction Execution from the Ground Up"
categories: databases transactions programming
---

Databases are responsible for processing a set of incoming transactions and executing them under some specified isolation level and/or concurrency control mechanism. There are different approches to doing this, including OCC vs. 2PL, and in the research community techniques like Calvin, etc. 

Let's consider transaction processing as a conceptual problem of executing a sequence of read and write operations from within a transaction correctly, where correctness is defined against some isolation level guarantees that we need to provide. 

There is a simplifying first model that makes this problem quite easy. If we want to run transactions concurrently, it may be the case that they do some operations that will violate isolation level guarantees without consideration. In this case, we need to do something to remedy this e.g. by aborting some set of transactions. 

Alternatively, we can consider forcibly ensuring an execution that abides by the isolation level guarantees. If we knew all transactions upfront, the simplest way to do this could be to statically schedule transactions in a way that satisfies the isolation level guarantees. In practice, we mostly assume that transaction operations are processed in an *online* manner, so we only learn about all keys written or read by a transaction dynamically at runtime. In this case, statically scheduling is not possible, since we can't predict the future. So, we can adopt locking (as in 2PL) to solve this.  

Locks are effectively making a reservation on a key for a window of time i.e. saying that once I acquire it, I am sure that any other concurrent transaction will be forced to execute logically after me when it accesses that key. From a safety perspective this is OK, but key accesses in opposite orders by concurrent transactions can lead to deadlocks, since both transactions will end up waiting on each other for key lock acquisitions. This is basically a failure of the serialization mechanism, where 