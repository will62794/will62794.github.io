---
layout: post
title:  "Inductive Invariance"
categories: tlaplus formal-methods 
---

An **invariant** of a transition system $$(S, S_0, R)$$ is a set of states $$ I $$ such that all reachable states are contained within $$ I $$. Semantically, an invariant is a set of states, but we commonly express invariants as state predicates i.e. a predicate $$ P(x) $$ that is true or false of a single state and gives rise to the corresponding set $$\{x \in S : P(x)\}$$. An **inductive invariant** is an invariant that is closed under the transition relation $$ R $$. That is, for any transition $$(s,s') \in R$$, $$(s \in I \Rightarrow s' \in I)$$.

Inductive invariants allow us to prove invariants of a system by reasoning about *states* of a system rather than *behaviors*. If we have a specification 

$$Spec \triangleq Init \wedge \square [Next]_{vars}$$ 

and want to prove that a state predicate $$ Inv $$ is an invariant of this system ($$Spec \Rightarrow \square Inv$$) we need to find an inductive invariant $$IndInv$$ and prove the following:

$$
\begin{align*}
Init &\Rightarrow IndInv &(1) \\
IndInv \wedge [Next]_{vars} &\Rightarrow IndInv' &(2)\\
\end{align*}
$$

These two statements establish that $$IndInv$$ holds in all initial states and that, on every transition, if the invariant holds currently then it will hold in the next state. Statement (1) is commonly referred to as **initiation** and (2) as **consecution**, and together they imply that $$IndInv$$ is an invariant. If we are trying to prove $$Spec \Rightarrow \square Inv$$, though, we also need to show that $$IndInv$$ is sufficient to ensure $$Inv$$. So, we need to additionally prove that

$$
\begin{align*}
IndInv \Rightarrow Inv
\end{align*}
$$

Verifying these 3 statements shows that our inductive invariant is actually an invariant and that it is a subset of our desired invariant. That is, we've shown that 

$$
\begin{align*}
Spec &\Rightarrow \square IndInv \\
IndInv &\Rightarrow Inv
\end{align*}
$$

which implies that $$Spec \Rightarrow \square Inv$$, which is what we set out to prove. 

# Finding Inductive Invariants

If we start with some invariant $$Inv$$ we want to prove, we first need to find some inductive invariant $$IndInv$$. We know that this inductive invariant must be stronger than $$Inv$$, since we need $$IndInv \Rightarrow Inv$$. This requirement suggests one strategy for finding an inductive invariant: start with $$Inv$$ and keep strengthening it until we get something that's inductive. In general, a logical formula $$X$$ is "stronger" than $$Y$$ if $$X \Rightarrow Y$$. In this context, if one invariant (or any state predicate) is stronger than another it also means that the state set satsifying the stronger invariant is a subset of the states satisfying the weaker invariant. This also raises the question of what the *strongest* possible inductive invariant is. Well, we know that an inductive invariant must be an invariant, so it cannot be smaller than the set of reachable states. The set of reachable states, however, is inductive, by nature of its definition. Any transition taken from a state in $$Reach$$ must go to another state in $$Reach$$. If it went to a state outside of $$Reach$$ that would necessarily imply the offending state must actually be in $$Reach$$. So, the set of reachable states itself is the strongest (i.e. smallest) inductive invariant. This means that any inductive invariant we try to find will fall somehwere in between the reachable state set and the invariant we are trying to prove. Formally, $$Reach \subseteq IndInv \subseteq Inv$$. This also suggests an alternative strategy to *strengthening* the original invariant. Rather, we could *weaken* the set of reachable states i.e. weaken our specification $$Spec$$ until we find a satisfactory inductive invariant.

It helps to examine this by looking at an example specification and a visual representation of its state space. Let's consider this trivial PlusCal program:

```tla
(* --algorithm simple2
variables x = 0;
begin
    l1: x := 0;
    l2: while x < 2 do
    l3:   x := x + 1;
        end while;
end algorithm; *)
```
It has a single variable $$x$$ that starts at zero and continues to increment as long as $$x < 2$$. There are at least two basic invariants of this program:

$$
\begin{align*}
I_1 &= x \geq 0 \\
I_2 &= x \leq 2
\end{align*}
$$

But are these invariants inductive? Well, let's look at the state space. If we are using the TLC model checker, we can generate the set of reachable states along with general states of $$S$$ by letting initial states range over a subset of *all possible states* e.g.

$$
\begin{aligned}
    InitAll \triangleq 
    &\wedge x \in -3..6 \\
    &\wedge pc \in \{``l1",``l2",``l3",``Done"\}
\end{aligned}

$$

 Since $$x$$ could range over integers, the full set $$S$$ is infinite, but we can explore a finite portion of it to give us intuition about its structure. In other words, we are showing a part of the complete transition relation $$R$$ as opposed to just the set of reachable states. The nodes in red are the invariant $$I_2$$ and the nodes outlined in blue are the reachable states.

