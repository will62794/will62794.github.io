---
layout: post
title:  "Modeling the Isolation Permissiveness Frontier"
categories: databases transactions programming
---

If we want to formalize and compare concurrency control algorithms for different transaction isolation levels, we can analyze them at a coarse level by what isolation guarantee they provide. From a more fine-grained perspective, though, this may not be sufficient to adequately capture the subtle differences between algorithms that provide the same isolation guarantees, or provide guarantees with different approaches.

<div align="center">
  <img width="450px" src="/assets/isolation_pareto_frontier (3).png" alt="Pareto frontier diagram" style="border:2px solid #aaa; padding:12px; display:inline-block; border-radius:10px;" />
  <div style="margin-top:8px; color:#666; font-size:15px;"><em>Abstract sketch of isolation techniques on an isolation-permissiveness frontier. Formal relationships between some algorithms are hard to establish.</em></div>
</div>


We can try to do this through the lens of transactional *permissiveness*. We've touched upon this idea briefly in prior work [[1](https://www.mongodb.com/company/blog/engineering/formal-methods-beyond-correctness-isolation-permissiveness-distributed-transactions),[2](https://dl.acm.org/doi/10.14778/3750601.3750626)], but we can explore how to model and check this property in a bit more depth. This also illustrates a formal modeling use case that extends beyond just binary safety or correctness verification, but allows us to measure quantitative protocol properties more precisely.

We can pursue this analysis by examining different concrete algorithms for achieving isolation levels and comparing them formally along both a correctness and permissiveness frontier. That is, permissiveness in this sense gives us a lightweight way to consider isolation algorithms not only on their correctness metrics but whether they achieve that goal through an overly restrictive approach or not. We can concretely examine different, optimistic concurrency control techniques for providing serializability, as well as classic approach to snapshot isolation. Approximating a permissiveness metric in a quantitiatve way also lets us examine given algorithms on a "correctness vs. performance" frontier.

## Permissiveness Modeling

In general, we can consider the *permissiveness* of a transactional isolation algorithm as a quantitative metric defined over the algorithm's (potentially infinite) set of reachable behaviors. So, it seems challenging to define and compute such a metric concretely, but we can try to use finite modeling techniques to at least gain an approximation of it, and also check that the results match our intuitions.

As a starting point, we can take a formal, TLA+ specification of a given transaction isolation algorithm and use a model checker for exhaustively exploring its reachable behaviors. 

For isolation algorithms, we can view them all as generators of histories, which are then projected down to a set fo committed transactional histories.


We compute this metric by taking the TLC model checker and modifying it slightly. In particular, TLC by default will hash states into *state fingerprints* as they are explored, and stored these fingerprints in a hash table, as it executes a breadth-first search over the state graph. For our use case, we can use these hashes in a modified way to compute the total number of unique transactional histories as we go. That is, by essentially hashing just the *ops* state variable for each reachable state independently, and tracking this in its own "projected" state space hash set. We then use the final cardinality of this set to as our raw computed permissiveness metric for that algorithm.


## Examining OCC Algorithms

For optimistic concurrency control algorithms, we can use a formal specification that is quite abstract, but still lets us probe the behaviors of several different algorithms. Concretely, we can imagine an abstract model of this family of algorithms as a setting where each transaction can either *Begin*, *Commit* or *Execute*, and we operate over a fixed, finite set of transaction ids, and keys. The *Begin* and *Commit* actions are straightforward, and the *Execute* action is important as it chooses a fixed set of keys to read and set of keys to write, atomically. 

This approach is actually able to capture a relatively wide variety of optimistic concurrency control algorithms that complete validation on commit (e.g. not eargerly upon first conflict). That is, for algorithms that execute against a snapshot, while they are executing, other concurrent transactions don't affect their possible behavior, and their commit validation decision is dependent only on the set of keys they read or wrote (and when the transaction started). So, this helps provide a tractable formal model of transaction execution while still being general enough to capture a variety of algorithms. More abstractly, we can think about most algorithmic behavior here as being depending not necessarily on the actualy keys or values read or written, but in the conflict patterns that occur between transactions. That is, for the dynamics of a concurrency control algorithm, the specific read and write sets of each transaction are not necessarily important, but rather the pattern of conflict edges between each pairwise set of transactions, since this is what determines whether a transaction commits or not.

We can start our permissiveness analysis by looking at a finite configuration of our above transactions model containing 4 transactions, 3 keys, and a maximum of 3 operations executed per transaction. We then measure permissiveness across the set of algorithms below, some at serializability and others at snapshot isolation. 

