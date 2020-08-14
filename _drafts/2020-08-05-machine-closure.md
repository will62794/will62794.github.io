---
layout: post
title:  "Machine Closure"
categories: tlaplus formal-methods
---

<!-- $$ -->
<!-- Init \wedge \square [Next]_{vars} \wedge Liveness -->
<!-- $$ -->

In practice we specify a system's behavior as the conjunction of a safety and liveness property $$S \wedge L$$. The safety-liveness decomposition is fundamental, as shown by Alpern and Schneider. Describing a system as a conjunction of arbitrary safety and liveness properties, however, can be dangerous. 

Imagine we have a rectangular, two dimensional grid system, with an agent that starts at the bottom left of this rectangle i.e. at point $$(0,0)$$. Let's say that the top right corner of the rectangle is a goal node that the agent is trying to reach.

<img   src="/assets/machine-closure.png" width="60%" class="centerImg">

Let's say we impose an initial condition on the agent $$(x=0, y=0)$$ and we also impose a liveness constraint that says "eventually the agent reaches the goal". Any path through our grid system that leads from the start point to the goal point satisfies our specification. We can think of a path in this example as a system behavior. We can then modify our system to add a region near the top of the grid that the agent is not allowed to enter (the shaded, red region in the illustration). With our specified liveness property, the agent should still be able to take routes that avoid or go around the obstacle. But, if we impose an additional safety property that the agent "can only move up or to the right", then it's possible for the agent to get stuck in a corner, without the ability to get out and ever reach the goal. In the illustration, the green path is one that satisfies our liveness property but not our safety property, since it winds left and right. The purple path satisfies both safety and liveness, and the brown path is one that gets stuck, unable to make any further progress. Indeed, any path that enters the brown shaded "dead ends" region is bound to get stuck in this way. That is, we've "painted ourself into a corner", by simply taking steps that satisfy our safety property. More formally, our system specification has allowed finite prefixes that satisfy the safety property but cannot be extended to satisfy our liveness property. 

This motivates the concept of *machine closure*. It [has also been referred](https://link.springer.com/article/10.1007/BF01872848) to as *feasibility*. Lamport [provides](https://lamport.azurewebsites.net/pubs/lamport-verification.pdf) the following definition of machine closure: a pair of properties $$(S, L)$$ is **machine closed** if $$S$$ is a safety property and every finite behavior satisfying $$S$$ is a prefix of an infinite behavior satisfying $$S \wedge L$$. Violation of machine closure means that there exists some safe finite prefix with *no* extensions that satisfy $$L$$. 

Note that machine closure depends on how we express a property $$P$$ as the conjunction of a particular safety and liveness property. There may be a different safety liveness decomposition that permits the same behaviors as $$P$$ but *is* machine closed. And, based on the Alpern-Schneider decomposition theorem, any property $$P$$ can be written as the conjunction of a safety property $$S$$ and liveness property $$L$$ such that $$(S,L)$$ is machine closed.

The rectangular grid example given above also illustrates an intuitive aspect of some non machine closed specifications, which is that satisfaction of both the safety and liveness property may require "foresight" (also [referred to](https://groups.google.com/g/tlaplus/c/Ccqat083y6g/m/_h5xVnBfCQAJ) as "prescience") on the part of the agent. That is, without knowledge of the entire layout upfront, by only making local moves the agent has no way of knowing that it may be traveling into a "dead end" region, that will prevent it from ever reaching its goal. 

When we write specifications of real systems, nearly all of the time we want them to be machine closed. This is more or less intuitive if we think about a system as being defined or governed by a state machine, rather than by some pair of arbitrary temporal properties. When we specify a system as state machine, we naturally think about the allowed actions that can be taken at each state. Liveness constraints on a state machine should really be about *fairness*. They are like a thread scheduling policy. In *[Fairness and Hyperfairness](https://lamport.azurewebsites.net/pubs/lamport-fairness.pdf)*, Lamport defines a fairness requirement exactly as machine closure. That is, a property $$L$$ is a fairness property for property $$S$$ iff $$(S,L)$$ is machine closed.

### Conclusions

The concept of machine closure is a reflection of the fact that arbitrary temporal (e.g liveness) properties are in some sense too expressive to be used as specifications for "real" systems. In general, specifications composed of arbitrary temporal properties may not correspond to "realizable" algorithms, since any real system (e.g. a program), has physical constraints on what it can do. For example, an algorithm cannot make decisions based on information from the future. When deciding on what step to take next, it can only take into account its current state. This is an inherent physical limitation of any system. Note, however, that the expressivity of temporal properties can be useful in certain cases where we want to write a very abstract specification. That is, we don't necessarily care whether a specification is directly "realizable", since that is, in part, the essential goal of a specification i.e. it should specify the *what*, not the *how*. If, broadly, we view specifications as either *what* specifications or *how* specifications, then in theory we want to write a *what* specification and show that a *how* specification implements it. And we want a *how* specification to be machine closed since it will presumably correspond, in some degree, to a real implementation. We don't need the *what* specification to be machine closed, if, for example, it's simpler to write it as a non machine closed spec. This is discussed in a thread [here](https://groups.google.com/g/tlaplus/c/-L1mCJZ6-BA).

I also find it interesting to think about the concept of machine closure from the perspective of concurrent and distributed protocol design. Asynchronous, fault tolerant concurrent protocols require fundamental trade offs between safety and liveness. So, if we are given some arbitrary safety and liveness property, it makes somewhat intuitive sense that it may not be "realizable" i.e. there may be cases where it's impossible to maintain liveness while satisfying a given safety constraint, if one is too strong. That is, it's not guaranteed to be machine closed. Perhaps machine closure and the techniques of safety liveness decomposition techniques provide a way to understand the strongest liveness guarantees that can be provided under some given safety condition, which is often relevant when analyzing certain concurrent algorithms.



#### My Questions

- Can we transform a non machine closed spec into a machine closed one? How does this affect $$S$$ and $$L$$?
- Why do we use temporal properties at all for specification? Why not just always stick with the automaton/state machine technique of specification? 
- In what cases is it useful to write non machine closed specifications?
- Does the liveness property of a non machine closed spec always rule out *all* allowed behaviors, or only some? In general, it should only rule out some.

----
<!-- 
If we have a spec 

$$ 
\begin{aligned}
S &\triangleq  x=0 \wedge \square [x'=x+1]_x \\
L & \triangleq (x>3 \Rightarrow \Diamond x'=x-1)
\end{aligned}
$$

this is clearly not machine closed since we have prefixes like `<<1,2,3,4>>` which are safe but cannot be extended to satisfy $$L$$. On the other hand, there are some safe prefixes like `<<1,2,3>>` which are safe and can be extended to satisfy $$L$$ i.e. by stuttering forever. So, our allowed prefixes should be those which never exceed 3 i.e.

```
<<1>>
<<1,2>>
<<1,2,3>>
```

So, we should be able to decompose this non machine closed spec into a different, machine closed spec $$(S',L')$$ that permits the same set of behaviors. For example:

$$ 
\begin{aligned}
S &\triangleq  x=0 \wedge \square [x < 3 \wedge x'=x+1]_x \\
L & \triangleq True
\end{aligned}
$$

We've changed the safety property to prevent us ever incrementing $$x$$ beyond a value of $$3$$, and we've removed our liveness property entirely. To do this we strengthened our safety property (i.e. it allows fewer behaviors, taken on its own), and we weakened our liveness property (i.e. it allows more behaviors). -->
