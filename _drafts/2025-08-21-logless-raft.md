---
layout: post
title:  "Logless Raft"
categories: databases transactions isolation
---

First, we can imagine an abstract version of Raft where we get rid of all the lower level implementation details around log index management and propagation of this information. That is, we can have a Raft variant where nodes send their entire logs to each other in any message, and the receiving nodes can, based on their local log state and the state they received, determine which entries (if any) they can go ahead and append to their own log. 

In this model, it is clear to see that log truncation, normally an incremental process that occurs via repeated AppendEntries messages from a leader, is subsumed into this single "log merging" operation. That is, when a node receives a full log, it can determine if (a) it is a prefix of this log, which allows it to append new entries (b) it is not a prefix, requiring it to potentially truncate its own log to align with the log it received.

Going further, we can view this somewhat more abstractly and see that, essentially, lower level log operations become irrelevant. That is, if we view the entire log as a monolithic piece of state that is replicated around between nodes, then we really only care about some notion of logical "ordering" between two different logs. With the key property that we prefer nodes to accept only logically "newer" logs. This can be modeled by simply viewing the log as some arbitrary piece of state that is tagged with a version/index number, which is increased every time a new version is created.

Extending this perspective, we can now imagine a variant of Raft that simply chooses to store some arbitrary piece of state, which gets updated "in-place" via some client operation at a leader node. This state is propagated to followers via messages that contain the entire state, and they decide whether to install the newer state or not based on this simple "merging" logic which does this logical comparison in version between their own local state and the state they received. 

Linearizability? Read your latest write?
