#!/bin/bash
name="DtDTS";
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
#echo $DIR
tmux new-session -A -s $name;
tmux send-keys -t $name "cd $DIR" Enter
