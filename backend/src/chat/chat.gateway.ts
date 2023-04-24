import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChannelsService } from "./channels.service";
import { CreateMessageDto } from "./createMessage.dto";
import { CreateChannelDto } from "./createChannel.dto";
import { CreateUserDto } from "./createUser.dto";
import { UsersService } from "./users.service";

@WebSocketGateway({
  namespace: 'chat',
  cors: '*',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly channelsService: ChannelsService, private readonly usersService: UsersService) { }
  readonly logger = new Logger();

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`New client connected: ${client.id}`);
  }

  async handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createMessage')
  async handlePushMessageToChannel(@ConnectedSocket() client: Socket, @MessageBody() createMessageDto: CreateMessageDto) {
    const channel = await this.channelsService.getChannelById(createMessageDto.toChannel);

    this.channelsService.pushMessageToChannel(createMessageDto, createMessageDto.toChannel, client.id);
    this.server.emit('createdMessage', channel);
  }

  @SubscribeMessage('createChannel')
  async handleCreateChannel(@MessageBody() CreateChannelDto: CreateChannelDto) {
    this.logger.log('createChannel');
    const channel = await this.channelsService.createChannel(CreateChannelDto);
    this.server.emit('createdChannel', channel);
    return channel;
  }

  @SubscribeMessage('createUser')
  async handleCreateUser(@MessageBody() createUserDto: CreateUserDto) {
    this.logger.log('createUser');
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  @SubscribeMessage('getAllChannels')
  handleGetAllChannels() {
    this.logger.log('getAllChannels');
    return this.channelsService.getAllChannels();
  }

  @SubscribeMessage('getOneChannel')
  handleGetOneChannel(index: number) {
    this.logger.log('getOneChannel');
    return this.channelsService.getChannelById(index);
  }

  @SubscribeMessage('clear')
  debugClearAllMessages(@MessageBody() index: number) {
    this.logger.log(`cleared all messages in channel: ${index}`);
    this.server.emit('clear');
    this.channelsService.debugClearChannelMessages(index);
  }

  @SubscribeMessage('clearChannels')
  debugClearAllChannels() {
    this.logger.log(`cleared all channels`);
    this.server.emit('clear');
    this.channelsService.debugClearAllChannels();
  }
}
