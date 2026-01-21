---
layout: post
title:  "Bespoke Verified Compilation with Claude"
categories: verification llms compilation
---

If we've written a formal specification in TLA+, we can check various correctness properties using [TLC](https://github.com/tlaplus/tlaplus), a model checker for specifications that basically just exhaustively explores the reachable states of the model and check that some specified property (e.g. invariant) holds.

TLC was originally developed [over 20 years ago](https://link.springer.com/chapter/10.1007/3-540-48153-2_6), is written in Java, and has had a lot of development effort put into it. So, it's a mature tool, and quite performant, but probably not expected to reach the theoretical limit of performance for checking finite, explicit-state system models, as it is essentially a dynamic interpreter for TLA+ that runs in Java. Overall, it seems the JVM can still be pretty fast for this, but there are likely performance gains to be had to be moving to a lower-level (compiled) language. This is basically the approach state-of-the-art model checkers within their domain like [SPIN](https://spinroot.com/spin/whatispin.html) i.e. they generate C code that can then be compiled and actually executes the model checking logic.

In theory, doing this kind of translation task for TLA+ would be relatively nontrivial e.g. transpiling/compiling TLA+ constructs down into some lower level representation (e.g. in C/C++ data structures) for compilation and execution. Building any kind of general approach here likely requires somewhat detailed understanding of the language and existing interpreter implementations, and how to effectively translate this into a lower level representation while preserving semantics accurately.

### Verified Compilation

Instead of building a whole compilation engine, we can try asking Claude to do these as one-off translations for us. This is a kind of standard transpilation/compilation task, but in a "bespoke" way, since we're not aiming to build any kind of generic compiler, and can also take advantage of any details specific to the given problem instance (more and more software problems seem to be falling under this type of "bespoke" category with LLMs). 

Furthermore, since we already have TLC as an existing, reference interpreter, we can also ask Claude to generate an automated validation harness for us i.e. one that checks (at least for a finite space of models), that the output of the optimized C++ version of the model exactly matches that from the original TLA+ model. This gives us a convenient kind of (approximately) verified compilation step for going from high level TLA+ spec to a lower level model.

We can easily try this out for a given TLA+ spec by condensing this whole workflow into a prompt to Claude Code. More conveniently, wrap it into a [skill](https://code.claude.com/docs/en/skills), which is essentially just a format for storing re-usable prompts as Markdown. The prompt itself was developed over a few rounds of trial and error and refinement, to make sure Claude knew how to generate scripts with the right arguments, compare outputs properly, etc. The overall prompt is as follows:

<style>

pre {
    white-space: pre-wrap;       /* Since CSS 2.1 */
    white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
    white-space: -pre-wrap;      /* Opera 4-6 */
    white-space: -o-pre-wrap;    /* Opera 7 */
    word-wrap: break-word;       /* Internet Explorer 5.5+ */
    font-size: 14px;
    border: 1px solid #ccc;
}
.language-markdown{
    font-size: 12px;
}
</style>


{% highlight markdown %}
## Generate Optimized C++ version of TLA+ Spec

Take the chosen TLA+ spec (ask the user for which one) and generate a C++ program that generates its full reachable state space as the model checker would do but in a way as optimized as possible for a C++ implementation. Do this single threaded, and check with the user for how to instantiate the constant finite parameters in the compiled C++ version. Ensure that the C++ version dumps out all states in a standard JSON format, and can output this to a JSON file. Assume a general JSON dump format that contains a state array like `{ "states": [ {fp: <uint64_t>, val: <JSON>, initial: <boolean>}, ... ]}`, where 'val' is the actual JSON representation of that state, and 'fp' is some hash/fingerprint for that state. Also add an option to run this state space exploration with JSON dumping disabled.

Finally generate a Makefile with a simple, barebones default target for building it.

## Validate Conformance between TLC and C++ version 

Now validate to make sure that the set of states generated and dumped into JSON by the C++ version match the set of states generated and dumped by TLC in JSON. Generate a Python script that runs TLC to generate the same state space and dump it to JSON using the tla2tools-checkall.jar binary which supports a `-dump json states.json` argument, and then have the script validate that the states match between the TLC output and the C++ generated state space. 

Generate a simple validation report in Markdown after completing this.

## Benchmark Throughput Difference

Measure the throughput (states/second) difference in the state space generation states between TLC and the C++ version. Check with the user for the finite model config parameters to use for this run, and update the generated C++ version of the spec to account for this if needed. You can do this benchmark by measuring the total runtime of TLC for an exhaustive run, and measuring its time duration and from this compute distinct states per second, and doing this similarly for the C++ version. When doing this, disable JSON dumping for both TLC and C++ to avoid the associated overhead. In order to measure the throughput of TLC, make sure to use the time duration reported by the final output of TLC.

Generate a simple markdown report file on the results once the benchmark is complete.
{% endhighlight %}

From within a [repo](https://github.com/will62794/model-compiler), we can store this as a Markdown file under `~/.claude/commands` and then open up Claude Code and run the `compile_tla` command, which will then prompt us to get started with a given TLA+ spec.

### Running Some Benchmarks

We can start with a test on the [`TwoPhase.tla`](https://github.com/will62794/model-compiler/blob/main/TwoPhase/TwoPhase.tla) specification, a standard TLA+ example and benchmark modeling two-phase commit. If we start up Claude Code and run our compilation command on this spec, Claude chugs away, with a few interaction points from the user (e.g. to confirm finite model parameters, etc.) and we can see it generate the following validation report, executed for a model with 4 resource managers:


{% highlight markdown %}
# TwoPhase Spec Validation Report

## Configuration
- **Spec**: TwoPhase.tla
- **Resource Managers**: 4 (rm1, rm2, rm3, rm4)
- **Depth Limit**: Unlimited (full state space)

## Results Summary

| Metric | TLC | C++ |
|--------|-----|-----|
| Total States | 1568 | 1568 |
| Initial States | 1 | 1 |
| Runtime | 1.90s | 0.48s |

## State Comparison

- **Common states**: 1568
- **Only in TLC**: 0
- **Only in C++**: 0

## Validation Status: PASSED

The C++ implementation generates the exact same state space as TLC.

{% endhighlight %}

As a sanity check, we can go into this spec's directory and take a look. Claude generated a [456 line C++ file](https://github.com/will62794/model-compiler/blob/60c3c076f34d0a2984143205096b952d657c66eb/TwoPhase/saved_outputs/TwoPhase.cpp), `TwoPhase.cpp`, that compiles with `make` and generates a binary that when run produces:

```bash 
$ ./twophase
TwoPhase State Space Generator (C++)
Configuration: NUM_RM = 4
Depth limit: unlimited
JSON output: disabled

Exploration complete.
States found: 1568
Transitions: 5377
Duration: 0.000155417 seconds
Throughput: 10088986 states/second
```
If we run TLC with the same model parameters, we get the following:
```
Model checking completed. No error has been found.
  Estimates of the probability that TLC did not check all reachable states
  because two distinct states had the same fingerprint:
  calculated (optimistic):  val = 3.2E-13
5378 states generated, 1568 distinct states found, 0 states left on queue.
The depth of the complete state graph search is 14.
The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 9 and the 95th percentile is 4).
Finished in 00s at (2026-01-20 21:42:36)
```
which feels a strong extra sanity check that the C++ model is doing the right thing. Even generating the exactly correct number of reachable states would be hard to cheat, and the Python validation script that was generated should also ensure that the generated JSON state spaces match exactly between both TLC and the C++ version.

After running the benchmarking step, Claude also generated this report:

{% highlight markdown %}
# TwoPhase State Space Generation Benchmark

## Configuration

- **Spec**: TwoPhase.tla
- **Resource Managers**: 8 (rm1, rm2, rm3, rm4, rm5, rm6, rm7, rm8)
- **JSON Output**: Disabled (pure exploration benchmark)
- **Workers**: 1 (single-threaded)
- **Benchmark Iterations**: 3

## Results

| Metric | TLC | C++ |
|--------|-----|-----|
| States | 1,745,408 | 1,745,408 |
| Avg Duration | 49.9251s | 0.851219s |
| Min Duration | 43.0652s | 0.808712s |
| Avg Throughput | 34,961 states/s | 2,050,480 states/s |
| Max Throughput | 40,529 states/s | 2,158,257 states/s |

## Speedup

- **Average throughput speedup**: C++ is **58.7x faster** than TLC
- **Peak throughput speedup**: C++ is **53.3x faster** than TLC

{% endhighlight %}

showing us that the C++ version can acheve over a 50x throughput speedup over TLC for larger parameter configuration (8 resource managers). This is pretty cool, and impressive that Claude is able to generate what seems to be a semantically accurate translation of the high level spec in essentially one-shot. It also seems reasonable that validating these kinds of translation steps for smaller finite parameters would be sufficient to assume generalization to larger parameter configurations e.g. if it is desirable to run larger model checking runs but would be infeasible to do full validation at those larger parameters.

### AbstractDynamicRaft

We can run the above command for another spec, an [abstracted variant of Raft](https://github.com/will62794/model-compiler/blob/main/AbstractDynamicRaft/AbstractDynamicRaft.tla) that also includes basic dynamic reconfiguration functionality. Running our prior command again, Claude generates a 740 line C++ file and generates the following validation report:


{% highlight markdown %}
# AbstractDynamicRaft Validation Report

## Summary

| Metric | Value |
|--------|-------|
| TLC States | 470098 |
| C++ States | 470098 |
| Common States | 470098 |
| Only in TLC | 0 |
| Only in C++ | 0 |
| TLC Initial States | 7 |
| C++ Initial States | 7 |

## Result

**✓ PASSED**: The state spaces match exactly.

The C++ implementation correctly generates the same state space as TLC.
## Configuration

- **Spec**: AbstractDynamicRaft.tla
- **Server**: {n1, n2, n3}
- **MaxTerm**: 2
- **MaxLogLen**: 2
- **MaxConfigVersion**: 2
- **InitTerm**: 0
{% endhighlight %}

and followed by the benchmark report:


{% highlight markdown %}
# AbstractDynamicRaft Benchmark Report

## Summary

Comparison of state space exploration throughput between TLC (Java) and optimized C++ implementation.

| Metric | TLC | C++ |
|--------|-----|-----|
| Distinct States | 470,098 | 470,098 |
| Duration | 60.00s | 1.696s |
| Throughput | 7,835 states/sec | 277,180 states/sec |

## Performance Analysis

- **C++ Speedup**: **35.4x** faster than TLC
- **TLC Throughput**: 7,835 states/second
- **C++ Throughput**: 277,180 states/second

## Configuration

- **Spec**: AbstractDynamicRaft.tla
- **Server**: {n1, n2, n3}
- **MaxTerm**: 2
- **MaxLogLen**: 2
- **MaxConfigVersion**: 2
- **InitTerm**: 0

## Notes

- JSON state dumping was disabled for both TLC and C++ during benchmarking
- TLC was run with `-Xmx8g` heap and `-XX:+UseParallelGC`
- C++ was compiled with `-O3 -march=native -flto` optimizations
- Single-threaded execution for both

## Timestamp

Benchmark run on: 2026-01-20 22:13:38

{% endhighlight %}
showing a roughly 35x speedup over TLC when running with the C++ version.


### Final Thoughts

Among the many capabilities of coding agents, this is another one that is quite impressive. It also seems an example not only of a impressive nontrivial task, but also one that kind of re-frames the types of programming tasks we might care about. That is, in a "classical" view of programming, really the only natural way to solve this kind of task would be to build a general purpose transpiler/compiler, but LLMs let us consider just making these one-off tasks solvable in a "bespoke" way, in a way that's still impressive (due to the pwoer of the LLM) but also simpler in a way, since we don't actually need to be building an entire transpiler here (even if a coding agent could in principle also solve this problem). So, in a way, it seems the smartness and generality of the LLM coding agents also in some cases actually reduces the hardness of the types of problems that need to be solved, in a nice way, when problems have this "bespoke" quality to them.

It's also worth pointing out a variety of caveats that still limit this approach as a fully generalizable, real-world solution. First, all of the above was limited to a single threaded execution, and real TLC is able to safely run many parallel model checking in parallel, which requires extra care around concurrency control and efficient data structure design e.g. a shared, concurrent BFS queue is required to be managed between workers, as well as the state hash (fingerprint) set, which has been a source of fairly challenging performance engineering challenges in the past. Furthermore, one of TLC's unique features is also its ability to spill states to disk when they are too large to fit in memory. The above approach would be fundamentally memory limited, but with modern machines this is becoming less of a concern. Nevertheless, this is still quite a promising solution for simply the inner loop of any model checking or verification task which ultimately still requires fast generation and evaluation of the transition relation of a spec in order to generate reachable states.

All the tests here were run with Claude Code v2.1.14 on Opus 4.5, on 2024 Apple M3 Macbook Pro, and the code and Claude prompts found [here](https://github.com/will62794/model-compiler). As with many LLM-oriented tasks, the determinism of the outputs of these type of workflows was also ahzy to understand well, and there seems to often be a better breakdown of a workflow into those steps which are truly "non-deterministic" or LLM-driven and those which can be cached as relatively deterministic scripts (e.g. the validation scripts). When starting off, though, it is easy to just write everything up a single agent prompt and re-run the workflow from scratch to test it out and experiment. Also, working with Claude in this way really makes it really nice to think about these experimentation workflows "end to end" without focusing on chaining together various Python, baash scripts, compilation steps, etc. Especially when going further and generating whole written reports or visuals from an experiment, that is something that typically is super manual and requires a lot of analysis and stitching things together.