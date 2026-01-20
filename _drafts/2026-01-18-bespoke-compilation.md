---
layout: post
title:  "Bespoke Compilation with Claude"
categories: databases transactions programming
---

We can take a system specification written in TLA+ and check its correctness using TLC, a model checker written in Java that will exhaustively explore the reachable states of the model and check that some specified invariatn holds. TLC is reasonalby performant, but probably not expected to reach the theoretical limit of performance for checking finite system models like this since it is essentially interpretes the code of a TLA+ model dynamically within Java. Overall, it seems the JVM can still be pretty fast for this, but there are likely perf gains to be had to be moving to a lower-level compiled language. This is basically what other fast model checkers like SPIN do i.e. they generate C code that can then be compiled and actually executes the model checking logic.

In theory, to do this for TLA+ would be a big task e.g. of transpiling/compiling TLA+ constructs down into some lower level representation (e.g. in C/C++ data structures) that can then be compiled and executed. Another approach is trying to get Claude to do this kind of one-off compilation for a given model for us. This is a kind of basic transpilation/compilation task, but in the general kind of "bespoke" way, since we don't need to build any kind of generic transpiler/compiler, and can take advantage of any specific details to the given problem instance.

If we try this for a few TLA+ specs, we can get some fairly dramatic speedups (~100x throughput) on raw interpreter speed, and, since we already have the TLC model checker as a kind of reference interpreter, we can also ask Claude to autoamtically generate a validation harness for this i.e. that checks (at least for a fintie space of models), that the output the optimized C++ version of the model exactly matches the semantics of the original TLA+ model.


This can basically all be boiled down into a prompt to Claude Code, or, more conveniently, wrapped into a "command", which is just CC's standard format for essentially storing custom commands as their own prompts. The prompt itself was developed over  a few rounds of trial and error and refinement, to make sure Claude knew how to generate scripts with the right arguments, compare outputs properly, etc. But, the main command prompt, labeled as the `compile-tla` command is as follows:

```
Can you take the chosen TLA+ spec (ask the user for which one) and generate a C++ program that generates its full reachable state space as the model checker would do but in a way as optimized as possible for C++ impl? you can do this single threaded, and also check with the user for how to instantiate the constant finite parameters in the compiled C++ version.. Also generate a Makefile with a simple, barebones default target for building it. Also make sure that this C++ version dumps out all states in a standard JSON format, and output this to a JSON file.

After this, I want to you validate to make sure that the set of states generated and dumped into JSON by the C++ version match the set of sttaes generated and dumped by TLC in JSON. You can generate a Python script that runs TLC to generate the same staet space and dump it to json using the tla2tools-checkall.jar binary which supports a '-dump json states.json' argument,and then the script validates the states match between the TLC output and the C++ generated state space. Generate a simple validation report in Markdown after completing this.

After this, I also want to measure the throughput difference in generating purely random states between TLC and the C++ version. So, go ahead and also create a variation to the C++ script that just generates random states as quickly as possible by generating random behaviors of length 20 (specified with a separate `-depth <length>` argument to TLC), and compare this state generation throughput to TLC single threaded simulation throughput. You can bound the number of total traces generated to 1000000 in this test, and then also generate a simple markdown markdown report file on the results once the test is complete.
```

Then, within a directory, we can simply download whatever specs we want to try this on, and run these benchmarks for each individually.



In most cases, Claude was able to generate a completely semantically accurate C++ version of the higher level TLA+ model in nearly one shot. The validation step is still somewhat approximate, but being able to exactly generate the correct set of reachable states (over 1000s or 10000s of states) is significantly hard to cheat on, and feels a good indicator that the optimized model is actually representing the spec's semantics correctly.

Among the many magical capabilities of coding agents, this is another one that is quite impressive. Interestingly, it also is an example not only of a impressive big coding task, but also one that kind of re-frames the types of programing tasks we might care about. That is, in a "classical" view of programming, really the only natural way to solve this kind of task would be to build a general purpose transpiler/compiler, but LLMs let us consider just making these one-off tasks solvable in a "bespoke" way, in a way that's still impressive (due to the pwoer of the LLM) but also simpler in a way, since we don't actually need to be building an entire transpiler here (even if a coding agent could in principle also solve this problem). So, in a way, it seems the smartness and generality of the LLM coding agents also in some cases actually reduces the hardness of the types of problems that need to be solved, in a nice way, when problems have this "bespoke" quality to them.