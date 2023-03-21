/**
 * Pong
 * 
 * When mounted:
 *  set default positions of paddles, ball
 *  draw the first frame
 * 
 * On start:
 *  render a new frame each time the state changes
 * 
 * On each re-render:
 *  clear canvas
 *  draw net, ball, paddles
 * 
 * State:
 *  game class
 *    Ball: (radius, pos(x, y), velocity(x, y), color)
 *    Paddles: (pos(x, y), width, height color)
 *    Player: (id, name, avatar)
 * 
 * fix paddle movements
 * check collisions with paddle
 * add score
 */

import { Navigate, redirect, useLocation, useNavigate } from "react-router";
import usePong from "../hooks/usePong";
import { CANVAS_HEIGHT, CANVAS_NET_COLOR, CANVAS_NET_GAP, CANVAS_WIDTH, TARGET_FPS } from "../constants";
import { useEffect } from "react";
import Play from "./Play";

function Game() {
  const location = useLocation();

  function goPlayPage() {
    console.log("test");
    
    const navigate = useNavigate();
    navigate("/play");
  }

  if (location.state) {
    const { leftPlayerData, rightPlayerData } = location.state; // props
    const [gameState, resetGame, drawGame] = usePong(leftPlayerData, rightPlayerData);

    // useEffect(() => {
    //   // drawGame(context);
    //   console.log("update");
      
    // }, [gameState]);

    return (
      <>
        <div className="Game"
          style={{
            userSelect: 'none',
            border: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3>{gameState.leftPlayer.name} vs {gameState.rightPlayer.name}</h3>
          <canvas id="canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              // border: '10px solid white',
              overflow: 'hidden',
              padding: '10px',
            }}
          >
            Your browser does not support the HTML 5 Canvas.
          </canvas>
          <button style={{ padding: '10px' }} onClick={resetGame}>Reset</button>
          {gameState.pause && <h2>paused</h2>}
        </div>
      </>
    );
  }
  return (
    <Navigate replace to={"/play"} />
  );
}

export default Game;