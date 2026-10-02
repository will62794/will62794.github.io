---
layout: post
title:  "Verifying Robustness of Transactional Workloads"
categories: databases transactions programming
---

In [past work](https://www.mongodb.com/company/blog/engineering/formal-methods-beyond-correctness-isolation-permissiveness-distributed-transactions) we explored early attempts to model and verify transactional programs, building [compositional TLA+ specifications](https://dl.acm.org/doi/10.14778/3750601.3750626) of MongoDB's distributed transaction protocol. With the rapid advances in LLM capabilities over the past 6-9 months, though, we have seen entirely new formal specification and verification abilities emerge in frontier models. In particular, the ability to not only write well-formed TLA+ specifications but also promising results on writing complete, machine-checked correctness proofs for those specifications in the [TLA+ proof system](https://proofs.tlapl.us/doc/web/content/Home.html) (TLAPS). As a grounding historical data point, the original transactions modeling work was done over a year ago (~ February 2025), at which point the latest frontier models we had access to were Claude 3.7 Sonnet and GPT-4.5, and Claude Code was still in its relative infancy.

These new LLM capabilities have opened up a lot of new opportunities for how to potentially apply formal methods in the design and verification of our systems. If we can truly generate proofs "on demand" this lets us consider a variety of new use cases that were previously infeasible. One interesting use case is for *workload-specific* transaction analyses. Specifically, the problem of checking the *[robustness](https://dl.acm.org/doi/10.1145/1065167.1065193)* of a given transactional workload. That is, given a specific transactional application, if we run it under an isolation level weaker than serializable, will it still provide serializable guarantees? There is some great [past work](https://link.springer.com/chapter/10.1007/978-3-030-25543-5_17) on how to formalize and check this problem in certain cases, but for arbitrary workloads this might be very challenging to prove. With the advent of proof-capable frontier LLMs, though, we can try to do this automatically.


## Modeling Workloads and Robustness

In [*Checking Robustness Against Snapshot Isolation*](https://link.springer.com/chapter/10.1007/978-3-030-25543-5_17), from 2019, they looked at a small set of transactional workloads that they established robustness properties for under snapshot isolation. We can use these as a starting test bench to see if we can automatically re-establish robustness for some of these workloads using TLA+ and the TLA+ proof system.

They originally look at several workloads, but we can start with two basic ones, *TPC-C* and *Auction*, which they claim to be robust under SI. We will see if it is possible to automatically establish robustness of these applications under snapshot isolation without doing tedious manual analysis and proof effort.  Note that, for TPC-C, the robustness question under SI was also previously [established formally](https://dsf.berkeley.edu/cs286/papers/ssi-tods2005.pdf) in the affirmative by Fekete et al. in 2005. For most of these prior techniques, though, the proofs often require heavyweight and detailed technical machinery, something that would be out of reach for a new, arbitrary workload given to us on the fly e.g. or for a workload that was tweaked or modified by an end user. We want to explore if we can effectively generate these proofs "on demand".


To start, we need the ability to formally reason about both (1) a given transactional workload and (2) an underlying database/KV-store providing a given isolation level. 
<!-- So, we start with an abstract specification of snapshot isolation, and then we will see if a variety of simple transactional workloads that we formalize can be verified as robust when run under SI.  -->
We first start with an abstract formal model of a snapshot isolated key-value store itself, which we luckily have versions of [lying around](https://github.com/will62794/snapshot-isolation-spec) in TLA+. On top of this, we can then build an abstract [formal spec](https://github.com/will62794/robustness-proofs/blob/main/TPCC.tla) of the TPC-C workload itself. Thankfully, it’s also easy to get LLMs to build most of the skeleton for this as well. Note that, under snapshot isolation, we can think about transactions as each getting their own private copy of the database when they start, and execute locally against this private workspace of data before trying to commit. So, from the perspective of other transactions, the specific order and timing of operations within a transaction are mostly irrelevant. Therefore, our specification works within a model where transactions and their *read sets* and *write sets* are chosen and written in one atomic step before commit. 

Our workload specification, `TPCC.tla`, instantiates an instance of the underlying `SnapshotIsolation` module, which it uses as its backing KV store. Within that module, we also define the [correctness property](https://github.com/will62794/robustness-proofs/blob/6a5f92067f63f8390bf183fe3224fda85ab13120/SnapshotIsolation.tla#L443) we are concerned with, which is serializability. In this context, this is defined as *conflict-serializability* i.e. are there any cycles in the multi-version serialization graph.
Once these specifications are written, this allows us to express our robustness property formally as a simple invariant i.e. does our `TPCC.tla` spec satisfy the `Serializable` invariant.

$$
TPCC!Spec \Rightarrow \square Serializable
$$

We could try to model check this property for small parameters using TLC, to find counterexamples if TPC-C was not robust under SI. Since we expect the workload to be robust under SI, though, we can try to generate a TLAPS proof of this fact. We can give this a go with a simple prompt to Claude Code, with the assumption we have the appropriate TLAPS toolchain installed locally, along with some TLAPS-specific toolchain guidance in our [agents file](https://github.com/will62794/robustness-proofs/blob/main/AGENTS.md):

```markdown
Go ahead and try to write a complete TLAPS proof for the `SerializableViaPath` 
invariant in @TPCC.tla. Don't look at past proofs or other proof files or commit history.
```




<!-- ## Finding and Fixing Robustness Violations

We can concretely establish that some other standard workloads, like SmallBank, are indeed not serializable when executed under snapshot isolation. This can then be established via standard model checking producing invariant counterexamples. This was possible prior to the advent of modern LLMs, but the generation of the specification itself of a given workload also becomes dramatically easier, and could even be directly inferred/generated from a given programming language.


Finding robustness violations for a workload like SmallBank is fairly well-known and understood, but more interestingly there have also been explorations into how you can safely *promote* certain operations within a workload to ensure it executes serializably. This is closely related to and in some sense a generalization of the `SELECT FOR UPDATE` concept that is used to emulate serializability guarantees. -->



<!-- <div align="center">
  <img width="450px" src="/assets/isolation_pareto_frontier (3).png" alt="Pareto frontier diagram" style="border:2px solid #aaa; padding:12px; display:inline-block; border-radius:10px;" />
  <div style="margin-top:8px; color:#666; font-size:15px;"><em>Abstract sketch of isolation techniques on an isolation-permissiveness frontier. Formal relationships between some algorithms are hard to establish.</em></div>
</div>
 -->

 Using Opus 5.5 in Claude Code, we were able to generate a [complete TLAPS proof](https://github.com/will62794/robustness-proofs/blob/03b3d0123870cab3784f24a70d8b53c452cf03e0/TPCC_Proofs.tla) of the [serializability invariant](https://github.com/will62794/robustness-proofs/blob/03b3d0123870cab3784f24a70d8b53c452cf03e0/TPCC_Proofs.tla#L1907-L1916) for the TPC-C workload spec in around 1 hour. The proof is approximately 2000 lines of TLA+, and can be re-checked from scratch using TLAPS in a few minutes.
 We created a [spec](https://github.com/will62794/robustness-proofs/blob/main/Auction.tla) for the *Auction* workload as well and ran this same proof experiment. It similarly took about an hour to generate a [complete TLAPS proof](https://github.com/will62794/robustness-proofs/blob/main/Auction_Proofs.tla) of Auction serializability under SI, in around 1000 lines of TLA+. The proof can also be re-checked from scratch in a few minutes.

 There are some caveats to consider here, including the fact that, in general, there are some "known" proof techniques for some of these workloads out there in the pre-existing literature, which may be leaked into the LLM's training data. Regardless, though, it seems a strong data point on the capability strength of the LLMs. Furthermore, we expect it may be possible that proofs for a class of properties like these robustness questions may generally follow a similar shape, and so LLMs carrying out many of these proofs may derive helpful structural and strategic hints from past attempts. 
 It is also worth noting that these TLAPS proofs are dense technical artifacts, so it is important to check that there is no “cheating” going on with the LLMs writing these proofs. In particular, addition of unrealistic or overly strong assumptions that are being relied on for the proof to go through. It is still important to understand as a human exactly what is being proven, even if you may not understand all the details of how the proof is exactly constructed.



## Reflections and Future Directions

This experiment is a relatively minimal proof of concept, but there are a broad class of extensions we could imagine exploring, backed by automated proof generation. For example, checking whether standard program transformations like [`SELECT FOR UPDATE`](https://www.cockroachlabs.com/blog/select-for-update/) achieve appropriate serializability guarantees for a non-robust workload.
There has also been [exploration](https://www.vldb.org/pvldb/vol18/p2846-vandevoort.pdf) into how to safely *promote* certain operations within a workload to ensure it executes serializably.
[Other work](https://dl.acm.org/doi/10.1145/1065167.1065193) has also looked at a generalization of the above problem, referred to as *allocation*, potentially also assigning different isolation levels to different transaction types. This effectively tries to determine the weakest possible isolation level against which a given workload is robust, letting a database enforce the weakest necessary guarantees for correctness of a given workload.

This overall approach takes some of the other ideas from [tools](https://github.com/specula-org/Specula) appearing across the space. Namely that of abstracting given code/systems into an abstract "simulation" substrate over which to reason about. In our case, we are using TLA+ as this abstract modeling substrate, which gives us a mechanism to both potentially look for bugs (via model checking) and also write proofs about correctness. The fluidity with which we can now move between programming language representations is opening up many new possibilities, and significantly expands the capabilities of on-demand program analysis and verification tasks. Translating a system or code into a suitable format for analysis is approximately free in many cases, and so we can start to think about any one representation as just one view on an underlying source of truth. Evals like [TLAPS bench](https://github.com/specula-org/tlaps-bench) are also starting to explore the boundary of how well LLMs can complete machine checked proofs for a variety of practical system specifications.

As with many LLM capabilities today, this also serves as a concrete upper bound on the speed and cost of this task going forward. That is, we can only expect intelligence and its cost to continue dropping by orders of magnitude over time, and so what might be a multi-hour hour long agent session today costing hundreds of dollars, may eventually be something that can be done extremely cheaply in a few seconds.



<!-- We’ve seen increasing development of using LLMs for writing machine checked proofs in a ton of domains, and the power continues to increase. This particular use case, though, is compelling in that it brings to bear formal proof on quite a practical program analysis problem that database users might care about. The flexibility of LLMs for modeling code and now their power to prove things about formal models lets us answer very interesting questions about each new dedicated application/workload, without devoting months/years of mathematical analysis and effort, as would be typically be required (e.g. see Fekete 2005 theory paper).  -->
