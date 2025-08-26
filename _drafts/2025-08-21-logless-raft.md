---
layout: post
title:  "Logless Raft"
categories: databases transactions isolation
---

The standard use of Raft is as an algorithm for implementing a fault tolerant, replicated state machine, by means of a replicated *log*, maintained at each server within a group. Depending on the nature of the state we want to replicate, though, we can sometimes employ a significantly simpler variant of Raft that achieves the same essential correctness properties with a conceptually simpler design. We can call this a *logless Raft* and it can be useful particularly when we want to only replicate a single, presumably small, piece of state (e.g. configuration, metadata, etc.) between servers. 

### Simplifying Log Management

There are a lot of machinery details included in the standard descriptions of Raft related to the intricacies of replicating log entries between servers, recording the applied indices of the log on each server, etc. (e.g. `matchIndex`, `nextIndex`, `commitIndex`). There are also strategies for specifically dealing with clean up and garbage collection of stale, divergent logs, handled as part of the `AppendEntries` request/response flow.  

Ultimately, most of the lower level log and index management maachinery is simply bookkeeping details around what log entries a node (e.g. a leader) should send to other nodes (`nextIndex`) and what entries other nodes have received so far (`matchIndex`), and which entries have been so far marked as committed (`commitIndex`). One perspective is that a lot of this is necessary from an implementation/optimization perspective, but not from a fundamental protocol/correctness perspective. 

With this in mind, we can significantly reduce this complexity if we imagine an abstract version of Raft where we get rid of all the lower level implementation details around log index management and propagation of this information. 
We can consider a Raft variant where nodes instead send their entire logs to each other in any message, and the receiving nodes can, based on their local log state and the state they received, determine which entries (if any) they can go ahead and append to their own log. Individual nodes no longer track any of the `nextIndex`/`matchIndex` bookkeeping variables, and the information flow between leaders/followers can also become much more symmetric e.g. both can simply propagate their entire logs to each other as a way of communicating new updates or feedback about which log entries have been appended.


In this model, both log append and log truncation operations, normally incremental processes that may occur via repeated rounds AppendEntries messages from a leader, can be subsumed into a single *log merge* operation. That is, when a node $$i$$ receives a log from node $$j$$, it can determine, based on some conditions, whether it can replace its current log with this incoming log. In general, this rule can be expressed as a check whether a node $$i$$'s own log is a prefix of $$log[j]$$. If so, this means that it is safe for the node to extend its log to the received log, by updating $$log[i]$$ to the value of $$log[j]$$. If $$i$$'s log is not a prefix of the incoming log, then it must check for a "staleness" or "divergence" condition, by comparing the last term of both logs. If $$i$$'s log has an older last term than $$log[j]$$, then it is safe to replace $$log[i]$$ with $$log[j]$$. Otherwise, it is not safe to modify its own log.

In both cases, this "prefix" check can be approximated in Raft by simply comparing the last term of each log, similar to how logs are compared in standard vote requests in Raft. That is, if the terms of the last entry in each logs are the same, then prefix check can be done by comparing log lengths, and otherwise, the check is done by comparing the terms of the last entry in each log, with newer terms taking precedence.

### Going Logless

In this abstract variant of the protocol, lower level, "internal" log operations have become irrelevant. That is, we can view the entire log as a monolithic piece of state that is replicated around between nodes, and we really only care about some notion of logical "ordering" between two different logs, which is determined by this "last term" ordering condition. In this monolithic log model, we really only care about comparison between the end of each log. So, it is relatively straightforward to see that we can view such a protocol as simply storing a "rolled up" log at each node i.e. storing the full piece of state that corresponds to application of all entires in a log, tagged by the "last index + term" of that log. When we propagate around logs, we don't actually need to store the whole log, but only the state corresponding to application of that log's entries. And we can easily compare two pieces of this state by simply comparing the tagged index/term values. 


<!-- With the key property that we prefer nodes to accept only logically "newer" logs. This can be modeled by simply viewing the log as an arbitrary piece of state that is tagged with a version/index number, which is increased every time a new version is created. -->



Extending this perspective, we can now imagine a variant of Raft that simply chooses to store some arbitrary piece of state, which gets updated "in-place" via some client operation at a leader node. This state is propagated to followers via messages that contain the entire state, and they decide whether to install the newer state or not based on this simple "merging" logic which does this logical comparison in version between their own local state and the state they received. When we write a new entry down on a leader, we can simply update that state in-place and increment the "index" or, more appropriately named "version" for the local state.
 
### Related Work

The notion of logless or "register"-based consensus algorithms is not new. Recent proposal slike CASPaxos try to do something similar for Paxos based systems, and there is also a history of literature on so classed "[atomic registers](https://groups.csail.mit.edu/tds/papers/Lynch/FTCS97.pdf)" or "multi-write, multi-reader" (MWMR) registers, which implement this type of primitive in distributed fashion. Notably I haven't seen the logless variation specifically appear in the context of a Raft-based protocol, though, it is essentially similar to the ideas that arose when designing a [new reconfiguration protocol](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.OPODIS.2021.26) within MongoDB's Raft-based consensus system.