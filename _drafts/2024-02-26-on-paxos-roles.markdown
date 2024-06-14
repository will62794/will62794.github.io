---
layout: post
title:  "On Roles in Paxos"
categories: distributed-systems
---

Many standard descriptions of Paxos assume that agents of a system are separated into 3 distinct roles: *proposer*, *acceptor*, and *learner*. As presented in [Paxos Made Simple](https://www.microsoft.com/en-us/research/publication/paxos-made-simple/):

> We let the three roles in the consensus algorithm be performed by three classes of agents: proposers, acceptors, and learners. In an implementation, a single process may act as more than one agent, but the mapping from agents to processes does not concern us here.

Is this role categorization fundamental, though? The basic consensus problem is described earlier in Paxos Made Simple:

> Assume a collection of processes that can propose values. A consensus algorithm ensures that a single one among the proposed values is chosen. If
no value is proposed, then no value should be chosen. If a value has been chosen, then processes should be able to learn the chosen value. 

It seems a leap to go from this basic description of the consensus problem to the specific agent roles of *proposer / acceptor / learner*. 
Rather, a more intuitive approach seems to consider a set of distributed nodes/processes that each need to decide on a some value and we want this decided value to be consistent across all nodes. A particular role breakdown doesn't seem immediately obvious.


### Modeling Paxos without Roles

We can consider a model of Paxos that doesn't assume any initial role separation.
<!-- It is useful to think about a description/model of Paxos that starts from this perspective i.e  -->
We simply assume there is a set of nodes that each store some set of local state, and communicate with each other via messages to achieve consensus. This feels a more natural "physical" analogy to me e.g., if a group of people were trying to achieve consensus among themselves in a distributed fashion, the proposer/acceptor/learner role separation seems artificial, at least when first modeling about the problem. We can transform the standard Paxos models into a model that reflects this more "natural" approach, and also gives some more insight into the underlying mechanisms of the protocol. 

We [specify Paxos based on this style](https://github.com/will62794/mypaxos/blob/master/PaxosUniversal.tla), while also utilizing what we refer to as a "universal" message passing style. We get rid of node roles and also get rid of distinct message types. Protocol actions consist only of a node (1) reading message and/or its own local state and (2) updating its own local state. After any such action, updated node state such is then always broadcast into the network as a new "message". We can think about this model as a kind of generalization of any distributed, message passing protocol, since broadcast of a node's entire state will contain a superset of any information that might be sent in a typical protocol message. That is, the data sent in any traditional protocol message is simply a function of a node's current state at the time of sending. 
<!-- So, broadcasting its entire state doesn't "lose" any information. -->

In this Paxos model, the local states of each node are now as follows:

<!-- Largest ballot number the node has seen. -->
<!-- Ballot of the largest accepted proposal -->
<!-- Value of the largest proposal accepted by the node. -->
<!-- chosen value at each node. -->
- `maxBal`
- `maxVBal` 
- `maxVal`
- `chosen`

where the first 3 variables, `maxBal`,`maxVBal`, and `maxVal`, have the same meaning as in classic Paxos, and `chosen` is a node local variable that records a node's chosen value, if it has one. The actions of our model are then as follows:

- **`Prepare(n, b)`**: Node `n` prepares at ballot `b`.
- **`Phase2a(n, b, v, Q)`**: Node `n` tries to get value `v` to be accepted at ballot `b` with quorum `Q`.
- **`Phase2b(n)`**: Node `n` accepts a value at some ballot, updating `maxVBal` and `maxVal` accordingly.
- **`Learn(n, b, v, Q)`**: Node `n` learns that value `v` has been chosen at ballot `b` by quorum `Q`.


#### Preparing 

The `Prepare` action roughly maps to `Phase1b` of classic Paxos, but we get rid of explicit `Phase1a` messages/actions, since proposers are no longer considered an explicit agent/role. Instead, any node can try to go ahead and spontaneously `Prepare` in a given ballot, which simply means the node moves to some newer ballot number `b` (i.e., a ballot newer than its current `maxBal`). Upon preparing, it simply updates `maxBal` to the new ballot and broadcasts its updated state.

#### Accepting 

The traditional `Phase2a` of classic Paxos for a ballot `b` consists of checking whether a quorum of nodes have moved to (i.e. "are prepared at") ballot `b`. In our universal message passing model, we can think about any node as always having the ability to directly read any historical state of another node, so checking this condition is naturally expressed as a predicate over the `msgs` set. 

If the precondition for `Phase2a` at ballot `b` is met (i.e. a quorum is prepared at ballot `b`), then a node should be free to go ahead and try to get a value accepted at ballot `b`. As in standard Paxos, a node needs to check to see if any of the nodes in the ballot `b` quorum had already accepted values in earlier ballots. It can check this by simply reading their `maxVBal` and `maxVal` values. If some values were accepted in prior ballots, then a node is required to use the value for the highest such proposal for its own ballot. Otherwise, it is *free* and can choose any value it wants for the ballot. That's not exactly correct, though. A core requirement of classic Paxos is that different proposers don't use the same ballot number for different proposals. Otherwise, two proposers might pick a different value for the same ballot number, breaking safety. 

In practice, we may use an allocation scheme that assigns distinct nodes/proposers disjoint sets of ballot numbers to use. In an abstract model, though, the important thing is only that there can't be proposals made in the same ballot with different values. That is, we can view proposals as globally unique, as identified by their proposal number. So, instead of using a ballot allocation scheme, we can just [statically assign an arbitrary, unique value to each ballot upfront](https://github.com/will62794/mypaxos/blob/b70e4a7f8903716e6e61f7f1430544de1094e37a/PaxosUniversal.tla#L81-L89), and assume every node has access to this table. So, when executing `Phase2a`, if ballot `b` is prepared and a node is "free", then it always proposes the value that is pre-determined in this global proposal table. 
<!-- We could have the node dynamically choose  -->

If a node determines the `Phase2a` precondition is met, it can go ahead and atomically execute its own `Phase2b` action locally, which consists of updating its `maxVBal` and `maxVal` to the ballot and value it chose to propose. The node broadcasts this updated state, so other nodes can now execute their `Phase2b` action if they see some other node with a `maxVBal` greater than their own `maxBal`. In classic Paxos this is typically communicated via an explicit `2b` message, but such a message is simply conveying the information that a value `v` is safe to be accepted for ballot `b`, meaning that (1) a quorum of nodes are prepared at ballot `b` and (2) value `v` is a safe value to use for ballot `b`. 

#### Learning 

The `Learn` action is now a straightforward quorum read that directly checks the "chosen" condition i.e. a quorum of nodes have accepted a proposal at a given ballot.

### Further Thoughts

I'm not sure the Paxos Made Simple model is actually the simplest way to understand or present Paxos. At the outset, that paper makes a somewhat subtle and non-obvious leap to proposer/acceptor/learner roles that is not necessarily natural. The whole discussion is then presented in that style, and if you don't understand that initial step deeply, it can be harder to understand the essence of the protocol. The notion of analyzing "roles" in Paxos more deeply also comes up in some practical work on [scaling Paxos via compartmentalization](https://mwhittaker.github.io/publications/compartmentalized_paxos.pdf) observes that multi-Paxos leaders often play distinct roles (e.g. sequencing and broadcasting). Roles can in theory be decoupled for performance/scalability benefits.

