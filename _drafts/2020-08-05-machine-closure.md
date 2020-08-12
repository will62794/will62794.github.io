---
layout: post
title:  "Machine Closure"
categories: tlaplus formal-methods
---

<!-- $$ -->
<!-- Init \wedge \square [Next]_{vars} \wedge Liveness -->
<!-- $$ -->

In practice, we specify a system's behavior as the conjunction of a safety and liveness property $$S \wedge L$$. The safety-liveness decomposition is inherently "natural", as shown by Alpern and Schneider. If we chose to describe a system as a conjunction of a safety and liveness property of arbitrary forms, however, we can run into a certain kind of trouble. For example, let's consider a system of train tracks, with two cars that are located on different sections of the tracks. We can define a safety property requiring that a train car can only ever take a forward step to a new track section, and that no train car can be located on the track section immediately ahead of the other car. For a liveness property, we require that each train must always eventually make a move. Taken on their own, these properties are reasonable. For example, if our system only obeys the liveness property then trains can move as they please, moving forward or backwards, or moving in front of another train, and trains would always be required to eventually move. If we conjoin this liveness property with our safety property, however, it's possible for us to end up in a state where any step (including doing nothing) would violate both our safety and liveness specification. For example, in the figure below, which is taken from *[Safety and Liveness From a Methodological Point of View](https://dl.acm.org/doi/10.1016/0020-0190%2890%2990181-V)*

<img src="/assets/traintracks.png" class="centerImg" width="35%">

it would be possible for train car $$w$$ to move onto track section $$s2$$, after which it would be impossible to take any steps that satisfy both the safety and liveness property. We've "painted ourself into a corner", by simply taking steps that satisfy our safety property. More formally, our system specification has allowed finite prefixes that satisfy the safety property but cannot be extended to satisfy our liveness property. 

This concept is formalized as *machine closure*. It is also referred to as *feasibility* in *[Appraising Fairness in Languages for Distributed Programming](https://link.springer.com/article/10.1007/BF01872848)*. Lamport [provides](https://lamport.azurewebsites.net/pubs/lamport-verification.pdf) the following definition of machine closure: a pair of properties $$(S, L)$$ is **machine closed** if $$S$$ is a safety property and every finite behavior satisfying $$S$$ is a prefix of an infinite behavior satisfying $$S \wedge L$$. 

So, violation of machine closure means that there exists some safe finite prefix with *no* extensions that satisfy $$L$$. When we write specifications of real systems, nearly all of the time we want them to be machine closed. This is more or less intuitive if we think about a system as being defined by a state machine, rather than by an arbitrary temporal property. When we specify a system as state machine, we naturally think about what the allowed actions that can be taken at each state. Liveness constraints for a state machine are really about *fairness* i.e. we can think about a liveness requirement like a scheduler policy. In *[Fairness and Hyperfairness](https://lamport.azurewebsites.net/pubs/lamport-fairness.pdf)*, Lamport defines a fairness requirement exactly as machine closure. That is, a property $$L$$ is a fairness property for property $$S$$ iff $$(S,L)$$ is machine closed.


Arbitrary temporal (e.g liveness) properties are in some sense too expressive to be used as specifications for real systems. In general, the space of temporal properties may include behavior sets that don't correspond to "real" or "implementable" algorithms, since any real system (or program, for example), has physical constraints on what it can do. One of the fundamental constraints is that an algorithm's behavior cannot depend on information from the future. When deciding on what step to take next, it can only take into account its current state. This is an inherent physical limitation of any real system or algorithm. In the train tracks example above, we can think about the liveness constraint we imposed as requiring that the algorithm has the "foresight" to predict that it might end up in a "dead end", where no further moves are possible. Clearly, though, this is not possible for any real algorithm to do. 

Note, however, that the expressivity of temporal properties can be useful in certain cases where we want to write a very abstract spec. For example, the standard specification of serializability of database transactions permits behaviors where a transaction reads a value from the "future" i.e. it reads a value written by another transaction that has not yet occurred yet. 

We can also think about the concept of machine closure from the perspective of designing concurrent and distributed systems. There is an inherent trade off between safety and liveness in asynchronous, fault tolerant concurrent protocols. So, if we are given some arbitrary safety and liveness property, it makes somewhat intuitive sense that it may not be "realizable" i.e. there may be cases where it's impossible to maintain liveness while satisfying a given safety constraint, if either one is too strong. That is, it's not guaranteed to be machine closed.

#### My Remaining Questions

- Can we transform a non machine closed spec into a machine closed one? How does this affect $$S$$ and $$L$$?
- Why do we use temporal properties at all for specification? Why not just always stick with the automaton/state machine technique of specification? 
- In what cases is it useful to write non machine closed specifications?
- Does the liveness property of a non machine closed spec always rule out *all* allowed behaviors, or only some? In general, it should only rule out some.

----

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

We've changed the safety property to prevent us ever incrementing $$x$$ beyond a value of $$3$$, and we've removed our liveness property entirely. To do this we strengthened our safety property (i.e. it allows fewer behaviors, taken on its own), and we weakened our liveness property (i.e. it allows more behaviors).