<img src="/assets/simple2/state-graph-inv.svg">

In this graph it's clear that $$I_2$$ is an invariant i.e. every reachable state (outlined in blue) satisfies the invariant (filled in red). We can also visually identify why $$I_1$$ is, in fact, not inductive. We can see that the transition $$(l3,2) \rightarrow (l2,3)$$ leaves $$I_1$$. We refer to this transition as a **counterexample to induction** i.e. it is a concrete example that demonstrates that an invariant is not inductive. This makes sense based on the program logic i.e. if we are at location $$l3$$ we will take a step to increment $$x$$ regardless of the value of $$x$$. If $$x$$ happens to be $$2$$ then we we will exceed $$2$$ in the next state, violating invariant $$I_1$$, even though it holds in the current state. This can also teach us something about why the program upholds the invariant. $$l3$$ is a dangerous program point if we end up there arbitrarily, so there must be some restrictions the program enforces on how $$l3$$ can be reached. Specifically, if we've reached $$l_3$$ then it must be the case that $$x \leq 1$$, which is ensured by the condition checked at $$l_2$$. We can formalize this in the following invariant:

$$I_3 = (pc = l_3) \Rightarrow (x \leq 1)$$

It turns out that this invariant is inductive, which we can see visually:

<img src="/assets/simple2/state-graph-indinv.svg">

It does not, however, imply our original invariant $$I_1$$ i.e. we do not have $$I_3 \Rightarrow I_1$$. This is because $$I_3$$ doesn't say anything about the allowed values of $$x$$ at program locations other than $$l3$$. We can strengthen $$I_3$$ to the following:

$$
\begin{aligned}
I_3' = 
    \wedge (pc = l_3) \Rightarrow (x \leq 1) \\
    \wedge (pc \neq l_3) \Rightarrow (x \leq 2) 
\end{aligned}
$$

and visualize this by keeping the existing states of $$I_3$$ in orange and marking the states of $$I_3'$$ in light green.

<img src="/assets/simple2/state-graph-indinvp.svg">

The invariant $$I_3'$$ is inductive and it implies our original invariant, so it is sufficient to prove $$I_2$$. If we compare $$I_3'$$ sidy by side with our original invariant $$I_2$$

<img src="/assets/simple2/state-graph-indinvp-alone.svg" width="48%">
<img src="/assets/simple2/state-graph-inv.svg" width="48%">

we can additionally see that it is, in fact, the weakest possible inductive invariant that implies $$I_2$$. We removed only a single state, $$(l3,2)$$ from $$I_2$$ to produce $$I_3'$$. This was sufficient to make the invariant inductive and by removing states, it ensured that the new invariant was stronger than the original.



If we think about it from a higher level, a program upholds an invariant by always making "safe" steps. That is, a program should never take a step that may allow for an invariant violation to occur in the future. In this particular program, the only program location that increments our variable is $$l3$$, so that is the main point of interest that we need to make sure we reach in a safe way. Before we take any step, we need to be sure that we are not putting ourselves into harm's way of a potential invariant violation. This also motivates an intuitive understanding of inductive invariance and why it can always be used to prove invariance. If a system does satisfy an invariant, how does it do it? In other words, how does it "know" to avoid the invariant violation? Well, it must maintain some state throughout any execution that ensures the invariance property will never be violated. That is, a program can only make decisions based on its current state, not on its past states, so it must be that each state "protects" the system in a way from making a bad step that would cause it to violate an invariant.

For sequential programs, does partial correctness actually rely on an inductive invariant, if we only care about being in the correct state upon termination? Why does it matter how we get there, even if we take random steps that don't satisfy some invariant. Is this possible, or do we always need to be satisfying some inductive invariant as we take steps in a sequential program?

<!-- - Why do we need inductive invariants? Why are they fundamental? Why can't we just use "behavioral reasoning"?
- Strengthening invariants to get an inductive invariant.
- Examples and state space visualization of reachable states and invariants/inductive invariants for several finite state protocols. -->


<!-- 
When specifying and verifying a transition system, one of the common type of properties we want to verify are **invariants**. An invariant is a property that holds for all reachable states of a system. The natural way to express an invariant is as a state predicate e.g. a property that is true or false of a particular state. This predicate defines a corresponding set of states $$I$$: the set of all states that satisfy the predicate. If we define $$Reach$$ to be the set of all reachable states of our transition system, we can formally define an invariant as a set of states $$I$$ such that $$Reach \subseteq I$$. That is, every reachable state of the system is contained within the invariant. As a logical formula, we can write this as $$Spec \Rightarrow \square I$$, where $$Spec$$ is a formula that defines the set of reachable states of our system. -->


