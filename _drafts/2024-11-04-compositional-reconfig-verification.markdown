---
layout: post
title:  "Interaction Graphs for Protocol Decomposition"
categories: distributed-systems verification
---

<!-- When verifying complex protocols, it is often useful to break them up into smaller components, verify each component separately, and then compose the results to verify the overall protocol. Ideally we would like to be able to break down a protocol into as small components as possible, verify each component separately, and then compose the results to verify the overall protocol. There are a few approaches to doing this for protocols, which we can do by analyzing the interactions between components, and abstracting sub-components based on these interactions. -->

<!-- ## Protocol Decomposition via Interaction Graphs -->

Concurrent and distributed protocols can be formally viewed as a set of logical *actions*, which symbolically describe the set of allowed transitions the system can take. We may want to analyze the structure of a protocol's actions, though, to understand the interaction between them and to reason about a protocol's underlying compositional structure e.g. for improving verification efficiency when possible. One approach to reasoning about the decomposition of a protocol into subcomponents is to break up its actions into a set of disjoint subsets, and view each subset as a separate logical component. This is a useful starting point for decomposition of protocols since actions represent the atomic units of behavior within a protocol specification. We can also use this basic type of decomposition to define various formal notions of *interaction* between subcomponents of a protocol.

<!-- , which illustrates the logical interaction structure of a protocol and can also be used for accelerating verification for some protocols with the adequate interaction structure. -->

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

with the state variables associated with each module indicated alongside.

In this case, it is clear that the *interaction* between $$M_1$$ and $$M_2$$ can be defined in terms of their single shared variable, $$b$$. Furthermore, this interaction is "uni-directional" in terms of the data flow between components, in the sense that only $$M_1$$ reads from $$b$$ and only $$M_2$$ writes to $$b$$. 

<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/M_uni/M_uni_interaction_graph.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="430">
</p>

In this simple case of component interaction it is also clear that verification of $$M_1$$ behavior's can be done only via dependence on the behavior of the interaction variable $$b$$. The full behavior of $$M_2$$ is irrelevant to the behavior of $$M_1$$, so this allows for a natural type of compositional verification. That is, we can consider all behaviors of $$M_2$$, projected to the interaction variable $$b$$, and then verify $$M_1$$ against this behavior. If we check pairwise interactions between all actions of an original protocol, we can produce this type of interaction graph as shown above, which can serve as a basis for protocol decomposition.

