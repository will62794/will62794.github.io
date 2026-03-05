---
layout: post
title:  "Canonicalized Distributed Protocol Specifications"
categories: distributed-systems
---

Formal descriptions of message passing distributed protocols are complex and heterogeneous. They use different messaging formats and patterns for how information is communicated between nodes. This makes protocol comprehension and modification tedious and error-prone. There is a [whole discussion](https://groups.google.com/g/raft-dev/c/cBNLTZT2q8o) around the various message types used and comparions between Raft and Viewstamped Replication. An EPaxos [spec](https://github.com/efficient/epaxos/blob/791b115669fca472d3136f6a2eda46c00b3f8251/tla%2B/EgalitarianPaxos.tla#L61-L90) has 9 different message types. 

These specs become complex and difficult to understand when specified at sufficient level of detail to fully capture fine-grained, asynchronous message passing details [1,2,3]. This also leads to confusion around the separation between (1) the messaging-specific details and communication patterns of a protocol and (2) the essential behavior required for ensuring correctness.

It would be nice if there was a better canonical format for describing/modeling distributed protocols that makes their similarities & differences clearer, and potentially also facilitates mechanical derivation of protocol optimizations, modifications etc.



Raft, for example, chooses two specific message types, *RequestVote* and *AppendEntries*, to implement its protocol behavior. It also contains a host of other specific state variables for tracking state, etc. What does a version of Raft look like when abstracted to eliminate message types i.e. specific in a so-called universal message passing canonical form? If we just focus on the [election related actions](https://github.com/will62794/dist-protocol-canonicalization/blob/a64c3697e7afb8b1b2f6296a185da1fbd8aff25a/code/RaftAsyncUniversal/RaftAsyncUniversal.tla#L105-L173), it contains the following:

- `UpdateTerm`
- `BecomeCandidate`
- `GrantVote`: reads `{currentTerm, votedFor, log}`, writes `{votedFor}`
- `RecordGrantedVote`: reads `{currentTerm, votedFor}`, writes `{votesGranted}`
- `BecomeLeader`: reads `{votesGranted,state}`

Going further, we can define some actions entirely in terms of *history queries*, rather than incrementally storing and reading an auxiiliary variable. For example, we can transform the precondition of `BecomeLeader` into a history query that only checks for a quorum of messages containing the appropriate votes.


if a node has previously reached a term and its log is new enough, i can record a vote for it. So, `votedFor` is simply a record of a past state (?) but also promise about future states (?)


and the following state variables:

- `state`
- `currentTerm`
- `votesGranted`
- `votedFor`
- `nextIndex`
- `matchIndex`
- `log`

Protocol actions can then all be viewed as direct reads of past states of other nodes.

So, for example, `RecordGrantedVote` is simply checking for some `votedFor` value, and recording this state into a local variable `votesGranted`. Similarly, `BecomeLeader` is simply reading the (current) `votesGranted` state and setting some `state` variable.

This canonical description model also reduces the possible design space of protocols. For example, given only `state` and `currentTerm` variables, what are our possible options for implementing a protocol that ensures Election Safety? Everyone can just become leader at term when they decide to, but to ensure safety, they must check that no one else is currently leader in the term they want to go to. 

### Incrementalizing Queries

Incrementalizing a query is equivalent to saying let's update the output of this query on each new message that arrives e.g. compute the query *online* instead of all at once over a batch of messages. The output of the query should remain the same, thoug.


### Related Work

This approach is similar to past about "broadcast" oriented algorithms, and also similar to *semi-symmetric* message passing specification aprpoach taken in some [PaxosStore specifications](https://dl.acm.org/doi/10.14778/3137765.3137778) from WeChat. The notion of specifying protocols over histories also appears in many places, including the [DistAlgo work](https://dl.acm.org/doi/10.1145/2994595), and also the work done on [Dedalus](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-173.pdf) and [Bloom](https://bloom-lang.net/).