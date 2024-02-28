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

        const requestMethod = result.method;

        switch(requestMethod){

        case METHODS.CREATE :
        {
            const requestClientId = result.clientId;
            const gameId = uuidv4();
                games[gameId] = {
                    "id": gameId,
                    "clients":[]
                }

            const payload = {
                "method": METHODS.CREATE,
                "gameId": games[gameId]
            }

            const con = clients[requestClientId].connection;
            con.send(JSON.stringify(payload));
            break;
        }
        

        // client makes a join request
            case METHODS.JOIN :
        {
            
            const clientId = result.clientId;
            const gameId = result.gameId;
            const currentGame = games[gameId];

            currentGame.clients.push({
                "clientId": clientId,
            });

            const payload = {
                "method":METHODS.JOIN,
                "game":currentGame,
            }

            // loop through all clients
            currentGame.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload));
            }); 
            break;
        }


        case METHODS.PLAY: 
        {
            const gameId = result.gameId;
    const game = games[gameId];

    // Initialize countdown variables
    let countdown = 5;
    let countdownInterval;

    // Function to send countdown updates to clients
    function sendCountdownUpdate() {
        const payload = {
            method: METHODS.COUNTDOWN,
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
    break;
        }
    }
});

    const beginGame = (gameId) => {
        const game = games[gameId];
        const gameClients = game.clients;
        const payload = {
            method: METHODS.STATUS,
            state: {
                onFocus: gameClients[0].clientId,
                players : gameClients.map((client)=> { return { clientId: client.clientId, liveRemaining: 3  }})
            }
        }

         // Send countdown update to all clients in the game
         game.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
        });

         // Start a timer for the current player
         setInterval(() => {
            startQue(gameId, 1);
        }, 5000); // 5000 milliseconds = 5 seconds

    }

    const startQue = (gameId, currentPlayerIndex = 0) => {
        const game = games[gameId];
        const gameClients = game.clients;
        
        // Get the current player
        const currentPlayer = gameClients[currentPlayerIndex];
        const nextPlayerIndex = (currentPlayerIndex + 1) % gameClients.length; // Calculate index of next player
        
        // Send status update to all clients
        const payload = {
            method: METHODS.STATUS,
            state: {
                onFocus: gameClients[nextPlayerIndex].clientId, // Next player gets focus
                players: gameClients.map(client => ({
                    clientId: client.clientId,
                    liveRemaining: 3 // Assuming 3 lives for each player initially
                }))
            }
        };
    
        // Send status update to all clients
        game.clients.forEach(client => {
            clients[client.clientId].connection.send(JSON.stringify(payload));
        });
    };
        
    // generate a new clientId
    const clientId = uuidv4();
    clients[clientId] = {
         "connection": connection
    }

    const payload = {
        "method": METHODS.CONNECT,
        "clientId": clientId
    };

    // send back the client connect
    connection.send(JSON.stringify(payload));



});