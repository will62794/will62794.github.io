---
layout: post
title:  "Safety and Liveness"
categories: formal-methods
---
 
Temporal logic properties can be broadly categorized into *safety* and *liveness* properties. Safety properties intuitively state that a "bad thing" must never happen whereas liveness properties state that a "good thing" must eventually happen. These informal definitions are made precise in the paper *Defining Liveness* (Alpern, Schneider, 1985).

# Formalizing Safety and Liveness

An *execution* or a *behavior* $$\sigma$$ is viewed as an infinite sequence of states $$\sigma = s_0,s_1,s_2,...$$. A *property* is a set of such sequences. Such a set may be finite or infinite. We write $$\sigma \vDash P$$ when execution $$\sigma$$ satisfies $$P$$. We can alternately say that $$\sigma$$ is contained in $$P$$. We denote the set of all infinite executions as $$S^\omega$$ and the set of all finite (partial) executions as $$S^*$$. Finally, we let $$\sigma_i$$ represent the partial execution consisting of the first $$i$$ states of an execution $$\sigma$$.

We define a **safety** property $$P$$ as follows:

$$
(\sigma \nvDash P) \Rightarrow \exists i \in \mathbb{N} : (\forall \beta \in S^\omega : \sigma_i\beta \nvDash P)
$$

This captures the intuition of a safety property specifying that a "bad thing" never happens. It says that if a behavior violates $$P$$, then it must do so in some finite prefix of the behavior. In other words, the violation occurs at some discrete point. After that point, you could try to extend the behavior with any suffix $$\beta$$, but you would not be able to remedy the violation.

We define a **liveness** property $$P$$ as follows:

$$
\forall \alpha \in S^* : (\exists \beta \in S^\omega : \alpha \beta \nvDash P) 
$$

This definition says that a property $$P$$ is a liveness property if any partial execution can be extended to satisfy $$P$$. That is, no matter how many steps we take in a finite behavior prefix, there's always hope that we can satisfy a liveness property in the future ("while there's life there's hope").

# The Decomposition Theorem

TODO.