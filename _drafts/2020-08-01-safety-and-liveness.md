---
layout: post
title:  "Safety and Liveness"
categories: formal-methods
---
 
Temporal logic properties can be broadly categorized into *safety* and *liveness* properties. Safety properties intuitively state that a "bad thing" must never happen whereas liveness properties state that a "good thing" must eventually happen. These informal definitions are made precise in the paper *[Defining Liveness](https://www.cs.cornell.edu/fbs/publications/DefLiveness.pdf)* (Alpern, Schneider, 1985).

# Formalizing Safety and Liveness

An *execution* or a *behavior* $$\sigma$$ is viewed as an infinite sequence of states $$\sigma = s_0,s_1,s_2,...$$. A *property* is a set of such sequences. Such a set may be finite or infinite. We write $$\sigma \vDash P$$ when execution $$\sigma$$ satisfies $$P$$. We can alternately say that $$\sigma$$ is contained in $$P$$. We denote the set of all infinite executions as $$S^\omega$$ and the set of all finite (partial) executions as $$S^*$$. Finally, we let $$\sigma_i$$ represent the partial execution consisting of the first $$i$$ states of an execution $$\sigma$$.

We define a **safety** property $$P$$ as follows:

$$
(\sigma \nvDash P) \Rightarrow \exists i \in \mathbb{N} : (\forall \beta \in S^\omega : \sigma_i\beta \nvDash P)
$$

This captures the intuition of a safety property specifying that a "bad thing" never happens. It says that if a behavior violates $$P$$, then it must do so in some finite prefix of the behavior. In other words, the violation occurs at some discrete point. After that point, you could try to extend the behavior with any suffix $$\beta$$, but you would not be able to remedy the violation. Note that even though a safety property is always violated at a discrete point, it may require looking at an entire behavior to determine whether the property is violated. For example, *invariants* are one class of safety property that depend only on a single state. For example, "x is never equal to 0" is an invariant, and can be checked by looking at any one state within a behavior. There are other safety properties, however, where this is not the case. For example, the property "if x=0 then x=1 three steps later". To determine the truth of this property, we must examine an entire trace, even though a violation will occur in a finite prefix.

We define a **liveness** property $$P$$ as follows:

$$
\forall \alpha \in S^* : (\exists \beta \in S^\omega : \alpha \beta \nvDash P) 
$$

This definition says that a property $$P$$ is a liveness property if any partial execution can be extended to satisfy $$P$$. That is, no matter how many steps we take in a finite behavior prefix, there's always hope that we can satisfy a liveness property in the future ("while there's life there's hope"). Note that the "good thing" required by a liveness property may or may not be discrete. A simple liveness requirement like "x is eventually 0" will be satisfied at a discrete point in a behavior, but a liveness condition like "x is 0 infinitely often" can only be determined by examining an infinite behavior.

# The Decomposition Theorem

It turns out that any property can be written as a conjunction of a safety and liveness property. This theorem is proven in *Defining Liveness* by resorting to a topological characterization of safety and liveness properties, defining a topology where safety properties are the closed sets and liveness properties are the dense sets. In that paper, they decompose an arbitrary property $$P$$ as

$$
P = \overline{P} \cap L
$$

where $$\overline{P}$$ is the smallest safety property that contains $$P$$, and $$L=\neg(\overline{P}-P)$$. I don't find this characterization and proof as intuitive, since it relies on topological concepts that may or may not be fully natural to a reader. In a slightly later paper *[Decomposing Properties into Safety and Liveness using Predicate Logic](https://ecommons.cornell.edu/bitstream/handle/1813/6714/87-874.pdf?sequence=1&isAllowed=y)* (Schneider, 1987), an alternate proof is presented whose arguments resort only to first order logic. The essence of this proof is clearer to me. We can start with an intuitive sketch and then formalize it.

Given an arbitrary property $$P$$, we want to come up with a safety property $$S_P$$ and a liveness property $$L_P$$ such $$P=S_P \wedge L_P$$. To find the safety property, we can start thinking about the defining characteristics of safety properties. Any behavior that violates a safety property must violate it in some finite prefix. So, we can view a safety property as consisting of a set of behaviors $$B$$ such that for all $$b\in B$$, there is no "unsafe" finite prefix of $$b$$. If a behavior $$b$$ has no unsafe finite prefixes with respect to a property $$P$$ we denote that as $$Safe_P(b)$$. So, we can start with a safety property that includes behaviors $$b$$ that satisfy $$Safe_P(b)$$ i.e. all behaviors that have only "safe" finite prefixes with respect to $$P$$. This is safety property $$S_P$$.

Next we need to define some liveness property such that intersecting it with $$S_P$$ will give us $$P$$. We know that $$S_P$$ consists of only those behaviors that contain no unsafe prefixes, but it is still possible that a behavior which satisfies $$Safe_P(b)$$ violates $$P$$. For example, if the violation only occurs by looking at the infinite behavior. By definition, a liveness property must include all finite prefixes in the behaviors it includes, since the definition states that any prefix (safe or unsafe) can always be extended to satisfy a liveness property. We know, however, that our safety property only consists of behaviors with "safe" prefixes, so the intersection of any liveness property with it will only include behaviors with safe prefixes. Therefore, the only remaining goal of our liveness property is to ensure that it excludes behaviors that satisfy $$Safe_P(b)$$ but violate $$P$$. We can do this by removing from $$L_P$$ behaviors in $$S_P$$ which are safe but not live, so that when we intersect $$L_P$$ and $$S_P$$ we are left with only behaviors that fully satisfy $$P$$.

TODO: Formalize Proof