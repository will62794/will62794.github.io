//
// Fetches JSON state graph for the protocol and presents a visualization of protocol states.
//

var mysvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
mysvg.setAttribute('style', 'border: 1px solid gray');
mysvg.setAttribute('width', '600');
mysvg.setAttribute('height', '500');
console.log(mysvg);
var svgns = "http://www.w3.org/2000/svg";
var main = document.getElementById("main");
main.appendChild(mysvg);


var states;
var edges;
var last_state;

fetch('states.json')
  .then(response => response.json())
  .then(data => setup(data));

function setup(state_graph){
    states = state_graph["states"];
    console.log("Loaded " + states.length + " states from JSON state graph.");
    edges = state_graph["edges"];
    console.log("Loaded " + edges.length + " transitions from JSON state graph.");

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
    update_view(states[0]);
    last_state = states[0];
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

function compact_state_str(state){
    sval = state["val"];
    lines = "" + state["fp"] + "<br>";
    for(var v in sval){
        vals = Object.values(sval[v]).join(",");
        lines += v + ":" + vals;
        lines += "<br>";
    }
    return lines;
}

function update_view(state){
    // console.log(state);
    sid = state["fp"];
    sval = state["val"];
    mysvg.innerHTML = "";
    svg = $("svg");
    svg.empty();
    svg.append(view(sval));
    document.getElementById("main").innerHTML += "";

    neighbors = adj_list[sid];
    // console.log(neighbors);
    var buttondiv = document.getElementById("buttons");
    buttondiv.innerHTML = "";

    var backbtn = document.createElement("button");
    backbtn.name = "back";
    backbtn.style="width:100px;";
    backbtn.innerHTML="Back";
    backbtn.id = "back-btn"
    console.log(backbtn);
    buttondiv.appendChild(backbtn);

    for(var nind in neighbors){
        neighbor_id = neighbors[nind];
        var btn = document.createElement("button");
        nstate = state_id_table[neighbor_id];
        nstateval = nstate["val"];
        btn.name = "neighbor";
        btn.style="width:300px;";
        btn.innerHTML = compact_state_str(nstate);
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
            update_view(state_id_table[neighbor_id]);
        };
    }

    // Handler for jumping back to previous state.
    let curr_last_state = last_state;
    document.getElementById("back-btn").onclick = function(){
        console.log("New state:");
        console.log("Clicked state: " + neighbor_id);
        update_view(curr_last_state);
    };

    last_state = state;
}

function view(state){
    var group = document.createElementNS(svgns, 'g');
    // console.log(state["configTerm"])
    var servers = Object.keys(state["configTerm"]);

    ind = 0
    num_servers = servers.length;
    for(var server in state["configTerm"]){
        // console.log(server)
        // console.log(state)
        circle = document.createElementNS(svgns, 'circle');
        R = 120;
        div = ind / num_servers;
        // console.log(div);
        X = R*Math.cos(div*2*Math.PI)+200;
        Y = R*Math.sin(div*2*Math.PI) + 200;
        // console.log("----")
        // console.log(X);
        // console.log(Y);
        server_R = 20
        circle.setAttributeNS(svgns, 'cx', X);
        circle.setAttributeNS(svgns, 'cy', Y);
        circle.setAttributeNS(svgns, 'r', server_R);
        circle.setAttributeNS(svgns, 'fill', "none");
        circle.setAttributeNS(svgns, 'stroke', "black");

        configtext = document.createElementNS(svgns, 'text');
        state_str = "(" + state["configVersion"][server] + "," + state["configTerm"][server] + ")"
        configtext.innerHTML = state_str;
        configtext.setAttributeNS(svgns, 'x', X);
        configtext.setAttributeNS(svgns, 'y', Y-server_R/2 - 20);
        configtext.setAttributeNS(svgns, 'style', "font-size:12px;font-family:courier;text-anchor:middle;");

        configmembertext = document.createElementNS(svgns, 'text');
        state_str = "{" + state["config"][server] + "}";
        // .join(",")
        console.log(state["config"][server]);
        configmembertext.innerHTML = state_str;
        configmembertext.setAttributeNS(svgns, 'x', X);
        configmembertext.setAttributeNS(svgns, 'y', Y-server_R/2 + 45);
        configmembertext.setAttributeNS(svgns, 'style', "font-size:12px;font-family:courier;text-anchor:middle;");

        statetext = document.createElementNS(svgns, 'text');
        state_str = state["state"][server][0] + state["currentTerm"][server]
        statetext.innerHTML = state_str;
        statetext.setAttributeNS(svgns, 'x', X);
        statetext.setAttributeNS(svgns, 'y', Y+ 12);
        statetext.setAttributeNS(svgns, 'style', "font-size:10px;font-family:courier;text-anchor:middle;");

        idtext = document.createElementNS(svgns, 'text');
        idtext.innerHTML = server;
        idtext.setAttributeNS(svgns, 'x', X);
        idtext.setAttributeNS(svgns, 'y', Y);
        idtext.setAttributeNS(svgns, 'style', "font-size:12px;font-family:courier;text-anchor:middle;");


        if(state["state"][server] === "Primary"){
            circle.setAttributeNS(svgns, 'stroke', "green");
            circle.setAttributeNS(svgns, 'stroke-width', "2");
        }

        ind += 1;
        group.appendChild(circle);
        group.appendChild(configtext);
        group.appendChild(configmembertext);
        group.appendChild(statetext);
        group.appendChild(idtext);
    }

    return group;
}

// view("something")


// var circle = document.createElementNS(svgns, 'circle');
// circle.setAttributeNS(svgns, 'cx', 20);
// circle.setAttributeNS(svgns, 'cy', 20);
// circle.setAttributeNS(svgns, 'r', 20);
// circle.setAttributeNS(svgns, 'fill', "red");
// mysvg.appendChild(circle);











