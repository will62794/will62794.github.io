---
layout: post
title:  "Notes on Raft's Reconfiguration Bug"
categories: distributed-systems
---


Below is a high level overview of the Raft reconfiguration bug cases laid out in Diego Ongaro's [group post](https://groups.google.com/g/raft-dev/c/t4xj6dJTP6E/m/d2D9LrWRza8J), which described the problematic scenarios in Raft's single server reconfiguration (i.e. membership change) algorithm. Configurations are annotated with their terms i.e., a config $$X$$ in term $$t$$ is shown as $$X^t$$.

- **One add, one remove**
    
    <div style="text-align:center;">
        <img width=620px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.001.png">
    </div>
- **Two adds** 
  
    <div style="text-align:center;">
        <img width=620px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.002.png">
    </div>
- **Two removes**
  
    <div style="text-align:center;">
        <img width=620px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.003.png">
    </div>


I view all of these bug cases as instances of a common problem related to config management when logs diverge (i.e., when there are concurrent primaries in different terms). The bug arises in each case due to the fact that each child config ($$D$$ and $$E$$) has quorum overlap with its parent $$C$$ (due to the single node change condition), but the sibling configs don't have quorum overlap with each other. These scenarios are problematic because, for example, in case (1), config $$D$$ could potentially commit writes in term 1 that are not known to leaders in config $$E$$ in term 2 or higher (since $$D$$ and $$E$$ don't have quorum overlap), breaking the fundamental safety property that earlier committed entries are known to newer leaders.

As pointed out, this underlying problem should be avoided when using the joint consensus approach since in that case each child config will continue to contact a quorum in its parent config.

### The Proposed Fix

Diego proposes the following fix:

> The solution I'm proposing is exactly like the dissertation describes except that a leader may not append a new configuration entry until it has committed an entry from its current term.

As described above, the underlying bug can be seen as stemming from the fact that when log divergence occurs, even though each child config has quorum overlap with its parent (due to the single node change condition), the sibling configs do not necessarily have quorum overlap with each other. 

So, upon election, before doing any reconfiguration, you actually need to be sure that any *sibling* configs are disabled i.e., prevented from committing writes, electing leaders, etc. You achieve this by committing a config in the parent config in your term, which disables all sibling configs in lower terms. I think this concept is clearer to see when thinking about the structure of global Raft system logs over time as a tree, similar to the concepts discussed [here](https://decentralizedthoughts.github.io/2021-07-17-simplifying-raft-with-chaining/), and some of the formalization sketches [here](https://github.com/will62794/raft-by-refinement).

Similarly to Diego's proposal, this fix is achieved in [MongoDB's reconfiguration protocol](https://arxiv.org/pdf/2102.11960.pdf) by [rewriting the config term on primary election](https://github.com/will62794/logless-reconfig/blob/5b1d0f3bfd93c4d78470689a56959d1dcc5297a2/MongoLoglessDynamicRaft.tla#L90-L91), which then requires this config in the new term to become committed before further reconfigs can occur on that elected primary.

### A Note on Relaxing the Single Node Change Condition

The single node change condition (i.e. reconfigurations can only add or remove a single node) proposed in the original Raft dissertation is a sufficient condition to ensure that all quorums overlap between any two configurations $$C_{old}$$ and $$C_{new}$$. Note that even without resorting to joint consensus, though, this condition can be relaxed slightly, to permit additional, safe reconfigurations that are not allowed under the strict single node change rule. 

Specifically, for a reconfiguration from $$C_{old}$$ to $$C_{new}$$, if we simply enforce that 

$$
QuorumsOverlap(C_{old}, C_{new})
$$ 

holds, where:

$$
\begin{aligned}
  &Quorums(S) \triangleq \{s \in 2^{S} : |s| \cdot 2 > |S|\} \\
  &QuorumsOverlap(S_i,S_j) \triangleq
     \forall q_i \in Quorums(S_i), q_j \in Quorums(S_j) : q_i \cap q_j \neq \emptyset\\
\end{aligned}
$$

then this explicitly ensures reconfiguration safety, without relying on the single node change restriction.

We can compare the above, generalized condition with the single node change condition by observing the space of possible reconfigurations under each, for varying numbers of global servers. In the reconfiguration transition graphs below, blue edges represent single node change reconfigurations, and green edges represent reconfigurations that are possible under the generalized condition but not under the single node change condition. Note also that we always explicitly disallow starting in or moving to empty configs.

#### 2 Servers

With only 2 servers, the single node change condition is equivalent to the generalized condition (note the absence of green edges): 

<div style="text-align:center">
<img width="380px" src="https://github.com/will62794/logless-reconfig/blob/master/notes/raft_reconfig_bug/quorums_n2_fdp.png?raw=true" >
</div>

#### 3 Servers

Even with 3 servers the generalized condition admits more possible reconfigurations:

<div style="text-align:center">
<img width="470px" src="https://github.com/will62794/logless-reconfig/blob/master/notes/raft_reconfig_bug/quorums_n3_fdp.png?raw=true" >
</div>

For example, moving between $$\{s_1,s_2\}$$, $$\{s_2,s_3\}$$, or $$\{s_1,s_3\}$$ (i.e. any size 2 config) in one step is safe under the generalized condition, since quorums are of size 2 in both configs, which always intersect. These reconfigurations are not allowed under the single node change condition, though, since they require 1 add and 1 remove.

#### 4 Servers


With 4 servers, even more additional reconfigurations are allowed.

<div style="text-align:center">
<img width="550px" src="https://github.com/will62794/logless-reconfig/blob/master/notes/raft_reconfig_bug/quorums_n4_fdp.png?raw=true" >
</div>

In particular, note the ability to move from any 4-node config to any 2-node config in one step, since 4 node configs have quorums of size 3, which always intersect with the size 2 quorums of any 2 node config. Some 2 node configs can still also move directly between each other, even without a single node difference, as in the 3 server setting.

<!-- ## Exploring Bug Traces -->

<!-- You can also see a concrete example of these bugs manifest in an execute formal model of an abstract version of Raft in TLA+ with this bug introduced. For example, see this [trace](https://will62794.github.io/tla-web/#!/home?specpath=https%3A%2F%2Fgist.githubusercontent.com%2Fwill62794%2F6603974a2b19d7221ab41ee42b377d32%2Fraw%2Fb4d22b9580e2bcb5bd8c49fc61e191be241f94dc%2FAbstractDynamicRaft.tla&constants%5BServer%5D=%7Bs1%2Cs2%2Cs3%2Cs4%2Cs5%2Cs6%7D&constants%5BClient%5D=%7B%22c1%22%2C%20%22c2%22%7D&constants%5BSecondary%5D=%22Secondary%22&constants%5BPrimary%5D=%22Primary%22&constants%5BNil%5D=%22Nil%22&constants%5BInitTerm%5D=0&trace=14745d3e). -->
