---
layout: post
title:  "Bespoke Verified Compilation with Claude"
categories: verification llms compilation
---

If we've written a formal specification in TLA+, we can check various correctness properties using TLC, a model checker for specifications that basically just exhaustively explores the reachable states of the model and check that some specified property (e.g. invariant) holds.

TLC was originally developed over 20 years ago, written in Java, and has had a lot of development effort put into it. So, it's a mature tool, and quite performant, but probably not expected to reach the theoretical limit of performance for checking finite, explicit-state system models, as it is essentially a dynamic interpreter for TLA+ that runs in Java. Overall, it seems the JVM can still be pretty fast for this, but there are likely performance gains to be had to be moving to a lower-level (compiled) language. This is basically the approach state-of-the-art model checkers within their domain like [SPIN](https://spinroot.com/spin/whatispin.html) i.e. they generate C code that can then be compiled and actually executes the model checking logic.

In theory, to do this kind of translation/compilation for TLA+ would be a relatively nontrivial task e.g. transpiling/compiling TLA+ constructs down into some lower level representation (e.g. in C/C++ data structures) that for compilation and execution. Building any kind of general approach here requires somewhat detailed udnerstanding the language and itnerpreter semantics, and how to effectively translate this into a lower level representation while preserving semantics accurately.

Instead, we can try asking Claude to do this translation for us. This is a kind of standard transpilation/compilation task, but in a "bespoke" way, since we don't need to build any kind of generic transpiler/compiler, and can take advantage of any specific details to the given problem instance. A lot more software problems seem to be falling under this category with LLMs.

### Verified Compilation

If we try this for a few TLA+ specs, we can see some fairly nontrivial speedups (~30x throughput) on raw interpreter speed. Furthermore, since we already have the TLC model checker as a kind of reference interpreter, we can also ask Claude to generate an automated validation harness for us i.e. one that checks (at least for a finite space of models), that the output the optimized C++ version of the model exactly matches the semantics of the original TLA+ model. This gives us a convenient kind of (semi) verified compilation step for going from high level TLA+ spec to lower level model.

