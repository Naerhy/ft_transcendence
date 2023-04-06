import { Logger } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { IRoomData, PongService } from "./pong.service";
import { ClientData } from "./game/GameState";

@WebSocketGateway({
  namespace: 'pong',
  cors: '*',
})
export class PongGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly pongService: PongService) {
    setInterval(() => {
      const queue: ClientData[] = this.pongService.getQueue();
      if (queue.length >= 2) {
        this.pongService.startGame(this.server, queue[0], queue[1]);
      }
    }, 1000);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    client.data.name = 'Username'; // get name from db later.
    this.pongService.handleUserConnected(client);
  }
  
  async handleDisconnect(client: Socket) {
    this.pongService.handleUserDisconnect(client);
  }

  @SubscribeMessage('get-room-list')
  handleGetRoomList(@ConnectedSocket() client: Socket) {    
    return this.pongService.getRoomList();
  }

  @SubscribeMessage('spectate')
  handleSpectate(@ConnectedSocket() client: Socket) {
  }

  @SubscribeMessage('join-queue')
  handleJoinQueue(@ConnectedSocket() client: Socket) {
    this.pongService.addClientToQueue(client);
  }

  @SubscribeMessage('leave-queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    this.pongService.removeClientFromQueue(client);
  }

  @SubscribeMessage('upKeyPressed')
  handleKeyUpPressed(@ConnectedSocket() client: Socket) {
    this.pongService.handleKeyUpPressed(client);
  }

  @SubscribeMessage('upKeyUnpressed')
  handleKeyUpUnpressed(@ConnectedSocket() client: Socket) {
    this.pongService.handleKeyUpUnpressed(client);
  }

  @SubscribeMessage('downKeyPressed')
  handleKeyDownPressed(@ConnectedSocket() client: Socket) {
    this.pongService.handleKeyDownPressed(client);
  }

  @SubscribeMessage('downKeyUnpressed')
  handleKeyDownUnpressed(@ConnectedSocket() client: Socket) {
    this.pongService.handleKeyDownUnpressed(client);
  }
}
