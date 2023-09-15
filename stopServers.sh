#!/bin/bash

# List all tmux sessions
tmux_list=$(tmux list-sessions -F "#{session_name}")

# Loop through each session and kill it
for session in $tmux_list; do
  tmux kill-session -t "$session"
done
