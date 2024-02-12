---
layout: post
title:  "Notes on Raft's Reconfiguration Bug"
categories: formal-methods model-checking
---


Below is a high level overview of the Raft reconfiguration bug cases laid out in Diego Ongaro's [group post](https://groups.google.com/g/raft-dev/c/t4xj6dJTP6E/m/d2D9LrWRza8J), which described the problematic scenarios in Raft single server membership change algorithm. Configurations are annotated with their terms i.e., a config $$X$$ in term $$t$$ is shown as $$X^t$$.

- **Two adds**
    
    <div style="text-align:center;">
        <img width=600px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.001.png">
    </div>
- **One add, one remove**:
  
    <div style="text-align:center;">
        <img width=600px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.002.png">
    </div>
- **Two removes**:
  
    <div style="text-align:center;">
        <img width=600px src="/assets/diagrams/raft_reconfig_bug/raft_reconfig_bug.003.png">
    </div>


I think all of these bug cases can be viewed as instances of a common problem related to config management when logs diverge (i.e., when there are concurrent primaries in different terms). The bug arises in each case due to the fact that each child config ($$D$$ and $$E$$) has quorum overlap with its parent $$C$$ (due to the single node change condition), but the sibling configs don't have quorum overlap with each other. These scenarios are problematic because, for example, in case (1), config $$D$$ could potentially commit writes in term $$1$$ that are not known to leaders in config $$E$$ in term 2 or higher (since $$D$$ and $$E$$ don't have quorum overlap), breaking the fundamental safety property that earlier committed entries are known to newer leaders.

As pointed out, this underlying problem should be avoided in joint consensus since in that case each child config will continue to contact a quorum in its parent config.

### The Proposed Fix

Diego proposes the following fix:

> The solution I'm proposing is exactly like the dissertation describes except that a leader may not append a new configuration entry until it has committed an entry from its current term.

As described above, the underlying bug can be seen as stemming from the fact that when log divergence occurs, even though each child config has quorum overlap with its parent (due to the single node change condition), the sibling configs do not necessarily have quorum overlap with each other. 

So, upon election, before doing any reconfiguration, you actually need to be sure that any \textit{sibling} configs are disabled i.e., prevented from committing writes, electing leaders, etc. You achieve this by committing a config in the parent config in your term, which disables all sibling configs in lower terms. Similarly to Diego's fix, we achieve this in MongoDB's reconfiguration protocol by [rewriting config term on primary election](https://github.com/will62794/logless-reconfig/blob/5b1d0f3bfd93c4d78470689a56959d1dcc5297a2/MongoLoglessDynamicRaft.tla#L90-L91), which then requires this config in the new term to become committed before further reconfigs can occur on that elected primary.
