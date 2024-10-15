---
layout: post
title:  "Canonicalization of Distributed Protocol Specifications"
categories: distributed-systems
---

Formal descriptions of message passing distributed protocols are complex and heterogeneous. They use different messaging formats and patterns for how information is communicated between nodes, making protocol comprehension, modification, and optimization tedious and error-prone. We want a better canonical format for describing/modeling distributed protocols that makes their essential similarities & differences clearer, and potentially also facilitates mechanical derivation of protocol optimizations, modifications etc.

In practice, formal descriptions of these distributed protocols can still suffer from being complex and difficult to understand when specified at sufficient level of detail to fully capture fine-grained, asynchronous message passing details [1,2,3]. This complexity leads to confusion around the separation between (1) the messaging-specific details and communication patterns of a protocol and (2) the essential behavior required for ensuring correctness.

Raft, for example, chooses two specific message types, *RequestVote* and *AppendEntries*, to implement its protocol behavior. It also contains a host of other specific state variables for tracking state, etc. What does a version of Raft look like when abstracted to eliminate message types i.e. specific in a so-called universal message passing canonical form? If we just focus on the [election related actions](https://github.com/will62794/dist-protocol-canonicalization/blob/a64c3697e7afb8b1b2f6296a185da1fbd8aff25a/code/RaftAsyncUniversal/RaftAsyncUniversal.tla#L105-L173), it contains the following:

- `UpdateTerm`
- `BecomeCandidate`
- `GrantVote`: reads `{currentTerm, votedFor, log}`, writes `{votedFor}`
- `RecordGrantedVote`: reads `{currentTerm, votedFor}`, writes `{votesGranted}`
- `BecomeLeader`: reads `{votesGranted,state}`

and the following state variables:

- `state`
- `votesGranted`
- `votedFor`
- `currentTerm`
- `nextIndex`
- `matchIndex`
- `log`

Protocol actions can then all be viewed as direct reads of past states of other nodes.

So, for example, `RecordGrantedVote` is simply checking for some `votedFor` value, and recording this state into a local variable `votesGranted`. Similarly, `BecomeLeader` is simply reading the (current) `votesGranted` state and setting some `state` variable.

This canonical description model also reduces the possible design space of protocols. For example, given only `state` and `currentTerm` variables, what are our possible options for implementing a protocol that ensures Election Safety?