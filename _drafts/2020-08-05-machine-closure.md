---
layout: post
title:  "Machine Closure"
categories: tlaplus formal-methods
---

In TLA+ we specify a system as the conjunction of a safety property and a liveness property:

$$
Init \wedge \square [Next]_{vars} \wedge Liveness
$$

In theory, this can take the form of any temporal logic property, but we impose specific constraints on each part of this specification. $$Init$$ must be a state predicate i.e. it is a predicate over a single state (not a behavior), and $$Next$$ is an action i.e. it is a predicate over pairs of states. What are the allowed forms of the $$Liveness$$ property? Let's assume we allowed it to be an arbitrary temporal logic formula. Then, we could write a specification like the following:

$$
x=0 \wedge \square [x'= (x+1) \% 4]_{vars} \wedge \lozenge (x=4)
$$

The initial state and next state predicate (the safety part of the spec) permit behaviors like this:

$$
0,1,2,3,0,1,2,3,...
$$

While the liveness part of the spec, taken on its own, permits behaviors like this:

$$
0,1,2,3,4,5,6,7,8,...
$$

So, if we consider the conjunction of these two properties, we end up with a specification that is satisfied by no behaviors. It is impossible for any behavior that satisfies the safety property to ever be greater than 3, which makes it impossible to ever satisfy the liveness property. So, we've defined a system that can't do anything.

Lamport defines machine closure as follows:

A pair of properties $$(S, L)$$ is *machine closed* if $$S$$ is a safety property and every finite behavior satisfying $$S$$ is a prefix of an infinite behavior satisfying $$S \wedge L$$. 

It means that a scheduler can execute a program without having to worry about "painting itself into a corner".

