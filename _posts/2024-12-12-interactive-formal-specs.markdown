---
layout: post
title:  "A Tool for Exploring Formal Specifications"
categories: formal-methods specification
---

Formal specifications [have](https://github.com/elastic/elasticsearch-formal-models) [become](https://www.datadoghq.com/blog/engineering/formal-modeling-and-simulation/) [a core part](https://www.amazon.science/publications/how-amazon-web-services-uses-formal-methods) of rigorous distributed systems design and verification, but existing tools have still been lacking in providing good interfaces for interacting with, exploring, visualizing and sharing these specifications and models in a portable and effective manner. 

The [TLA+ Web Explorer](https://github.com/will62794/tla-web) aims to address this shortcoming by providing a browser-based tool for exploring and visualizing formal specifications written in [TLA+](https://lamport.azurewebsites.net/tla/tla.html). It takes inspiration from past attempts at building similar tools, like Diego Ongaro's [Runway](https://www.usenix.org/system/files/login/articles/login_fall16_06_ongaro.pdf), but it builds atop TLA+, taking advantage of an existing, well-defined formal specification language, rather than trying to build a new language alongside the tool.

### The Javascript Interpreter 

At the core of the tool is a new, native Javascript interpreter for TLA+. [TLC](https://github.com/tlaplus/tlaplus) is the main existing interpreter and model checker for TLA+ specifications, and is is mature, well-maintained, and has been optimized for performance over many years of development. It is, however, a somewhat complex and intricate codebase, written in Java, and so it was not a great candidate for integration into a browser-based tool that would allow for dynamic interaction with specifications. One could build a type of language server into TLC that allows for remote interaction, but this seemed to provide a less than ideal dynamic interaction experience, and would require an external server to be maintained whenever the tool is being used.

<!-- In light of this, the origin of this tool centered around building a native interpreter for TLA+ in Javascript, so that we could have a fast, dynamic interpreter that could be directly embedded in the browser, and could run anywhere, locally. -->
The development of a Javascript interpreter for TLA+ was largely enabled by earlier work on [building a tree-sitter parser for TLA+](https://ahelwer.ca/post/2023-01-11-tree-sitter-tlaplus/), which can be compiled to [WebAssembly](https://webassembly.org/) and run in the browser. Parsing TLA+ itself is a non-trivial task, so the development of this browser-based parser was a big step forward in terms of enabling the web explorer tool for TLA+. The interpreter itself is written entirely in plain Javascript, and [currently sits](https://github.com/will62794/tla-web/blob/07c093c27a0886c70cbbf1ab1c1b7188caf4ca3d/js/eval.js) at around 5000 lines of code. The goal is for the interpreter semantics to conform as closely as possible with TLC semantics, which we try to achieve via a conformance testing approach that compares the results of the Javascript interpreter and TLC [on a large corpus of TLA+ specifications](https://will62794.github.io/tla-web/test.html).

A benefit of this interpreter implementation is its ability to evaluate TLA+ specifications and expressions dynamically, in any browser e.g., seen below with a simple demo:

<div style="display: flex; justify-content: center;padding:20px;font-size:16px;">
    <input type="text" id="tla-repl-input" placeholder="Enter TLA+ expression" style="font-size: 18px;padding:10px;width:500px;font-family:monospace;" />
</div>

<div style="display: flex; justify-content: center;">Result:</div>

<div id="tla-init-states" style="display: flex; justify-content: center;align-items:center;font-size:16px;font-family:monospace;border:solid 1px gray;padding:10px;margin:15px;margin-bottom:32px;width:50%;margin-left:auto;margin-right:auto;height:26px;border-radius:10px;"></div>

<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>
<script src="/assets/tla-web-embed/js/hash-sum/hash-sum.js"></script>
<script src="/assets/tla-web-embed/js/eval.js"></script>
<script>LANGUAGE_BASE_URL = "js";</script>
<script src="/assets/tla-web-embed/js/tree-sitter.js"></script>


<script>
    // 
    // Main script that sets up and runs the interpreter.
    //

    let tree;
    let parser;
    let languageName = "tlaplus";
    let enableEvalTracing = false;

    /**
     * Main UI initialization logic. 
     */
    async function init() {
        const codeInput = document.getElementById('code-input');

        await TreeSitter.init();
        parser = new TreeSitter();

        let tree = null;
        var ASSIGN_PRIMED = false;

        // Load the tree-sitter TLA+ parser.
        let language;
        const url = `/assets/tla-web-embed/${LANGUAGE_BASE_URL}/tree-sitter-${languageName}.wasm`;
        try {
            language = await TreeSitter.Language.load(url);
        } catch (e) {
            console.error(e);
            return;
        }

        tree = null;
        parser.setLanguage(language);

        // Define a very simple spec inline.
        // This can also be fetched from a remote URL.
        let inputExpr = document.getElementById('tla-repl-input');
        inputExpr.addEventListener('input', function() {
            // Re-parse and evaluate spec with new input value
            let specText = `
            ---- MODULE test ----
            VARIABLE expr
            Init == expr = ${inputExpr.value}
            Next == expr' = expr
            ====`;

            document.getElementById('tla-init-states').innerHTML = "";

            // Parse the spec
            let spec = new TLASpec(specText, "");
            spec.parse().then(function () {
                // Initialize the interpreter after parsing the spec
                let interp = new TlaInterpreter();

                // Generate initial states
                let initStates = interp.computeInitStates(spec.spec_obj, {}, false);
                console.log("Init states:", initStates);
                document.getElementById('tla-init-states').innerHTML = initStates[0].getVarVal("expr");
            });
        });
        // let specText = `
        // ---- MODULE test ----
        // VARIABLE expr
        // Init == expr = ${inputExpr.value}
        // Next == expr' = expr
        // ====`;

        // // Parse the spec.
        // let spec = new TLASpec(specText, "");
        // spec.parse().then(function () {

        //     // Initialize the interpreter after parsing the spec.
        //     let interp = new TlaInterpreter();

        //     // Generate initial states.
        //     let initStates = interp.computeInitStates(spec.spec_obj, {}, false);
        //     console.log("Init states:", initStates);
        //     document.getElementById('tla-init-states').innerHTML = initStates[0];

        //     // Generate next states from the set of initial states.
        //     // let nextStates = interp.computeNextStates(spec.spec_obj, {}, initStates);
        //     // console.log("Next states:", nextStates);
        //     // document.getElementById('tla-next-states').innerHTML = nextStates[0].state;
        // });
    }

    // Initialize things.
    init();
</script>

### Interactive Trace Exploration

A core feature of the TLA+ web explorer is the ability to load a TLA+ specification and *interactively* explore behaviors of the specification. It provides the capability for a user to, from any current state, select an enabled action to transition to a next state, and also allows for back-tracking in the current trace. It also allows for the definition of *trace expressions*, which allow arbitrary TLA+ expressions to be evaluated at each state of the current trace.

For example below shows a partial trace of the [two-phase commit protocol specification](https://github.com/will62794/tla-web/blob/07c093c27a0886c70cbbf1ab1c1b7188caf4ca3d/specs/TwoPhase.tla) in the tool:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-12 at 12.19.13 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 92%; height: auto;" style="border:solid 1px;" width="95%">
</div>

The tool also provides with the ability to easily share traces via static links, which can be reloaded in a new browser window while retaining the generated trace and its existing parameters/settings. This provides a universal, portable way to share system traces, something that was quite awkward with existing tools. For example, here is a link showing two-phase commit [driving all the way to commit](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FTwoPhase_anim.tla&constants%5BRM%5D=%7Brm1%2Crm2%7D&trace=c99c20ba%2C30c6b350_0890eb82%2C344e78da_1b98ff2e%2C0d5b83ed_0890eb82%2Cd269707c_1b98ff2e%2Cbe584cb6%2Cb43678f6_0890eb82%2C148074d7_1b98ff2e), and another link showing it [driving through to abort](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FTwoPhase_anim.tla&constants%5BRM%5D=%7Brm1%2Crm2%7D&trace=c99c20ba%2Cf8e02e82%2C5591f69d_1fed159c%2C34e21ef8_b103fde2). It is also easy to link to some of the following system traces/counterexamples, that illustrate interesting behaviors and/or edge cases of different protocols e.g. here is a [link](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FAbstractRaft_anim.tla&constants%5BServer%5D=%7Bs1%2Cs2%2Cs3%7D&constants%5BPrimary%5D=%22Primary%22&constants%5BSecondary%5D=%22Secondary%22&constants%5BNil%5D=%22Nil%22&constants%5BInitTerm%5D=0&trace=318c702a%2C0785f33f_61cceca3%2Cbbf1576c_7afb3e6d%2Cf22c40e4_d78334f6%2C33e78fd9_0b61fc25%2C3a0d0c32_00b5da31) to a case of a Raft leader being elected, writing a log entry and then committing it across all nodes.

In addition to the trace exploration and expression features, the tool also provides a basic REPL interface, which allows arbitrary expressions to be evaluated in the context of the currently loaded specification. This feature mostly subsumes [previous attempts](https://github.com/will62794/tlaplus_repl) at providing a REPL-like interface for TLA+ specifications.

### Visualization

The above features are effective for exploring and understanding a specification, but in some cases it can also be nice to have a more polished and visual way to understand a system and its states/behaviors. Currently, the tool provides a very simple, SVG-based DSL for defining visualizations directly in a TLA+ specification itself, rather than requiring a separate interface/language for defining visualizations.

For example, here is a [simple visualization](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FCabbageGoatWolf.tla&trace=f3cb45ca%2C4357915f_7da698e2%2C126ae834_bf3b326e%2C76c2f092_652fccef%2C7229f089_f598e730%2C29e91cea_2ac3323e%2C50fe2821_bf3b326e%2C1d26e01c_9abe74ba%2C5f98d202_f598e730%2C3a9fa186_34b35f78%2Ca49994fc_bf3b326e%2Ceec0674a_652fccef%2C2afe63ed_f598e730%2C2883b61a_7da698e2%2C73ea1058_bf3b326e) of the final state of the famous Cabbage, Goat, Wolf puzzle specification solution:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-11 at 9.47.28 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 95%; height: auto;" style="border:solid 1px;" width="95%">
</div>
and here is [a visualization](https://will62794.github.io/tla-web/#!/home?specpath=.%2Fspecs%2FAbstractRaft_anim.tla&constants%5BServer%5D=%7Bs1%2Cs2%2C%20s3%7D&constants%5BSecondary%5D=%22Secondary%22&constants%5BPrimary%5D=%22Primary%22&constants%5BNil%5D=%22Nil%22&constants%5BInitTerm%5D=0&trace=318c702a%2C0785f33f_61cceca3%2Cbbf1576c_7afb3e6d%2C7d2094df_162f61ec%2C24889c7a_27f1dc2e%2C14a799f4_d78334f6%2Ce791a59e_0b61fc25%2C18d3230b_b9fc551c%2Cb3781e54_52c587a6) of an abstract Raft specification with an elected leader and some log entries replicated across nodes:

<div style="text-align: center;">
<img src="/assets/interactive-formal-specs/Screenshot 2024-12-12 at 12.12.30 PM.png" alt="TLA+ Web Explorer Visualization" style="width: 95%; height: auto;" style="border:solid 1px;" width="95%">
</div>

The visualization DSL can currently be defined directly in the TLA+ specification itself, as seen [here](https://github.com/will62794/tla-web/blob/07c093c27a0886c70cbbf1ab1c1b7188caf4ca3d/specs/CabbageGoatWolf.tla#L74-L107), and currently provides a set of basic SVG primitives that can be [arranged and positioned in hierarchical groups](https://github.com/will62794/tla-web/blob/07c093c27a0886c70cbbf1ab1c1b7188caf4ca3d/specs/CabbageGoatWolf.tla#L109-L156), following standard SVG conventions. In future, these these visualization primitives could be expanded with a variety of richer strucutres (e.g. graphs, lists, charts, [constraint-based approaches](https://andrewcmyers.github.io/constrain/) etc.), but for now even this simple set of primitives allows for a variety of helpful system visualizations.

### Conclusion

Overall, the vision is for the web explorer tool to remain complementary to existing tooling. For example, it is expected that TLC will remain the primary tool for model checking of non-trivial TLA+ specifications, since it is still the most performant tool for doing so. The goal is for the web explorer to be a tool for prototyping, exploring, and understanding specs, and sharing the results of these explorations in a convenient and portable manner, aspects that few existing tools in the ecosystem excel at.

