---
layout: post
title:  "Logless Raft"
categories: databases transactions isolation
---

The standard use of Raft is as an algorithm for impelemtning a fault tolerant, replicated state machine, by means of a replicated *log*, maintained at each server within a group. Depending on the nature of the state we want to replicate, though, we can sometimes employ a significantly simpler variant of Raft that achieves the same essential correctness properties with a conceptually simpler and, potentially more performant, design. We can call this a *logless Raft* and it can be useful particularly when we want to only replicate a single, presumably small, piece of state (e.g. configuration, metadata, etc.) between servers. 

### Simplifying Log Management

There are a lot of machinery details included in the standard descriptions of Raft related to the intricacies of replicating log entries between servers, recording the applied indices of the log on each server, etc. (e.g. `matchIndex`, `nextIndex`, `commitIndex` variables, etc.). There are also strategies for specifically dealing with clean up and garbage collection of stale, divergent logs, which are handled as part of the `AppendEntries` request/response flow.  

Ultimately, most of the lower level log and index management maachinery is simply bookkeeping details around what log entries a node (e.g. a leader) should send to other nodes (`nextIndex`) and what entries other nodes have received so far (`matchIndex`), and which entries have been so far marked as committed (`commitIndex`). One perspective is that a lot of this is necessary from an implementation/optimization perspective, but not from a fundamental protocol/correctness perspective. 

With this in mind, we can significantly reduce this complexity if we imagine an abstract version of Raft where we get rid of all the lower level implementation details around log index management and propagation of this information. 
So, we can consider a Raft variant where nodes send their entire logs to each other in any message, and the receiving nodes can, based on their local log state and the state they received, determine which entries (if any) they can go ahead and append to their own log. Individual nodes no longer track any of the `nextIndex`/`matchIndex` bookkeeping variables, and the information flow between leaders/followers also becomes much more symmetric e.g. both can simply propagate their entire logs to each other as a way of communicating new updates or feedback about which log entries have been appended.


In this model, both log append and log truncation operations, normally incremental processes that may occur via repeated rounds AppendEntries messages from a leader, is subsumed into a single "log merging" operation. That is, when a node receives a full log, it can determine if (a) it is a prefix of this log, which allows it to append new entries (b) it is not a prefix, requiring it to potentially truncate its own log to align with the log it received.

Going further, we can view this somewhat more abstractly and see that, essentially, lower level log operations become irrelevant. That is, if we view the entire log as a monolithic piece of state that is replicated around between nodes, then we really only care about some notion of logical "ordering" between two different logs. With the key property that we prefer nodes to accept only logically "newer" logs. This can be modeled by simply viewing the log as an arbitrary piece of state that is tagged with a version/index number, which is increased every time a new version is created.

Extending this perspective, we can now imagine a variant of Raft that simply chooses to store some arbitrary piece of state, which gets updated "in-place" via some client operation at a leader node. This state is propagated to followers via messages that contain the entire state, and they decide whether to install the newer state or not based on this simple "merging" logic which does this logical comparison in version between their own local state and the state they received. 

Linearizability? Read your latest write?


## Related Approaches

The notion of logless or "register"-based consensus algorithms is not new. Recent proposal slike CASPaxos try to do something similar for Paxos based systems, and there is also a history of literatue on so classed "atomic registers" or "multi-write, multi-reader" (MWMR) registers, which implement this type of primitive in distributed fashion. Notably I haven't seen the logless variation specifically appear in the context of a Raft-based protocol, though, it is essentially similar to the ideas that arose when designing a [new reconfiguration protocol](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.OPODIS.2021.26) within MongoDB's Raft-based consensus system.