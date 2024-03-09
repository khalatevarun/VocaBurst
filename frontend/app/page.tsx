"use client";
import Input from "@/common/components/Input";
import Button from "@/common/components/Button";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { METHOD } from "@/common/utils/constants";

export default function Home() {
 
  const [gameId, setGameId] = useState('');
  const [clientId, setClientId] = useState('');
  const [ws, setWs] = useState(new WebSocket("ws://localhost:9090"));
  const router = useRouter();
  const [ gameJoined, setGameJoined ] =  useState(false);
  const [ players, setPlayers ] = useState<string[]>([]);
  const [ gameState, setGameState ] = useState({});
  const [typing, setTyping] = useState('');
  const [countDown, setCountDown] = useState('');
  const [ guess, setGuess ] = useState('');
  // const webSocketRef = useRef();

  // webSocketRef.current

  console.log("game id>>>>", gameId);


  const submitGuess =  useCallback(() => {
    const payload = {
      "method": METHOD.DIFFUSE,
      "gameId": gameId,
      "word": guess
    }
    ws.send(JSON.stringify(payload));
    console.log(JSON.stringify(payload), gameId, guess)
  },[gameId, guess])

  useEffect(() => {
    const handleKeyPress = (event:any) => {
      if (event.key === 'Enter') {
        // Your logic here for handling Enter key press
        console.log('Enter key pressed');
        submitGuess();
      }
    
  }
  document.body.addEventListener('keydown', handleKeyPress);

  // Cleanup function to remove the event listener when the component unmounts
  return () => {
    document.body.removeEventListener('keydown', handleKeyPress);
  };
},[submitGuess]);
  


  const createGame = () => {
    console.log("cliceedddd");
    const payload = {
      "method": METHOD.CREATE,
      "clientId": clientId
  }

    ws.send(JSON.stringify(payload)); 
  }

  const joinGame = () => {
    const payload = {
      "method": METHOD.JOIN,
      "clientId": clientId,
      "gameId": gameId,
  };

  ws.send(JSON.stringify(payload));

  }

  const startGame = () => {
    const payload = {
      method: METHOD.PLAY,
      gameId: gameId
    };

    ws.send(JSON.stringify(payload));
  }

    ws.onmessage = message => {
      const response = JSON.parse(message.data);
      console.log(response);

      const responseMethod = response.method;

      switch(responseMethod){
      
      //connect
      case METHOD.CONNECT: {
        setClientId(response.clientId);
        break;
      }
  
      case METHOD.CREATE: {
        setGameId(response.gameId);  
        break;
      }

      case METHOD.JOIN : {
        const game = response.game;
        const clients = game.clients;
        setGameJoined(true);
        setPlayers(clients);
        break;
      }

      case METHOD.STATUS: {
        const state = response.game;
        setGameState(state);
        break;
      }

      case METHOD.COUNTDOWN: {
        const countdown = response.countdown;
        setCountDown(countdown);
        break;
      }

      case METHOD.TYPING: {
        setTyping(response.typing);
        break;
      }

    

    }
  }

  const debounce = (func:any, delay:any) => {
    let timerId:any;
    return function(...args) {
        const context:any = this;
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
};

const typeUpdate = (e:any) => {
  const value = e.target.value;
  const payload = {
      "method": METHOD.TYPING,
      "clientId": clientId,
      "gameId": gameId,
      "typing": value
  };

  ws.send(JSON.stringify(payload));
};

const debouncedTypeUpdate = (e:any) => {
  setGuess(e.target.value)

debounce((e:any)=>typeUpdate(e), 300); // Adjust debounce time as needed (300 milliseconds in this example)
}


  
    

    const getOnboardUI = () => {
      return (
        <>
         <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
          <Button onClick={createGame} buttonText='Create New Game' />
          <div>{gameId}</div>
          </div>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
          <Button onClick={joinGame}  buttonText='Join Game' />
          <Input onInputChange={(e:any)=>setGameId(e.target.value)} value={gameId}/>
        </div>

       
        </>
      )
    }

    const playGame = () => {
      return (
        <>
          <Button onClick={startGame}  buttonText='Start Game' />
          <p>Game starts in {countDown}</p>
          <div>
          {players.map((player) => (
          <div>
            {player.clientId === clientId && <span>{'YOU -> '}</span>}
            {player.clientId}
            </div>
          ))}
          { clientId === gameState?.state?.onFocus && <Input value={guess} onInputChange={debouncedTypeUpdate} /> }
          </div>
          <div>{typing}</div>

          <div>
          WINNER IS:
          {console.log(gameState)}
          {gameState.status === 'FINISHED' &&  <span>{gameState.state?.onFocus}</span>}
        </div>
        </>
      )
    }


  return (
    <div style={{display:'flex',flexDirection:'column', gap:'20px', alignItems:'center', justifyContent:'center', height:'100vh'}}>
      <div>Vocaburst!</div>
      {gameJoined ? playGame(): getOnboardUI()}
    </div>
  );
}
