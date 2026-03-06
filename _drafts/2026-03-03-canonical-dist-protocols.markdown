---
layout: post
title:  "Canonicalizing Distributed Protocol Specifications"
categories: distributed-systems
---

Formal descriptions of message passing distributed protocols are complex and heterogeneous. They use different messaging formats and patterns for how information is communicated between nodes. This makes protocol comprehension and modification tedious and error-prone. There is a [whole discussion](https://groups.google.com/g/raft-dev/c/cBNLTZT2q8o) around the various message types used and comparions between Raft and Viewstamped Replication, an EPaxos [spec](https://github.com/efficient/epaxos/blob/791b115669fca472d3136f6a2eda46c00b3f8251/tla%2B/EgalitarianPaxos.tla#L61-L90) has 9 different message types, and in general [these specs](https://github.com/ongardie/raft.tla/blob/master/raft.tla) just become pretty large and challenging to digest succinctly.

<!-- These specs become complex and difficult to understand when specified at sufficient level of detail to fully capture fine-grained, asynchronous message passing details [1,2,3].  -->

This also leads to confusion around the separation between (1) the messaging-specific details and communication patterns of a protocol and (2) the essential behavior required for ensuring correctness.
It would be nice if there was a better canonical format for describing/modeling distributed protocols that makes their similarities & differences clearer, and potentially also facilitates mechanical derivation of protocol optimizations, modifications etc.


Raft, for example, chooses two specific message types, *RequestVote* and *AppendEntries*, to implement its protocol behavior. It also contains a host of other specific state variables for tracking state, etc. It makes a bunch of implementation choices that are reflected in its descriptions.


What does a version of Raft look like if we abstract it to eliminate concrete message types i.e. specific in a so-called universal message passing canonical form? We can explore how far we can take this. Conceptually, we will express protocols in a model where all actions follow a simple, common template:


1. Reading its local state and/or a message from the network. 
2. Updating its local state based on this read.
3. Broadcasting its entire updated state into the network as a new message. 


If we start with the election related actions of Raft, we can end up with the following state variables:

- `state`
- `currentTerm`
- `votesGranted`
- `votedFor`
- `nextIndex`
- `matchIndex`
- `log`

and actions:

- `BecomeCandidate`
- `GrantVote`
- `RecordGrantedVote`
- `BecomeLeader`
- `UpdateTerm`

We don't impose any message type details on communication between nodes, so we can think of every action as based on reading some message from the network and updating its state appropriately in response. More simply, since all messages are simply a full recording of a node's local state at sending time, we can consider every action as based on reading the remote (past) state of some other node and acting in response. So, for example, we can have a `GrantVote` action like the following:

```tla
\* Server i grants its vote to a candidate server.
GrantVote(i, m) ==
    /\ LET  j     == m.from
            logOk == \/ LastTerm(m.log) > LastTerm(log[i])
                     \/ /\ LastTerm(m.log) = LastTerm(log[i])
                        /\ Len(m.log) >= Len(log[i])
            grant == /\ m.currentTerm >= currentTerm[i]
                     /\ logOk
                     /\ votedFor[i] \in {Nil, j} IN
            \* /\ m.currentTerm <= currentTerm[i]
            /\ votedFor' = [votedFor EXCEPT ![i] = IF grant THEN j ELSE votedFor[i]]
            /\ currentTerm' = [currentTerm EXCEPT ![i] = m.currentTerm]
            /\ UNCHANGED <<state, candidateVars, leaderVars, logVars>>
            /\ BroadcastUniversalMsg(i)
```
where the action is parameterized on a message `m` whose fields are exactly the local state variables maintained on each node.

Similarly, we can have associated `RecordGrantedVote` and `BecomeLeader` actions
```tla
\* Server i records a vote that was granted for it in its current term.
RecordGrantedVote(i, m) ==
    /\ m.currentTerm = currentTerm[i]
    /\ state[i] = Candidate
    /\ votesGranted' = [votesGranted EXCEPT ![i] = 
                            \* The sender must have voted for us in this term.
                            votesGranted[i] \cup 
                                IF (i = m.votedFor) THEN {m.from} ELSE {}]
    /\ UNCHANGED <<serverVars, votedFor, leaderVars, logVars, msgs>>

\* Candidate i becomes a leader.
BecomeLeader(i) ==
    /\ state[i] = Candidate
    /\ votesGranted[i] \in Quorum
    /\ state'      = [state EXCEPT ![i] = Leader]
    /\ nextIndex'  = [nextIndex EXCEPT ![i] = [j \in Server |-> Len(log[i]) + 1]]
    /\ matchIndex' = [matchIndex EXCEPT ![i] = [j \in Server |-> 0]]
    /\ UNCHANGED <<currentTerm, votedFor, candidateVars, logVars, msgs>>
    /\ BroadcastUniversalMsg(i)
```

This type of abstraction first gets rid of message passing and communication pattern specific details from the protocol. All we do now is define actions that are able to read some past state of another node and make updates based on it.  

### History Queries

We can push this abstraction further, simplifying some actions to express their reads entirely in terms of *history queries*, rather than incrementally updating and reading an auxiliary variable. For example, for the `BecomeLeader` action, it is really just waiting until the `votesGranted` variable has accumulated the right internal state so that it can safely transition to a leader state. If we ignore this variable entirely, we can express the action precondition with one big precondition query like this:

<pre>
<span style="color: green">\* Candidate i becomes a leader.</span>
BecomeLeader(i) ==
    /\ state[i] = Candidate
    <span style="background-color: #ccffcc">/\ \E Q \in Quorum : 
       \A j \in Q :</span>
       <span style="background-color: #ccffcc">\E m \in msgs :</span> 
           <span style="background-color: #ccffcc">m.currentTerm = currentTerm[i] /\ m.from = j /\ m.votedFor = i</span>
    /\ state'      = [state EXCEPT ![i] = Leader]
    /\ nextIndex'  = [nextIndex EXCEPT ![i] = [j \in Server |-> Len(log[i]) + 1]]
    /\ matchIndex' = [matchIndex EXCEPT ![i] = [j \in Server |-> 0]]
    /\ UNCHANGED <<currentTerm, votedFor, candidateVars, logVars, msgs>>
    /\ BroadcastUniversalMsg(i)
</pre>
which checks for the appropriate quorum of voters given the set of messages (states) in the network. This also simplifies the protocol description by getting rid of the `votesGranted` and the `RecordGrantedVote` actions, leaving us with:

- `BecomeCandidate`
- `GrantVote`
- `BecomeLeader`
- `UpdateTerm`


If we do something similar for the log replication related actions, the `LeaderLearnsOfAppliedEntry` is another similar action that records log application progress from other nodes.



<!-- So, for example, `RecordGrantedVote` is simply checking for some `votedFor` value, and recording this state into a local variable `votesGranted`. Similarly, `BecomeLeader` is simply reading the (current) `votesGranted` state and setting some `state` variable. -->

<!-- This canonical description model also reduces the possible design space of protocols. For example, given only `state` and `currentTerm` variables, what are our possible options for implementing a protocol that ensures Election Safety? Everyone can just become leader at term when they decide to, but to ensure safety, they must check that no one else is currently leader in the term they want to go to.  -->

### Query Incrementalization

Specifying a protocol in terms of history queries is conceptually satisfying and a nice way to abstract away more of the lower level protocol details. It moves the protocol further away from a practical implementation, though, since it's not realistic for a node to have the ability to continuously read and query over the entire history of all states of other nodes. We can bridge this over to practical implementations, though, by viewing this as an incremental view maintenance problem. 

That is, in a real system, we essentially want to maintain the correct output of this precondition query based on the current state of the network. An alternate way to do this is to view this as an online maintenance problem i.e. instead of computing the query output over a giant batch of all historical messages, we update the output of the query incrementally as each new message arrives.

This is a formal way to map between the abstract, query-oriented protocol specification and a more practical, operational algorithmic implementation. It also, in theory, is perfectly general i.e. as long as know that the query we write down can be computed incrementally, any protocol we specify in this manner could in theory always be automatically "incrementalized" into a practical, operational version.


From an efficiency and optimization perspective, we can also deal with the reasonable objection that passing around every node's full state for any real protocol is infeasible e.g. you can't be passing around an entire Raft log in every message, even though it's easy to do in an abstract spec. So, we can also define transformation functions that operate on the full state of a node for sake of a practical efficiency. For example, if we send a message that contains a node's full state $$s$$, we can send $$m = f(s)$$ into the network, and assume the receiver can easily compute $$s = f^{-1}(m)$$ to get the full state back, so that we could still express our protocol logic in terms of the full state.

For example, in Raft as classically defined, an AppendEntries message may only send one new log entry (or a chunk of them) from a primary to a follower. This is based on a local computation, though, based on its knowledge of its own log and the log application progress (`matchIndex`) of the follower node. So, we can think of this as applying some transformation function $$f$$ on these local state variables to produce a message format that is efficient to send across the network.

### Related Work

This approach is similar to past work on "broadcast" oriented algorithms, and also similar to *semi-symmetric* message passing specification aprpoach taken in some [PaxosStore specifications](https://dl.acm.org/doi/10.14778/3137765.3137778) from WeChat. The notion of specifying protocols as queries over histories also has quite a long...history. This includes the [DistAlgo work](https://dl.acm.org/doi/10.1145/2994595), and also the work done on [Dedalus](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-173.pdf) and [Bloom](https://bloom-lang.net/).

History-oriented approach has appeared in a kind of folk way in more abstract specs like [original specs](https://github.com/tlaplus/Examples/blob/9ac1cdc8d54ce619105ffed96a7c9b52041733ae/specifications/Paxos/Paxos.tla#L108-L141) of Paxos.