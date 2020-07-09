---
layout: post
title:  "Refinement in TLA+"
categories: tlaplus formal-methods refinement
---

Refinement allows us to define a formal relationship between a higher level specification and a lower level specification. This can be viewed as an *implements* relationship i.e. a lower level specification *implements* a higher level specification. In TLA+ we can easily express this concept formally: it's logical implication. If we have a high level spec $$H$$ and a low level spec $$L$$ then the expression

$$ L \Rightarrow H $$

can be interpreted as stating that $$L$$ implements $$H$$. In other words, every behavior of $$L$$ satisfies the specification $$H$$. Put another way, every step in $$L$$ is a valid step in $$H$$. 

## Refinement Mappings

This isn't quite the whole picture, though. In simple cases, a lower level spec might be identical to a higher level spec except for some additional variables. For example, consider an hour clock that has an `hour` and a `minute` hand. The higher level version of this spec might only model `hour` but the lower level spec also models the `minute`. Every minute tick in the lower level spec $$L$$ is trivially a valid step of of the higher level spec $$H$$, because it leaves `hour` unchanged i.e. it is a stuttering step with respect to the `hour` variable. There might be cases, however, where the correspondence between lower level variables and higher level variables is not as obvious. 

For example, maybe the low level spec tries to model a clock with minute level precision differently. Instead of storing an `hour` and a `minute` variable separately, perhaps it just stores a single `minute` variable which counts the total number of minutes since the beginning of the day. So, for example, at 1:30 AM, this clock would record that state as `minute=90` (since 1:30 AM is 90 minutes past midnight, which is `minute=0`). The same information is being stored, just in a different representation. 

In this case the lower level spec only has a single variable `minute`, in contrast to the `hour` variable in the higher level spec. The statement  $$ L \Rightarrow H$$ is not valid, since the lower level states don't have a direct correspondence to higher level states. Thus, we need to define some function that describes how a lower level state maps to a higher level state. This will be a state function that depends on the variables in the lower level spec. In our case, we can describe this function as 

```tla
hour = minute / 60 
```

using integral division. We call this function a **refinement mapping**: it describes how states in a lower level specification map to states in a higher level specification.

## Checking Refinement with TLC

In TLA+ we can check refinement using TLC. Say we have a lower level spec `MinuteClockCompact` which models a high level `HourClock` spec using a single `minute` variable. To check refinement we can ask TLC if every behavior of `MinuteClockCompact` satisfies the spec of `HourClock`, after applying the refinement mapping. We can instantiate an `HourClock` module with our own substitutions, which is how we define the refinement mapping. For example, consider the following expression:

```tla
\* Our refinement mapping.
V == INSTANCE HourClock WITH hour <- (minute \div 60)
```
It instantiates an instance of the `HourClock` module but substitutes all references to `hour` with the expression `(minute \div 60)`. So, for example, the next state relation in the instantiated module `V` should, after substitution, be:

```tla
Next == hour' = ((minute \div 60) + 1) % 12
```

whereas normally it was:

```
Next == hour' = (hour + 1) % 12
```

We can then use TLC to check if `MinuteClockCompact` refines (implements) `HourClock` by checking the property `V!Spec`. This property asserts that every behavior of `MinuteClockCompact` satisfies the `HourClock` specification under the refinement mapping.


## Examining Abstraction and Refinement

In general, if we have two different specifications, we want to consider what it means for one specification to implement the other. Or, inversely, for one to abstract the other. In a sense this is one of the fundamental tasks of system verification i.e. we want to build/implement some system and show that it satisfies some higher level specification. Furthermore, we might specify a system at multiple levels of abstraction and show that each one implements the layer above it. If two specs are written at the same level of abstraction, and use the same variables, then it's easy to draw a correspondence between them, as discussed above. But if there is no direct correspondence between the variables, how do we know if one system/spec implements another? 

One approach is to look only at the *externally observable* behaviors of a system. If, to an external observer, two systems appear to behave identically, then it would seem sensible to consider the two systems equivalent, in some sense, even if the systems operate in different ways internally. This matches a definition of "implements" given by Lamport and Abadi in their paper *The Existence of Refinement Mappings*. In section 1.2 it says:

"*A specification $$S_1$$ implements $$S_2$$ if every externally observable behavior allowed by $$S_2$$ is also allowed by $$S_1$$.*"

This definition doesn't say anything about constructing a refinement mapping, it just provides a high level statement about how we should think about refinement/abstraction. The underlying model that the definition is based on, however, assumes that each system has some shared set of external variables and some set of internal variables (i.e. internal "gears") that may differ between the two specs. The "externally observable" behavior definition seems natural and intuitive, but in practice it doesn't always exactly work, since specs may not always make these external variable explicit or consistent across different specs. It might be the case, though, that one spec implements another, as we demonstrated above with the clock that used a single `minute` variable. Lamport points this out in a recent paper, [*Hiding, Refinement, and Auxiliary Variables in TLA+*](https://lamport.azurewebsites.net/tla/hiding-and-refinement.pdf). He mentions the "philosopically correct" way to express refinement and then talks about why that doesn't always work in practice. In section 5 he says that the philosophically correct way to write a spec is as follows:

$$ \exists v_1,...v_k : Spec $$ 

where $$v_1, ...,v_k$$ are *internal variables* and $$\exists$$ is the temporal existential operator. A behavior satisfies this expression if there exist some sequence of values that can be assigned to the $$v_i$$ variables to make $$Spec$$ true of that behavior. If two specs $$PC_1$$ and $$PC_2$$ are both written in this form, then $$PC_2$$ implements $$PC_1$$ if the observable part of a behavior satisfying $$PC_2$$ is the observable part of a behavior satisfying $$PC_1$$. Mathematically, we can just express implementation in this case as $$PC_2 \Rightarrow PC_1$$. This is mathematically "nice", but Lamport goes on to say:

"*In practice, implementation is implication only when both specs are written at the same level of abstraction.*"

He then gives an example of $$PC_1$$ describing a message passing algorithm and $$PC_2$$ describing an implementation of that message passing algorithm with a packet switching network. $$PC_1$$ might only describe behaviors in terms of abstract "messages". At the $$PC_2$$ layer, however, perhaps a single message is broken up into several packets that may be re-transmitted or re-ordered over the network. In this case, analogous to the minute clock example above, the variables of $$PC_2$$ only describes things in terms of low level packets, knowing nothing about a "message". It may well be the case, however, that $$PC_2$$ implements $$PC_1$$. So, Lamport concludes, in practice we just eschew the philosophical distinction between "internal" and "external" variables and just assert implementation by writing a refinement mapping.

My take on this discussion is that, philosophically, the "right" way to think about refinement/abstraction is by looking at externally observable behaviors. That, to me, seems to be a sensible way of defining equivalence between two systems. It's often the case, though, that, for two given system descriptions, the externally observable behaviors don't directly map to each other as is. The minute clock example above is a simple example of this. In the minute clock example, though, it's fairly obvious that a clock that only stores a global `minute` counter can implement a clock with both `hour` and `minute` counters. It seems that such a fact is "obvious" because it's easy to construct "virtual" external variables for the minute clock that represent the current hour in the high level system. In other words, it's like the lower level system is storing the same amount of necessary information to "simulate" or "implement" the high level system, it just stores it in a different representation. In cases like these, it seems that the externally observable values can be considered "virtual" i.e. they are a function of the internal variables. If those "virtual" external variables then exhibit the same behaviors as a high level spec, we can consider the implementation relation to hold.



