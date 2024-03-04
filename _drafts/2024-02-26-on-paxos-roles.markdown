---
layout: post
title:  "On Roles in Paxos"
categories: distributed-systems
---

Standard descriptions of Paxos assume that agents of the system are separated into distinct *proposer*, *acceptor*, and *learner* roles. As presented in [Paxos Made Simple](https://www.microsoft.com/en-us/research/publication/paxos-made-simple/):

> We let the three roles in the consensus algorithm be performed by three classes of agents: proposers, acceptors, and learners. In an implementation, a single process may act as more than one agent, but the mapping from agents to processes does not concern us here.

To what extent is this role categorization is fundamental or "natural", though? It is somewhat of an abstraction leap to go right from "solve the consensus problem among a set of distributed nodes" to breaking down agent roles in the specific proposer/acceptor/learner split. Rather, when starting from the core consensus problem, it seems more natural to think about the more classic consensus problem statement i.e. we have a set of distributed nodes/processes that each need to decide on a some value and we want this decided value to be consistent across all nodes.

It is useful to think about a description/model of Paxos that starts from this perspective i.e assumes only some amount of node local state among a set of processes, and messages then need to be sent between nodes to achieve consensus. This feels a more natural "physical" analogy to me e.g., if a group of people were trying to achieve consensus among themselves in a distributed fashion, I don't think the proposer/acceptor role divide is necessarily natural at all, at least when first thinking about the problem. We can transform the standard Paxos models into a model that reflects this more "natural" approach, and also gives some more insight into the underlying mechanisms of the protocol. 

### Specifying Paxos without Roles

We can [specify Paxos based on this approach](https://github.com/will62794/mypaxos/blob/master/PaxosUniversal.tla), while also utilizing what we can call a "universal" message passing style. We get rid of node roles and also get rid of all message types. All protocol actions consist only of reading message and/or local state and updating a node's local state. The updated node state after taking such an action is always implicitly broadcast into the network as a new "message". We can think about this as a generalization of any message passing protocol, since broadcasting a node's entire state is a superset of any information that might be sent in a message. That is, any message of a protocol will only consist of some function of the node's current state at the time of sending. So, broadcasting its entire state doesn't "lose" any information.

The local states of each node are now as follows:

<!-- Largest ballot number the node has seen. -->
<!-- Ballot of the largest accepted proposal -->
<!-- Value of the largest proposal accepted by the node. -->
<!-- chosen value at each node. -->
- `maxBal`
- `maxVBal` 
- `maxVal`
- `chosen`

where the first 3 variables, `maxBal`,`maxVBal`, and `maxVal` have the standard meaning as in classic Paxos, and `chosen` is a node local variable that records that nodes decided value. The actions of our model are as follows:

- **`Prepare(b, n)`**: Node `n` prepares at ballot `b`.
- **`Phase2a(b, v, n, Q)`**: Node `n` tries to get value `v` to be accepted at ballot `b` with quorum `Q`.
- **`Phase2b(n)`**: Node `n` accepts a value at some ballot, updating `maxVBal` and `maxVal` accordingly.
- **`Learn(n, b, v, Q)`**: Node `n` learns that value `v` has been chosen at ballot `b` by quorum `Q`.


#### Preparing 

The `Prepare` action roughly maps to `Phase1b` of classic Paxos, but we get rid of explicit `Phase1a` messages/actions, since proposers are no longer considered an explicit agent/role. Instead, any node can try to go ahead and spontaneously `Prepare` in a given ballot, which simply means the node moves to some newer ballot number `b` (i.e., a ballot newer than its current `maxBal`). Upon preparing, it simply updates `maxBal` to the new ballot and, given our universal message passing style, broadcasts its updated state.

#### Accepting 

Now, the traditional `Phase2a` of classic Paxos for a ballot `b` simply consists of checking whether a quorum of nodes have moved to (i.e. "are prepared at") ballot `b`. In our universal message passing model, we can think about any action as always having the ability to directly read any historical state of another node, so checking this condition is natural, expressed as a predicate over the `msgs` set. 

If the precondition for `Phase2a` at ballot `b` is met (i.e. a quorum is prepared at ballot `b`), then a node should be free to go ahead and try to get a value accepted at ballot `b`. As in standard Paxos, a node needs to check to see if any of the nodes in the ballot `b` quorum had already accepted values in earlier ballots. It can check this by simply reading their `maxVBal` and `maxVal` values. If some values were accepted in prior ballots, then a node is required to use the value for the highest such proposal for its own ballot. Otherwise, it is *free* and can choose any value it wants for the ballot. Not quite, though. A core requirement of classic Paxos is that different proposers don't use the same ballot number for different proposals. Otherwise, two proposers could pick a different value for the same ballot number, which naturally breaks safety. 

In practice, we can use an allocation scheme that assigns distinct nodes/proposers disjoint sets of ballot numbers to use. In an abstract model, though, the important thing is really only that there can't be proposals made in the same ballot with different values. That is, proposals are globally unique. So, instead of using a ballot allocation scheme, we can simply statically assign a unique value to each ballot number upfront, that we assume every node has access to. So, now, when executing `Phase2a`, if ballot `b` is prepared and a node is "free", then it always proposes the value that is pre-determined in the global proposal table. 
<!-- We could have the node dynamically choose  -->

After a node executes its `Phase2a` action, it can also atomically execute its own `Phase2b` action locally, which consists of updating its `maxVBal` and `maxVal` to the ballot and value it just proposed. It broadcasts this updated state, so other nodes can now execute their so-called `Phase2b` action if they see a `maxVBal` greater than their own `maxBal`. In classic Paxos this is typically communicated via an explicit "2b" message, but all this message is really conveying is the information that a value `v` is safe to be accepted for ballot `b`, meaning that (1) a quorum of nodes are prepared at ballot `b` and (2) value `v` is a safe value to use for ballot `b`. 

#### Learning 

The `Learn` action is now a straightforward quorum read that directly checks the "chosen" condition i.e. a quorum of nodes have accepted a proposal at a given ballot.

<!-- Overall, Paxos Made Simple is perhaps not actually the simplest way to understand or present Paxos. I think that at the outset, that paper already makes a somewhat subtle and non-obvious leap to proposer/acceptor/learner roles that is not necessarily natural. The whole discussion is then rpesented in that style, and if you don't understand that initial step deeply, it can be harder to understand the essence of the protocol. -->

