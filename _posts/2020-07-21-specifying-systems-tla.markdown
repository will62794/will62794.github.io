---
layout: post
title:  "Specifications and Properties in TLA+"
categories: tlaplus formal-methods refinement
---

Temporal logic, which TLA+ is based on, provides a way to describe properties about behaviors, where a behavior is an infinite sequence of states. We could call these *temporal properties* or, more simply, *properties*.  You can classify certain properties as *safety* or *liveness* properties, but those are just categorizations within the general space of properties you might care about. Roughly, a safety property is one that is violated by a finite behavior (a behavior prefix), and a liveness property is one that is violated by an infinite behavior. The paper [*Defining Liveness*](https://www.cs.cornell.edu/fbs/publications/DefLiveness.pdf) is a bit old but I think it gives clear, formal definitions of this.

In TLA+, there are basically two things you might use a temporal property for:

1. Defining the allowed behaviors of your system (used for **specification**)
2. Defining what it means for your system to be correct (used for **verification**) 

These serve two distinct purposes but they both utilize the same conceptual tool i.e you define both of these using temporal properties. We might alternately refer to use case 1 as *modeling*, but we'll use the term *specification*.

# Specification: Modeling Your System

For the case of **specification**, you can think about defining your system as the set of all behaviors that satisfy a certain temporal property. When you write a specification as 

$$ Init \wedge \square[Next]_{vars}$$ 

you are writing a temporal property. If you were going to check this specification, the model checker basically interprets this formula as you saying "find all behaviors that satisfy this property". Note that even though TLA+ chooses to represent a system definition by the initial state, next state relation formulation, you could do it in a different way, using some arbitrary temporal property. My perception of the historical development of TLA+ was that the initial state, next state relation way of describing systems was deemed practically useful and generally applicable to almost all systems you would ever want to design or specify, even if, arguably, it might not be the most abstract way you could write a specification. I believe this issue is alluded to by Lamport in a note on his [writings](https://lamport.azurewebsites.net/pubs/pubs.html) page under entry 50, *Specifying Concurrent Program Modules*, where he writes:

>...I became disillusioned with temporal logic when I saw how Schwartz, Melliar-Smith, and Fritz Vogt were spending days trying to specify a simple FIFO queue – arguing over whether the properties they listed were sufficient.  I realized that, despite its aesthetic appeal, writing a specification as a conjunction of temporal properties just didn't work in practice. So, I had my name removed from the paper before it was published, and I set about figuring out a practical way to write specifications.  I came up with the approach described in this paper, which I later called the *transition axiom* method.

Lamport also [elaborates on this in a video interview](https://www.youtube.com/watch?v=uK9yGNuGWKE&feature=youtu.be&t=1749) from 2016 (from around minute 29 to 34), where he describes how researchers started using temporal logic to specify systems. He says:

> But trying to specify safety with temporal logic formulas, is a loser, it
doesn’t work. Because what you wind up doing is writing a whole bunch of axioms. And even if the individual axioms are comprehensible, what you get by combining a whole bunch of axioms is totally incomprehensible.

And shortly after:

> ...I realized that the only way to describe the safety properties of nontrivial systems, precisely and formally, was basically using some kind of state machines. And that’s what programs are.

Here's a [link](https://archive.computerhistory.org/resources/access/text/2017/07/102717246-05-01-acc.pdf) to the full transcript of the interview. If I understand Lamport's points here accurately, this speaks to the motivation behind TLA+ and why it adopted a "transition relation" approach for specifying systems, since it works well in practice, and also seems to match our intuitive understanding of how systems actually work in the real world i.e. they take discrete steps to evolve their state according to some rules.

One point that's important to remember is that even though we might model a system in TLA+ as a state machine using an initial state and next state relation, a specification is just a mathematical formula. It cannot be "executed". It is simply a declaration about what behaviors are permitted by a system. This tripped me up when first learning TLA+ because I would see actions written like 

$$\begin{align}&\wedge x=0 \\ &\wedge x' = x + 1\end{align}$$ 

and think of them like standard variable assignment in a programming language, but this model quickly breaks down when you see actions defined like 

$$\begin{align}&\wedge x=0 \\ &\wedge x' \in \{1,2\}\end{align}$$ 

where you can't apply the same mental model. Rather, you have to think about the set of all pairs $$(x, x')$$ that satisfy the given mathematical relation i.e. in the above case we would have 

$$
(x=0, x'=1) \\
(x=0, x'=2)
$$

as valid pairs i.e. allowed transitions. To illustrate the generality of this mathematical approach, though, we can go further and consider a transition relation where it's not obvious how we would even enumerate the transitions of the relation. For example, it is valid to write a next state relation like

$$\begin{align}&\wedge x=0 \\ &\wedge x' \neq x\end{align}$$ 

but it is unclear how you would go about enumerating the allowed transitions (e.g. there might be an infinite number of them). Nevertheless, it's a perfectly sensible mathematical question to ask if a particular pair of values satisfies the relation i.e. $$(x=0, x'=\sqrt{-1})$$ satisfies our relation, even though it might make little sense for a real system that we would want to specify or build.

# Verification: Checking Your System

For the case of **verification**, you also define a temporal property (or several), but these are properties that you typically want to verify are true, given the definition of your system by an initial state and next state relation. If you think about your system specification as a set of  allowable behaviors, $$B$$, and a correctness property, similarly, as a set of behaviors $$P$$ which satisfy the property, then verification (e.g. model checking) is about checking that all behaviors of $$B$$ lie within $$P$$ i.e. $$B \subseteq P$$. Alternatively, we can express this in TLA+ as 

$$ Spec \Rightarrow P$$

where $$Spec$$ is the specification of your system and $$P$$ is a temporal property you want to check. The goal of verification is to check the truth of the above formula.

The elegant aspect of TLA+ is that there is no fundamental distinction between temporal properties used for defining the behavior of your system (specification) and stating correctness properties of your system (verification). In the abstract, they are the same conceptual objects i.e. temporal properties. We just intepret them differently depending on the context e.g. for specification versus verification.

# A Note on Liveness and Fairness

It is worth making one additional note about liveness and fairness properties. When you write a temporal property that describes the behavior of your system, you can, in general, write it as 

$$Init \wedge \square[Next]_{vars} \wedge Liveness$$

where $$Liveness$$ is an additional temporal property. In TLA+, however, this additional temporal property, by convention, must take on a very specific form. That is, it specifies fairness properties of your system i.e. what the system "must" do, as opposed to what it "can" do. These fairness constraints are just a temporal property with particular characteristics. If you allowed $$Liveness$$ to be an arbitrary temporal property, you could get into cases where you try to define a system that doesn’t make sense or couldn’t actually be implemented. This is discussed in the concept of *machine closure*, in *[Specifying Systems](https://lamport.azurewebsites.net/tla/book.html)* and [elsewhere](https://lamport.azurewebsites.net/tla/safety-liveness.pdf). My understanding is that, in TLA+, if you always write your liveness property as a conjunction of weak/strong fairness constraints (the definitions of which are also discussed elsewhere), then your spec will always be machine closed, which means that the liveness conjunct "constrains neither the initial state nor what steps may occur" (a quote from *Specifying Systems* section 8.9.2). I think of this like a scheduling constraint i.e. it says what must eventually happen, not what is allowed to happen, and it doesn't get you into trouble with making your liveness property too strong such that it affects the behavior of your system as specified in awkward or undesirable ways.

