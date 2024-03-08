"use client";
import Input from "@/common/components/Input";
import Button from "@/common/components/Button";
import { useState } from "react";
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
  // const webSocketRef = useRef();

  // webSocketRef.current


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
        const state = response.game.state;
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

const debouncedTypeUpdate = debounce(typeUpdate, 300); // Adjust debounce time as needed (300 milliseconds in this example)


  
    

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
          { clientId === gameState?.onFocus && <Input onInputChange={debouncedTypeUpdate} /> }
          </div>
          <div>{typing}</div>
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
