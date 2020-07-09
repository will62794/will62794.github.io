---
layout: post
title:  "Specifications versus Properties in TLA+"
categories: tlaplus formal-methods refinement
---

When people are first learning about how to use TLA+ to model and verify systems, I have found that there is an early confusion around the distinction between a *specification* and a *property*, and how these relate. I also struggled with this concept when first learning TLA+ and I feel it was one of the more important hurdles towards understanding how to model systems in a mathematical, declarative way. I will give an explanation of my current understanding of the topic and the some of the surrounding confusion in an effort to make this concept clearer for future learners.

----

Temporal logic (which TLA+ is based on) provides a way to describe properties about behaviors, where a behavior is just an infinite sequence of states. We could call these "temporal properties" or just "properties".  You can classify certain properties as "safety" or "liveness" properties, but those are just categorizations within the general space of properties you might care about. Roughly, a safety property is one that must be violated by a finite behavior (a behavior prefix), and a liveness property is one that must be violated by an infinite behavior. This paper, [*Defining Liveness*](https://www.cs.cornell.edu/fbs/publications/DefLiveness.pdf), is a bit old but I think it gives clear, formal definitions of this.

As I understand TLA+, there are basically two things you might use a temporal property for:

1. Defining the allowed behaviors of your system (**specification**).
2. Defining what it means for your system to be correct (**verification**). 

These serve two distinct purposes but they both utilize the same conceptual "tool" i.e you define both of these things using temporal properties. 

# Specification

For (1), you can think about defining the behavior of your system as the set of all behaviors that satisfy a certain temporal property. When you write a specification as $$ Init \wedge [][Next]_{vars}$$ you are writing a temporal property. If you were going to check this specification, for example, the model checker basically interprets this formula as you saying "find all behaviors that satisfy this property". Note that even though TLA+ chooses to represent a system definition by this "initial state and next state predicate" formulation, you could do it in a different way, with an arbitrary temporal property. My understanding of the development of TLA+, though, was that this "initial state, next state relation" way of describing things was deemed practically useful and generally applicable to almost all systems you would ever want to design or specify, even if, arguably, it’s not the most abstract way you could write a specification. I believe this issue is alluded to by Lamport in a note on his [writings](https://lamport.azurewebsites.net/pubs/pubs.html) page under entry *50. Specifying Concurrent Program Modules*, where he writes:

*"...I became disillusioned with temporal logic when I saw how Schwartz, Melliar-Smith, and Fritz Vogt were spending days trying to specify a simple FIFO queue--arguing over whether the properties they listed were sufficient.  I realized that, despite its aesthetic appeal, writing a specification as a conjunction of temporal properties just didn't work in practice."*

I could be misinterpreting this statement but I think it speaks to some of the motivation behind TLA+ and why it adopted the "transition axiom" approach to specifying systems, since it works well in practice, and also seems to match our intuitive understanding of how systems actually work in the real world i.e. they take discrete steps to evolve their state according to some rules. 

One other point to make here is that it's important to remember that a specification is just a mathematical formula: it cannot be "executed". It is simply a declaration about what behaviors are "permitted" by your system. This tripped me up when first learning TLA+ because I would see actions written like 

$$\begin{align}&\wedge x=0 \\ &\wedge x' = x + 1\end{align}$$ 

and think of them like standard variable assignment in a programming language, but this model quickly breaks down when you see actions defined like 

$$\begin{align}&\wedge x=0 \\ &\wedge x' \in \{1,2\}\end{align}$$ 

where you can't apply the same mental model. Rather, you have to think about the set of all pairs $$(x,x')$$ that satisfy the given mathematical relation i.e. in the last case above we would have $$(x=0,x'=1)$$ and $$(x=0,x'=2)$$ as valid pairs i.e. allowed transitions. Note that even with the last relation above, though, we can imagine a clear way to enumerate the possible transitions (which the model checker does). To illustrate the generality of this mathematical approach, though, we could go further and write something that doesn't have an obvious enumeration strategy. For example, it should be perfectly valid to write a next state relation like

$$\begin{align}&\wedge x=0 \\ &\wedge x' \neq x\end{align}$$ 

but it is unclear how you would sensibly go about enumerating the allowed transitions (e.g. there might be an infinite number of them). Nevertheless, it's a perfectly sensible mathematical question to ask if a particular pair of values satisfies the relation i.e. $$(x=0, x'=\sqrt{-1})$$ satisfies our relation, even though it might make little sense for a real system that we would want to build.

# Verification

For use (2), you also define a temporal property (or several), but these are properties that you typically want to verify are true, given the definition of your system in (1). If you think about your system specification as a "set of  allowable behaviors", $$B$$, and a correctness property, similarly, as a set of behaviors $$P$$ which satisfy the property, then verification (e.g. model checking) is about ensuring that all behaviors of $$B$$ lie within $$P$$. The interesting and elegant thing to note, though, is that there is no fundamental distinction between temporal properties used for (1) defining the behavior of your system and (2) stating correctness properties of your system. In the abstract, they are the same conceptual objects i.e. temporal properties. We just intepret them differently depending on the context e.g. for specification versus verification.

# A Note on Liveness and Fairness

It is worth making one additional note about liveness and/or fairness properties. When you write a temporal property that describes the behavior of your system, you can, in general, write it as 

$$Init \wedge [][Next]_{vars} \wedge Liveness$$

where $$Liveness$$ is an additional temporal property. In TLA+, however, this additional temporal property, by convention, must take on a very specific form. That is, it specifies the fairness properties of your system i.e. what the system "must" do. These fairness constraints are just a temporal property with particular characteristics. If you allowed $$Liveness$$ to be an arbitrary temporal property, you could get into cases where you try to define a system that doesn’t really make sense, or couldn’t actually be implemented. This is discussed in the concept of "machine closure", in *[Specifying Systems](https://lamport.azurewebsites.net/tla/book.html)* and [elsewhere](https://lamport.azurewebsites.net/tla/safety-liveness.pdf). My understanding is that, in TLA+, if you always write your liveness property as a conjunction of weak/strong fairness constraints (the definitions of which are also discussed elsewhere), then your spec will always be machine closed, which means that the liveness conjunct "constrains neither the initial state nor what steps may occur" (a direct quote from *Specifying Systems* 8.9.2). I think of this like a "scheduling constraint" i.e. it just says what must eventually happen, not what is allowed to happen, and it doesn't get you into trouble with making your liveness property "too strong" such that it affects the behavior of your system as specified in awkward or undesirable ways.

