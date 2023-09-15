#!/bin/bash

# Define an array of session names and corresponding commands
sessions=("startlds" "startsel fupdate" "startsw" "starts" "starta" "startaw")
commands=("npm run startlds" "npm run startselfupdate" "npm run startsw" "npm run starts" "npm run starta" "npm run startaw")
dircommand=("cd /home/ubuntu/server-folder-for-android")

# Loop through the sessions and start each one
for ((i=0; i<${#sessions[@]}; i++)); do
  session="${sessions[$i]}"
  command="${commands[$i]}"
  
  # Start the tmux session
  tmux new-session -s "$session"
  
  # Send the command to the session
  tmux send-keys -t "$session" "$dircommand" C-m
  tmux send-keys -t "$session" "$command" C-m
done

# Optionally, attach to a specific session (e.g., the first one)
# tmux attach-session -t "${sessions[0]}"