const express = require("express");
const http = require("http");

const app = express();

app.use(express.static('public'))

const server = http.createServer(app);
server.listen(3000);

server.on('listening', function () {
    console.log("Server On");
});
server.on('error', function (error) {
    console.error(error);
});