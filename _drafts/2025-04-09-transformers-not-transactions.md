---
layout: post
title:  "Transformers vs. Transactions"
categories: databases transactions isolation
---

Database transactions are traditionally represented as a sequence of read/write operations
on keys in a database. This is reflected in the formalisms that precisely define the semantics of various transaction isolation levels. In many cases, however, especially for most isolation levels used in practice in modern database systems, which are often snapshot isolation or stronger, this may not be the best model, and leads to some unnecessary confusion and complexity.

Most standard, existing transaction formalisms represents a transaction as a sequence of read/write operations over a subset of some fixed set of database keys and values e.g

$$
T: r(x,v_0) \, r(y_0) \, w(x, v_1)
$$

For transactions oeprating at isolation levels that read from a consistent database snapshot, though, they don't really need to be modeled as a linear sequence of program steps, and can alternately be viewed as *state transformers*. That is, we can compact any transaction into the following object, illustrated by example, for a database with keys $$K=\{x,y,z\}$$:

$$
T: 
\begin{cases}
&\mathcal{R}=\{x,y\} \\
&x' = f_x(y,z) \\ 
&z' = f_y()
\end{cases}
$$

where $$\mathcal{R}=\{x,y\}$$ is the set of keys read by the transaction upfront, and each $$f_v$$ is a *key transformer* function, which is a pure function describing the updates that get applied to each key in the subset of keys that are updated by that transaction. Each such function can optionally depend on the values read from the current snapshot state for that transaction.

Notably, most traditional transaction formalisms don't make this operational view explicit in their models. For example, consider the way that papers treat the *lost update* anomaly. In the Cerone 2015 framework, they represent transactions as sequences of read/write operations over a set of keys, e.g.

<div style="text-align: center">
<img src="/assets/diagrams/txn-transformers/cerone-defs.png" alt="Transaction Isolation Models" width=550>
</div>

and when they go to define the *lost update* anomaly, it sort of requires a bit of skirting the issue by resorting to a notion of "application code" that could have produced this sequence of writes:

<div style="text-align: center">
<img src="/assets/diagrams/txn-transformers/cerone-lost-update-explanation.png" alt="Transaction Isolation Models" width=530>
</div>

<div style="text-align: center">
<img src="/assets/diagrams/txn-transformers/cerone-lost-update.png" alt="Transaction Isolation Models" width=390>
</div>

In this particular case, I would argue that anomalies like *lost update* (which are the specific anomaly which SI write-write conflicts are supposed to prevent), aren't really "true" anomalies without expressing transactions in a higher level model like these state transformers. 

Existing low level models can essentially be viewed as those where all key transformers don't take in any key dependencies (like $$f_y()$$) above. That is, they always write "constant" values i.e. those that are not actually dependent on any values read by the transaction. This is the case because a semantic notion of "dependence" is not explicitly representable in most of these formalisms.
In such a world, I'd argue that "lost update" isn't a "true" anomaly at all, since if two transactions conflict by writing to the same key, what's the problem? One of them will commit after the other, and the database state will then reflect this as it should, and from an external observer's perspective (i.e. another transaction), this is no different than if the two transactions had executed in some serial order. 

A more accurate definition of *lost update*, which we can express in the state transformer model, is that an update may be "lost" if two transactions update the same key $$k$$ *and* the dependencies of key transformers $$f_k$$ in each transaction include $$k$$. That is, a lost update is only a problem due to the read-write dependency that exists between the two transactions, which creates a serializability anomaly because if you execute two transformer operations (for different transactions $$T_1$$ and $$T_2$$) like:

$$
\begin{aligned}
f^{T_1}_x(x) = x + 1 \\
f^{T_2}_x(x) = x + 3
\end{aligned}
$$

their order obviously matters for the final outcome, since they incur a semantic (read-write) dependency on each other. If they both execute on the same data snapshot and are allowed to commit, the result will be semantically incorrect i.e. you have really "lost" one of the updates, since the outcome will be either $$x=1$$ or $$x=3$$, but not $$x=4$$ as it should be.





Going further, this transformer model also gives us a nice way to see that *write skew*, which is another anomaly that is allowed under full snapshot isolation, is reallyjust a generalization of lost update. Essentially, write skew exists because two transactions don't write to overlapping key sets, but they both update keys in a way that breaks a semantic constraint. Again, the transformer model representation for the cannonical write skew anomaly would look something like:


$$
T_1: 
\begin{cases}
&r(\{x,y\}) \\
&x' = f_x(x,y)
\end{cases} \quad\quad
T_2: 
\begin{cases}
&r(\{x,y\}) \\
&y' = f_y(x,y) \\ 
\end{cases}
$$

In this case, we can argue that the key transformers in both actually do depend on both keys, since the conditional logic in the example can be represented as a logical if-then-else that reads values of both keys $$x$$ and $$y$$ i.e. 

$$
f_y(x,y) = \text{if } (x + y) > 100 \text{ then } y - 100 \text{ else } y
$$

Again, the problem arises at the core due to the read-write dependencies between these transactions i.e. the writes of one transaction affect the dependency key set of the writes (i.e. key transformers) of the other. Thus, the order of execution matters.

So, given this, we might consider both *lost update* and *write skew* both as subsets of a more general class of anomalies that can arise when there is a data dependency between the *write set* of a transaction and the *dependency key set* of another transaction.



<div style="text-align: center">
<img src="/assets/diagrams/txn-transformers/cerone-write-skew.png" alt="Transaction Isolation Models" width=670>
</div>

This issue also arises in an obscured form elsewhere e.g. in [A Critique of Snapshot Isolation](https://arxiv.org/abs/2405.18393), where they make the observation that detecting *read-write* conflicts (rather than *write-write*) is actually sufficient to make snapshot isolation serializable. But, they have to add a few special cases for read-only transactions e.g.

> Plainly, since a read-only transaction does not perform any writes, it does
not affect the values read by other trans- actions, and therefore does not
affect the concurrent trans- actions as well. Because the reads in both snapshot isolation and write-snapshot isolation are performed on a fixed snapshot of the database that is determined by the trans- action start timestamp, the return
value of a read operation is always the same, independent of the real time that the read is executed. Hence, a read-only transaction is not affected by concurrent transactions and intuitively does not have to be aborted....In other words, the read-only transactions are not checked for conflicts and hence never abort.

Viewed in the state transformer model, there is no need to special case read-only transactions, since they already satisfy the condition we defined above which is about the dependency set of each key transformer. This provides a more unifying view to understand when serialization anomalies will arise. Furthermore, we can make a finer-grained distinction that allows transactions to proceed if the key transformer updates are "constant".



### Merging and Deterministic Scheduling

This view of transactions also opens up a few interesting questions about whether we can be smarter about dealing with conflicts. That is, if transactions are formally expressed in this state transformer structure, we could consider cases where, instead of aborting transactions that encounter certain type of conflicts (write-write), we may be able to simple semantically merge the effects of their key transformers into a unified operation that reflects the correct, sequential execution of both transformers. This is in essence very similar to a CRDT-based idea, but applied in the context of a more classic transaction processing paradigm.

Similarly, if transactions can be represented in this fashion for most practical systems/isolation levels, this also seems to raise the question of whether we can also move back to a world where we apply ideas from deterministic transaction scheduling (i.e. [Calvin](https://cs.yale.edu/homes/thomson/publications/calvin-sigmod12.pdf) style), since in theory the read/write sets of a transaction are known upfront. In practice, some transactions may still determine their full read/write sets dynamically, as they execute, but there may be some opportunities to apply some of these ideas.
