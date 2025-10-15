---
layout: post
title:  "Git for Transactions"
categories: databases transactions isolation
---

The design space of weakly consistent data storage systems has been explored thoroughly. Generally, one approach is to define some reasonable isolation or consistency level that is [applicable to a wide enough range of applications](http://www.bailis.org/papers/ramp-sigmod2014.pdf), or allow the application to [tune the consistency level](https://learn.microsoft.com/en-us/azure/cosmos-db/consistency-levels) to their specific needs. An alternate approach is to re-examine the application level requirements we really want out of weakly consistent systems. In general, strongly consistent systems try to offer a sequential (e.g. linearizable/serializable) data store as the fundamental abstraction to a client. Alternatively, weakly consistent systems do not provide such a clean abstraction. One perspective is to lean into this, abandoning the strictly sequential view of storage, and expose this flexibility to users. This is the approach explored in [TARDiS](https://www.cs.cornell.edu/~youerpu/papers/2016-sigmod-tardis.pdf) (SIGMOD 2016), a concurrency control approach of  transactional data systems that essentially throws out the sequential data store model, and instead adopts weak consistency by making explicit a notion of *branch and merge* concurrency model. 

<div style="text-align: center;">
  <img src="/assets/git-for-txns/basic-merging-2.png" alt="TARDiS Model" width="530">
</div>


Essentially, TARDIS adopts a view of transactional isolation in the style of [Git](https://en.wikipedia.org/wiki/Git) i.e. at the start of a transaction a client forks history onto their own local branch, and are able to perform reads and writes in isolation on this branch. When they have completed their operations, they can go ahead and "merge" back their changes into a main branch of history. TARDiS leaves this merging task to the application, rather than to the underlying storage layer.


## Branch and Merge Transactions

The proposed TARDiS system consists of a transactional key-value store that tracks conflicting execution branches with 3 mechanisms: 

1. branch on conflict
2. inter-branch isolation
3. application-specific merge

In a standard transactional data store, we can imagine that the entire system consists of a single, linear history of states. As transactions commit, the effects of their write operations are applied to the latest state in this linear history, and new transactions may read from some state in this history (e.g. from either the latest state or some historical snapshot). TARDiS breaks from this model and instead includes an explicit notion of branching into their data store abstraction. That is, when users are executing transactions, they may can do so in a *single mode*, which means they are executing their transactions against a chosen branch. As in Git, this branch is conceptually isolated from concurrent transactions, so can be viewed conceptually as a linear/sequential thread of history by an application.

### Begin and Commit

In this model, there are a few natural modifications to the lifecycle of a transaction. First, when a transaction begins, it is not obvious where the transaction will "start from", since there is no longer a global, sequential state history. So, a transaction first needs some strategy for selecting a branch to being execution against i.e. which state in the history DAG it will begin from i.e. which we call its *read state*.

<div style="text-align: center;">
  <img src="/assets/git-for-txns/tardis-branching.png" alt="TARDiS Model" width="590">
</div>

There is also a notion of *begin* and *commit constraints*, which are additional conditions on start and commit that place extra validity conditions on a transaction, allowing a user more control over the degree of local branching. 

<div style="text-align: center;">
  <img src="/assets/git-for-txns/begin-commit-constraints.png" alt="TARDiS Model" width="440">
</div>



For example, there is a way for users to explicitly specify a *serializability* constraint, which requires tracking of read and write sets of transactions on a branch. There are also constraints for ensuring *snapshot isolation*, etc. The paper does not go into depth on the formal definitions of these constraints, but my intuition is that they are sufficient to provide guarantees analogous to some standard isolation levels (e.g. serializability, snapshot isolation, etc.) 


### Merging

To make the concept of branch merging explicit, TARDiS includes a concept of *merge transactions*. Conceptually, these can be viewed as similar to standard transactions in *single mode*, except that they may operate on multiple *read states* (i.e. multiple branches). These merge transactions are also a bit special in that they are given access to additional structure about the global state DAG, most notably

- *Fork Points*: the fork point in the history between the set of states being merged
- *Conflict Writes*: the set of conflicting writes that occurred on the set of branches being merged.

Access to this information allows merge transactions to explicitly resolve conflicts between branches in an application-specific manner. For example, they take the example of a simple counter value that has diverged among conflicting branches. Given the values on each branch and the fork point, a merge transaction can compute a new, resolved value by summing the difference between the value on each branch plus the value at the fork point.

<div style="text-align: center;">
  <img src="/assets/git-for-txns/counter-code.png" alt="TARDiS Model" width="460">
</div>
<br>

## Concluding Thoughts

It is interesting to note how the ideas in this paper echo the work that came just a bit later, in Crooks work on [state-based isolation formalism](https://www.cs.cornell.edu/lorenzo/papers/Crooks17Seeing.pdf), which appeared in PODC 2017. It seems that related ideas were present in this work, and the similar ideas were being developed concurrently. For example, the notions of *read states* and *begin constraints* appear quite analogous to the "read state" and "commit test" concepts in the client-centric formulation. In general, both papers seem to share a common conceptual core of viewing transactional isolation models as centered around *state-centric histories* i.e. the database moves through a sequence of states over time, and new transactions may conceptually read from one of these states, and upon commit may create a new state, appending to this history.

I find the TARDiS approach an interesting attempt at an alternative approach to managing weakly consistent data interfaces in a more principled manner. On the flip side, though, my intuition is that managing and merging these branches in a complex application would become burdensome and unintuitive for most application developers. For software and systems builders, and those familiar with Git, DAGs, etc. this may be more palatable, but even in Git I find that it is rare I have ever dealt with merging of more than a 1-2 branches at a time. Even then, dealing with merge conflicts in general can still be somewhat tedious. Perhaps this type of system, though, would be effective as a slightly more internal layer, that other tools/apps could build on top of, rather than having users directly interface with it themselves. Regardless, I think the ideas in the paper are productive and useful as an alternative model for conceptualizing transactions in general and especially weak consistency or isolation models.

They also note that similar ideas have been explored in past, including [Olive](https://dl.acm.org/doi/10.5555/1267680.1267707) and [Bayou](https://www.cs.utexas.edu/~lorenzo/corsi/cs380d/papers/p172-terry.pdf), and there is sort of a [folk understanding](https://www.dolthub.com/blog/2024-07-08-are-git-branches-mvcc/) of the [underlying relationships](https://buttondown.com/jaffray/archive/git-workflow-is-snapshot-isolated/) between multiversion concurrency control, Git, snapshot transactions, etc.