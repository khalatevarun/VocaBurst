"use client";
import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStorage } from "@/utils";

export default function Home() {
 
  const [gameId, setGameId] = useState('');
  const [clientId, setClientId] = useState('');
  const [ws, setWs] = useState(new WebSocket("ws://localhost:9090"));
  const router = useRouter();
  const [ gameJoined, setGameJoined ] =  useState(false);
  const [ players, setPlayers ] = useState([]);
  const [ gameState, setGameState ] = useState({});
  const [countDown, setCountDown] = useState('');
  // const webSocketRef = useRef();

  // webSocketRef.current


  const createGame = () => {
    console.log("cliceedddd");
    const payload = {
      "method": "create",
      "clientId": clientId
  }

    ws.send(JSON.stringify(payload)); 
  }

  const joinGame = () => {
    const payload = {
      "method": "join",
      "clientId": clientId,
      "gameId": gameId,
  };

  ws.send(JSON.stringify(payload));

  }

  const startGame = () => {
    const payload = {
      method: "play",
      gameId: gameId
    };

    ws.send(JSON.stringify(payload));
  }

    ws.onmessage = message => {
      const response = JSON.parse(message.data);
      console.log(response);
      
      //connect
      if(response.method === "connect"){
        setClientId(response.clientId);
      }
  
      if(response.method === "create"){
        setGameId(response.game.id);  
      }

      if(response.method === "join"){
        const game = response.game;
        const clients = game.clients;
        setGameJoined(true);
        setPlayers(clients);
      }

      if(response.method === 'state'){
        const state = response.state;
        setGameState(state);
      }

      if(response.method === 'countdown'){
        const countdown = response.countdown;
        setCountDown(countdown);
      }

      if(response.method === 'status'){
        console.log(response);
      }

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
          <Input onInputChange={(e)=>setGameId(e.target.value)} value={gameId}/>
        </div>
        </>
      )
    }

    const playGame = () => {
      return (
        <>
          <Button onClick={startGame}  buttonText='Start Game' />
          <p>Game starts in ${countDown}</p>
          <div>
          {players.map((player) => <div>{player.clientId}</div>)}
          </div>
        </>
      )
    }


  return (
    <div style={{display:'flex',flexDirection:'column', gap:'20px', alignItems:'center', justifyContent:'center', height:'100vh'}}>
      <div>Vocabust!</div>
      {gameJoined ? playGame(): getOnboardUI()}
    </div>
  );
}
