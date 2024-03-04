---
layout: post
title:  "On Roles in Paxos"
categories: distributed-systems
---

In most classical descriptions of Paxos, it is assumed that agents of the system are separated into distinct *proposer*, *acceptor*, and *learner* roles. As described in Paxos Made Simple:

> We let the three roles in the consensus algorithm be performed by three classes of agents: proposers, acceptors, and learners. In an implementation, a single process may act as more than one agent, but the mapping from agents to processes does not concern us here.

I have been confused/bothered by this role categorization and whether it is fundamental or "natural". Like, I think it's actually a bit of an abstraction leap to go right from "let's solve the cosnensus problem among a set of distributed nodes" to breaking down agent roles in that particular proposer/acceptor/learner split. If we were starting from the bare bones consensus problem, it seems more natural to think about the more classic consensus problem statement i.e. we have a set of distributed nodes/processes that each need to decide on a some value and we want this decided value to be consistent across all nodes.

I find it helpful to think about a description/model of Paxos that starts from this other perspective i.e assumes only some amount of node local state among a set of processes, and messages then need to be sent between nodes to achieve consensus. This feels a more natural "physical" analogy to me e.g., if a group of people were trying to achieve consensus among themselves in a distributed fashion, I don't think the proposer/acceptor role divide is necessarily natural at all, at least when first thinking about the problem.

Here is a [formal specification of Paxos](https://github.com/will62794/mypaxos/blob/master/PaxosUniversal.tla) in a so-called "universal" message passing style, where we get rid of message types entirely, and node roles, and execute everything in a broadcast and read paradigm. The local states of each node are now as follows:

<!-- Largest ballot number the node has seen. -->
<!-- Ballot of the largest accepted proposal -->
<!-- Value of the largest proposal accepted by the node. -->
<!-- chosen value at each node. -->
- `maxBal`
- `maxVBal` 
- `maxVal`
- `chosen`

where the first 3 variables, `maxBal`,`maxVBal`, and `maxVal` have the standard meaning as in classic Paxos, and `chosen` is a node local variable that records that nodes decided value. The actions of the protocol are now as follows:

- `Phase1b`
- `Phase2a`
- `Phase2b`
- `Learn`

The `Phase1b` is more or less analogous to the `Phase1b` of Paxos, but we get rid of `Phase1a`, since proposers no longer are demarcated as distinct roles. Instead, any node can try to go ahead and `Prepare`, which simply consists of a node preparing at some ballot number `b`, provided that `b` is newer than its latest seen ballot. It simply updates it `maxBal` to that ballot and, implicitly based on our message passing style, broadcasts its updated state.

Now, the traditional `Phase2a` of Paxos for ballot `b` simply consists of checking whether a quorum of nodes are at ballot `b`. In our universal message passing model, we can basically always just directly read from any historical state of any other node, so checking this is natural, expressed as a predicate over the `msgs` set. If the precondition for `Phase2a` at ballot `b` is met (i.e. a quorum is prepared at ballot `b`), then a node should be free to go ahead and try to get a value accepted at ballot `b`. As in standard Paxos, it needs to see if any of the nodes in its ballot `b` quorum had already accepted values in an earlier ballot. It can do this by simply reading their values of `maxVBal` and `maxVal`. If so, then it is required to only propose the value for the highest such proposal. Otherwise, it is "free" and can choose any value it wants for the ballot. But, not quite. A typical requirement of Paxos is that we somehow ensure that different proposers don't re-use the same ballot number. Otherwise, two proposers could pick a different value for the same ballot number, and this naturally breaks safety. 

In practice, we might use some allocation scheme that gives different proposers disjoint sets of ballot numbers to use, but, in an abstract model, the important thing is really only that there can't be proposals made in the same ballot with different values. So, instead of any kind of ballot allocation or proposer modeling, we can simply statically assign a unique value to each ballot number, that we assume every node has access to. So, now, when executing `Phase2a`, if ballot `b` is prepared and a node is "free", then it always proposes the value that is pre-determined in the global proposal table.

After a node executes its `Phase2a` action, it can also implicitly/atomically execute its own `Phase2b` action, which consists of updating its `maxVBal` and `maxVal` to the ballot and value it just proposed. It by default broadcasts this updated state, and so other nodes can now execute their so-called `Phase2b` action if they see a `maxVBal` greater than their own `maxBal`.

The `Learn` action then only needs to see if a quorum of nodes have accepted a proposal at a given ballot.

OVerall, I would argue that Paxos Made Simple is perhaps not actually the simplest way to understand or present Paxos. I think that at the outset, that paper already makes a somewhat subtle and non-obvious leap to proposer/acceptor/learner roles that is not necessarily natural. The whole discussion is then rpesented in that style, and if you don't understand that initial step deeply, it can be harder to understand the essence of the protocol.

