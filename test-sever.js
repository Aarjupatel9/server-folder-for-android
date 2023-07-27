const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = 3000; // Replace with your desired port number

// Store some data to be sent to the client
let serverData = { message: "Hello from the server!" };

// Handle incoming connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Send the initial data to the connected client
    socket.emit("dataFromServer", serverData);

    // Listen for "check" requests from the client
    socket.on("check", () => {
        console.log("Received a 'check' request from client:", socket.id);
        // Respond to the "check" request with some data
        socket.emit("dataFromServer", serverData);
    });
});

// Start the server
http.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
