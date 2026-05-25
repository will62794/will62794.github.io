---
layout: post
title:  "WaveScalar "
categories: databases transactions programming
---

[WaveScalar](https://www.youtube.com/watch?v=Qsb6fZGYP8M&t=1052s) was design for dataflow oriented hardware system. Chip multi-processors became the main way to scale when heat/power law slowed down increasing performance for single processor performance.

Generalization of instruction level parallelism.

Highly scalable processor architecture. Uses fundamentally different algorithm for executing programs, and also organizes hardware very differently.
- Dataflow execution model.
- WaveScalar hardware design


Interesting how much this model comes to resemble application executing against distributed key-value store. Each instruction loads/stores something from memory, and program (application) is represented in terms of its dataflow, instead of strict sequence.

Can we directly build durable execution style systems in this manner, where loads and stores just go to a persistent KV store instead of memory?

Interesting view too that multi-core processes are kind of like mini workflow engines in a way, rather than sets of many parallel, strictly sequential processors. You can like take a bunch of work from a program and schedule this across different worker cores as they become available.

Many, many previous dataflow architectures.