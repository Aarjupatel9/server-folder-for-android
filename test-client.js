const io = require("socket.io-client");
const socket = io("http://localhost:3000"); // Replace with the server URL and port

// Receive data from the server
socket.on("dataFromServer", (data) => {
    console.log("Data received from server:", data);
});

// Send "check" request every second
setInterval(() => {
    socket.emit("check");
}, 1000);