This can basically all be boiled down into a prompt to Claude Code (more conveniently, wrapped into a [command/skill](https://code.claude.com/docs/en/skills), which is essentially just a format for storing re-usable prompts). The prompt itself was developed over a few rounds of trial and error and refinement, to make sure Claude knew how to generate scripts with the right arguments, compare outputs properly, etc. But, the main command prompt is as follows:

<style>

pre {
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
    font-size: 16px;
    border: 1px solid #ccc;
}
</style>

<pre>
Can you take the chosen TLA+ spec (ask the user for which one) and generate a C++ program that generates its full reachable state space as the model checker would do but in a way as optimized as possible for C++ impl? You can do this single threaded, and and check with the user for how to instantiate the constant finite parameters in the compiled C++ version.

Make sure that this C++ version dumps out all states in a standard JSON format, and will output this to a JSON file.

Also generate a Makefile with a simple, barebones default target for building it.
</pre>

We can start with a test on the TwoPhase specification that is often used as a standard TLA+ example and benchmark. If we run this under TLC with 4 resource managers, it generates the following:

```
Finished computing initial states: 1 distinct state generated at 2026-01-20 15:08:49.
Model checking completed. No error has been found.
  Estimates of the probability that TLC did not check all reachable states
  because two distinct states had the same fingerprint:
  calculated (optimistic):  val = 3.2E-13
5378 states generated, 1568 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 14.
The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 9 and the 95th percentile is 4).
Finished in 00s at (2026-01-20 15:08:50)
```

Running the above prompt for the TwoPhase.tla spec, Claude generates a 614 line C++ file that it combines with the following paratmers, and we can run run with

```bash
$ ./twophase_explorer 
TwoPhase Commit Protocol State Space Explorer
Number of Resource Managers: 4

Mode: Full state space exploration
Max depth: unlimited
Output file: states.json

Depth 1: 10 states explored so far
Depth 2: 46 states explored so far
Depth 3: 134 states explored so far
Depth 4: 288 states explored so far
Depth 5: 504 states explored so far
Depth 6: 764 states explored so far
Depth 7: 1034 states explored so far
Depth 8: 1267 states explored so far
Depth 9: 1428 states explored so far
Depth 10: 1516 states explored so far
Depth 11: 1554 states explored so far
Depth 12: 1566 states explored so far
Depth 13: 1568 states explored so far
Exploration complete: 1568 states, 5377 transitions
```

At least on the surface, it looks like the C++ version generated an identical number of states as TLC, but we can verify this with Claude as well:

```
I want to you validate to make sure that the set of states generated and dumped into JSON by the C++ version match the set of states generated and dumped by TLC in JSON. 

Generate a Python script that runs TLC to generate the same state space and dump it to json using the tla2tools-checkall.jar binary which supports a '-dump json states.json' argument, and then the script validates the states match between the TLC output and the C++ generated state space. 

To do this more efficiently without exploding state sizes, do these checks by limiting the depth of state space exploration. You can limit depth in TLC by using the TLCGet("level") call and modifying the transition function, and you can also feel free to add an option to the C++ to limit depth of its state space exploration when generating and dumping JSON. To determine the actual max depth to run the validation checks at, you can run the TLC model checker at increasing depths, starting from 2, until it generates roughly 50,000 states or more. Depths of {4,6,8} are fine. If at depth 8 the set of states is still less than 50,000, then just use depth 8. This depth should be sufficient for comparison against the C++ generated state space. 

Notes: 
 - The 'timeout' command doesn't work on macOS
 - TLC's "level" limiting will actually be 1 less depth than specified in MaxDepth, if you use it for a state constraint. 

Generate a simple validation report in Markdown after completing this.
```


We can also test this on an abstract variant of a Raft protocol spec.


In most cases, Claude was able to generate a completely semantically accurate C++ version of the higher level TLA+ model in nearly one shot. The validation step is still somewhat approximate, but being able to exactly generate the correct set of reachable states (over 1000s or 10000s of states) is significantly hard to cheat on, and feels a good indicator that the optimized model is actually representing the spec's semantics correctly.

### Benchmarking

Now that we have a fairly strong confidence that Claude is able to generate semantically correct transalations to C++ for these specs, we can see what kind of speedups we can get by using the compiled C++ version.

#### TwoPhase

To benchmark the speedups here, we can try boosting the number of resource managers in the finite model to generate a larger state space. Then, we can try running a single threaded exhaustive state space exploration with both TLC and the C++ variant and compare their runtimes, and double check that they appear to generate the same set of states.

Running with TLC:
```
Model checking completed. No error has been found.
  Estimates of the probability that TLC did not check all reachable states
  because two distinct states had the same fingerprint:
  calculated (optimistic):  val = 9.4E-7
  based on the actual fingerprints:  val = 2.6E-7
11657218 states generated, 1745408 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 26.
The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 17 and the 95th percentile is 4).
Finished in 40s at (2026-01-20 15:29:57)
```

And running in C++ variant:
```
$ time ./twophase_explorer
TwoPhase Commit Protocol State Space Explorer
Number of Resource Managers: 8

Mode: Full state space exploration
Max depth: unlimited
Output file: states.json

Depth 1: 18 states explored so far
Depth 2: 154 states explored so far
Depth 3: 842 states explored so far
Depth 4: 3342 states explored so far
...
Depth 24: 1745406 states explored so far
Depth 25: 1745408 states explored so far
Exploration complete: 1745408 states, 11657217 transitions
./twophase_explorer  1.13s user 0.03s system 98% cpu 1.171 total
```
Assuming the state space generated is correct, given that the number of states matches between TLC and C++, this gives a wall-clock speedup of around 35x. Note this is all running with a single worker thread, on a 2024 Apple M3 chip.

#### AbstractRaft

Let's measure the speedup for the abstract Raft spec as well, first with TLC:

```
Finished computing initial states: 7 distinct states generated at 2026-01-20 14:41:28.
Progress(8) at 2026-01-20 14:41:31: 205,362 states generated (205,362 s/min), 48,666 distinct states found (48,666 ds/min), 28,390 states left on queue.
Progress(17) at 2026-01-20 14:42:31: 4,922,977 states generated (4,717,615 s/min), 468,682 distinct states found (420,016 ds/min), 1,645 states left on queue.
Model checking completed. No error has been found.
  Estimates of the probability that TLC did not check all reachable states
  because two distinct states had the same fingerprint:
  calculated (optimistic):  val = 1.1E-7
  based on the actual fingerprints:  val = 8.2E-7
4971847 states generated, 470098 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 22.
The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 12 and the 95th percentile is 4).
Finished in 01min 04s at (2026-01-20 14:42:33)
```
and then with the C++ variant:
```
$ time ./AbstractDynamicRaft -explore test.json
Constants:
  NUM_SERVERS = 3
  MAX_TERM = 2
  MAX_LOG_LEN = 2
  MAX_CONFIG_VERSION = 2
  INIT_TERM = 0

Starting BFS exploration...
Initial states: 7
Processed: 10000, Visited: 26684, Frontier: 16684
Processed: 20000, Visited: 48311, Frontier: 28311
Processed: 30000, Visited: 66933, Frontier: 36933
...
Processed: 460000, Visited: 465837, Frontier: 5837
Processed: 470000, Visited: 470080, Frontier: 80
Exploration complete. Total states: 470098
./AbstractDynamicRaft -explore test.json  4.97s user 0.05s system 99% cpu 5.049 total
```
giving something close to a 13x speedup.



### Thoughts

Among the many capabilities of coding agents, this is another one that is quite impressive. Interestingly, it also is an example not only of a impressive big coding task, but also one that kind of re-frames the types of programing tasks we might care about. That is, in a "classical" view of programming, really the only natural way to solve this kind of task would be to build a general purpose transpiler/compiler, but LLMs let us consider just making these one-off tasks solvable in a "bespoke" way, in a way that's still impressive (due to the pwoer of the LLM) but also simpler in a way, since we don't actually need to be building an entire transpiler here (even if a coding agent could in principle also solve this problem). So, in a way, it seems the smartness and generality of the LLM coding agents also in some cases actually reduces the hardness of the types of problems that need to be solved, in a nice way, when problems have this "bespoke" quality to them.