---
layout: post
title:  "Git for Transactions"
categories: databases transactions isolation
---

The design space of weakly consistent data storage systems has been explored thoroughly. Generally, one approach is to define some reasonable isolation or consistency level that is suitably applicable to a wide enough range of applicatinos, or allow the application to tune the consistency level to their specific needs. 

An alternate approach, though, is to re-examine the applicatino level requirements we really want out of weakly consistent systems. In general, stronly consistent systems try to offer a sequential (e.g. linearizable/serializable) data store as the fundamental abstration to a client. Alternaatively, weakly consistent systems do not provide such a clean abstrat, and one perspective is to lean into this, abandoning the strictly sequential view of storage, and expose this flexibility to users. This is the approach explored in [TARDiS](https://www.cs.cornell.edu/~youerpu/papers/2016-sigmod-tardis.pdf), a concurrency control approach of  transactional data systems that essentially throws out the sequential data store model, and instead adopts weak consistency by making explicit a notion of *branch and merge* concurreny model. That is, adopting a Git-lik model of transactions, where new transactions may fork off into new, isolated branches, and periodically "merge" back into a "main" branch of transactional history.

Essentially, TARDIS adopts a view of transactional isolation in the style of Git i.e. at the start of a transaction a user forks off history onto their own local branch, and are able to perform reads and writes in isolation on this branch. When they have completed their operations, they can go ahead and "merge" back their changes into a main branch of history. 
TARIDS leaves this merging task to the application, rather than to the underlying storage layer.

## Branch and Merge Transactions

TARDIS is a transational key-value store that tracks conflicting execution branches with 3 mechanisms: 

- branch on conflict
- inter-branch isolation
- application-specific merge

In a standard transactional data store, we can imagine that the entire system consists of a single, linear history. As transactions commit, the effects of their write operations are applied to the latest state in this linear history, and new transactions may read from some state in this history (e.g. from either the latest state or some historical snapshot). The TARDiS model breaks this model and instead includes an explicit notion of branching into their fundamnetal data store abstraction. That is, when users are executing transactions, they may can do so in a *single mode*, which means they are executing their transactions against a chosen branch. As in Git, this branch is conceptually isolated from concurrent transactions, so can be viewed conceptually as a linear/sequential thread of history by an application.

### Begin and Commit

In this model, there are a few natural behavioral changes within the transaction lifecylce. First, when a transaction begins, it is not obvious where the transaction will "start from", since there is no longer a global, sequential data storage history. So, it first needs some strategy for selecting a branch to being execution against i.e. which state in the history DAG it will begin from i.e. its *read state*.

<div style="text-align: center;">
  <img src="/assets/git-for-txns/tardis-branching.png" alt="TARDiS Model" width="500">
</div>

There is also the notion of *begin* and *commit constraints*, which are additional conditions on start and commit that place extra validity conditions on a transaction, allowing a user more control over the degree of local branching. 

<div style="text-align: center;">
  <img src="/assets/git-for-txns/begin-commit-constraints.png" alt="TARDiS Model" width="400">
</div>



For example, there is a way for users to explicitly specify a *serializability* constraint, which requires tracking of read and write sets of transactions on a branch. There are also constraints for ensuring *snapshot isolation*, etc.


### Merging

To make the concept of branch merging explicit, TARDiS includes a concept of *merge transactions*. Conceptually, these can be viewed as similar to standard transactions in *single mode*, except that they may operate on multiple *read states* (i.e. multiple branches). These merge transactions are also a bit special in that they are given access to additional structure about the global state DAG, most notably

- *Fork Points*: the fork point in the history between the set of states being merged
- *Conflict Writes*: the set of conflicting writes that occurred on the set of branches being merged.

## Related Thoughts

It is interesting to note how these days echo the ideas that came just a bit later, in Crooks work on [state-based ioslation formalism](https://www.cs.cornell.edu/lorenzo/papers/Crooks17Seeing.pdf), which appeared in PODC 2017. It seems fairly clear that related ideas were present in this work, and the similar ideas were being developed concurrently. For example, the notions of *read states* and *begin constraints* appear quite analogous to the "read state" and "commit test" concepts in the client-centric formulation. In general, both papers seem to share a common conceptual core of viewing transactional isolation models as centered around *state-centric histories* i.e. the database moves through a sequence of states over time, and new transactions may conceptually read from one of these states, and upon commit may create a new state, appending to this history.

Overall, I find the TARDiS approach a fascinating attempt at an alternative approach to managing weakly consistent data interfaces in a more principled manner. On the flip side, though, my intuition is that managing and merging these branches in a complex application would become highly burdensome and unintuitive for most application developers. For software and systems builders, and those familiar with Git, DAGs, etc. this may be more palatable, but even in Git I find that it is rare I have ever dealt with merging of more than a 1-2 branches at a time. Perhaps this type of system, though, would be effective as a slightly more internal layer, that other tools/apps could build on top of, rather than having users directly interface with it themselves. Regardless, I think the ideas in the paper are productive and useful as an alternative model for conceptualizing transactions in general and especially weak consistency or isolation models.