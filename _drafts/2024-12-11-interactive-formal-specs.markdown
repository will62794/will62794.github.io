---
layout: post
title:  "A Tool for Exploring Formal Specifications"
categories: formal-methods specification
---

Formal specifications are a core part of rigorous distributed systems design and verification, but the existing tools have still been lacking in providing good interfaces for interacting with, exploring, visualizing and sharing these specifications and models in a convenient manner. 

The [TLA+ Web Explorer](https://github.com/will62794/tla-web) aims to address this by providing a web-based interface for exploring and visualizing TLA+ formal specifications. It takes inspiration from past attempts at building similar tools, like Diego Ongaro's [Runway](https://www.usenix.org/system/files/login/articles/login_fall16_06_ongaro.pdf), but it builds atop TLA+ as an existing, well-defined formal specification language, rather than trying to build a new language alongside the tool.

### The Javascript Interpreter 

At the core of the TLA+ web explorer is a native, Javascript interpreter for TLA+ specifications. [TLC](https://github.com/tlaplus/tlaplus), the main model checker for TLA+ specifications, is a mature and well-maintained tool and has been optimized for performance over many years of development. It is, however, a somewhat complex and intricate codebase, written in Java, and so it was not a great candidate for integration into a browser based tool that would allow for dynamic interaction with specifications. One could build a kind of language server into TLC, that allows for remote interaction, but it seemed that this may still not enable the kind of ideal dynamic interaction that we would like, and would also require an external server to be maintained whenever the tool is being used.

<!-- In light of this, the origin of this tool centered around building a native interpreter for TLA+ in Javascript, so that we could have a fast, dynamic interpreter that could be directly embedded in the browser, and could run anywhere, locally. -->
The development of a Javascript interpreter for TLA+ was largely enabled by earlier work on [building a tree-sitter parser for TLA+](https://ahelwer.ca/post/2023-01-11-tree-sitter-tlaplus/), which can be compiled to [WebAssembly](https://webassembly.org/) and run in the browser. Parsing TLA+ itself is a non-trivial task, so the development of this browser-based parser was a big step forward in terms of enabling the web explorer tool for TLA+

### Interactive Trace Exploration

A core feature of the TLA+ web explorer is the ability to load a TLA+ specification and *interactively* explore behaviors of the specification. It provides the capability for a user to, at any current state, select any currently enabled action to transition to the next state reached by that action. This also allows for back-tracking in the current trace, and also for features like *trace expressions*, which allow arbitrary TLA+ expressions to be evaluated at each state of the current trace.

Ability to explore traces and and back track, and evaluate trace expressions e.g. a partial trace of the two-phase commit specification:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-11 at 9.59.05 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 95%; height: auto;">
</div>

Coupled with this is the ability to easily share traces via static links, which can be reloaded in a new browser window while retaining the generated trace and its various exploratory parameters/settings. This provides a very universal, portable way to share system traces, in a way that was somewhat awkward in the past. For example, here is one link showing two-phase commit [driving all the way to commit](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FTwoPhase_anim.tla&constants%5BRM%5D=%7Brm1%2Crm2%7D&trace=c99c20ba%2C30c6b350_0890eb82%2C344e78da_1b98ff2e%2C0d5b83ed_0890eb82%2Cd269707c_1b98ff2e%2Cbe584cb6%2Cb43678f6_0890eb82%2C148074d7_1b98ff2e), and another link showing it [driving through to abort](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FTwoPhase_anim.tla&constants%5BRM%5D=%7Brm1%2Crm2%7D&trace=c99c20ba%2Cf8e02e82%2C5591f69d_1fed159c%2C34e21ef8_b103fde2). It is also easy to link to some of the following system traces/counterexamples, that illustrate interesting behaviors and/or edge cases of different protocols:

- Raft rolling back entries
- 


In addition, the tool also provides a nice, dynamic REPL interface, that also can be evaluated in the context of the current loaded specification.

### Visualization

The above features are effective for exploring and understanding a specification, but in some cases it can also be nice to have a more polished and visual way to understand a system and its states/behaviors. So, having a visualization feature was a natural externsion to include in the web explorer tool, and it includes a simple DSL for visualizing system states using TLA+ itself. Currently, the goal is to provide a very simple, SVG-based DSL for defining visualizations right in the TLA+ specification itself, rather than requiring a separate interface/language for defining visualizations.

For example, here is a simple visualization of the famous Cabbage, Goat, Wolf puzzle specification solution:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-11 at 9.47.28 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 95%; height: auto;">
</div>
and here is a visualization of an abstract Raft specification with an elected leader and some log entries replicated across nodes:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-11 at 9.48.09 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 95%; height: auto;">
</div>

This DSL can currently be defined directly in the TLA+ specification itself, as seen [here](https://github.com/will62794/tla-web/blob/07c093c27a0886c70cbbf1ab1c1b7188caf4ca3d/specs/CabbageGoatWolf.tla#L74-L107), and currently provides a set of basic SVG primitives that can be arranged and positioned in group sets. 

### Conclusion

Overall, the vision is for the web explorer tool to remain complementary to the existing tooling. For example, it is expected that TLC will remain the primary tool for model checking of non-trivial TLA+ specifications, since it is still the most performant tool for doing so. The web explorer can be a tool for exploring, understanding, and prototyping specs, and sharing the results of these explorations in a convenient and portable manner, aspects that no existing tools in the ecosystem excel at.