- Read Committed (RC)
- Serializable Snapshot Isolation (SSI)
- Write Snapshot Isolation (WSI)
- Snapshot Isolation (SI)

<div style="text-align: center;">
  <img width="600px" src="/assets/permissiveness_by_isolation.png" alt="Pareto frontier diagram" />
</div>

An interesting observation here is that we would naturally expect snapshot isolation to be "northwest" of any serializable algorithm. That is, it should be natural that any serializable algorithm will not be *more* permissive than snapshot isolation. Similarly, within the space of serializable algorithms, we can look at the different algorithms relationship to each other. The SSI and WSI .


It is also useful to explore to what extent these metrics are stable across varying finite configuration parameter sizes.

## Workload Dependence

This doesn't quite tell us the whole picture, though, since permissiveness is a nice metric in some ways but, for example, when algorithms are not strictly subsets of each other, it is harder to get a sense of how the permissiveness metric is effectively "distributed across behaviors".
That is, more practically, we may often care about the *workload-dependent* permissiveness properties of these algorithms. 
<!-- So, we can also examine workload-specific permissiveness i.e. permissiveness under certain assumptions on the operations that occur in transactions.  -->

One concrete version of this is to consider measuring across permissiveness different read/write ratios, as we might do in a typical microbenchmarking setup. Even though our formal model is quite abstract, we can try doing this by looking at two different read/write ratios by having each transaction skew 1/3 of its operations to reads or 1/3 of its operations to writes. This gives us curves to examine and see how the permissiveness dynamics differ under the assumption of skewed read/write workloads.

<div style="text-align: center;">
  <img width="600px" src="/assets/permissiveness_by_workload.png" alt="Pareto frontier diagram" />
</div>

We can observe that, as expected, snapshot isolation's permissiveness is still higher than SSI regardless of read/write skew. This makes sense since SSI uses a strictly stronger commit validation check, as it layers [*dangerous structure* detection](https://dl.acm.org/doi/10.1145/1620585.1620587) on top of existing snapshot isolation systems. It is clear, though, that SI obviously performs better from a permissiveness standpoint under read-heavy workloads. Interestingly, WSI, which only aborts on read-write transactions, has a similar inverted pattern, and its permissiveness is not significantly different from SI under read-heavy workloads.


## Related Work

The above is a nice way to use model checking and simulation tools to examine quantitative properties of transaction concurrency control algorithms. Often examining only binary notions of safety or liveness are not sufficient to adequately compare algorithmic beahviors at a finer-grained level. Moreover, this approach helps us understand concretely where an approach lies on the optimality frontier, and whether different changes can help us move closer to this frontier. In essence, this can be seen as a kind of very high fidelty and rigorous simulation, but one with maximum controllability and observability over the fundamental algorithmic characteristics. 

Building more efficient checking techniques for these types of properties remains an interesting open question and future topic to explore e.g. we are still limited to analyses at relatively tiny model sizes. We believe such approaches may have similarities to other, recent techniques for [checking quantitative hyperproperties](https://arxiv.org/abs/1905.13514), which are similar in that they aim to capture quantitative metrics over a protocol's entire set of reachable states. The theoretical literature on [permissiveness in transactional memory systems](https://infoscience.epfl.ch/server/api/core/bitstreams/a83c2ef3-e03d-4016-b362-4c8b624f6830/content) may also provide inspiration.

There is also work such as the [Serial Safety Net](https://dl.acm.org/doi/10.1145/2771937.2771949) is another prior example of addressing informally the concept of transactional performance and correctness tradeoffs. They don't explicitly formalize a permissiveness notion, but consider different algorithms within a similar framework.



<!-- 
 
Serializable:

- Serializable Snapshot Isolation (SSI)
- Precisely serializable snapshot isolation (PSSI)
- 2PL
- Write Snapshot Isolation
- Write Snapshot Isolation w/o read-only optimization
- Snapshot Isolation with SELECT FOR UPDATE
- Snapshot Isolation
- Snapshot Isolation w/ blind write optimization
- Read Committed

It is also worth examining how we might consider the theoretical question of whether such a quantitative protocol property is well-defined over an infinite state protocol. It would seem challenging to compute such a value, but we can consider trying to approximate it with simulation data.

Note that this approximation of permissivness also represents a metric essentially over all possible workloads. We can also consider cases where we effectively skew workloads in some ways e.g. write-heavy or read-heavy workloads.



Pareto frontier diagram -->