//
// Fetches JSON state graph for the protocol and presents a visualization of protocol states.
//

var mysvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
var svgWidth = 500;
var svgHeight = 330;
mysvg.setAttribute('style', 'border: 0px solid gray');
mysvg.setAttribute('width', svgWidth);
mysvg.setAttribute('height', svgHeight);
console.log(mysvg);
var svgns = "http://www.w3.org/2000/svg";
var main = document.getElementById("main");
main.appendChild(mysvg);

var states;
var initial_states;
var edges;
var curr_behavior = [];

function forall(f, lst){
    let istrue = false;
    for(var i=0;i<lst.length;i++){
        if(!f(lst[i])){
            return false;
        }
    }
    return true;
}

function exists(lst, f){
    let negf = function(x){
        return !f(x);
    }
    return !forall(negf, lst)
}

function compact_state_str(state, action_name){
    sval = state["val"];
    var servers = Object.keys(sval["configTerm"]);
    lines = "<b>" + action_name + "</b><br>";
    console.log("Will")
    console.log(servers);
    for(var i=0;i<servers.length;i++){
        let server = servers[i];
        let CV = "(" + sval["configVersion"][server] + "," + sval["configTerm"][server] + ")";
        let stateTerm = sval["state"][server][0] + sval["currentTerm"][server];
        let memberSet = "{" + sval["config"][server] + "}"
        lines += server + ": "
        lines += CV + ", " + stateTerm + " " + memberSet
        lines += "<br>";
    }
    return lines;
}

/**
 * Update the current view to show the given state, or initial states, if 'state' is null.
 */
function update_view(state, initstates){
    svg = $("svg");
    console.log(initstates)

    var neighbors;
    // Initial states case.
    if(state===null){
        neighbors = initstates.map((s) => s["fp"]);
        $("#choose-state-title").html("Choose initial state:");
        mysvg.innerHTML = "";
        svg.empty();
        svg.append(view(initstates[0]["val"], true));
        document.getElementById("main").innerHTML += "";
    } else{
        $("#choose-state-title").html("Choose next state:");
        sid = state["fp"];
        sval = state["val"];
        mysvg.innerHTML = "";
        svg.empty();
        svg.append(view(sval, false));
        document.getElementById("main").innerHTML += "";
        neighbors = adj_list[sid];
    }

    console.log(neighbors);
    var buttondiv = document.getElementById("buttons");
    buttondiv.innerHTML = "";

    // Create the 'back' button for going back to previous state.
    var backbtn = document.createElement("button");
    backbtn.name = "back";
    backbtn.style="width:200px;height:35px;";
    backbtn.innerHTML="Back";
    backbtn.id = "back-btn"
    console.log(backbtn);
    buttondiv.appendChild(backbtn);
    buttondiv.innerHTML += "<br>";

    let curr_state = state;
    for(var nind in neighbors){
        neighbor_id = neighbors[nind];
        console.log(neighbor_id);
        var btn = document.createElement("div");
        nstate = state_id_table[neighbor_id];
        console.log(nstate)
        nstateval = nstate["val"];

        action_name = infer_action_name(curr_state, nstate)
        btn.name = "neighbor";
        btn.classList.add("state-btn");
        btn.innerHTML = compact_state_str(nstate, action_name);
        btn.id = "neighbor-" + neighbor_id;
        buttondiv.appendChild(btn);
    }

    buttondiv.innerHTML += "";

    for(var nind in neighbors){
        let neighbor_id = neighbors[nind];
        // console.log("neighbor-" + neighbor_id);
        document.getElementById("neighbor-" + neighbor_id).onclick = function(){
            console.log("New state:");
            console.log("Clicked state: " + neighbor_id);
            // console.log(state_id_table[local_neighbor_id]);
            new_state = state_id_table[neighbor_id]
            update_view(new_state);
            curr_behavior.push(new_state);
        };
    }

    var backbtn = document.getElementById("back-btn");
    // Handler for jumping back to previous state.
    backbtn.onclick = function(){
        console.log("New state:");
        console.log("Clicked state: " + neighbor_id);
        if(curr_behavior.length === 2){
            console.log("Return to initial states.");
            curr_behavior.pop();
            update_view(null, initial_states);
            svg.empty();
        }
        else if(curr_behavior.length > 2){
            curr_behavior.pop();
            update_view(curr_behavior[curr_behavior.length-1]);
        }
    };
}

