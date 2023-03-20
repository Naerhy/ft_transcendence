import { useEffect, useState } from "react";
import { IBall, Vec2 } from "../types";
import { BALL_DEFAULT_POS_X, BALL_DEFAULT_POS_Y, BALL_RADIUS, BALL_VELOCITY_X, BALL_VELOCITY_Y, CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants";

//{radius: 10, pos: {x: 325, y: 240}, velocity: {x: 1, y: 1}, color: "white"});

/**
 * 
 * @param _sideWalls Bounce off side walls
 * @param _radius Ball radius
 * @param _pos Ball default position
 * @param _velocity Ball 
 * @param _color 
 * @returns 
 */
const useBall = (
  _sideWalls: boolean,
  _radius: number = BALL_RADIUS,
  _pos: Vec2 = { x: BALL_DEFAULT_POS_X, y: BALL_DEFAULT_POS_Y },
  _velocity: Vec2 = { x: BALL_VELOCITY_X, y: BALL_VELOCITY_Y },
  _color: string = "white"
): [IBall, any, any, any, any, any] => {
  const [radius, setRadius]: [number, any] = useState(_radius);
  const [x, setX]: [number, any] = useState(_pos.x);
  const [y, setY]: [number, any] = useState(_pos.y);
  const [velocityX, setVelocityX]: [number, any] = useState(BALL_VELOCITY_X);
  const [velocityY, setVelocityY]: [number, any] = useState(BALL_VELOCITY_Y);
  const [color, setColor]: [string, any] = useState("white");

  function moveBall() {
    if (_sideWalls) {
      if (x < 0 + radius && velocityX < 0) {
        setVelocityX(-velocityX);
        setX(x - velocityX);
        return;
      }
      if (x > CANVAS_WIDTH - radius && velocityX > 0) {
        setVelocityX(-velocityX);
        setX(x - velocityX);
        return;
      }
    }
    if (y < 0 + radius && velocityY < 0) {
      setVelocityY(-velocityY);
      setY(y - velocityY);
      return;
    }
    if (y > CANVAS_HEIGHT - radius && velocityY > 0) {
      setVelocityY(-velocityY);
      setY(y - velocityY);
      return;
    }
    setX(x + velocityX);
    setY(y + velocityY);
  }

  function drawBall(context: CanvasRenderingContext2D) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2, true);
    context.closePath();
    context.fill();
  }

  return [{
    radius: radius,
    pos: { x: x, y: y },
    velocity: { x: velocityX, y: velocityY },
    color: color
  },
    moveBall, drawBall, setRadius, setColor, (__x: number, __y: number) => {setX(__x); setY(__y)}];
}

export default useBall;