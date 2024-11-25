---
layout: post
title:  "Protocol Interaction Graphs and Compositional Verification"
categories: distributed-systems verification
---

When verifying larger or more complex protocols, it is often useful to break them up into smaller components, verify each component separately, and then compose the results to verify the overall protocol. Ideally we would like to be able to break down a protocol into as small components as possible, verify each component separately, and then compose the results to verify the overall protocol. There are a few approaches to doing this for protocols, which we can do by analyzing the interactions between components, and abstracting sub-components based on these interactions.

## Decomposing a Protocol

One way to reason about the decomposition of a protocol into subcomponents is to break up its *actions* into a set of disjoint subsets. This may not be the only way to decompose a protocol, but it is a useful starting point since actions represent the atomic units of interaction within a protocol description. We can then proceed to define notions of interactions between subcomponents of a protocol.



As a simple example, consider the following protocol specification:

$$
\small
\begin{align*}
&\text{VARIABLES } a,b,c \\[0.4em]
&{Init }  \triangleq \\
& \quad \land a = 0 \\
& \quad \land b = 0 \\
& \quad \land c = 0 \\[0.4em]
& IncrementA  
    \triangleq \\
     & \quad \land b = 0 \\
     & \quad \land a' = a + b \\
     &\quad \land \text{UNCHANGED } \langle b,c \rangle \\[0.4em]
& IncrementB 
    \triangleq \\
     & \quad \land b' = b + c \\
     & \quad \land \text{UNCHANGED } c \\[0.4em]
& IncrementC  \triangleq \\
    &\quad \land c' = (c + 1) \% cycle \\
    &\quad \land c < cycle  \\
    &\quad \land \text{UNCHANGED } b
\\[0.4em]
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
  <img src="https://github.com/will62794/ipa/blob/main/specs/M_uni/M_uni_interaction_graph.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="450">
</p>

In this simple case of component interaction it is also clear that verification of $$M_1$$ behavior's can be done only via dependence on the behavior of the interaction variable $$b$$. The full behavior of $$M_2$$ is irrelevant to the behavior of $$M_1$$, so this allows for a natural type of compositional verification. That is, we can consider all behaviors of $$M_2$$, projected to the interaction variable $$b$$, and then verify $$M_1$$ against this behavior.



If we check pairwise interactions between all actions of an original protocol, we can define a type of interaction graph, which can then serve as a basic for decomposition to be used for verification as we described above.

