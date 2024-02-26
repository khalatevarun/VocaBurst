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
            game.clients.push({
                "clientId": clientId,
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
            const gameId = result.gameId;
    const game = games[gameId];

    // Initialize countdown variables
    let countdown = 5;
    let countdownInterval;

    // Function to send countdown updates to clients
    function sendCountdownUpdate() {
        const payload = {
            method: 'countdown',
            countdown: countdown
        };

        // Send countdown update to all clients in the game
        game.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
        });

        // Decrement countdown
        countdown--;

        // If countdown reaches 0, clear the interval
        if (countdown < 0) {
            clearInterval(countdownInterval);
            // Start your game logic here after countdown reaches 0
            beginGame(gameId);
        }
    }

    // Start countdown timer
    countdownInterval = setInterval(sendCountdownUpdate, 1000);
        }


    })

    const beginGame = (gameId) => {
        const game = games[gameId];
        const clients = game.clients;
        const payload = {
            method: "status",
            state: {
                onFocus: clients[1].clientId,
                players : clients.map((client)=> { return { clientId: client.clientId, liveRemaining: 3  }})
            }
        }

         // Send countdown update to all clients in the game
         game.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
        });

        startQue();

    }

    const startQue = (gameId, currentPlayerIndex = 0) => {
        const game = games[gameId];
        const clients = game.clients;
        
        // Get the current player
        const currentPlayer = clients[currentPlayerIndex];
        const nextPlayerIndex = (currentPlayerIndex + 1) % clients.length; // Calculate index of next player
        
        // Send status update to all clients
        const payload = {
            method: "status",
            state: {
                onFocus: clients[nextPlayerIndex].clientId, // Next player gets focus
                players: clients.map(client => ({
                    clientId: client.clientId,
                    liveRemaining: 3 // Assuming 3 lives for each player initially
                }))
            }
        };
    
        // Send status update to all clients
        game.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
        });
    
        // Start a timer for the current player
        setTimeout(() => {
            // If there are more players, continue the queue
            if (nextPlayerIndex !== currentPlayerIndex) {
                startQue(gameId, nextPlayerIndex);
            } else {
                // If this was the last player, start the game logic or next phase
                // For example, you can call another function here to start the game logic
                // beginGameLogic(gameId);
            }
        }, 5000); // 5000 milliseconds = 5 seconds
    };
    


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