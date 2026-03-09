---
layout: post
title:  "Canonicalized Distributed Protocol Specs"
categories: distributed-systems
---

<style>
pre {
  font-size: 0.75em;
  line-height: 1.5;
  margin: 1.2em 0;
  padding: 1.1em 1.4em;
  border-radius: 10px;
  border: none;
  background: linear-gradient(98deg, #f9fafc 0%, #eef1f5 100%);
  box-shadow: 0 3px 18px 0 rgba(80,100,138,0.07);
  color: #222;
  font-family: 'Fira Mono', 'Consolas', 'SFMono-Regular', Menlo, Monaco, monospace;
  overflow-x: auto;
  transition: background 0.25s;
}
pre:hover {
  background: linear-gradient(98deg, #f1f5fb 0%, #e5eaf3 100%);
}
</style>

Formal descriptions of message passing distributed protocols are complex and heterogeneous.  In theory, writing a formal spec of a distributed protocol is a good way to formalize and communicate its precise behavior. In practice, though, many of these specs become quite [large](https://github.com/ongardie/raft.tla/blob/master/raft.tla) and [challenging to digest](https://github.com/Vanlightly/vsr-tlaplus/blob/main/vsr-revisited/paper/VSR.tla) clearly. They use different messaging formats and patterns for how information is communicated between nodes, making protocol comprehension and modification tedious and [error-prone](https://jira.mongodb.org/browse/SERVER-34728). There are [long discussions](https://groups.google.com/g/raft-dev/c/cBNLTZT2q8o) around the various message types used and comparions between Raft and Viewstamped Replication.

<!-- , an EPaxos [spec](https://github.com/efficient/epaxos/blob/791b115669fca472d3136f6a2eda46c00b3f8251/tla%2B/EgalitarianPaxos.tla#L61-L90) has 9 different message types, and in general [these specs](https://github.com/ongardie/raft.tla/blob/master/raft.tla) just become pretty large and challenging to digest succinctly. -->

<!-- These specs become complex and difficult to understand when specified at sufficient level of detail to fully capture fine-grained, asynchronous message passing details [1,2,3].  -->

I've found the way these protocols are described also often leads to confusion around the separation between (1) the messaging-specific details and communication patterns of a protocol and (2) the essential behavior required for ensuring correctness.
It would be nice to have a better *canonical* format for describing/modeling distributed protocols that makes their similarities & differences clearer, and potentially also facilitates mechanical derivation of protocol optimizations, modifications etc. without obscuring things with too many implementation specific choices.

Raft, for example, chooses two specific message types, *RequestVote* and *AppendEntries*, to implement its protocol behavior. It also contains a host of other specific state variables for tracking state, etc.
What does a version of Raft look like if we try to abstract away concrete message types and communication patterns i.e. specify it in what we can call a so-called "canonicalized" message passing form? We can take a very simple approach and see how far it takes us. 

Conceptually, we will express protocols in a model where all actions on a given node follow a simple, common template:


1. **Read** its local state and optionally a message from the network. 
2. **Update** its local state based on this read.
3. **Broadcast** its entire updated state into the network as a new message. 


We don't impose any message type details on communication between nodes, so we can think of the behavior of every action as reading some message from the network and updating its state appropriately in response. More simply, since all messages are simply a full recording of a node's local state at sending time, we can view every action as based on reading the remote (past) state of some other node and acting in response. 

As an example, we can apply this to a version of the originally published [Raft TLA+ spec](https://github.com/ongardie/raft.tla/blob/master/raft.tla), which contains roughly 9 distinct, core protocol actions. If we write a version of this spec in a "canonical" form, we end up with the following, election related actions `GrantVote`, `RecordGrantedVote`, and `BecomeLeader` actions:
<pre>
<span style="color: green">\* Server i grants its vote to a candidate server.</span>
<b>GrantVote</b>(i, m) ==
    /\ m.currentTerm >= currentTerm[i]
    /\ state[i] = Follower
    /\ LET  j     == m.from
            logOk == \/ LastTerm(m.log) > LastTerm(log[i])
                     \/ /\ LastTerm(m.log) = LastTerm(log[i])
                        /\ Len(m.log) >= Len(log[i])
            grant == /\ m.currentTerm >= currentTerm[i]
                     /\ logOk
                     /\ votedFor[i] \in {Nil, j} IN
            /\ votedFor' = [votedFor EXCEPT ![i] = IF grant THEN j ELSE votedFor[i]]
            /\ currentTerm' = [currentTerm EXCEPT ![i] = m.currentTerm]
            /\ UNCHANGED <<state, candidateVars, leaderVars, logVars>>
            /\ BroadcastUniversalMsg(i)
            
<span style="color: green">\* Server i records a vote that was granted for it in its current term.</span>
<b>RecordGrantedVote</b>(i, m) ==
    /\ m.currentTerm = currentTerm[i]
    /\ state[i] = Candidate
    /\ votesGranted' =
        [votesGranted EXCEPT ![i] =
            <span style="color: green">\* The sender must have voted for us in this term.</span>
            votesGranted[i] \cup IF (i = m.votedFor) THEN {m.from} ELSE {}]
    /\ UNCHANGED <<serverVars, votedFor, leaderVars, logVars, msgs>>

<span style="color: green">\* Candidate i becomes a leader.</span>
<b>BecomeLeader</b>(i) ==
    /\ state[i] = Candidate
    /\ votesGranted[i] \in Quorum
    /\ state'      = [state EXCEPT ![i] = Leader]
    /\ nextIndex'  = [nextIndex EXCEPT ![i] = [j \in Server |-> Len(log[i]) + 1]]
    /\ matchIndex' = [matchIndex EXCEPT ![i] = [j \in Server |-> 0]]
    /\ UNCHANGED <<currentTerm, votedFor, candidateVars, logVars, msgs>>
    /\ BroadcastUniversalMsg(i)
</pre>
where each action is parameterized on a message `m` whose fields exactly match the state variables on a local node, and the [`BroadcastUniversalMsg`](https://github.com/will62794/dist-protocol-canonicalization/blob/b80954af376903f503002b3608d1fefcf119573e/code/RaftAsyncUniversal/RaftAsyncUniversal.tla#L111-L122) operator simply pushes a node's full, updated state into the network as a new message, stored in a global `msgs` state variable.


<pre>
<b>BroadcastUniversalMsg</b>(s) == 
    msgs' = msgs \cup {[
        from |-> s,
        currentTerm |-> currentTerm'[s],
        state |-> state'[s],
        votedFor |-> votedFor'[s],
        log |-> log'[s],
        commitIndex |-> commitIndex'[s]
    ]}
</pre>

We can do this similarly for the core log replication related actions:

<pre>
<span style="color: green">\* Server i appends a new log entry from some other server.</span>
<b>AppendEntry</b>(i, m) ==
    /\ m.currentTerm = currentTerm[i]
    /\ state[i] \in { Follower } \* is this precondition necessary?
    \* Can always append an entry if we are a prefix of the other log, and will only
    \* append if other log actually has more entries than us.
    /\ IsPrefix(log[i], m.log)
    /\ Len(m.log) > Len(log[i])
    \* Only update logs in this action. Commit learning is done separately.
    /\ log' = [log EXCEPT ![i] = Append(log[i], m.log[Len(log[i]) + 1])]
    /\ UNCHANGED <<candidateVars, commitIndex, leaderVars, votedFor, currentTerm, state>>
    /\ BroadcastUniversalMsg(i)

<span style="color: green">\* Server i learns that another server has applied an entry up to some point in its log.</span>
<b>LeaderLearnsOfAppliedEntry</b>(i, m) ==
    /\ state[i] = Leader
    \* Entry is applied in current term.
    /\ m.currentTerm = currentTerm[i]
    \* Only need to update if newer.
    /\ Len(m.log) > matchIndex[i][m.from]
    \* Follower must have a matching log entry.
    /\ Len(m.log) \in DOMAIN log[i]
    /\ m.log[Len(m.log)] = log[i][Len(m.log)]
    \* Update matchIndex to highest index of their log.
    /\ matchIndex' = [matchIndex EXCEPT ![i][m.from] = Len(m.log)]
    /\ UNCHANGED <<serverVars, candidateVars, logVars, nextIndex, msgs>>

<span style="color: green">\* Leader advances its commit index with quorum Q.</span>
<b>AdvanceCommitIndex</b>(i, Q, newCommitIndex) ==
    /\ state[i] = Leader
    /\ newCommitIndex > commitIndex[i]
    /\ LET \* The maximum indexes for which a quorum agrees
        agreeIndexes == {index \in 1..Len(log[i]) : Agree(i, index) \in Quorum}
        \* New value for commitIndex'[i]
        newCommitIndex ==
            IF /\ agreeIndexes /= {}
                /\ log[i][Max(agreeIndexes)] = currentTerm[i]
            THEN Max(agreeIndexes)
            ELSE commitIndex[i]
    IN 
        /\ commitIndex[i] < newCommitIndex \* only enabled if it actually advances
    /\ commitIndex' = [commitIndex EXCEPT ![i] = newCommitIndex]
    /\ UNCHANGED <<serverVars, candidateVars, leaderVars, log>>
    /\ BroadcastUniversalMsg(i)
</pre>

This type of specification approach gets rid of message type and communication pattern specific details from the protocol. All we do is define actions that are able to read some past state of another node and make updates based on it. In this model, we can view a protocol as specified simply in terms of (1) its state variables and (2) its actions, each of which are simply a read of some (current or past) node state.

### History Queries

We can push this specification approach further, simplifying some actions to express their reads entirely in terms of *history queries*, rather than incrementally updating and reading an auxiliary variable. For example, for the `BecomeLeader` action, it is really just waiting until the `votesGranted` variable has accumulated the right internal state so that it can safely transition to a leader state. If we ignore this variable entirely, we can express the action precondition with one big precondition query like this:

<pre>
<span style="color: green">\* Candidate i becomes a leader.</span>
<b>BecomeLeader</b>(i, Q) ==
    /\ state[i] = Candidate
    <span style="background-color: #ccffcc">/\ \A j \in Q : \E m \in msgs : m.currentTerm = currentTerm[i] /\ m.from = j /\ m.votedFor = i</span>
    /\ state'      = [state EXCEPT ![i] = Leader]
    /\ nextIndex'  = [nextIndex EXCEPT ![i] = [j \in Server |-> Len(log[i]) + 1]]
    /\ matchIndex' = [matchIndex EXCEPT ![i] = [j \in Server |-> 0]]
    /\ UNCHANGED <<currentTerm, votedFor, candidateVars, logVars, msgs>>
    /\ BroadcastUniversalMsg(i)
</pre>
which checks for the appropriate quorum of voters given the set of messages (states) in the network.

We can do something similar for the log replication related actions, the `LeaderLearnsOfAppliedEntry` is another similar action that records log application progress from other nodes.

<pre>
<span style="color: green">\* Leader advances its commit index.</span>
<b>AdvanceCommitIndex</b>(i, Q, newCommitIndex) ==
    /\ state[i] = Leader
    /\ newCommitIndex > commitIndex[i]
    <span style="background-color: #ccffcc">/\ \A j \in Q : \E m \in msgs : 
        /\ m.from = j 
        /\ Len(m.log) >= newCommitIndex
        /\ log[i][newCommitIndex] = m.log[newCommitIndex]
        /\ m.currentTerm = currentTerm[i]</span>
    /\ commitIndex' = [commitIndex EXCEPT ![i] = newCommitIndex]
    /\ UNCHANGED <<serverVars, candidateVars, leaderVars, log>>
    /\ BroadcastUniversalMsg(i)
</pre>

<!-- So, for example, `RecordGrantedVote` is simply checking for some `votedFor` value, and recording this state into a local variable `votesGranted`. Similarly, `BecomeLeader` is simply reading the (current) `votesGranted` state and setting some `state` variable. -->

<!-- This canonical description model also reduces the possible design space of protocols. For example, given only `state` and `currentTerm` variables, what are our possible options for implementing a protocol that ensures Election Safety? Everyone can just become leader at term when they decide to, but to ensure safety, they must check that no one else is currently leader in the term they want to go to.  -->

Applying this history query specification approach, we end up with a [simplified set of actions](https://github.com/will62794/dist-protocol-canonicalization/blob/16b93ab4d26d7abdcd5e4fbb6306db5c1cd6d898/code/RaftAsyncUniversal/RaftAsyncUniversal.tla#L280-L295) for the protocol:

- `BecomeCandidate`
- `GrantVote`
- `BecomeLeader`
- `ClientRequest`
- `AppendEntry`
- `TruncateEntry`
- `AdvanceCommitIndex`
- `LearnCommit`
- `UpdateTerm`

where the previously required `RecordGrantedVote` and `LeaderLearnsOfAppliedEntry` actions have been subsumed into the `BecomeLeader` and `AdvanceCommitIndex` actions respectively, as well as their associated state variables `votesGranted` and `matchIndex`. 

Simplifying the action structure by utilizing history queries can also have a non-trivial impact on model checking performance, as we are able to cut out a number of intermediate steps from the protocol. For example, in one experiment, even for a relatively small model (3 servers, `MaxTerm = 2`, `MaxLogLen=1`), running the original spec with `RecordGrantedVote` and
`LeaderLearnsOfAppliedEntry` actions enabled generates 2,060,946 distinct states.  With these actions disabled and using the history query based spec, only 27,062 distinct states were generated, a potential 75x reduction. 

### Query Incrementalization

Specifying a protocol in terms of history queries is conceptually satisfying and a nice way to abstract away more of the lower level protocol details. It moves the protocol further away from a practical implementation, though, since it's not realistic for a node to have the ability to continuously read and query over the entire history of all states of other nodes. We can bridge this over to practical implementations, though, by viewing this as an [incremental view maintenance](https://materialize.com/blog/ivm-database-replica/) problem. 

That is, in a real system, we essentially want to maintain the correct output of these precondition queries based on the current state of the network. We can view this as an online maintenance problem i.e. instead of computing the query output over a giant batch of historical messages, we update the output of the query incrementally as each new message arrives.
This is a formal way to map between the abstract, query-oriented protocol specification and a more practical, operational algorithmic implementation. It also, in theory, is sufficiently general i.e. as long as know that the queries we write down can be computed incrementally, any protocol we specify in this manner could in theory always be automatically "incrementalized" into a practical, operational version. 

A lot of previous work has explored the [foundations](https://ecommons.cornell.edu/server/api/core/bitstreams/ef203133-30b8-45e8-a504-53b3b5443632/content) of evaluating these types of (first order logic) queries incrementally, particularly in the [context of Datalog](https://corescholar.libraries.wright.edu/knoesis/352/). I'm not as clear, though, what work has been done on automatically "incrementalizing" these types of queries into practical, operational versions for realistic protocols like Raft. [Hydroflow](https://speakerdeck.com/jhellerstein/hydroflow-a-compiler-target-for-fast-correct-distributed-programs) might be the closest project tackling similar ideas.



<!-- From an efficiency and optimization perspective, we can also deal with the reasonable objection that passing around every node's full state for any real protocol is infeasible e.g. you can't be passing around an entire Raft log in every message, even though it's easy to do in an abstract spec. So, we can also define transformation functions that operate on the full state of a node for sake of a practical efficiency. For example, if we send a message that contains a node's full state $$s$$, we can send $$m = f(s)$$ into the network, and assume the receiver can easily compute $$s = f^{-1}(m)$$ to get the full state back, so that we could still express our protocol logic in terms of the full state. -->

<!-- For example, in Raft as classically defined, an AppendEntries message may only send one new log entry (or a chunk of them) from a primary to a follower. This is based on a local computation, though, based on its knowledge of its own log and the log application progress (`matchIndex`) of the follower node. So, we can think of this as applying some transformation function $$f$$ on these local state variables to produce a message format that is efficient to send across the network. -->

### Related Work

This approach is similar to past work on the [Heard-Of Model](https://link.springer.com/article/10.1007/s00446-009-0084-6), and also a specification approach taken in some [PaxosStore specifications](https://dl.acm.org/doi/10.14778/3137765.3137778) from WeChat that they refer to as *semi-symmetric* message passing. The notion of specifying protocols as queries over histories also has been around for a while. This includes the foundational work done on [Dedalus](https://www2.eecs.berkeley.edu/Pubs/TechRpts/2009/EECS-2009-173.pdf) and [Bloom](https://bloom-lang.net/) by Peter Alvaro and also on [DistAlgo](https://dl.acm.org/doi/10.1145/2994595). My understanding is that this also overlapped somewhat with the "relational transducer" model for declarative networking used in [NDLog](https://netdb.cis.upenn.edu/fvn/ndlogsemantics.pdf) and [similar techniques](https://arxiv.org/pdf/1012.2858). The general idea of a history-oriented approach to specification has appeared in a kind of folk way in some of Lamport's [original specs](https://github.com/tlaplus/Examples/blob/9ac1cdc8d54ce619105ffed96a7c9b52041733ae/specifications/Paxos/Paxos.tla#L108-L141) of Paxos. Similar concepts also appear in posts on a [message soup](https://quint-lang.org/posts/soup#long-story-short) approach to modeling. I believe the [Hydroflow work](https://hydro.run/papers/hydroflow-thesis.pdf) is also more recently taking these ideas further by concretely exploring ways to incrementally compute (e.g. compile) network or dataflow queries.