---
layout: post
title:  "Inductive Proof Graphs"
categories: distributed-systems
---

If we want to formally prove that a safety property (an invariant) holds of a system, we can do this by finding an *inductive invariant*. An inductive invariant is a special invariant that is at least as strong as the target invariant to be proven, but it is also inductive, meaning that it is closed under all transitions of the system.

For example, for a specification of two-phase commit, we may want to establish the 

A possible inductive invariant might look like this:

In this form, though, it is quite hard to understand the logical str and how it represents the correctnness argu,ent for this propety. Instead we can view inductive invariants through the lens of *inductive proof graphs*. These are a graph structure that explicitly represents the compositional structure of an inductive invariant.

We explot these structures for automated inductive invariant inference technique in [1], and to also improve the interactivity and interpretability of the inductive invariant development process.

