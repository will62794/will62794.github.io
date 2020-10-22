---
layout: post
title:  "Inductive Invariance"
categories: tlaplus formal-methods 
---

An **invariant** of a transition system $$(S, S_0, R)$$ is a set of states $$ I $$ such that all reachable states are contained within $$ I $$. Semantically, an invariant is a set of states, but we commonly express invariants as state predicates i.e. a predicate $$ P(x) $$ that is true or false of a single state and gives rise to the corresponding set $$\{x \in S : P(x)\}$$. An **inductive invariant** is an invariant that is closed under the transition relation $$ R $$. That is, for any state transition $$(s, s') \in R, (s \in I \Rightarrow s' \in I)$$.

Inductive invariants are fundamental to how we prove invariants of a system. 

- Why do we need inductive invariants?
- Strengthening invariants to get an inductive invariant.
- Examples and state space visualization of reachable states and invariants/inductive invariants for several finite state protocols.


<!-- 
When specifying and verifying a transition system, one of the common type of properties we want to verify are **invariants**. An invariant is a property that holds for all reachable states of a system. The natural way to express an invariant is as a state predicate e.g. a property that is true or false of a particular state. This predicate defines a corresponding set of states $$I$$: the set of all states that satisfy the predicate. If we define $$Reach$$ to be the set of all reachable states of our transition system, we can formally define an invariant as a set of states $$I$$ such that $$Reach \subseteq I$$. That is, every reachable state of the system is contained within the invariant. As a logical formula, we can write this as $$Spec \Rightarrow \square I$$, where $$Spec$$ is a formula that defines the set of reachable states of our system. -->


