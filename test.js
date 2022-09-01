var socket = io.connect('http://192.168.43.48:3110');
socket.emit('join', { email: 'user1@example.com'});
