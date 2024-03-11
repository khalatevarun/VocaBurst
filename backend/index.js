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
const { METHOD, GAME_STATUS } = require("./constants");


const clients = {};
const games = {};
// const rand

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

        case METHOD.CREATE :
        {
            const requestClientId = result.clientId;
            const gameId = uuidv4();
                games[gameId] = {
                    "id": gameId,
                    "clients":[]
                }

            const payload = {
                "method": METHOD.CREATE,
                "gameId": gameId
            }

            const con = clients[requestClientId].connection;
            con.send(JSON.stringify(payload));
            break;
        }
        

        // client makes a join request
            case METHOD.JOIN :
        {
            
            const clientId = result.clientId;
            const gameId = result.gameId;
            const currentGame = games[gameId];

            currentGame.clients.push({
                "clientId": clientId,
            });

            const payload = {
                "method":METHOD.JOIN,
                "game":currentGame,
            }

            // loop through all clients
            currentGame.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload));
            }); 
            break;
        }


        case METHOD.PLAY: 
        {
            const gameId = result.gameId;
    const game = games[gameId];

    // Initialize countdown variables
    let countdown = 5;
    let countdownInterval;

    // Function to send countdown updates to clients
    function sendCountdownUpdate() {
        const payload = {
            method: METHOD.COUNTDOWN,
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


        case METHOD.TYPING: {

            const typing = result.typing;
            const gameId = result.gameId;
            const currentGame = games[gameId];

            const payload = {
                method: METHOD.TYPING,
                typing: typing,
            };
    
            currentGame.clients.forEach(client => {
                clients[client.clientId].connection.send(JSON.stringify(payload));
            });

            break;
        }

        case METHOD.DIFFUSE: {
            const word = result.word.toUpperCase();
            const gameId = result.gameId;
            const currentGame = games[gameId];
            
        
            const containsSubstring = word.includes(currentGame.state.prompt);
            const validWords = substringWordMap[currentGame.state.prompt.toLowerCase()] || [];
            const isValidWord = validWords.includes(word);
        
            if (containsSubstring && isValidWord) {
                // Reset the timer
                clearInterval(currentGame.countdownInterval);
        
                // Update onFocus to the next player ID
                // const currentPlayerIndex = currentGame.clients.findIndex(client => client.clientId === currentGame.state.onFocus);
                // const nextPlayerIndex = (currentPlayerIndex + 1) % currentGame.clients.length;
                // currentGame.state.onFocus = currentGame.clients[nextPlayerIndex].clientId;
                currentGame.state.diffused = true;
                sendStatusUpdate(gameId);
                // Start a new timer
                currentGame.countdownInterval = setInterval(()=>sendStatusUpdate(gameId), 8000);
            } 
            break;
        }
        
    }
});

   



        
    // generate a new clientId
    const clientId = uuidv4();
    clients[clientId] = {
         "connection": connection
    }

    const payload = {
        "method": METHOD.CONNECT,
        "clientId": clientId
    };

    // send back the client connect
    connection.send(JSON.stringify(payload));



});

const beginGame = (gameId) => {
    const game = games[gameId];

    // Function to send status update to all clients


    // Send initial status update to all clients
    sendStatusUpdate(gameId);

    // Start the countdown for the game
    game.status = GAME_STATUS.STARTED;
    game.countdownInterval = setInterval(()=>sendStatusUpdate(gameId), 8000); // 5000 milliseconds = 5 seconds


};

const sendStatusUpdate = (gameId) => {
    const game = games[gameId];

    let currentPlayerIndex = 0;
    const gameClients = game.clients;

if(game?.state?.onFocus){

    currentPlayerIndex = game.clients.findIndex((client)=> client.clientId === game.state.onFocus);
}

    // Check if the game has started
if (game.status === GAME_STATUS.STARTED) {
    if(!game.state.diffused){
    const currentPlayer = game.state.players.find(client => client.clientId === game.state.onFocus);
    currentPlayer.liveRemaining--; // Decrement liveRemaining of the current player
    // Check if the current player has no remaining lives
    if (currentPlayer.liveRemaining === 0) {
        // Handle the case where the current player has no remaining lives (e.g., remove player from the game)
        game.status = GAME_STATUS.FINISHED;
    }
    game.state.diffused = false;
}
} 

    let nextPlayerIndex;
    if (gameClients.length === 2) {
        // If there are only two players, switch between them
        nextPlayerIndex = currentPlayerIndex === 0 ? 1 : 0;
    } else {
        // For more than two players, calculate the next player index using modular arithmetic
        nextPlayerIndex = (currentPlayerIndex + 1) % gameClients.length;
    }

    game.promt = generateRandomSubstring().toUpperCase();
    if(game.status === GAME_STATUS.STARTED){
        game.state = {
            prompt: game.promt,
            onFocus: gameClients[nextPlayerIndex].clientId, // Next player gets focus
            players: game.state.players
        }


    }

    else if (game.status === GAME_STATUS.FINISHED){
        game.state = {
            prompt: game.promt,
            onFocus: gameClients[nextPlayerIndex].clientId, // Next player gets focus
            players: game.state.players
        }

    }
    else {
        game.state = {
            onFocus: gameClients[nextPlayerIndex].clientId, // Next player gets focus
            players: gameClients.map(client => ({
                clientId: client.clientId,
                liveRemaining: 3 // Assuming 3 lives for each player initially
            })),
            prompt: game.promt
    }



  
    }

    // Construct payload for status update
    const payload = {
        method: METHOD.STATUS,
        game: game 
    };

    // Send status update to all clients
    game.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payload));
    });

    if(game.status === GAME_STATUS.FINISHED){
        clearInterval(game.countdownInterval);
        return;
    }
};



const fs = require('fs');

// Load the dictionary file
const dictionaryData = fs.readFileSync(__dirname + '/dictionary.txt', 'utf8');
const dictionary = dictionaryData.split('\n');

// Preprocess the dictionary to create a map of consecutive letter pairs to words
const substringWordMap = {};
for (const word of dictionary) {
    for (let i = 0; i < word.length - 1; i++) {
        const substring = word.slice(i, i + 2).toLowerCase(); // Convert to lowercase for case-insensitive matching
        if (!substringWordMap[substring]) {
            substringWordMap[substring] = [];
        }
        substringWordMap[substring].push(word);
    }
}

// Function to generate a random two-letter substring for which at least one word exists
function generateRandomSubstring() {
    const substrings = Object.keys(substringWordMap);
    let randomSubstring;
    do {
        randomSubstring = substrings[Math.floor(Math.random() * substrings.length)];
    } while (substringWordMap[randomSubstring].length === 0); // Ensure at least one word exists for the substring
    return randomSubstring;
}
