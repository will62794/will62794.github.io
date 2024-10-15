---
layout: post
title:  "Inductive Proof Graphs"
categories: distributed-systems
---

If we want to formally prove that a system satisfies some safety property (i.e. an invariant), we can do this by finding an *inductive invariant*. An inductive invariant is a particular type of invariant that is at least as strong as the target invariant to be proven, and is also *inductive*, meaning that it is closed under all transitions of the system.

For example, for a [formal specification of the two-phase commit protocol](https://github.com/will62794/scimitar/blob/c730a3c0dd410c70ef6ffc79a609d15e9b17fda2/benchmarks/TwoPhase.tla), we may want to establish the core safety property stating that no two resource managers can end up in conflicting commit/abort states:

$$
\small  
\newcommand{\stext}[1]{\small\text{#1}}
\begin{align*}
&TCConsistent \triangleq{} \\
  % A state predicate asserting that two RMs have not arrived at          \\
  % conflicting decisions.                                                \\
  &\hspace{1cm}\forall rm_i, rm_j \in RM : \neg (rmState[rm_i] = \stext{ABORTED} \land rmState[rm_j] = \stext{COMMITTED})
\end{align*}
$$

A possible inductive invariant for establishing this property (along with [its formal proof in TLAPS](https://github.com/will62794/scimitar/blob/c730a3c0dd410c70ef6ffc79a609d15e9b17fda2/benchmarks/TwoPhase_IndProofs.tla)) may look like the following conjunction of smaller, lemma invariants:

$$
\newcommand{\stext}[1]{\small\text{#1}}
\small
\begin{align*}
Inv73 &\triangleq \forall rm_i,rm_j \in \text{RM} : \neg(rmState[rm_i] = \stext{COMMITTED}) \lor \neg(rmState[rm_j] = \stext{WORKING}) \\
Inv23 &\triangleq \forall rm_i \in \text{RM} :  (rmState[rm_i] = \stext{ABORTED}) \Rightarrow  (\langle \stext{Commit} \rangle \notin msgsCommit)\\
Inv11 &\triangleq \forall rm_j \in \text{RM} : \neg(\langle \stext{Abort} \rangle \in msgsAbort) \lor \neg(rmState[rm_j] = \stext{COMMITTED}) \\
Inv2 &\triangleq \forall rm_i \in \text{RM} : \neg(\langle {\stext{Commit}} \rangle \in msgsCommit) \lor \neg(rmState[rm_i] = \stext{WORKING}) \\
Inv1 &\triangleq (\langle \stext{Abort} \rangle \in msgsAbort) \Rightarrow (\langle \stext{Commit} \rangle \notin msgsCommit) \\
Inv53 &\triangleq \forall rm_i \in \text{RM} : \neg(rmState[rm_i] = \stext{COMMITTED}) \lor \neg(tmState = \text{"init"}) \\
Inv1140 &\triangleq \forall rm_i \in \text{RM} : (rmState[rm_i] = \stext{PREPARED}) \lor (\neg(tmPrepared = \text{RM}) \lor \neg(tmState = \text{"init"})) \\
Inv16 &\triangleq \forall rm_i \in \text{RM} : (rmState[rm_i] = \stext{WORKING}) \Rightarrow (tmPrepared \neq \text{RM}) \\
Inv1325 &\triangleq \forall rm_j \in \text{RM} : (rmState[rm_j] = \stext{PREPARED}) \lor \neg(rm_j \in tmPrepared) \lor \neg(tmState = \text{"init"}) \\
Inv1291 &\triangleq \forall rm_j \in \text{RM} : (rmState[rm_j] = \stext{PREPARED}) \lor \neg(\langle \stext{Prepared}, rm \mapsto rm_j \rangle \in msgsPrepared) \lor \neg(tmState = \text{"init"}) \\
Inv29 &\triangleq \forall rm_i \in \text{RM} : (\langle \stext{Prepared}, rm \mapsto rm_i \rangle \in msgsPrepared) \Rightarrow (rmState[rm_i] \neq \stext{WORKING}) \\
Inv4 &\triangleq (tmState = \text{"init"}) \Rightarrow (\langle \stext{Commit} \rangle \notin msgsCommit) \\
Inv7 &\triangleq (tmState = \text{"init"}) \Rightarrow (\langle \stext{Abort} \rangle \notin msgsAbort) \\
\end{align*}
$$

$$
\small
\begin{align*}
Ind \triangleq{}& \\
  &\land TCConsistent \\
  &\land Inv73 \\
  &\land Inv23 \\
  &\land Inv2 \\
  &\land Inv16 \\
  &\land Inv1325 \\
  &\land Inv1291 \\
  &\land Inv29 \\
  &\land Inv11 \\
  &\land Inv1 \\
  &\land Inv53 \\
  &\land Inv1140 \\
  &\land Inv7 \\
  &\land Inv4
\end{align*}
$$

It is relatively straightforward to observe that these individual lemmas establish various important facts/invariants about the protocol, but,
in this form, it is still quite difficult to understand the logical structure of such an inductive invariant and how it represents the correctness argument for establishing the top-level safety property, $$TCConsistent$$.

Instead we can view inductive invariants through the lens of an *inductive proof graph*, a graph structure that explicitly represents the compositional structure of an inductive invariant. We can do this by breaking down the logical structure of a monolithic inductive invariant like the one shown above, which is stated simply as a conjunction of many lemmas. Specifically, for any inductive invariant of the form 

$$
Ind = S \wedge  L_1 \wedge \dots \wedge L_k
$$

each lemma in this overall invariant may only depend inductively on some other subset of lemmas in $$Ind$$. More formally, for a system $$M=(I,T)$$, with transition relation $$T$$, proving the main induction step for such an invariant requires establishing validity of the following formula

$$
\begin{align}
    (S \wedge L_1 \wedge \dots \wedge L_k) \wedge T \Rightarrow (S \wedge L_1 \wedge \dots \wedge L_k)'
\end{align}
$$

This can be decomposed into the following set of independent proof obligations:

$$
\begin{align}
    \begin{split}
        (S \wedge L_1 \wedge \dots \wedge L_k) &\wedge T \Rightarrow S' \\
        (S \wedge L_1 \wedge \dots \wedge L_k) &\wedge T \Rightarrow L_1' \\
        &\vdots \\[0.1em]
        (S \wedge L_1 \wedge \dots \wedge L_k) &\wedge T \Rightarrow L_k'
    \end{split}
\end{align}
$$

For distributed and concurrent protocols, the transition relation of a system $$M=(I,T)$$ is typically a disjunction of several distinct actions i.e., $$T=A_1 \vee \dots \vee A_n$$. So, each node of a lemma support graph can be augmented with sub-nodes, one for each action of the overall transition relation. Lemma support edges in the graph then run from a lemma to a specific action node, rather than directly to a target lemma. Incorporation of this action-based decomposition now lets us define the full inductive proof graph structure. The following figure shows an abstract inductive proof graph for a system along with its corresponding inductive proof obligations at each node.

<p align="center">
  <img src="/assets/ind-proof-graphs/abstract-ind-proof-graph.png" alt="Abstract Inductive Proof Graph" width="500">
</p>





<!-- Instead, we can take advantage of the udnerlying compositional structure of an inductive invariant to develop an inductive proof graph, which is a graph structure corresponds to an inductive invariant while explicitly representing the induction relationships between protocol transitions/actions and lemmas of the invariant. -->

For example,the following is an inductive proof graph for the *TwoPhase* protocol that correspons to the inductive invariant above:

<p align="center">
  <img src="/assets/ind-proof-graphs/TwoPhase_ind-proof-tree-sd1.png" alt="Inductive Proof Graph Example" width="700">
</p>

Green nodes represent individual lemma invariants, gray nodes represent protocol actions, while the edges show the dependencies between them. This visual representation helps in understanding the logical flow and compositional nature of the inductive invariant.

For example, $$Inv11$$ supports the top level safety property via the *RMRcvAbortMsg* action, stating that

$$
\small
Inv11 \triangleq \forall rm_j \in \text{RM} : (\langle \stext{Abort} \rangle \in msgsAbort) \Rightarrow \neg(rmState[rm_j] = \stext{COMMITTED}) 
$$

That is, if an abort message has been sent, then no resource manager can be in a committed state. The preservation of this invariant is sufficient to prevent violation of the safety property $$TCConsistent$$ via some *RMRcvAbortMsg* action, since it ensures no abort messages can be present in the system if some resource manager has already committed. 

We can trace the lineage of this lemma logically backward, to its own two support lemmas:

$$
\small
\begin{align}
Inv53 &\triangleq \forall rm_i \in \text{RM} : (tmState = \stext{init}) \Rightarrow \neg(rmState[rm_i] = \stext{COMMITTED}) \\
Inv1 &\triangleq (\langle \stext{Abort} \rangle \in msgsAbort) \Rightarrow (\langle \stext{Commit} \rangle \notin msgsCommit) 
\end{align}
$$

The first, $$Inv53$$, prevents the presence of any committed resource managers in the initial state. Similarly, $$Inv1$$ ensures that presence of an abort message in the system precludes the presence of a commit message, since this could *lead* to a resource manager then becoming committed. 

Finally, both of these lemmas, $$Inv53$$ and $$Inv1$$, are then supported by 

$$
\small
\begin{align}
Inv7 &\triangleq (tmState = \text{"init"}) \Rightarrow (\langle \stext{Abort} \rangle \notin msgsAbort) \\
Inv4 &\triangleq (tmState = \text{"init"}) \Rightarrow (\langle \stext{Commit} \rangle \notin msgsCommit)
\end{align}
$$

which ensure that, initially, no commit/abort messages can be present in the system.

### Variable Slices

Note that an additional feature afforded by the compositional structure of these inductive proof graphs is the notion of *variable slices*. That is, at each individual node of the proof graph, we are able to statically determine a subset of state variables that are relevant for support lemmas needed to discharge that node. This variable slcie is determined based on a static analysis of the lemma and action node pair. In the graph above, action nodes are annotated with their variable slices below. For example, for the RMRcvAbortMsg action of the *Safety* lemma node, the variable slice is $$\{msgsAbort, rmState\}$$, meaning that any support lemmas required to discharge this node need only refer to those state variables. This can be seen in its single support lemma, $$Inv11$$, for example, which refers to exactly those state variables. 

These variable slices are useful both for automated inductive invariant inference and also for human guided developmnt, since they provide a formal way to focus attention on, ideally, a small subset of relevant state variables. With monolithic representations of inductive invariants as shown above, it is often unclear which variables are relevant for a given lemma/action pair, making this reasoning task burdensome. 

### Cyclic Proof Graphs

Note that the definition of proof graphs do not imply any restriction on cycles in a valid inductive proof graph. A simple example of a purely cyclic proof graph is as follows. Consider a simple ring counter system with 3 state variables, $$a,b$$, and $$c$$, where a single value gets passed from 𝑎 to 𝑏 to 𝑐 and exactly one variable holds the value at any time. An inductive invariant establishing the property that 𝑎 always has a well-formed value will consist of 3 properties that form a 3-cycle, each stating that 𝑎,𝑏 and 𝑐’s state are, respectively, always well-formed.

$$
\begin{align*}
&\text{VARIABLES } a,b,c \\ \\
&\text{Init }  \triangleq a = 1 \land b = 0 \land c = 0 \\
\\
& A  \triangleq a > 0 \land b' = a \land a' = 0 \land \text{UNCHANGED } c \\
& B \triangleq b > 0 \land c' = b \land b' = 0 \land \text{UNCHANGED } a \\
& C \triangleq c > 0 \land a' = c \land c' = 0 \land \text{UNCHANGED } b \\
\\
&\text{Next } \triangleq A \lor B \lor C \\
\\
&\text{Inv } \triangleq a \in \{0,1\} \quad \text{(* top-level invariant. *)} \\
\\
& L1  \triangleq b \in \{0,1\} \\
& L2  \triangleq c \in \{0,1\}
\end{align*}
$$

To prove the top-level invariant, $$Inv$$, we need a sufficiently strong inductive invariant. Using $$Ind = Inv \wedge L_1 \wedge L_2$$ works for this, since it establishes that all of $$a,b,c$$ are in valid states. The inductive proof graph for this invariant, though, is a pure cycle containing these 3 lemma nodes:


<p align="center">
  <img src="/assets/ind-proof-graphs/3cycle.png" alt="Inductive Proof Graph Example" width="490">
</p>


### Conclusions

At a high level, these proof graphs essentially make explicit the kind of backward reasoning that is applied when trying to show correctness of a safety property. That is, we work backwards via protocol actions, finding
invariants that must be required to hold true in prior steps in order for the system to always be safe with respect to some target property in question. In some ways, we can also view these proof graphs as a way of, to some extent, marrying the inductive invariants used for formal verification with the kind of semi-formal, pen and paper proof structures often written by humans. For example, a careful induction proof in a distributed systems paper may somewhat closely resemble this kind of structure (e.g. see the [Raft dissertation proof](https://web.stanford.edu/~ouster/cgi-bin/papers/OngaroPhD.pdf#page=233)). These inductive proof graph structures provide a useful way to make this formal, while also showing that these types of graph structures can be seen as ultimately equivalent to any inductive invariant. 

We also concretely exploit these structures for automated inductive invariant inference technique in [this work](https://arxiv.org/abs/2404.18048), and to improve the interactivity and interpretability of the inductive invariant development process.