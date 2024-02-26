//create http server
const { response } = require("express");
const http = require("http");
const httpServer = http.createServer();
httpServer.listen(9090, ()=> console.log("I am listening on 9090"));

//upgrade the http server to websocket server
const websocketServer = require("websocket").server;
const wsServer = new websocketServer({
    "httpServer": httpServer
});

// get uuid lib to generate unique id
const { v4: uuidv4 } = require('uuid');


const clients = {};
const games = {};

wsServer.on("request", request => {
    // connect
    const connection =  request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"));
    connection.on("close", () =>  console.log("closed!"));
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data);
        console.log(result);

        if (result.method === 'create'){
            const requestClientId = result.clientId;
            const gameId = uuidv4();
                games[gameId] = {
                    "id": gameId,
                    "balls": 20,
                    "clients":[]
                }

            const payload = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[requestClientId].connection;
            con.send(JSON.stringify(payload));
        }

        // client makes a join request
        if (result.method === 'join'){
            
            const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];

            if(game.clients.length >= 3)
            {
                //max player reached
                return;
            }
            const color = {"0": "Red", "1":"Green", "2":"Blue"}[game.clients.length];
            game.clients.push({
                "clientId": clientId,
                "color": color
            });

            if(game.clients.length === 3){
                updateGameState();
            }


            const payload = {
                "method":"join",
                "game":game,
            }

            // loop through all clients
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload));
            });

        }

        if(result.method === 'play'){
            const clientId = result.clientId;
            const gameId = result.gameId;
            const ballId = result.ballId;
            const color = result.color;

            let state = games[gameId].state;

            if(!state){
                state = {};
            }

            state[ballId] = color;
            games[gameId].state = state;

        }

    })


    function updateGameState(){

        
        for(const g of Object.keys(games)) {

            const game = games[g];

            const payload = {
                "method": "update",
                "game":game,
            }
            games[g].clients.forEach((c) => {

                clients[c.clientId].connection.send(JSON.stringify(payload));
            })
        }

        setTimeout(updateGameState, 500);

    }
    
    // generate a new clientId
    const clientId = uuidv4();
    clients[clientId] = {
         "connection": connection
    }

    const payload = {
        "method": "connect",
        "clientId": clientId
    };

    // send back the client connect
    connection.send(JSON.stringify(payload));



});