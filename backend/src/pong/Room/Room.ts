import { Server } from "socket.io";
import Client, { IClient, STATUS_ONLINE, STATUS_PLAYING } from "../Client/Client";
import { GameState, IGameState } from "../Game/GameState";
import { Player } from "../Game/Player";
import Elo from "../Matchmaking/Elo";

export interface IRoom {
  id: number,
  left: IClient,
  right: IClient,
  gameState: IGameState,
}

class Room {
  /** This set contains the ids of all current rooms. */
  private static __rooms_ = new Set<Room>;

  private readonly _id: number;
  private _left: Client | null;
  private _right: Client | null;
  private _spectators: Set<Client>;

  private _gameState: GameState;

  private __newId(): number {
    let _new_id = 0;
    for (const room of Room.__rooms_.values()) {
      if (room._id != _new_id && !(Room.at(_new_id))) {
        break;
      }
      _new_id++;
    }
    return _new_id;
  }

  private constructor(
    left: Client | null = null,
    right: Client | null = null,
  ) {
    this._id = this.__newId();
    if (left) {
      this.join(left);
    }
    if (right) {
      this.join(right);
    }
    this._spectators = new Set();
  }

  public get id(): number { return this._id; }
  public get left(): Client | null { return this._left; }
  public get right(): Client | null { return this._right; }
  public get gameState(): GameState { return this._gameState; }

  // public set id(id: number) { this._id = id; }
  public set left(left: Client | null) { this._left = left; }
  public set right(right: Client | null) { this._right = right; }
  public set gameState(gameState: GameState) { this._gameState = gameState; }
  
  public IRoom(): IRoom {
    const iRoom: IRoom = {
      id: this._id,
      left: this._left ? this._left.IClient() : Client.nullIClient(),
      right: this._right ? this._right.IClient() : Client.nullIClient(),
      gameState: this._gameState.IGameState(),
    };
    return iRoom;
  }

  public handleKey(client: Client, direction: string, isPressed: boolean) {
    if (this._left && this._right) {
      const player: Player = client.__socket.id === this._left.__socket.id ? this._gameState.leftPlayer : this._gameState.rightPlayer;

      if (direction === "up") {
        if (isPressed) {
          player.handleKeyUpPressed();
        }
        else {
          player.handleKeyUpUnpressed();
        }
      } else {
        if (isPressed) {
          player.handleKeyDownPressed();
        }
        else {
          player.handleKeyDownUnpressed();
        }
      }
    }
  }

  public abortGame() {
    if (this._gameState.interval) {
      clearInterval(this._gameState.interval);
    }
    console.log(`Aborted game (room: ${this._id}). Both players disconnected.`);
    Room.delete(this);
  }

  public endGame(server: Server) {
    if (!this._left || !this._right) {
      return;
    }
    this._left.status = STATUS_ONLINE;
    this._right.status = STATUS_ONLINE;

    server.to(this._id.toString()).emit('endGame', this.gameState.IGameState());

    if (this._gameState.interval) {
      clearInterval(this._gameState.interval);
    }
    console.log(`Ended game (room: ${this._id}).`);
    const [newLeftRating, newRightRating] = Elo.updateRatings(this._left.rating, this._right.rating, this._gameState.leftPlayer.score > this._gameState.rightPlayer.score);
    this._left.rating = newLeftRating;
    this._right.rating = newRightRating;
    console.log(`Ratings updated (left: ${newLeftRating}, right: ${newRightRating})`);
    Room.delete(this);
  }

  public startGame(server: Server): boolean {
    if (!this._left || !this._right) {
      return false;
    }
    const leftPlayer: Client = this._left;
    const rightPlayer: Client = this._right;
    leftPlayer.status = STATUS_PLAYING;
    rightPlayer.status = STATUS_PLAYING;
    this._gameState = new GameState(leftPlayer, rightPlayer);

    server.to(this._id.toString()).emit('startGame', { roomId: this._id });
    this._gameState.previous = Date.now();
    this._gameState.interval = setInterval(() => {
      this._gameState.current = Date.now();
      this._gameState.deltaTime = (this._gameState.current - this._gameState.previous) / 1000;
      if (this._gameState.gameOver) {
        this.endGame(server);
      }
      this._gameState.update();
      const room = {
        id: this._id,
        left: { id: leftPlayer.id, name: leftPlayer.name, avatar: leftPlayer.avatar },
        right: { id: rightPlayer.id, name: rightPlayer.name, avatar: rightPlayer.avatar },
        gameState: this._gameState.IGameState(),
      }
      server.to(this._id.toString()).emit('update', room);
      if (leftPlayer.__socket.disconnected && rightPlayer.__socket.disconnected) {
        this.abortGame();
      }
      this._gameState.previous = Date.now();
    }, 1000 / this._gameState.fps);
    console.log(`Started new game (room: ${this._id}, left: ${leftPlayer.id}, right: ${rightPlayer.id}).`);
    return true;
  }

  public join(client: Client): boolean {
    if (!this._left) {
      this._left = client;
      this._left.__socket.join(this._id.toString());
      return true;
    }
    if (!this._right) {
      this._right = client;
      this._right.__socket.join(this._id.toString());
      return true;
    }
    return false;
  }

  public addSpectator(client: Client) {
    client.__socket.join(this._id.toString());
    this._spectators.add(client);
  }

  public removeSpectator(client: Client) {
    client.__socket.leave(this._id.toString());
    this._spectators.delete(client);
  }

  public leave(client: Client | null) {
    if (this._left) {
      this._left.__socket.leave(this._id.toString());
      return true;
    }
    if (this._right) {
      this._right.__socket.leave(this._id.toString());
      return true;
    }
    return false;
  }

  public static new(left: Client | null = null, right: Client | null = null): Room {
    const room: Room = new Room(left, right);
    Room.__rooms_.add(room);
    return room;
  }

  public static with(client: Client): Room | undefined {
    for (const room of Room.__rooms_.values()) {
      if ((room._left && room._left.id === client.id) || (room._right && room._right.id === client.id)) {
        return room;
      }
    }
    return undefined;
  }

  public static at(id: number): Room | undefined {
    if (typeof id === 'number') {
      for (const room of Room.__rooms_.values()) {
        if (room._id === id) {
          return room;
        }
      }
    }
    return undefined;
  }

  public static delete(room: Room): void;
  public static delete(room: number): void;
  public static delete(x: number | Room): void {
    let _delete_id: number;

    if (typeof x === 'number') {
      _delete_id = x;
    }
    else {
      _delete_id = x.id;
    }
    for (const room of Room.__rooms_.values()) {
      if (room.id === _delete_id) {
        room.leave(room._left);
        room.leave(room._right);
        room._spectators.forEach((spec) => {
          room.removeSpectator(spec);
        });
        Room.__rooms_.delete(room);
        return;
      }
    }
  }

  public static list(): IRoom[] {
    const roomList: IRoom[] = [];

    Room.__rooms_.forEach((room: Room) => {
      roomList.push(room.IRoom());
    });
    return roomList;
  }
}

export default Room;