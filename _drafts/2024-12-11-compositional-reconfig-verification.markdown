---
layout: post
title:  "Compositional Modeling of Dynamic Reconfiguration"
categories: formal-methods specification
---

We designed a [new Raft-based protocol with dynamic reconfiguration](https://will62794.github.io/assets/papers/LIPIcs-OPODIS-2021-26.pdf) that utilizes a so-called "logless" design, more explicitly decoupling the main operation log from the sequence of configuration changes. This is in contrast to the traditional Raft-based reconfiguration protocols which run reconfigurations as operations in the main log. 

As part of this decoupled design, we were able to formally specify the protocol in a compositional manner that reflects this decoupling. Based on the compositional strucutre, we can also take advantage of it for optimizing model checking due to the specific type of composition we employ between the two subprotocols i.e. the main data replication protocol and the reconfiguration sub-protocol. 