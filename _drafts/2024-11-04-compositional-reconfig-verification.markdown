---
layout: post
title:  "Compositional Verification and Interaction Preserving Abstractions"
categories: distributed-systems verification
---

Verifying distributed protocols that support dynamic reconfiguration presents unique challenges. While compositional verification techniques have been successful for static protocols, they often break down when dealing with reconfiguration due to the complex interactions between the reconfiguration mechanism and the base protocol. We explore an approach to compositional verification that preserves these essential interactions while allowing separate reasoning about reconfiguration safety.

## Decomposing a Protocol

One way to reason about the decomposition of a protocol into subcomponents is to break up its *actions* into a set of disjoint subsets. This may not be the only way to decompose a protocol, but it is a useful starting point since actions represent the atomic units of interaction within a protocol description. We can then proceed to define notions of interactions between subcomponents of a protocol.



As a simple example, consider the following protocol specification:

$$
\small
\begin{align*}
&\text{VARIABLES } a,b,c \\ \\
&\text{Init }  \triangleq a = 0 \land b = 0 \land c = 0 \\
\\
& IncrementA  
    \triangleq \\
     &\land b = 0 \\
     &\land a' = a + b \\
     &\land \text{UNCHANGED } \langle b,c \rangle \\\\
& IncrementB 
    \triangleq \\
     & \land b' = b + 2 \\
     & \land \text{UNCHANGED } c \\ \\
& IncrementC  \triangleq \\
    &\land c' = (c + 1) \% cycle \\
    &\land c < cycle  \\
    &\land \text{UNCHANGED } b
\\\\
&\text{Next } \triangleq \\ 
&\lor IncrementA \\
&\lor IncrementB \\
&\lor IncrementC \\
\\
&\text{Inv } \triangleq a \in \{0,1\} \quad \text{(* top-level invariant. *)} \\
\\
& L1  \triangleq b \in \{0,1\} \\
& L2  \triangleq c \in \{0,1\}
\end{align*}
$$

In this case, we can consider decomposing the protocol into 2 logical sub-components, 

$$
\begin{align*}
M_1 &= \{IncrementA\}, \, Vars(M_1)=\{a,b\} \\ 
M_2 &= \{IncrementB, IncrementC\}, \, Vars(M_2)=\{b,c\}
\end{align*}
$$

with the associated state variables associated with each module indicated alongside.

In this case, it is clear that the *interaction* between $$M_1$$ and $$M_2$$ is defined in terms of their single shared variable $$b$$. Furthermore, this interaction is "uni-directional" in terms of the data flow between components, in the sense that $$M_1$$ only reads $$b$$ and $$M_2$$ only writes to $$b$$. 

<p align="center">
  <img src="/assets/compositional_protocol_interaction/composition_diagrams/composition_diagrams.001.png" alt="Simple Protocol Component Interaction" width="700">
</p>

In this simple case of component interaction it is also clear that verification of $$M_1$$ behavior's can be done only via dependence on the behavior of the interaction variable $$b$$. The full behavior of $$M_2$$ is irrelevant to the behavior of $$M_1$$, so this allows for a natural type of compositional verification. That is, we can consider all behaviors of $$M_2$$, projected to the interaction variable $$b$$, and then verify $$M_1$$ against this behavior.



## Generalized Interaction Semantics

If we choose a specific decomposition of protocol actions, then we can check whether they interact, but how can we define more generally whether two components interact? We can start at the level of single actions i.e. does one action "interact" with another? As an approximation to this notion of interaction, we can consider the set of shared variables and their read/write semantics as we did above, but can define a more general notion of "interaction". Intuitively, one action $$A$$ interacts with another action $$B$$ if $$A$$ can affect $$B$$ i.e. can $$A$$ enable/disable $$B$$ or change the resulting state aftere a $$B$$ action is taken? For example, even if $$A$$ writes to a variable that $$B$$ reads, this does not necessarily mean that the two actions interact. If both share variable $$x$$, and the $$A$$ action is something like $$x = 2 \wedge x' = 3$$, and $$B$$ has an action like like $$x = 0 \wedge x' = 10$$, then these two actions don't necessarily interact. In a sense, the actions of $A$ are "invisible" to $$B$$, since they have no effect on whether $$B$$ is enabled.

We can also try to mechanically check these notions of interaction e.g. using a symbolic verification tool or model checker.

If we check pairwise interactions between all actions of an original protocol, we can define a type of interaction graph, which can then serve as a basic for decomposition to be used for verification as we described above.

## Compositional Verification for Reconfiguration Protocol

Reconfiguration in distributed systems allows for dynamic changes to the set of participating nodes while maintaining safety properties of the underlying protocol. However, proving correctness of reconfigurable protocols is notably more difficult than their static counterparts for several reasons:

<!-- ## Compositional Verification Approach

Traditional compositional verification techniques often struggle with reconfigurable protocols because they try to completely separate the reconfiguration mechanism from the base protocol. Instead, we propose preserving the essential interactions between these components while still enabling separate reasoning about their properties.

Key aspects of this approach include:

- Identifying and preserving critical interaction points between reconfiguration and base protocol
- Defining interface properties that capture these interactions
- Separate verification of reconfiguration safety properties
- Composition theorem showing how local properties combine to ensure global correctness -->