/**
 * Determines if a given state is an initial state.
 */
function initial_state(state){
    let servers = Object.keys(state["val"]["configTerm"]);
    return forall((sid) => state["val"]["configTerm"][sid]==0 && state["val"]["configVersion"][sid]==1, servers)
}

/**
 * Given a state transition (s1, s2), infer the name of the action associated with this transition.
 */
function infer_action_name(s1, s2){
    // Initial states are not a transition.
    if(s1===null){
        return "";
    }
    servers = Object.keys(s1["val"]["configTerm"]);
    console.log("servers");
    console.log(servers);
    function configChanged(s){
        return s1["val"]["config"][s] !== s2["val"]["config"][s] && s1["val"]["configVersion"][s] !== s2["val"]["configVersion"][s] && s1["val"]["state"][s] === "Primary";
    }
    function newLeader(s){
        return (s1["val"]["currentTerm"][s] !== s2["val"]["currentTerm"][s]) && s2["val"]["state"][s] === "Primary";
    }
    function configSent(s){
        return !(s1["val"]["configVersion"][s] === s2["val"]["configVersion"][s] && s1["val"]["configTerm"][s] === s2["val"]["configTerm"][s]) && s2["val"]["state"][s] === "Secondary";
    }
    function termUpdate(s){
        console.log(s1["val"])
        return (s1["val"]["currentTerm"][s] !== s2["val"]["currentTerm"][s]) && (s2["val"]["state"][s] === "Secondary");
    }
    console.log(s1);
    console.log(s2);

    if(exists(servers, configChanged)){
        return "Reconfig"
    }
    else if(exists(servers, newLeader)){
        return "BecomeLeader";
    } 
    else if(exists(servers, configSent)){
        return "SendConfig";
    } 
    else if(exists(servers, termUpdate)){
        return "UpdateTerms";
    }else{
        return "Action";
    }
}

/**
 * View function. 
 * 
 * Takes a protocol state and returns an SVG object that is a visual representation of that state.
 * 
 * With the 'skeleton' option, it just draws the nodes and their names, without details of their values.
 */