To take another example, we can consider [this simplified consensus protocol](https://github.com/will62794/ipa/blob/main/specs/consensus_epr/consensus_epr.tla) for selecting a value among a set of nodes via a simple leader election protocol. There are 5 actions of this protocol, related to nodes sending out votes for a leader, a leader processing those votes, getting electing leader and a leader deciding on a value. If we examine this protocol's interaction graph, we obtain the following:
<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/consensus_epr/consensus_epr_interaction_graph.png?raw=true" alt="Simple Consensus Protocol Interaction Graph" width="720">
</p>

In this protocol, we can see its interaction graph admits quite a simple structure, with nearly unidirectional dataflow between most actions. We can utilize this for accelerating verification as we discuss below.


We can see another concrete example of an interaction graph, for the two-phase commit protocol, based on the protocol specification [here](https://github.com/will62794/scimitar/blob/main/benchmarks/TwoPhase.tla):

<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/TwoPhase/TwoPhase_interaction_graph.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="750">
</p>

This interaction graph, annotated with the interaction variables along its edges, makes explicit the logical dataflow between actions of the protocol, and also suggests natural action groupings for decomposition. For example, we can note that the only outgoing dataflow from the set of actions of the resource manager is via the $$msgsPrepared$$ variable, which is read by the transaction manager via the $$TMRcvPrepare$$ action. The only incoming dataflow to the resource manager sub-component is the via the $$msgsAbort$$ and $$msgsCommit$$ variables, which are written to by the transaction manager. This matches our intuitive notions of the protocol where the resource manager and transaction manager are logically separate processes, and only interact via specific message channels.

## Compositional Verification

The decomposition notions above based on interaction graphs provide a way to consider a protocol decomposition in terms of how its fine-grained atomic sub-components interact. We can take this concept further and utilize this structure for a kind of compositional verification for certain interaction graph structures that are amenable to this type of analysis.

### Simple Consensus Protocol

If we consider, for example, the interaction graph of the simple consensus protocol from above, its simple interaction graph makes it directly amenable to a very simple form of accelerated compositional verification. If we want to verify the core safety property of this protocol, $$NoConflictingValues$$, which states that no two nodes decide on different values, we can check this with TLC using a model with 3 nodes, `Node={n1,n2,n3}` in a few seconds, generating a reachable state space of 110,464 states.

From the interaction graph, it is easy to see that the actions $$\{SendRequestVote, SendVote\}$$, operate independently from the rest of the protocol actions, interacting only via writes to the `vote_msg` variable. So, one approach to verifying this protocol is to start by verifying the $$\{SendRequestVote, SendVote\}$$ actions independently of the rest of the protocol, and then verify the rest of the protocol against this behavior. More specifically, the overall protocol only depends on the observable behavior of this $$\{SendRequestVote, SendVote\}$$ sub-component with respect to the `vote_msg` variable.

For example, if we model check the protocol with the pruned transition relation of

$$
\begin{align*}
Next_A &\triangleq \\
&\vee SendRequestVote\\
&\vee SendVote \\
\end{align*}
$$

we find 16,128 distinct reachable states, a ~7x reduction from the full state space. Now, since the only "interaction variable" between this $$Next_A$$ sub-protocol and the rest of the protocol is the `vote_msg` variable, we can project the state space of $$Next_A$$ to the `vote_msg` variable, and verify the rest of the protocol against this projected state space. With an explicit state model checker, one way to do this would be to explicitly compute this projection and just use the projected state graph as the "assume" model to verify the remainder of the protocol against. Alternatively, we can come up with an *abstraction* of the $$Next_A$$ protocol that reflects this abstract behavior adequately i.e. it reflects the behavior of the `vote_msg` variable correctly. 

For example, consider the following simple model that adds a new message into `vote_msg` only if no existing node has already put such a message into `vote_msg` (i.e. since nodes can't vote twice in the original protocol):

$$
\begin{align*}
&SendRequestVote\_SendVote(src, dst) \triangleq \\
    &\quad \land \nexists m \in vote\_msg : m[1] = src  \\
    &\quad \land vote\_msg' = vote\_msg \cup \{\langle src,dst \rangle\} \\
    &\quad \land \text{UNCHANGED } \langle vote\_request\_msg, voted, votes, leader, decided \rangle\\
\end{align*}
$$

Due to the structured, acyclic nature of this protocol's interaction graph, we could continue applying this compositional rule to further reduce verification time, but even if we go ahead with this initial reduction, we can see drastic improvement. For example, now we have developed an "interaction preserving" abstraction of the $$\{SendRequestVote, SendVote\}$$ sub-protocol, we can try verifying the rest of the protocol against this abstraction e.g.

$$
\begin{align*}
Next_2 &\triangleq \\
    &\vee \exists i,j \in Node : SendRequestVote\_SendVote(i,j) \\
    &\vee \exists i,j \in Node : RecvVote(i,j) \\
    &\vee \exists i \in Node, Q \in Quorum : BecomeLeader(i,Q) \\
    &\vee \exists i,j \in Node, v \in Value : Decide(i,v)
\end{align*}
$$

Model checking the above protocol ($$Next_2$$) with TLC, produces 514 distinct reachable states, a > 200x reduction from the original state space. 

So, in this case, with only a simple dataflow/interaction analysis, we were able to reduce the hardest model checking problem by a factor of ~10x e.g. in this case model checking of the $$Next_A$$ sub-protocol was the most expensive verification sub-problem e.g. we would need to verify that $$Next_A$$ is a valid abstraction of the `{SendRequestVote, SendVote}` sub-protocol.

### Two Phase Commit Protocol


Is there an "interaction preserving abstraction" that exists for the transaction manager sub-component in the two-phase commit protocol? Well, if we break down the protocol into transaction manager and resource manager sub-components, then we know the only interaction points between these two sub-components are via the $$\{msgsCommit, msgsAbort\}$$ (written to by RM, read by TM) and the $$msgsPrepared$$ (read by TM, written to by RM) variables. 

<p align="center">
  <img src="https://github.com/will62794/ipa/blob/main/specs/TwoPhase/TwoPhase_interaction_graph_partitioned.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="750">
</p>

From the perspective of the transaction manager, all it knows about is the view of the `msgsPrepared` variable, and it simply waits until it is filled up with enough resource managers. So, we can consider this abstraction of the `RM`:

$$
\begin{align*}
&RMAtomic(rm) \triangleq \\
&\quad \land msgsCommit = \{\} \\
&\quad \land msgsAbort = \{\} \\
&\quad \land msgsPrepared' = msgsPrepared \cup \{[type \mapsto Prepared, rm \mapsto rm]\} \\
&\quad \land \text{UNCHANGED } \langle tmState, tmPrepared, rmState, msgsCommit, msgsAbort \rangle
\end{align*}
$$

We can model check the original two-phase commit protocol with 4 resource managers, $$RM=\{rm1,rm2,rm3,rm4\}$$, for the main $$Consistency$$ safety property,

$$
\small
Consistency \triangleq \forall rm_1, rm_2 \in RM : \neg (rmState[rm_1] = aborted \wedge rmState[rm_2] = committed)
$$

and find that it has 1568 reachable states. If we instead model check the protocol against the $$RMAtomic$$ abstraction

$$
\begin{align*}
Next_{TwoPhase_A} &\triangleq \\
    &\lor RMAtomic(rm) \triangleq \\
    &\lor \exists rm \in RM : TMRcvPrepared(rm) \\
    &\lor \exists rm \in RM : TMAbort(rm) \\
    &\lor \exists rm \in RM : TMCommit(rm)
\end{align*}
$$

we find 163 reachable states, a ~10x reduction. 

In this example, though, the original interaction between these two logical sub-components ($$RM$$ and $$TM$$) was not as simple as the acyclic dataflow of the simple consensus protocol, so just doing the above verification step is not sufficient to establish the top level safety property. That is, we actually need to show formally that this `RMAtomic` abstraction is truly "interaction preserving". That is, we need to prove that it would behave the same as the original component with respect to the interaction variables, $$\{msgsCommit, msgsAbort, msgsPrepared\}$$. In general, one way to show this would be to show that the RMAtomic component is, formally, an abstraction of the original $$RM$$ component, i.e. that $$RM$$ is a refinement of $$RMAtomic$$, roughly, that

$$
Next_{RM} \Rightarrow RMAtomic
$$

In general, though proving this refinement may be hard, and require development of auxiliary invariants to constrain the interaction variables suitably (?) to prove this step refinement condition.

<!-- In this case, it is fairly easy to intuitively see why this is true. For example, we can first consider actions that write to `msgsPrepared` in the original component and the abstracted one. Only the `RMPrepare` action of the original sub-component do this,  -->

## Generalized Interaction Semantics

Note that the above notions of action interaction are essentially based on static, syntactic checks, and so are in fact conservative. That is, they may determine that two actions interact, even when they, in a semantic sense, do not. For this, we need a more general notion of "interaction" (i.e. independence). 

The notion of interaction/independence we can use bears similarity to the independence notions that appear classical partial order reduction techniques. 
<!-- and we can in theory do these kinds of checks statically, though we may need assistance of a symbolic checker i.e. SAT/SMT solver to check these interactino conditions in general.  -->
Related ideas also appear in [earlier papers](https://www-old.cs.utah.edu/docs/techreports/2003/pdf/UUCS-03-028.pdf) on SAT-based partial order reduction, which use SAT solvers to check these symbolic independence conditions.

<!-- If we choose a specific decomposition of protocol actions, then we can check whether they interact, but how can we define more generally whether two components interact? We can start at the level of single actions i.e. does one action "interact" with another? As an approximation to this notion of interaction, we can consider the set of shared variables and their read/write semantics as we did above, but can define a more general notion of "interaction".  -->
Intuitively, we can say that one action $$A$$ "interacts" with another action $$B$$ if $$A$$ can affect $$B$$. That is, $$A$$ can either enable/disable $$B$$ or it could change the resulting state after a $$B$$ action is taken. This gives more rise to a more precise notion of interaction compared to our read/write static analysis above. For example, even if $$A$$ writes to a variable that $$B$$ reads, this does not necessarily mean that the two actions interact. If both share variable $$x$$, and $$A$$ is defined as something like 

$$ 
\begin{aligned}
&A \triangleq \\
&\quad \wedge x = 1 \\
&\quad \wedge x' = 2
\end{aligned}
$$

and $$B$$ as something like like 

$$
\begin{aligned}
&B \triangleq \\
&\quad \wedge x = 0 \\
&\quad \wedge x' = 3
\end{aligned}
$$

then these two actions don't "truly" interact. In a sense, the actions of $$A$$ will always be "invisible" to $$B$$, since they have no effect on whether $$B$$ is enabled or on the outcome after a $$B$$ action is taken.

<!-- We can also try to mechanically check these notions of interaction e.g. using a symbolic verification tool or model checker. -->

Essentially, one way to define interaction is in terms of the semantic behavior of actions i.e. can one action "observe" the effect of another action? As we stated, there are two ways such an action can functionally observe the effect of another action. It can either (1) affect its precondition i.e. enable/disable it, or it can (2) affect the outcome of that action transition i.e. it affects the action's postcondition. We can encode these two properties for generic actions $$Action1, Action2$$ as follows, written as temporal logic formulas stating whether $$Action1$$ interacts with/affects $$Action2$$:

$$
\begin{aligned}
Independence &\triangleq \\
    \wedge& \square[(({\small\text{ENABLED }} Action2) \wedge Action1 ) \Rightarrow Action2_{Pre}']_{vars} \\
    \wedge& \square[((\neg {\small\text{ENABLED }} Action2) \wedge Action1 ) \Rightarrow ~Action2_{Pre}']_{vars}\\[0.5em]
Commutativity &\triangleq \square[Action1 \Rightarrow (Action2_{PostExprs} = Action2_{PostExprs}')]_{vars}
\end{aligned}
$$

and $$Action2_{Pre}$$ and $$Action2_{PostExprs}$$ represent the formula of $$Action2$$'s precondition and postcondition/update variables, respectively.

This definition provides a more precise notion of interaction between two actions, for which the syntactic checks we defined above are an overapproximation. For example, in the case of the simple consensus protocol, its semantic interaction graph based on these new property definitions turns out to be the same as the one based on read/write interactions, since the read/write relationships already capture the semantic interaction accurately. For the two-phase commit protocol, however, its semantic interaction graph differs, as follows:

<figure id="2pc-semantic-interaction-graph">
  <p align="center">
    <img src="https://github.com/will62794/ipa/blob/main/specs/TwoPhase/TwoPhase_semantic_interaction_graph.png?raw=true" alt="Two Phase Commit Protocol Interaction Graph" width="750">
  </p>
  <figcaption>Semantic interaction graph for the two-phase commit protocol, based on the independence conditions above.</figcaption>
</figure>

We can see, for example, that the $$RMRcvAbortMsg$$ and $$RMRcvCommitMsg$$ actions are determined as interacting in the original, read/write interaction graph, but in the refined, semantic interaction graph, they do not interact. This is clear if we look at the underlying actions:

$$
\small
\begin{aligned}
&RMRcvCommitMsg(rm) \triangleq \\
&\quad \land \langle \text{Commit} \rangle \in msgsCommit \\
&\quad \land rmState' = [rmState \text{ EXCEPT }![rm] = \text{committed}] \\
&\quad \land \text{UNCHANGED } \langle tmState, tmPrepared, msgsPrepared, msgsCommit, msgsAbort \rangle \\[1em]
&RMRcvAbortMsg(rm) \triangleq \\
&\quad \land \langle \text{Abort} \rangle \in msgsAbort \\
&\quad \land rmState' = [rmState \text{ EXCEPT }![rm] = \text{aborted}] \\
&\quad \land \text{UNCHANGED } \langle tmState, tmPrepared, msgsPrepared, msgsCommit, msgsAbort \rangle
\end{aligned}
$$

From a naive syntactic analysis, we may determine that both actions read from the $$rmState$$ variable (e.g. in their postcondition), and both write to that variable as well. In reality, though, the updates of both actions don't actually end up depending on the value of $$rmState$$, so writes to it don't "interact with"/"affect" these actions. Thus, these actions can be considered as semantically independent. This leads to the slightly refined version of the interaction graph shown in the [figure above](#2pc-semantic-interaction-graph).

<!-- From the interaction graph [above](#2pc-semantic-interaction-graph), we can apply some simple rewrites to derive an interaction prerserving abstraction. If we take the $$RMChooseToAbort$$, we can try to rewrite this somehow to preserve its interactions with the rest of the components. It interacts with $$RMRcvAbortMsg$$ and $$RMRcvCommitMsg$$ only via $$rmState$$, and similarly for $$RMPrepare$$, which is in fact the only action that can observe its transitions. So, we what if we merge it with $$RMPrepare$$? If we do this, then we need to preserve this merged node's interaction with $$RMPrepare$$.  -->

<!-- We know that $$RMChooseToAbort$$ transitions a resource manager to state `"aborted"` if that resource manager's state is currently `"working"`, so we need to preserve these externally visible transitions. The only way that $$RMChooseToAbort$$ can affect $$RMPrepare$$ -->

<!-- $$
\small
RMChooseToAbort(rm) \triangleq \neg \langle \text{Commit} \rangle \in msgsCommit \Rightarrow RMChooseToAbort(rm)
$$ -->

Note that there is a practical tradeoff between the read/write interaction analysis and the semantic interaction analysis. The former can in theory be done statically, based only on syntactic analysis of actions, whereas the semantic notions of interaction may require some symbolic analysis i.e. to check the independence conditions properly may require a SAT/SMT query. In general, though, this may be worth it if the semantic interactions can help us reduce verification times significantly, especially since these conditions can be produced automatically, without any kind of special synthesis procedure needed (e.g. in the case of inductive/loop invariant synthesis).

<!-- ## Conditional Interaction

TODO. Explore conditional interaction for Paxos based ballots.

-->

<!-- ## Questions

- **TODO:** how exactly do we check that one abstraction is "interaction preserving" w.r.t some interaction variable, like in the consensus_epr example? just a refinement check?
- Note that for some interactions that are "read only", this may be even a more fine-grained distinction in the sense that the read variable may only appear in the precondition of an action, and so may only *restrict* the behavior of the component that reads from this variable.
- Can you also do "conditional" interaction? i.e. interaction might occur between two Raft actions in general, but may not occur between those actions executed across different term boundaries? -->

## Conclusions

The ideas and techniques discussed above are similar to various types of compositional verification techniques that have been applied in various contexts. Similar ideas are utilized in the "interaction preserving abstraction" techniques in [this paper](https://arxiv.org/abs/2202.11385), and also in the work on *[recomposition](https://iandardik.github.io/assets/papers/recomp_fmcad24.pdf)*, which builds similar techniques within the TLC model checker. The notion of using dataflow to analyze distributed and concurrent protocols has also appeared in various works in the past (e.g. [distributed data flow](https://www.cs.cornell.edu/~krzys/krzys_debs2009.pdf)), and also more [recent work](https://dl.acm.org/doi/10.1145/3639257) on using a Datalog like variant to automatically optimize distributed protocols using pre-defined rewrite rules.