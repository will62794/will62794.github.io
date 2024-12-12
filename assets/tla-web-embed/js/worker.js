// TODO: Just a skeleton here.

console.log("Worker is running...")

self.importScripts('tree-sitter.js');
self.importScripts('eval.js');
self.importScripts('https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js');
self.importScripts('hash-sum/hash-sum.js');

let parser;
let languageName = "tlaplus";
let enableEvalTracing = false;

onmessage = async (e) => {


    let newText = e.data.newText;
    let specPath = e.data.specPath;
    let constValInputs = e.data.constValInputs;

    await TreeSitter.init();
    parser = new TreeSitter();

    let tree = null;
    var ASSIGN_PRIMED = false;


    // Load the tree-sitter TLA+ parser.
    let language;
    LANGUAGE_BASE_URL = "js";
    const url = `/${LANGUAGE_BASE_URL}/tree-sitter-${languageName}.wasm`;
    try {
        console.log("Loading language from", url);
        language = await TreeSitter.Language.load(url);
    } catch (e) {
        console.error(e);
        return;
    }

    tree = null;
    parser.setLanguage(language);

    console.log("Message received from main script");
    const workerResult = `Result: ${e.data}`;
    console.log(e.data);
    console.log("Posting message back to main script");

    let spec = new TLASpec(newText, specPath);
    return spec.parse().then(function(){
        console.log("SPEC WAS PARSED IN WEBWORKER.", spec);

        let constVals = {};
        let constTlaVals = {};
    
        // Evaluate each CONSTANT value expression.
        for (var constDecl in constValInputs) {
            let constValText = constValInputs[constDecl];
            if (constValText === undefined) {
                throw "no constant value given for " + constDecl;
            }
            console.log("constDecl:", constDecl, constValText);
            constVals[constDecl] = constValText;

            let model = {};
            model.specDefs = spec.spec_obj["op_defs"]
    
            let ctx = new Context(null, new TLAState({}), model.specDefs, {}, constTlaVals);
            // Flag so that we treat unknown identifiers as model values during evaluation.
            ctx.evalModelVals = true;
            let cVal = evalExprStrInContext(ctx, constValText);
            console.log("cval:", cVal);
            constTlaVals[constDecl] = cVal;
        }
    
        console.log("constTlaVals:", constTlaVals);


        // Generate initial states.
        let interp = new TlaInterpreter();

        let start = performance.now();
        let initStates = interp.computeInitStates(spec.spec_obj, constTlaVals, false);
        const duration = (performance.now() - start).toFixed(1);
        console.log("INIT STATES IN WEBWORKER.", initStates, `duration: ${duration}ms`);

        // Seems it is fine to serialize TLAState objects back through the web worker.
        postMessage(initStates[0]);


    }).catch(function(e){
        console.log("Error parsing and loading spec.", e);
        // model.errorObj = {parseError: true, obj: e, message: "Error parsing spec."};
    });




};