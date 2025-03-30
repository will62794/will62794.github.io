---
layout: post
title:  "Modern Views of Transaction Isolation"
categories: formal-methods specification
---

Transaction isolation is a dense topic with a lot of history. There have been many attempts over the years to formalize various isolation concepts, but it is not always clear to what extent these new attempts have clarified things or just introduced new layers of complexity and notation to the domain. The rise of distributed systems and the need to reason about isolation in these contexts has worsened the problem over the past decade or so.

If we want to say anything precise about transaction isolation, we need some formal model in which to reason about it. There are, however, a host of different formalisms that all approach the problem from subtly different angles, with different goals, notation, frameworks, etc. ([Adya](https://pmg.csail.mit.edu/papers/adya-phd.pdf), [Cerone](https://drops.dagstuhl.de/storage/00lipics/lipics-vol042-concur2015/LIPIcs.CONCUR.2015.58/LIPIcs.CONCUR.2015.58.pdf), [Crooks](https://dl.acm.org/doi/10.1145/3087801.3087802)). It is helpful, then, to try to understand the common underyling concepts between any of these formalisms.

A unifying concept of essentially any transaction isolation formalism is that an isolation definition can be viewed as a *condition over a set of committed transactions*. That is, given some set of transactions that were committed by a database, these transactions either satisfy a given isolation level or not, based on the sequence of read/write operations present in each of these transactions.


<div style="text-align: center">
<img src="/assets/diagrams/txn-isolation/transaction-isolation-model.drawio.svg" alt="Transaction Isolation Models" width=550>
</div>


Note that a core aspect of any formal isolation definition is about putting conditions on *how reads observe database state*. If we have a set of transactions that only perform writes, we might intuitively have some notion of a correctness for a database executing these transactions, but we such definitions really don't mean anything unless we have some type of read operation that occurs to observe the effect of other transaction's writes. So, we could say that transaction isolation should really fundamentally be related to 

> **conditions on the possible set of values that any transaction can read**. 

We can keep this "read-centric" view in mind in context of some of the modern formalisms for transaction isolation.

## Modern Isolation Formalisms

There are two notable, modern models of transaction isolation that try to capture some of this intuition formally: the [2015 model of Cerone et al.](https://drops.dagstuhl.de/storage/00lipics/lipics-vol042-concur2015/LIPIcs.CONCUR.2015.58/LIPIcs.CONCUR.2015.58.pdf) and the subsequent [Crooks 2017 client-centric model](https://dl.acm.org/doi/10.1145/3087801.3087802).

If we consider transaction isolation under the above, "read-centric" view, then when we think about how to define an isolation level, we should first be concerned with how we define *what values a transaction can read*. If our isolation level makes no restrictions on this, then a transaction can read any value (in practice what a level like *read uncommitted* may give you). More sensibly, we would expect a transaction to read states that are *reasonable*, in some sense. More concretely, we should expect that transactions actually read values written by other transactions. This could, in fact, be one possible isolation definition (similar to *read committed*), but is stronger than allowing transactions to read *any* value. 

There are some other reasonable constraints, though. Basically, we likely expect that the possible states we read from came about through some "reasonable" execution of the transactions we gave to the database. One "reasonable" type of execution would be to execute these transactions in some sequential order. This is, for example, what we would expect out of a database system if we gave it a series of transactions one-by-one, with no concurrent overlapping between transactions.


### Cerone 2015

The Cerone paper, [*A Framework for Transactional Consistency Models with Atomic Visibility*](https://drops.dagstuhl.de/storage/00lipics/lipics-vol042-concur2015/LIPIcs.CONCUR.2015.58/LIPIcs.CONCUR.2015.58.pdf), is based on a core simplifying assumption of *atomic visibility*, which is that either all or none of the operations of a transaction can become visible to other transactions. This means that their model essentially cannot represent isolation levels like *Read Committed*, which is weaker than *Read Atomic*, the weakest level their model can express. 

Their model encodes the intuitive idea of "read-centric" isolation by first defining a *visibility* relation between transactions i.e. a way of defining which transactions are visible to other transactions. That is, if a transaction reads a key, whose transactions write should it be observing. It defines this in terms of *abstract executions*, where an abstract execution consists of a set of committed transactions (a *history* $$\mathcal{H}$$) along with two relations over this set:

 - **Visibility** ($$\mathsf{VIS} \subseteq \mathcal{H} \times \mathcal{H}$$): acyclic relation where $$T \overset{\mathsf{VIS}}{\rightarrow} S$$ means that $$S$$ is aware of $$T$$.
 - **Arbitration** ($$\mathsf{AR} \subseteq \mathcal{H} \times \mathcal{H}$$): total order such that $$\mathsf{AR} \supseteq \mathsf{VIS}$$ where $$T \overset{\mathsf{AR}}{\rightarrow} S$$ means that the writes of $$S$$ supersede those written by $$T$$ (essentially only orders write by concurrent transactions).

Basically, $$\mathsf{VIS}$$ is a partial ordering of transactions in a history, and $$\mathsf{AR}$$ is a total order on transactions that is a superset of $$\mathsf{VIS}$$ (i.e. any edge in $$\mathsf{VIS}$$ is also by default an edge in $$\mathsf{AR}$$). Note that $$\mathsf{AR}$$ is a total order, so every two transactions are comparable by this ordering even if, in some cases (as discussed below), this ordering is not relevant, and could be omitted.


<figure style="text-align: center" id="fig1">
<div style="text-align: center;padding:30px;">
<img src="/assets/diagrams/txn-isolation/txnvis1-SampleHistory.drawio.svg" alt="Transaction Isolation Models" width=450>
</div>
<figcaption>Figure 1: History \(\mathcal{H}\) of committed transactions with possible visibility and arbitration relations.</figcaption>
</figure>



<!-- e.g. External Consistency ($$EXT$$) axiom is basically saying, there exists a partial ordering of transactions such that you observe the latest effects of all transactions visible to you as defined by this partial order. -->


<!-- The framework is defined in terms of *abstract executions*, and a consistency model as a set of *consistency axioms* constraining executions.  -->
A consistency model (e.g. isolation level) is then defined as a set of *consistency axioms* constraining executions, where a consistency model allows histories for which there exists an abstract execution satisfying the axioms. In other words, given a set of transactions that executed against the database, they satisfy a consistency/isolation level if there exists an abstract execution that obeys the axioms of that consistency/isolation level. 



The weakest isolation level they define, *Read Atomic*, imposes only the *internal* and *external* consistency conditions. 

- $$I\small{NT}$$ (internal consistency): read from an object returns the same value as the last write to or read from this object in the transaction.
- $$E\small{XT}$$ (external consistency): the value returned by an external read in $$T$$ is determined by the transactions $$\mathsf{VIS}$$-preceding $$T$$ that write to $$x$$. If there are no such transactions, then $$T$$ reads the initial value 0. Otherwise it reads the final value written by the last such transaction in $$\mathsf{AR}$$.

Internal consistency is the less interesting condition, stating simply that you read your own writes within a transaction. External consistency is the more important condition, stating that a transaction will read the value written by the latest transaction preceding it in the visibility relation, with conflicts decided by the arbitration relation.
<!-- Other than that, though, there are no real restrictions.  -->

<!-- For example, transactions could observe the effect of two different transactions in different orders, or even violate causality (e.g. by reading from the future?). This very weak transaction level is helpful to understand the model.  -->




So, at this weakest defined isolation level, *Read Atomic*, we can think about a whole batch of committed transactions, and the only restrictions that we are placing on their read values is that they observe the effects of some other transaction(s) in this set, determined by a transaction's incoming edges of the visibility ($$VIS$$) relation (e.g. as illustrated in <a href="#fig1">Figure 1</a>). If multiple transactions in its incoming visibility set wrote to conflicting key sets, then the $$AR$$ exists to arbitrate between them, determining which write is observed. Note sometimes $$AR$$ edges are omitted where they would not be directly relevant.

The underlying model does require the visibility relation to be acyclic, but there are still some unintuitive semantics allowed by this weakest definition, with *causality violations* being a notable example. Basically, the visibility relation is not, by default, required to be *transitive* in this weak model, so you can end up with transactions observing the effects of some other transaction that observed the effect of an "earlier" transaction, but you don't observe the effects of the "earlier" transaction e.g. as shown by example below with 3 transactions.

<div style="text-align: center">
<img src="/assets/diagrams/txn-isolation/txnvis1-Page-1.drawio.svg" alt="Transaction Isolation Models" width=420>
</div>


Moving up the isolation hierarchy from *Read Atomic*, we start strengthening requirements on what transactions can observe. In this paper, this starts by adding the transitivity condition on visibility ($$T{\small{RANS}}V{\small{IS}}$$), to get *Causal Consistency*, which is then extended to *Parallel Snapshot Isolation (PSI)* and *Prefix Consistency*, two levels that are not strictly comparable in the hierarchy. Note that the $$C\small{ONFLICT}$$ condition enforced at PSI is the first condition that does not make a restriction on the values *observed by reads*. Rather, it places conditions on valid cases of conflicting writes between transactions.  transactions 

<div style="text-align: center">
<img src="/assets/fig1-framework-atomic-viz.png" alt="Transaction Isolation Models" width=770>
</div>

Also, there is a notable transition between PSI and Prefix Consistency + Snapshot Isolation (SI) which is the switch from a *partial* to *total* required on the visibility relation. Basically, the $$P\small{REFIX}$$ condition requires that if $$T$$ observes $$S$$, then it also observes all $$AR$$ predecessors of $$S$$. In the example below, which illustrates the *long fork* anomaly of PSI, transactions $$T_3$$ and $$T_4$$ can be considered to observe the effects of $$T_1$$ and $$T_2$$ in "different orders" i.e. for $$T_3$$ it appears as if $$T_1 \rightarrow T_2$$, but for $$T_4$$ the opposite is true.

<figure style="text-align: center">
<img src="/assets/diagrams/txn-isolation/txnvis1-LongFork.drawio.svg" alt="Transaction Isolation Models" width=330 style="display: block; margin-left: auto; margin-right: auto;">
<figcaption>Case of long fork anomaly allowed under Parallel Snapshot Isolation.</figcaption>
</figure>

Under the $$P\small{REFIX}$$ condition, the arbitration ordering between $$T_1$$ and $$T_2$$ comes into play, effectively enforcing a fixed order on how $$T_1$$ and $$T_2$$ are observed by $$T_3$$ and $$T_4$$. That is, in the above example, if $$T_3$$ observes $$T_1$$, then by $$P\small{REFIX}$$ it must observe its $$AR$$ predecessor $$T_2$$. Similarly, $$T_4$$ is then only required to observe $$T_2$$, conforming to the $$T_2 \rightarrow T_1$$ ordering enforced by $$AR$$. Recall that since $$AR$$ is a total order, this condition is basically saying that if you are ever going to observer a transaction, then you are also forced to observe all transactions preceding it in the $$AR$$ total ordering. So, this effectively forces visibility to be totally ordered for concurrent transactions.

Hm, so if $$AR$$ is a total order always estalbished upfront, then is $$VIS$$ kind of just like the "**selection of read states**" in Crooks' model???? I guess it's like a "total order if you need it".

If you move all the way to serializability, then the conditions simply become strengthened to $$T{\small{OTAL}}V{\small{IS}}$$, requiring simply that $$VIS$$ is a total order (along with $$I\small{NT}$$ and $$E\small{XT}$$ conditions).

 <!-- $$AR$$  -->


<!-- One transaction T3 reads a value written by another transaction T2 that must have observed T1, but T3 does not observe T1's effect. (i.e. if you observe something, and another transaction observes that, it should also reflect effect of all things you observed.) -->

----

Note that the *read atomic* isolation model (the weakest in this formalism) can be viewed as an interesting "boundary" in isolation strength since, for something like *read committed* you only need to ensure that reads within a transaction of a key $$k$$ read the value written by *some* other transaction to key $$k$$. But, in the weakest sense, there may be no restriction on a notion of reading from a "consistent" state across keys. So, the weakest interpretation of read committed might be simply that any read can read any value that was written to that key at some point by any transaction in the history. This doesn't even impose any notion of ordering on transactions, since you really only care about your consistency guarantees at the level of a single key.


Note that the read atomic model was actually first introduced in [Bailis' 2014 paper](http://www.bailis.org/papers/ramp-sigmod2014.pdf) on RAMP transactions. Note that Read Atomic is something similar to Snapshot Isolation but with an allowance for concurrent updates (e.g. allows write-write conflicts). This was preceded by their earlier proposal of [*monotonic atomic view*](https://www.vldb.org/pvldb/vol7/p181-bailis.pdf) which is strictly weaker than Read Atomic.


### Crooks 2017

While the Cerone 2015 formalization starts with the notion of a partial ordering of transactions, Crooks takes a different starting point, though there are ultimately similarities. Crooks again approaches isolation definitions over a set of committed transactions, but considers their definitions in terms of *executions*, which are simply a totally ordered sequence of these transactions.

The basic idea of this formalism is centered around a *state-based* or *client-centric* view of isolation. That is, the values observed by any transactions will be determined based on *read states*, which are the states that the database passed through as it executed the transactions according to the execution ordering you defined. In a sense, this is more similar to the notion of serializability as classically defined i.e. in terms of your committed transactions conforming to *some* ordering that could have occurred which is consistent with the values observed by each transaction.

<!-- Crooks model is able to allow for transactions observing concurrent transaction writes in different orders since it doesn't require strict ordering between transactions to disjoint keys? -->

<figure style="text-align: center">
<div style="text-align: center;padding:30px;">
<img src="/assets/diagrams/txn-isolation/txnvis1-ReadStates.drawio.svg" alt="Transaction Isolation Models" width=480>
</div>
<figcaption>Execution of transactions with associated read states in Crooks model.</figcaption>
</figure>

This is ultimately quite similar to the Cerone view, since the visibility relation ($$\mathsf{VIS}$$) serves a similar purpose i.e. by basically picking out which transactions writes are visible to you. Cerone doesn't formulate this in terms of "read states" as Crooks does, but essentially the same idea is present i.e. the "read state" in the Cerone model is created by the application of your $$\mathsf{VIS}$$-preceding transactions.

Crooks does also have a technial difference from the Cerone model, in that it allows expression of weaker models like *Read Committed*, since it does not make the assumption of *atomic visibility* that Cerone does. It does this by allowing each read operation of a transaction to potentially read from a *different* read state, allowing for expression of the fractured reads anomaly the Cerone cannot represent.

Crooks is able to represent *Read Atomic* as well, though. The formal definition (as shown in <a href="#fig2">Figure 2</a>) is somewhat dense (note that $$sf_o$$ represents the first read state for an operation $$o$$), but intuitively it is simplying saying that if an operation $$o$$ observes the writes of a transaction $$T_i$$, all subsequent operations reading a key in $$T_i$$'s write set must read from a state that include $$T_i$$'s effects.

<figure style="text-align: center" id="fig2">
<div style="text-align: center;padding:5px;">
<img src="/assets/crooks-commit-tests.png" alt="Transaction Isolation Models" width=630>
</div>
<figcaption>Figure 2: Execution of transactions with associated read states in Crooks model.</figcaption>
</figure>


---------------------------

<br>

## Restrictions Beyond Reads

A core aspect of the above models is how we define and formalize the values that transactions are able to read. But the values that a transaction can read dont capture the full picture of isolation definitions. Other than the values a transaction reads, what other restrictions are there to be made? Well, we may want to prevent a transaction from doing certain writes if they may break some "semantic" guarantees (which need to be defined a bit more carefully).


Also, *why* does snapshot isolation actually need to enforce write-write conflict checking? If it didn't, how would this be observable to other transaction reads?

```
t1: r(x,init) w(y,1) w(z, 1)
t2: r(x,init) w(z,2) w(y, 2)
```

If you don't prevent a certain anomaly, is the effect of this anomaly actually observable to the reads of any other transactions?

Do we actually care about how writes are abitrated between concurrent/conflicting transactions?

what if both transactions were allowed to commit? How do we arbitrate between them?

It seems that certain anomalies, like "Lost Updates", are really only representable/observable if you include in your transactions model the ability of a write inside a transaction to use some value previously read within the transaction i.e. having a first-class semantic notion of an "update".

What if we view all transactions as kind of "transactional updates" or "state transformers"? Where we describe them as writes to a set of output keys that are a function of the state of input keys at the start of the transaction? e.g. over keys `x` and `y`:

```
x' = y + 1
y' = 2
```
where `x` is modified based on current value of `y` and `y` is just set to a new constant value. This simplified/condenses the whole read/write model of transactions. Obviously, in practice, we may not know the whole set of transaction keys upfront, but in a model, we could consider any transaction as reading some set of keys, and making writes possibly dependent on the values read from those keys.

For commutative operations, could you avoid aborting on write conflicts? e.g. pure inserts (v.s. increments, etc.) Note that commutativity/idempotency (CRDT style) is one way to avoid concurrency conflicts entirely.


*Some anomalies don't really make sense unless you consider the semantics of operations explicitly??* i.e. dealing with how writes conflict??

--------------------

Other than restricting the values that can be observed by reads, what other restrictions does an isolation level need to impose? As mentioned, why do we even need to make any other restrictions?

<!-- e.g. *Read Atomic* is only making restrictions on  -->

Restrictions on *what you can observe* vs. restrictions on *whether a transaction can proceed* (or, perhaps, *what you can write*)?

Depends on the semantics of "writes"?

- *Lost Updates* - only meaningful if you consider the semantics of "update" operations?
- *Write Skew*

Write skew arises in a case when there is a read write dependency between two transactions

Say two transactions both read x and y, but then T1 writes to x and T2 writes to y. Both are reading from a consistent snapshot of state, but a potentially "stale" snapshot w.r.t the other ongoing transaction.

```
T1: r(y,0) w(x' = y+2)
T2: r(x,0) w(y' = x+2)
```
If executed serially, you would expect a result like `x=2, y=4`, but if executed concurrently you can get a result like `x=2, y=2`.

How different is this, actually, from a *lost update*?

And in the read-only transaction anomaly of SI:

```
Say initially x0=0 and y0=0.
T1: R(y0,0) W(y' = y + 20, 20) C1 
T2: R(x0,0) R(y0, 0) W(x' = x - 10, -11) C2
T3: R(x0,0) R(y1,20) C3 
```
I think this is ultimately similar?

If two updates are non-concurrent, then you should expect them to always behave "correctly". It is really concurrent updates whose effect you have to decide on and reason about.

<!-- 
## Partial vs. Total

Partial or total ordering more natural?

## Adya's formalism 

I would argue that Adya style formalization perhaps moved slightly in the right direction, but ultimately still strayed far from any intuitive notion of how a user or client might being to understand or reason about an isolation level.

But, I also somewhat disagree with Crooks' assertion that the client-centric model is:

> the first to specify isolation without relying on some notion of history.

since I feel the notion of a history (i.e. an ordering of transactions) is still quite central to the client-centric model, but it avoids the complexities and unintuitive details around partial ordered events and serialization graphs. -->