---
layout: post
title:  "Defining Safety and Liveness"
categories: formal-methods
---
 
Temporal logic properties can be broadly categorized into *safety* and *liveness* properties. Safety properties intuitively state that a "bad thing" must never happen whereas liveness properties state that a "good thing" must eventually happen. These informal definitions are made precise in the paper *[Defining Liveness](https://www.cs.cornell.edu/fbs/publications/DefLiveness.pdf)* (Alpern, Schneider, 1985), and are also discussed in a later paper, *[Decomposing Properties into Safety and Liveness using Predicate Logic](https://ecommons.cornell.edu/bitstream/handle/1813/6714/87-874.pdf?sequence=1&isAllowed=y)* (Schneider, 1987).

# Formalizing Safety and Liveness

An *execution* or a *behavior* $$\sigma$$ is as an infinite sequence of states $$\sigma = s_0,s_1,s_2,...$$. A *property* is a set of such sequences. Such a set may be finite or infinite. We write $$\sigma \vDash P$$ when execution $$\sigma$$ satisfies property $$P$$. We can alternately say that $$\sigma$$ is contained in $$P$$. We denote the set of all infinite executions as $$S^\omega$$ and the set of all finite (partial) executions as $$S^*$$. Finally, we let $$\sigma_i$$ represent the partial execution consisting of the first $$i$$ states of an execution $$\sigma$$.

We define a **safety** property $$P$$ as follows:

$$
(\sigma \nvDash P) \Rightarrow \exists i \in \mathbb{N} : (\forall \beta \in S^\omega : \sigma_i\beta \nvDash P)
$$

This captures the intuition of a safety property specifying that a "bad thing" never happens. It says that if a behavior violates $$P$$, then it must do so in some finite prefix of the behavior. In other words, the violation occurs at some discrete point. After that point, you could try to extend the behavior with any suffix $$\beta$$, but you would not be able to remedy the violation. Note that even though a safety property is always violated at a discrete point, it may require looking at an entire behavior to determine whether the property is violated. *Invariants* are one class of safety property that depend only on a single state. For example, "x is never equal to 0". This can be checked by looking at any one state of a behavior. There are other safety properties, however, where this is not the case. For example, the property "if x=0 then x=1 three steps later". To determine the truth of this property, we must examine an entire trace, even though a violation will occur in a finite prefix. Intuitively, we can think about a safety property as a property that rules out "bad" or "unsafe" prefixes. A safety property only includes behaviors where all prefixes of the behavior are "good" or "safe", for some definition of safety.

We define a **liveness** property $$P$$ as follows:

$$
\forall \alpha \in S^* : (\exists \beta \in S^\omega : \alpha \beta \nvDash P) 
$$

This definition says that a property $$P$$ is a liveness property if any partial execution can be extended to satisfy $$P$$. That is, no matter how many finite steps we take in a behavior prefix, there's always hope that we can satisfy a liveness property in the future ("while there's life there's hope"). Note that the "good thing" required by a liveness property may or may not be discrete. A simple liveness requirement like "x is eventually 0" will be satisfied at a discrete point in a behavior, but a liveness condition like "x is 0 infinitely often" can only be determined by examining an infinite behavior.

# The Decomposition Theorem

It turns out that any property can be written as a conjunction of a safety and liveness property. This theorem is proven in *Defining Liveness* by resorting to a topological characterization of safety and liveness properties, defining a topology where safety properties are the closed sets and liveness properties are the dense sets. In that paper, they decompose an arbitrary property $$P$$ as

$$
P = \overline{P} \cap L
$$

where $$\overline{P}$$ is the smallest safety property that contains $$P$$, and $$L=\neg(\overline{P}-P)$$.The topological characterization of safety and liveness properties is elegant, but I don't think it is the clearest way to understand the topic for someone without a strong prior intuition in topology. We can prove the theorem without resorting to the topological characterization, though.

The safety property $$\overline{P}$$ consists of all behaviors with only "safe" finite prefixes. Formally, we can say that a given behavior $$\sigma$$ is *safe* with respect to property $$P$$ if all finite prefixes of $$\sigma$$ can be extended to satisfy $$P$$ i.e.

$$
Safe_P(\sigma) = \forall i \in \mathbb{N} : \exists \beta \in S^\omega : \sigma_i\beta \vDash P
$$

$$\overline{P}$$ is simply the set of all behaviors $$\sigma$$ such that $$Safe_P(\sigma)$$. Note that this set may be larger than $$P$$, since it is possible that $$\sigma \nvDash P \wedge Safe_P(\sigma)$$. For example, consider the property "x=0 initially and eventually x=1". The behavior where x=0 in every state is clearly safe but it still violates the property. The behaviors that satisfy $$Safe_P(\sigma)$$ but not $$P$$ are exactly those in $$\overline{P}-P$$. So, we need to intersect $$\overline{P}$$ with a property $$L$$ that gets rid of the behaviors in $$\overline{P}-P$$, so that we are left only with behaviors in $$P$$. We also need $$L$$ to be a liveness property. It turns out that we can take $$L$$ to be the set of all behaviors except for those in $$\overline{P}-P$$. That is, $$L=\neg(\overline{P}-P)$$.

We can see how the intersection of these properties gives us $$P$$:

$$
\begin{aligned}
\overline{P} \cap L &= \overline{P} \cap \neg(\overline{P} - P) \\
&= \overline{P} \cap (P \cup \neg \overline{P}) \\
&= (\overline{P} \cap P) \cup (\overline{P} \cap \neg \overline{P}) \\
&= P \cup \emptyset \\
&= P \\
\end{aligned}
$$

As a side note, in some of these formulas and derivations we go back and forth between expressing properties in logical formulas and in set notation, which may be confusing, but it's helpful to remember correspondences between common set and logical operations. For example, set intersection ($$\cap$$) corresponds to logical conjunction ($$\wedge$$), set union ($$\cup$$) corresponds to logical disjunction ($$\vee$$), and negation ($$\neg$$) corresponds to set complement. This arises from the fact that we can think about properties either as logical formulas or sets of behaviors.

It remains to show that $$L$$ is actually a liveness property. We can assume that $$L$$ is not a liveness property and derive a contradiction. If $$L$$ was not a liveness property it would mean that there exists some finite execution $$\sigma \in S^*$$ such that no extension of $$\sigma$$ satisfies $$L$$. So it must be the case that no behaviors in $$L$$ have $$\sigma$$ as a prefix, which, by definition of $$L$$, means that no behaviors in $$\neg(\overline{P} - P)$$ have $$\sigma$$ as a prefix. If this is true, then some behavior in $$\overline{P} - P$$ must have $$\sigma$$ as a prefix. This cannot be true, though, since $$\overline{P}$$ includes only behaviors where all finite prefixes have an extension satisfying $$P$$.

<!-- <img src="/assets/safety-liveness-sets.svg"/> -->

#### Liveness-Liveness Decomposition

At a high level, the safety liveness decomposition feels somewhat natural, since it reflects the way we often think about the behavior of real systems. It turns out, however, that it is also possible to express any property $$P$$ as the conjunction of two liveness properties. This is an additional theorem given in *Defining Liveness*. If $$S$$ is the set of all states, and $$\mid {S} \mid > 1$$ (i.e. there are at least 2 possible system states), then we let $$L_a$$ be the set of all executions with tails that are infinite sequences of $$a$$'s and $$L_b$$ is, similarly, the set of sequences with infinite tails consisting of $$b$$'s. The intersection of $$(P \cup L_a)$$ and $$(P \cup L_b$$) (which both happen to be liveness properties) gives us $$P$$. I don't really have a good intuition for why this decomposition works and I'm not sure if it has any significant theoretical or practical interest, but it's an interesting auxiliary result.

<!-- $$
\begin{aligned}
(P \cup L_a) \cap (P \cup L_b) &= (P \cap P) \cup (P \cap L_b) \cup (L_a \cap P) \cup (L_a \cap L_b) \\
&= P \cup (P \cap L_b) \cup (P \cap L_a) \cup \emptyset \\
&=  TODO
\end{aligned}
$$

We have to show that $$(P \cup L_a)$$ and $$(P \cup L_b)$$ are both liveness properties. We can start with $$(P \cup L_a)$$. Let's assume that it is not a liveness property and derive a contradiction. If it's not a liveness property, there must exist some finite execution $$\sigma$$ with no extension that lies inside $$(P \cup L_a)$$. Well, it should always be possible extend a finite execution $$\sigma$$ with an infinite suffix of $$a$$'s, which would, by the definition of $$L_a$$, cause it to be contained in $$(P \cup L_a)$$. So, it must be impossible to have a finite execution where no extension falls in $$(P \cup L_a)$$. The same reasoning applies to $$(P \cup L_b)$$. So, both of these must be liveness properties. -->

