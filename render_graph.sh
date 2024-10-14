#!/bin/bash

# Check if Graphviz is installed
if ! command -v dot &> /dev/null
then
    echo "Graphviz is not installed. Please install it and try again."
    exit 1
fi

# Input and output file paths
INPUT_FILE="assets/ind-proof-graphs/2pc_graph_1.dot"
OUTPUT_FILE="assets/ind-proof-graphs/2pc_graph_1.png"

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
