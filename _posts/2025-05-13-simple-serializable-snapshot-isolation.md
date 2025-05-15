---
layout: post
title:  "Simple Serializable Snapshot Isolation"
categories: databases transactions isolation
---

In [*A Critique of Snapshot Isolation*](https://arxiv.org/abs/2405.18393), published in EuroSys 2012, they present *write-snapshot isolation*, a simple but clever approach to making snapshot isolation serializable. This work was published a few years after Michael Cahill's original work on [*Serializable Snapshot Isolation*](https://courses.cs.washington.edu/courses/cse444/08au/544M/READING-LIST/fekete-sigmod2008.pdf) (TODS 2009), and around a similar time as the work of Dan Ports on [implementing serializable snapshot isolation](https://dl.acm.org/doi/10.14778/2367502.2367523) (VLDB 2012), which applied Cahill's ideas in PostgreSQL.

At the highest level, the idea of this paper is that instead of detecting and aborting "write-write" conflicts, as is done in [classic snapshot isolation](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/tr-95-51.pdf), it is sufficient to guarantee serializability by instead detecting and preventing "read-write" conflicts. That is, a conflict where one transaction writes to a key that is read by another concurrent transaction. They also show that, at least for some workloads, there is a significant fundamental concurrency/performance impact of this approach vs. snapshot isolation.

## Snapshot Isolation

Classic snapshot isolation ensures that each transaction observes a consistent snapshot of the database, and prevents conflicting writes by concurrent transactions. There are standard lock-based and lock-free implementations of SI, which rely on assignment of both a "read" and "commit" timestamp to each transaction. That is, a centralized *timestamp oracle* is used to assign timestamps for ordering transactions. For a transaction $$T_i$$ with read timestamp  $$T_s(T_i)$$, it will read the latest version of data with commit timestamp $$\delta < T_s(T_i)$$. Two transactions conflict if they (1) write to the same row $$r$$ and (2) they have temporal overlap i.e. their read and commit timestamp spans intersect.

Google's [Percolator system](https://www.usenix.org/legacy/event/osdi10/tech/full_papers/Peng.pdf) implemented a standard lock-based implementation of SI, which adds *lock* and *write* columns, where the *write* column maintains the commit timestamp. It runs a 2PC algorithm that first writes the data and acquires the corresponding locks.
A basic lock-free implementation of snapshot isolation can be done using a centralized oracle, that is responsible for receiving commit requests from all transactions and checking for conflicts.

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/lock-free-si.png" alt="Write-snapshot isolation lock-free algorithm" width="480px">
</div>

This algorithm checks, for each row modified by a transaction, $$R$$, whether there is temporal overlap with any other transaction on that row i.e. has any other transaction concurrently written to it. If so, the transaction must be aborted. Otherwise, it is assigned a new commit timestamp and allowed to commit, marking each of its modified row with the newly chosen commit timestamp.

## Serializability

The paper first examines the question of what role write-write conflicts play in snapshot isolation and serializability. The most standard example of non-serializable snapshot isolation histories are those containing *write skew* anomalies, where transactions don't write to conflicting keys, but may update keys in a way that violates some global constraint.

They note, though, that aborting transactions on write-write conflict is also overly restrictive in some ways i.e. transactions will be aborted in some cases even if no serialization anomaly would manifest. They consider a modified variant of *lost update* anomaly, like

$$
r_1(x) \, \, w_2(x) \, \, w_1(x) \, \, r_2(x) \, \, c_1 \, \, c_2
$$

Standard write-write conflict checks will abort one of these transactions unncessarily, since a lost update anomaly won't actually manifest here.
As they summarize:

> In other words, write-write conflict avoidance of snapshot isolation, besides allowing some histories that are not serializable, unnecessarily lowers the concurrency of transactions by preventing some valid, serializable histories.

## Making Snapshot Isolation Serializable

Instead of detecting write-write conflicts of concurrent transactions, as done under classic snapshot isolation, they introduce *write-snapshot isolation* (WSI), which instead detects and aborts *read-write* conflicts. Essentially, if a transaction $$T_1$$ is concurrent with $$T_2$$ and writes a key $$k$$ that $$T_2$$ reads from, this is manifested as conflict and $$T_2$$ must be prevented from committing. Most importantly, write-snapshot isolation is sufficient to strengthen snapshot isolation to be fully serializable.

<!-- ### Read-Only Transactions -->

They also point out that the simple condition of checking for read-write conflicts is not quite precise enough, and would by default lead to many, potentially unnecessary aborts of read-only transactions. For example, read-only transactions needn't abort, even if they fall into the conflict detection condition for write-snapshot isolation i.e. if someone concurrently wrote into your read set.


They prove that write-snapshot isolation is serializable, by basically showing that you can use commit timestamps of transactions for a serial ordering, and that read-write conflict detection is sufficient to ensure that all transaction reads would be equivalent to those read in a serial history, since they are not allowed to proceed if they conflict with a concurrent write that is into their read set.


They present a lock-free implementation of write-snapshot isolation, which augments the classic SI approach by recording both the read sets $$R_w$$ and writes ets $$R_r$$ of each transaction that is used upon transaction commit at an "oracle".

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/write-si-lock-free-algo" alt="Write-snapshot isolation lock-free algorithm" width="450px">
</div>

This idea is nice since it is mostly the same as write-write conflict detection of SI, just a bit generalized to handle reads as well as writes.

## Performance

Their approach raises the question of how different classic SI is from write-snapshot isolation in terms of histories that are allowed or proscribed. Intuitively, it doesn't seem that there would be something inherently more restrictive about the prevention of read-write conflicts vs. write-write conflicts. 

They compare the concurrency level offered by a centralized, lock-free implementation of write-snapshot isolation with that of [standard snapshot isolation implementation](https://dl.acm.org/doi/10.1109/DSNW.2011.5958809). They implemented both snapshot isolation and write-snapshot isolation in HBase to test this. Overall, they basically test with both normally distributed and zipfian (modeling case where some items are extremely popular) workloads, and find that essentially there is minimal performance difference between the two, at least for these (relatively artificial) workloads.


<!-- ## Comparison with Other Approahces -->

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/eval1.png" alt="Write-snapshot isolation lock-free algorithm" width="810px">
</div>

They find similar results for abort rate comparison between SI and WSI, with the latter being slightly higher, but the overall difference is negligible.

<div style="text-align: center">
<img src="/assets/diagrams/critique-of-si/eval2.png" alt="Write-snapshot isolation lock-free algorithm" width="810px">
</div>


## Concluding Thoughts

Overall, this paper provides a nice perspective on snapshot isolation in general, and a re-consideration of its underlying assumptions. One takeaway for me is a reinforcement of the somewhat arbitrary delineations between isolation levels. For example, I think that snapshot isolation is in some ways intuitive i.e. every transaction reads from a consistent snapshot, but the notion of write-write conflicts seems somewhat arbitrary. This paper kind of sheds light on that by showing that, in some sense, read-write conflicts are actually the more "natural" type of conflict you would care about, at least in the sense that they give you a more fundamental guarantee i.e. serializability. I'm not sure that the specific anomalies allowed under SI (i.e. write skew) are fundamentally intuitive in any way.

<!-- Furthermore, it also helps provide some insight on the question of basically why a set of given transactions as executed by a databases will or will not satisfy serializability. Read-write dependencies seem to capture this more fundamentally. In other words, if a set of transaction execute concurrently, serializability issues arise if there is some way that the execution of those transactions will not be equivalent to executing them sequentially. And, this will only occur when there are some types of dependencies between these transactions. Namely, when one transaction reads from a key that another transaction writes to. Read-write dependencies are the somewhat natural dependency category you care about when considering serializability anomalies (at least at levels with snapshot read guarantees).  -->

Note that in Adya style formalisms and considerations of these type of anomalies, it centers around the notion of *anti-dependencies* and their appearance in cycles (e.g. the [G2 anomaly class](https://jepsen.io/consistency/phenomena/g2)). Adya defines an anti-dependency for a transaction that writes a newer version of a value read by another transaction. Cahill's [work on serializable snapshot isolation](https://dl.acm.org/doi/10.1145/1620585.1620587) builds on [earlier results from Fekete](https://dsf.berkeley.edu/cs286/papers/ssi-tods2005.pdf) (TODS 2005), which showed a result that any non-serializable SI history must contain a cycle with 2 consecutive anti-dependency edges, and furthermore, that each of these edges involves two transactions that are active concurrently. For example, in the classic write skew anomaly, such a cycle exists with  just two transactions, each with a mutual anti-dependency on the other, satisfying Fekete's condition. Cahill's implementation basically tracks `inConflicts` and `outConflicts` for each transaction, which track, respectively, incoming and outgoing $$rw$$ dependencies. This bears similarities to the global approach of checking read-write conflicts between transactions, as done in WSI, but it is done with metadata tracked per-transaction.

<!-- They do note, however, that  -->


<!-- Adya defines anti-dependency for a transaction that writes a newer version of a value read by another transaction. -->
<!-- 
I think it's useful to think about a starting point of something like [RAMP transactions](http://www.bailis.org/papers/ramp-sigmod2014.pdf), which essentially provide snapshot-based reads of classic snapshot isolation, but with no write-write conflicts. Classic SI augements this with write-write conflicts, whereas WSI -->


