---
layout: post
title:  "Verifying Robustness of Transactional Workloads"
categories: databases transactions programming
---

In [past work](https://www.mongodb.com/company/blog/engineering/formal-methods-beyond-correctness-isolation-permissiveness-distributed-transactions) we explored early attempts to model and verify transactional programs, building [compositional TLA+ specifications](https://dl.acm.org/doi/10.14778/3750601.3750626) of the MongoDB distributed transactions protocols. With the rapid advances in LLM capabilities over the past 6-9 months, though, we have seen entirely new specification and verification abilities emerge in the frontier models. In particular, the ability to not only write well-formed TLA+ specifications but also promising results on writing complete, machine-checked correctness proofs for those specifications in the [TLA+ proof system](https://proofs.tlapl.us/doc/web/content/Home.html) (TLAPS). As a grounding historical data point, the original transactions modeling work we did was done over a year ago (~ February 2025), at which point the latest frontier models we had access to were Claude 3.7 Sonnet and GPT-4.5, and Claude Code was still in its relative infancy.

These LLM capabilities have opened up a lot of new opportunities for how we might apply formal methods in the design of our systems. If we can truly generate proofs "on demand" we may start considering a host of new use cases that were previously impossible or infeasible. One novel use case if for *workload-specific* verification analyses. More specifically, applying it to the problem of checking the *robustness* of a given transactional workload. That is, given a specific transactional application/workload, if we run it under an isolation level weaker than serializable, will it still provide serializable guarantees? There is some great [past work](https://link.springer.com/chapter/10.1007/978-3-030-25543-5_17) on how to formalize and check this problem in certain cases, but for arbitrary workloads this might be quite difficult to prove. With the advent of proof-capable LLMs models, we can try this out.


## Modeling Workloads and Robustness

We can try this out by looking at two initial transactional workloads, *TPC-C* and *Auction*, a sample workload that was originally examined and determined to be robust under SI in the paper [referenced above](https://link.springer.com/chapter/10.1007/978-3-030-25543-5_17). We can see if it is possible to automatically establish robustness of these applications against snapshot isolation using TLA+ and its [proof system](https://proofs.tlapl.us/doc/web/content/Home.html) (TLAPS), without doing tedious manual analysis and proof effort.  Note that, for TPC-C, the robustness question for SI was previously [established formally](https://dsf.berkeley.edu/cs286/papers/ssi-tods2005.pdf) in the affirmative by Fekete et al. in 2005. For any of these prior approaches, though, such proofs often require heavyweight and detailed technical machinery, something that would be out of reach for a new, arbitrary workload. We want to explore if we can effectively generate these proofs "on demand".


To start, we need the ability to formally reason about both (1) a given transaction workload and (2) an underlying database/KV-store providing a given isolation level. 
<!-- So, we start with an abstract specification of snapshot isolation, and then we will see if a variety of simple transactional workloads that we formalize can be verified as robust when run under SI.  -->
We first start with an abstract formal model of a snapshot isolated key-value store itself, which we luckily have some of these [lying around](https://github.com/will62794/snapshot-isolation-spec) in TLA+. On top of this, we can then build an abstract [formal spec](https://github.com/will62794/robustness-proofs/blob/main/TPCC.tla) of the TPC-C workload itself. Thankfully, it’s also easy to get LLMs to build most of the skeleton for this as well. Note that, under snapshot isolation, we can think about transactions as each getting their own private copy of the database when they start, and execute locally against this private workspace of data before trying to commit. So, from the perspective of other transactions, the specific order and timing of operations within a transaction are mostly irrelevant. Therefore, we can work with a model where transactions and their *read sets* and *write sets* are chosen and written in one atomic step before commit. 

Our `TPCC.tla` model instantiates an instance of the underlying `SnapshotIsolation` module, which it uses as its backing KV store. Within that module, we also define the correctness property we are concerned about here, which is serializability. In this context, this is defined as *conflict-serializability* i.e. are there any cycles in the multi-version serialization graph.
Once these specifications are set up, this allows us to express robustness formally as a very simple invariance property i.e. does our `TPCC.tla` spec satisfy the `Serializable` invariant.

$$
TPCC!Spec \Rightarrow \square Serializable
$$

We could try to model check this property for small parameters using TLC, and if TPC-C was not robust under SI, we might quickly discover this. Since we expect the workload to be robust, though, we can try to generate a TLAPS proof of this fact. We can give this a go with a simple prompt in Claude Code:

```markdown
Go ahead and try to write a complete TLAPS proof for the 
`SerializableViaPath` invariant in @TPCC.tla. 

Please use the TLAPS tool binaries at usr/local/bin/tlapm. 

Don't look at past proofs or other proof files or commit history.
```




<!-- ## Finding and Fixing Robustness Violations

We can concretely establish that some other standard workloads, like SmallBank, are indeed not serializable when executed under snapshot isolation. This can then be established via standard model checking producing invariant counterexamples. This was possible prior to the advent of modern LLMs, but the generation of the specification itself of a given workload also becomes dramatically easier, and could even be directly inferred/generated from a given programming language.


Finding robustness violations for a workload like SmallBank is fairly well-known and understood, but more interestingly there have also been explorations into how you can safely *promote* certain operations within a workload to ensure it executes serializably. This is closely related to and in some sense a generalization of the `SELECT FOR UPDATE` concept that is used to emulate serializability guarantees. -->



<!-- <div align="center">
  <img width="450px" src="/assets/isolation_pareto_frontier (3).png" alt="Pareto frontier diagram" style="border:2px solid #aaa; padding:12px; display:inline-block; border-radius:10px;" />
  <div style="margin-top:8px; color:#666; font-size:15px;"><em>Abstract sketch of isolation techniques on an isolation-permissiveness frontier. Formal relationships between some algorithms are hard to establish.</em></div>
</div>
 -->

 Using DeepSeek 4.1, we are able to generate a complete TLAPS proof of the `Serializable` invariant for TPC-C in around 1.5 hours, producing a proof that is ~2000 lines of TLA+, and can be checked using the TLAPS tool in ~30 seconds or so.

 We ran this experiment for the Auction workload as well, building a [formal spec](https://github.com/will62794/robustness-proofs/blob/main/Auction.tla) and asking for a serializability proof as well. Using Grok 4.6 it took about 1.5 hours to generate a complete TLAPS proof, which was over 2500 lines of TLA+, and can be checked from scratch in a few minutes.


## Reflections and Future Possibilities

This experiment is a relatively minimal proof of concept, but there are a broad class of extensions we could imagine exploring here. For example, checking whether standard program transformations like `SELECT * FOR UPDATE` style additions maintain serializability when a given workload is not robust to start with. There may be other, more elaborate transformations to explore as well that improve performance in other ways while maintaining the same underlying isolation correctness guarantees.

Finding robustness violations for a workload like SmallBank is fairly well-known and understood, but there have also been [explorations](https://www.vldb.org/pvldb/vol18/p2846-vandevoort.pdf) into how you can safely *promote* certain operations within a workload to ensure it executes serializably. This is closely related to and in some sense a generalization of the `SELECT FOR UPDATE` concept that is used to emulate serializability guarantees.
[Other work](https://dl.acm.org/doi/10.1145/1065167.1065193) has also looked at a generalization of the above problem, referred to as *allocation*. This effectively tries to determine the weakest possible isolation level against which a given workload is robust. This in theory lets a database try to provide the weakest necessary guarantees and maximal performance characteristics for an arbitrary, given workload.


This overall approach takes some of the other ideas from tools appearing across the space. Namely that of abstracting given code/systems into a “simulation” representation over which to reason about. In our case, we are using TLA+ as this abstract substrate, which gives us a mechanism to both look for bugs (via model checking) and also write proofs about correctness. The fluidity with which we can now move between programming language representations is opening up many new possibilities, and significantly expands the capabilities of program analysis and verification. Translating a system or code into a suitable format for other analysis tasks is largely free in many cases, and so we can start to think about any one representation as just a “lens” or “view” on an underlying source of truth.


As with many LLM capabilities today, this also serves as a concrete upper bound on the speed and cost of this task going forward. That is, we can only expect intelligence and its cost to continue dropping by orders of magnitude over time, and so what might be a ~1 hour long agent session today costing $10s of dollars, may eventually be something that can be done in a few seconds and extremely cheaply.
Evals like [TLAPS bench](https://github.com/specula-org/tlaps-bench) are also starting to explore the boundary of how well LLMs can complete machine checked proofs for a variety of practical system specifications.

It is important to note also that these TLAPS proofs are quite dense technical artifacts, but as we rely on the underlying proof system, we simply need to mechanically check that the overall proofs check out. Note that, it is still important to check that there are no “cheating” going on with LLMs when writing these proofs. In particular, addition of unrealistic or overly strong assumptions that are being relied on for the proof to go through. It is still quite important to understand as a human exactly what is being proven, even if you may not understand all the details of how the proof is exactly constructed works.


<!-- We’ve seen increasing development of using LLMs for writing machine checked proofs in a ton of domains, and the power continues to increase. This particular use case, though, is compelling in that it brings to bear formal proof on quite a practical program analysis problem that database users might care about. The flexibility of LLMs for modeling code and now their power to prove things about formal models lets us answer very interesting questions about each new dedicated application/workload, without devoting months/years of mathematical analysis and effort, as would be typically be required (e.g. see Fekete 2005 theory paper).  -->