For example, we can see a concrete example of such an interaction graph the basic two-phase commit protocol, based on its specification [here](https://github.com/will62794/scimitar/blob/main/benchmarks/TwoPhase.tla):

<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/TwoPhase/TwoPhase_interaction_graph.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="720">
</p>

This interaction graph, annotated with the interaction variables along its edges, allows us to reason explicitly about the logical dataflow between actions/components of the protocol. For example, we can note that the only *outgoing* dataflow from the set of actions of the resource manager is via the `msgsPrepared` variable, which is read by the transaction manager via the `TMRcvPrepare` action. The only incoming dataflow to the resource manager sub-component is the via the `msgsAbort` and `msgsCommit` variables, which are written to by the transaction manager. This matches our intuitive notions of the protocol where the resource manager and transaction manager are logically separate processes, and only interact via specific message channels.


Is there an "interaction preserving abstraction" that exists for the transaction manager sub-component in this case? Well, if we break down the protocol into transaction manager and resource manager sub-components, then we know the only interaction points between these two sub-components are via the `{msgsCommit, msgsAbort}` (written to by RM, read by TM) and the `msgsPrepared` (read by TM, written to by RM) variables. Well, from the perspective of the transaction manager, all it knows about is the view of the `msgsPrepared` variable, and it simply waits until it is filled up with enough resource managers.

Can you also do "conditional" interaction? i.e. interaction might occur between two Raft actions in general, but may not occur between those actions executed across different term boundaries?

## Compositional Verification

To take another example, we can consider [this simplified consensus protocol](https://github.com/will62794/ipa/blob/main/specs/consensus_epr/consensus_epr.tla) for selecting a value among a set of nodes via a simple leader election protocol. There are 5 actions of this protocol, related to nodes sending out votes for a leader, a leader processing those votes, getting electing leader and a leader deciding on a value. If we want to verify the core safety property of this protocol, which $$H_NoConflictingValues$$, stating that no two nodes decide on different values, we can check this with TLC using a model with 3 nodes, `Node={n1,n2,n3}` in a few seconds, generating a reachable state space of 110,464 states.

If we examine this protocol's interaction graph, though, we see the following:
<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/consensus_epr/consensus_epr_interaction_graph.png?raw=true" alt="Simple Consensus Protocol Interaction Graph" width="720">
</p>
That is, it turns out to be quite a simple interaction graph, and in fact is amenable to a very simple form of decomposition that we can use to accelerate verification. Basically, it is easy to see that the actions `{SendRequestVote, SendVote}`, for example, operate independently from the rest of the protocol actions, interacting only via writes to the `vote_msg` variable. So, one approach to verifying this protocol is to verify the `{SendRequestVote, SendVote}` actions independently of the rest of the protocol, and then verify the rest of the protocol against this behavior. 

For example, if we model check the protocol with the pruned transition relation of

$$
\begin{align*}
Next_A &\triangleq \\
&\vee SendRequestVote\\
&\vee SendVote \\
\end{align*}
$$

we have a reachable state space of 16,128 states, which is already a ~7x reduction from the full state space. Now, since the only "interaction variable" between this sub-protocol and the rest of the protocol is the `vote_msg` variable, we can project the state space of $$Next_A$$ to the `vote_msg` variable, and verify the rest of the protocol against this projected state space. With an explicit state model checker, one way to do this would be to explicitly compute this projection and just use the projected state graph as the "assume" model to verify the remainder of the protocol against. Alternatively, we can come up with an abstraction of the $$Next_A$$ protocol that reflects this abstract behavior adequately i.e. it reflects the behavior of the `vote_msg` variable correctly. We can do this by using a simple model that basically only adds a new message into `vote_msg` if no existing node has already put such a message into `vote_msg` (i.e. since nodes can't vote twice in this model).

$$
\begin{align*}
&SendRequestVote\_SendVote(src, dst) \triangleq \\
    &\quad \land \nexists m \in vote\_msg : m[1] = src  \\
    &\quad \land vote\_msg' = vote\_msg \cup \{\langle src,dst \rangle\} \\
    &\quad \land \text{UNCHANGED } \langle vote\_request\_msg, voted, votes, leader, decided \rangle\\
\end{align*}
$$

Due to the structured nature of the interaction graph, we could continue applying this compositional rule to further reduce verification time, but even if we go ahead with this initial reduction, we can see drastic improvement. For example, now we have developed an "interaction preserving" abstraction of the $$\{SendRequestVote, SendVote\}$$ sub-protocol, we can try verifying the rest of the protocol against this abstraction e.g.

$$
\begin{align*}
Next_2 &\triangleq \\
    &\vee \exists i,j \in Node : SendRequestVote\_SendVote(i,j) \\
    &\vee \exists i,j \in Node : RecvVote(i,j) \\
    &\vee \exists i \in Node, Q \in Quorum : BecomeLeader(i,Q) \\
    &\vee \exists i,j \in Node, v \in Value : Decide(i,v)
\end{align*}
$$

Model checking the above protocol ($$Next_2$$) with TLC, produces 514 distinct reachable states, a > 200x reduction from the original state space. So, in this case, with only a simple dataflow/interaction analysis, we were able to reduce the hardest model checking problem by a factor of ~10x e.g. in this case model checking of the `{SendRequestVote, SendVote}` sub-protocol was the most expensive verification sub-problem e.g. we would need to verify that $$Next_A$$ is a valid abstraction of the `{SendRequestVote, SendVote}` sub-protocol.

**TODO:** how exactly do we check that one abstraction is "interaction preserving" w.r.t some interaction variable, like in the consensus_epr example? just a refinement check?


## Generalized Interaction Semantics

If we choose a specific decomposition of protocol actions, then we can check whether they interact, but how can we define more generally whether two components interact? We can start at the level of single actions i.e. does one action "interact" with another? As an approximation to this notion of interaction, we can consider the set of shared variables and their read/write semantics as we did above, but can define a more general notion of "interaction". Intuitively, one action $$A$$ interacts with another action $$B$$ if $$A$$ can affect $$B$$ i.e. can $$A$$ enable/disable $$B$$ or change the resulting state aftere a $$B$$ action is taken? For example, even if $$A$$ writes to a variable that $$B$$ reads, this does not necessarily mean that the two actions interact. If both share variable $$x$$, and the $$A$$ action is something like $$x = 2 \wedge x' = 3$$, and $$B$$ has an action like like $$x = 0 \wedge x' = 10$$, then these two actions don't necessarily interact. In a sense, the actions of $A$ are "invisible" to $$B$$, since they have no effect on whether $$B$$ is enabled.

We can also try to mechanically check these notions of interaction e.g. using a symbolic verification tool or model checker.

Note that syntactic checks of action interaction are conservative, and may determine that two actions interact, even when they (semantically) do not. For this, we need a more precise, fine-grained notion of "interaction" (i.e. independence). This notion bears similarity to the notion of independence used in classical partial order reduction techniques, and we can in theory do these kinds of checks statically, though we may need assistance of a symbolic checker i.e. SAT/SMT solver to check these interactino conditions in general. These ideas also appear in [earlier papers](https://www-old.cs.utah.edu/docs/techreports/2003/pdf/UUCS-03-028.pdf) on SAT-based partial order reduction.


## Conclusions

The ideas and techniques discussed above are similar to various types of compositional verification techniques that have been applied in various contexts. Similar ideas are utilized in the "interaction preserving abstraction" techniques in [this paper](https://arxiv.org/abs/2202.11385), and also in the work on *[recomposition](https://iandardik.github.io/assets/papers/recomp_fmcad24.pdf)*, which builds similar techniques within the TLC model checker. The notion of using dataflow to analyze distributed and concurrent protocols has also appeared in various works in the past (e.g. [distributed data flow](https://www.cs.cornell.edu/~krzys/krzys_debs2009.pdf)), and also more [recent work](https://dl.acm.org/doi/10.1145/3639257) on using a Datalog like variant to automatically optimize distributed protocols using pre-defined rewrite rules.