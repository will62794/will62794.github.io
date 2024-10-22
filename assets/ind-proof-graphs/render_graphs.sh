#!/bin/bash

# Set the working directory to the script's location
cd "$(dirname "$0")"

# Check if Graphviz is installed
if ! command -v dot &> /dev/null
then
    echo "Graphviz is not installed. Please install it and try again."
    exit 1
fi

# Input and output file paths
INPUT_FILE="2pc_graph_1.dot"
OUTPUT_FILE="2pc_graph_1.png"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file $INPUT_FILE not found."
    exit 1
fi

# Render the graph
dot -Tpng "$INPUT_FILE" -o "$OUTPUT_FILE"

# Check if rendering was successful
if [ $? -eq 0 ]; then
    echo "Graph rendered successfully. Output saved to $OUTPUT_FILE"
else
    echo "Error occurred while rendering the graph."
    exit 1
fi

# Render 3cycle.dot
INPUT_FILE="3cycle.dot"
OUTPUT_FILE="3cycle.png"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file $INPUT_FILE not found."
    exit 1
fi

# Render the graph using sfdp
dot -Ksfdp -Tpng -Goverlap=scale -Gnodesep=0.1 -Granksep=0.1 -Gdpi=300 "$INPUT_FILE" -o "$OUTPUT_FILE"

# Check if rendering was successful
if [ $? -eq 0 ]; then
    echo "Graph rendered successfully using sfdp. Output saved to $OUTPUT_FILE"
else
    echo "Error occurred while rendering the graph with sfdp."
    exit 1
fi

# Re-render TwoPhase proof graph.
python3 scimitar.py --spec benchmarks/TwoPhase --seed 1 --num_simulate_traces 200000 --tlc_workers 6 --debug --target_sample_time_limit_ms 30000 --target_sample_states 200000 --opt_quant_minimize --k_cti_induction_depth 1 --ninvs 400000 --max_num_ctis_per_round 300 --save_dot --niters 5 --max_num_conjuncts_per_round 20 --num_ctigen_workers 7 --nrounds 45 --proof_tree_mode --auto_lemma_action_decomposition --enable_partitioned_state_caching  --cti_elimination_workers 1 --do_tlaps_induction_checks   --ninvs_per_iter_group 25000 --persistent_mode
python3 scimitar.py --spec benchmarks/TwoPhase --seed 2 --num_simulate_traces 200000 --tlc_workers 6 --debug --target_sample_time_limit_ms 30000 --target_sample_states 200000 --opt_quant_minimize --k_cti_induction_depth 1 --ninvs 400000 --max_num_ctis_per_round 300 --save_dot --niters 5 --max_num_conjuncts_per_round 20 --num_ctigen_workers 7 --nrounds 45 --proof_tree_mode --auto_lemma_action_decomposition --enable_partitioned_state_caching  --cti_elimination_workers 1 --do_tlaps_induction_checks   --ninvs_per_iter_group 25000 --persistent_mode
python3 scimitar.py --spec benchmarks/TwoPhase --seed 3 --num_simulate_traces 200000 --tlc_workers 6 --debug --target_sample_time_limit_ms 30000 --target_sample_states 200000 --opt_quant_minimize --k_cti_induction_depth 1 --ninvs 400000 --max_num_ctis_per_round 300 --save_dot --niters 5 --max_num_conjuncts_per_round 20 --num_ctigen_workers 7 --nrounds 45 --proof_tree_mode --auto_lemma_action_decomposition --enable_partitioned_state_caching  --cti_elimination_workers 1 --do_tlaps_induction_checks   --ninvs_per_iter_group 25000 --persistent_mode


# Render TwoPhase_ind-proof-tree-sd2_RMRcvAbortMsg
INPUT_FILE="benchmarks/TwoPhase_ind-proof-tree-sd2_RMRcvAbortMsg"
OUTPUT_FILE="benchmarks/TwoPhase_ind-proof-tree-sd2_RMRcvAbortMsg.png"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file $INPUT_FILE not found."
    exit 1
fi

# Render the graph
dot -Tpng "$INPUT_FILE" -o "$OUTPUT_FILE"

# Check if rendering was successful
if [ $? -eq 0 ]; then
    echo "Graph rendered successfully. Output saved to $OUTPUT_FILE"
else
    echo "Error occurred while rendering the graph."
    exit 1
fi


# Render TwoPhase_ind-proof-tree-sd2_RMRcvAbortMsg
INPUT_FILE="benchmarks/TwoPhase_ind-proof-tree-sd1_RMRcvAbortMsg"
OUTPUT_FILE="benchmarks/TwoPhase_ind-proof-tree-sd1_RMRcvAbortMsg.png"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file $INPUT_FILE not found."
    exit 1
fi

# Render the graph
dot -Tpng "$INPUT_FILE" -o "$OUTPUT_FILE"

# Check if rendering was successful
if [ $? -eq 0 ]; then
    echo "Graph rendered successfully. Output saved to $OUTPUT_FILE"
else
    echo "Error occurred while rendering the graph."
    exit 1
fi

