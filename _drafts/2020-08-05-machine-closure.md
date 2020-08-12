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

it would be possible for train car $$w$$ to move onto track section $$s2$$, after which it would be impossible to take any steps that satisfy both the safety and liveness property. We've "painted ourself into a corner", by simply taking steps that satisfy our safety property. More formally, our system specification has allowed finite prefixes that satisfy the safety property but cannot be extended to satisfy our liveness property. This concept is formalized as *machine closure*. It is also referred to as *feasibility* in *[Appraising Fairness in Languages for Distributed Programming](https://link.springer.com/article/10.1007/BF01872848)*. Lamport [provides](https://lamport.azurewebsites.net/pubs/lamport-verification.pdf) the following definition of machine closure:

> A pair of properties $$(S, L)$$ is *machine closed* if $$S$$ is a safety property and every finite behavior satisfying $$S$$ is a prefix of an infinite behavior satisfying $$S \wedge L$$. 

So, violation of machine closure means that there exists some safe finite prefix with *no* extensions that satisfy $$L$$. When we write specifications of real systems, nearly all of the time we want them to be machine closed. This is more or less intuitive if we think about a system specification as a state machine, rather than an arbitrary temporal property. When we specify a system as state machine, we naturally start with the safety aspect i.e. at each state, what are the allowed actions we can take to transition to a new state. Liveness constraints for a state machine are really about *fairness* i.e. we can think about liveness as a scheduler policy. Arbitrary temporal properties are in some sense too expressive to use for liveness requirements of our system. Indeed, in *[Fairness and Hyperfairness](https://lamport.azurewebsites.net/pubs/lamport-fairness.pdf)*, Lamport defines a fairness requirement exactly as machine closure. Formally, 

> A property $$L$$ is a fairness property for property $$S$$ iff $$(S,L)$$ is machine closed.

We can also think about the concept of machine closure from the perspective of designing concurrent and distributed systems. There is an inherent trade off between safety and liveness in asynchronous, fault tolerant concurrent protocols. So, if we are given some arbitrary safety and liveness property, it makes somewhat intuitive sense that it may not be "realizable" i.e. there may be cases where it's impossible to maintain liveness while satisfying a given safety constraint, if either one is too strong. That is, it's not guaranteed to be machine closed.

#### My Remaining Questions

- Can we transform a non machine closed spec into a machine closed one? How does this affect $$S$$ and $$L$$?
- Why do we use temporal properties at all for specification? Why not just always stick with the automaton/state machine technique of specification? 
- In what cases is it useful to write non machine closed specifications?