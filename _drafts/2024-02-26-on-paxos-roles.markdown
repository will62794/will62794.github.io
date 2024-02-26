---
layout: post
title:  "On Roles in Paxos"
categories: distributed-systems
---

In most classical descriptions of Paxos, it is assumed that agents of the system are separated into distinct *proposer*, *acceptor*, and *learner* roles. As described in Paxos Made Simple:

> We let the three roles in the consensus algorithm be performed by three classes of agents: proposers, acceptors, and learners. In an implementation, a single process may act as more than one agent, but the mapping from agents to processes does not concern us here.

I have been confused/bothered by this role categorization and whether it is fundamental or "natural". Like, I think it's actually a bit of an abstraction leap to go right from "let's solve the cosnensus problem among a set of distributed nodes" to breaking down agent roles in that particular proposer/acceptor/learner split. If we were starting from the bare bones consensus problem, it seems more natural to think about the more classic consensus problem statement i.e. we have a set of distributed nodes/processes that each need to decide on a some value and we want this decided value to be consistent across all nodes.

I find it helpful to think about a description/model of Paxos that starts from this other perspective i.e assumes only some amount of node local state among a set of processes, and messages then need to be sent between nodes to achieve consensus. This feels a more natural "physical" analogy to me e.g., if a group of people were trying to achieve consensus among themselves in a distributed fashion, I don't think the proposer/acceptor role divide is necessarily natural at all, at least when first thinking about the problem.