function view(state, skeleton){
    var group = document.createElementNS(svgns, 'g');
    // console.log(state["configTerm"])
    var servers = Object.keys(state["configTerm"]);

    ind = 0
    num_servers = servers.length;
    for(var server in state["configTerm"]){
        // console.log(server)
        // console.log(state)
        circle = document.createElementNS(svgns, 'circle');
        R = 110;
        div = ind / num_servers;
        // console.log(div);
        cx = svgWidth/2
        cy = svgHeight/2
        X = -R*Math.cos(div*2*Math.PI)+cx;
        Y = -R*Math.sin(div*2*Math.PI)+cy;
        // console.log("----")
        // console.log(X);
        // console.log(Y);
        server_R = 30
        circle.setAttributeNS(svgns, 'cx', X);
        circle.setAttributeNS(svgns, 'cy', Y);
        circle.setAttributeNS(svgns, 'r', server_R);
        circle.setAttributeNS(svgns, 'fill', "none");
        circle.setAttributeNS(svgns, 'stroke', "black");
        circle.setAttributeNS(svgns, 'stroke-width', "2");

        idtext = document.createElementNS(svgns, 'text');
        idtext.innerHTML = server;
        idtext.setAttributeNS(svgns, 'x', X);
        idtext.setAttributeNS(svgns, 'y', Y);
        idtext.setAttributeNS(svgns, 'style', "font-size:14px;font-family:courier;text-anchor:middle;font-weight:bold;dominant-baseline:middle;");
        group.appendChild(idtext);
        group.appendChild(circle);

        if(!skeleton){
            configtext = document.createElementNS(svgns, 'text');
            state_str = "(" + state["configVersion"][server] + "," + state["configTerm"][server] + ")"
            configtext.innerHTML = state_str;
            configtext.setAttributeNS(svgns, 'x', X);
            configtext.setAttributeNS(svgns, 'y', Y-server_R/2 - 20);
            configtext.setAttributeNS(svgns, 'style', "font-size:14px;font-family:courier;text-anchor:middle;");

            configmembertext = document.createElementNS(svgns, 'text');
            state_str = "{" + state["config"][server] + "}";
            // .join(",")
            console.log(state["config"][server]);
            configmembertext.innerHTML = state_str;
            configmembertext.setAttributeNS(svgns, 'x', X);
            configmembertext.setAttributeNS(svgns, 'y', Y - server_R/2 + 60);
            configmembertext.setAttributeNS(svgns, 'style', "font-size:14px;font-family:courier;text-anchor:middle;");

            statetext = document.createElementNS(svgns, 'text');
            state_str = state["state"][server][0] + state["currentTerm"][server]
            // if(state["state"][server][0]==="P"){
            //     state_str += "♕"
            // }
            statetext.innerHTML = state_str;
            statetext.setAttributeNS(svgns, 'x', X);
            statetext.setAttributeNS(svgns, 'y', Y+server_R/2 + 4);
            statetext.setAttributeNS(svgns, 'style', "font-size:14px;font-family:courier;text-anchor:middle;");

            primarysymbtext = document.createElementNS(svgns, 'text');
            state_str = ""
            if(state["state"][server][0]==="P"){
                state_str += "♕"
            }
            primarysymbtext.innerHTML = state_str;
            primarysymbtext.setAttributeNS(svgns, 'x', X);
            primarysymbtext.setAttributeNS(svgns, 'y', Y+server_R/2 - 27);
            primarysymbtext.setAttributeNS(svgns, 'style', "font-size:16px;font-family:courier;text-anchor:middle;");

            if(state["state"][server] === "Primary"){
                circle.setAttributeNS(svgns, 'stroke', "green");
                circle.setAttributeNS(svgns, 'stroke-width', "3");
                circle.setAttributeNS(svgns, 'fill', "green");
                circle.setAttributeNS(svgns, 'fill-opacity', "0.2");
            }

            group.appendChild(configtext);
            group.appendChild(configmembertext);
            group.appendChild(statetext);
            group.appendChild(primarysymbtext);
        }

        ind += 1;
    }

    return group;
}

function random_state(){
    var rand_state = states[Math.floor(Math.random() * states.length)];
    return rand_state;
}

function build_adj_graph(states, edges){
    adj_list = {}
    for(var i=0;i<edges.length;i++){
        edge = edges[i];
        if(!adj_list.hasOwnProperty(edge[0])){
            adj_list[edge[0]] = [edge[1]]
        } else{
            if(!adj_list[edge[0]].includes(edge[1])){
                adj_list[edge[0]].push(edge[1]);
            }
        }
    }   
    return adj_list;
}

/**
 * Set up the visualization.
 */
function setup(state_graph){
    states = state_graph["states"];
    console.log("Loaded " + states.length + " states from JSON state graph.");
    edges = state_graph["edges"];
    console.log("Loaded " + edges.length + " transitions from JSON state graph.");

    initial_states = states.filter(initial_state)
    console.log("Total initial states: " + initial_states.length);

    adj_list = build_adj_graph(states, edges);
    console.log("Built adjacency graph.");

    // Build table to look up states by their ids.
    state_id_table = {}
    for(var i=0;i<states.length;i++){
        state_id_table[states[i]["fp"]] = states[i];
    }
    console.log("Built state lookup table.");
    console.log(adj_list);

    // update_view(random_state());
    update_view(null, initial_states);
    curr_behavior = [states[0]]
}

//
// Download the state graph and set up the visualization.
//
fetch('states-no-symmetry-compact.json')
  .then(response => response.json())
  .then(data => setup(data));



// var circle = document.createElementNS(svgns, 'circle');
// circle.setAttributeNS(svgns, 'cx', 20);
// circle.setAttributeNS(svgns, 'cy', 20);
// circle.setAttributeNS(svgns, 'r', 20);
// circle.setAttributeNS(svgns, 'fill', "red");
// mysvg.appendChild(circle);











