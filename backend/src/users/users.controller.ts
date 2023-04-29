import { ClassSerializerInterceptor, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { CurrentUserInterceptor } from './interceptors/current-user.interceptor';
import { MessageBody } from '@nestjs/websockets';
import { FileInterceptor } from '@nestjs/platform-express';
import { createWriteStream } from 'fs';
import { EnvService } from 'src/config/env.service';
import { ChannelService } from 'src/chat/channel/channel.service';
import { Channel } from 'src/chat/channel/entities/channel.entity';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor, CurrentUserInterceptor)
export class UsersController {
  constructor(private usersService: UsersService, private envService: EnvService, private channelService: ChannelService) { }

  @Get("me")
  getMyInfo(@CurrentUser() user: User): User {
    return user;
  }

  @Get('id/:id')
  findUserId(@Param("id") id: number): Promise<User | null> {
    return this.usersService.findOneId(id);
  }

  @Get(":username")
  findUser(@Param("username") username: string): Promise<User | null> {
    return this.usersService.findOneUsername(username);
  }

  @Get("get/all")
  findAllUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Delete(":id")
  removeUser(@Param("id") id: string): Promise<User> {
    return this.usersService.remove(parseInt(id));
  }

  @Get('get/rankings')
  getRankings(): Promise<User[]> {
    return this.usersService.rankings();
  }

  @Post("edit/username")
  editUsername(@CurrentUser() user: User, @MessageBody() data: { username: string }): Promise<User> {
    return this.usersService.setUsername(user.id, data.username);
  }

  // todo: add file validation
  // https://docs.nestjs.com/techniques/file-upload#basic-example
  @Post("edit/avatar")
  @UseInterceptors(FileInterceptor('image'))
  async editAvatar(@CurrentUser() user: User, @UploadedFile() file: Express.Multer.File): Promise<User> {
    const dirname = this.envService.get('AVATARS_DIR');
    const filename = user.id + '.' + Date.now() + '.' + file.mimetype.split("/").pop();
    const fullpath = dirname + '/' + filename;
    const writeStream = createWriteStream(fullpath);
    writeStream.write(file.buffer);
    writeStream.end();
    return this.usersService.setAvatar(user.id, `${this.envService.get('BACKEND_HOST')}/${fullpath}`);
  }
  
  @Delete("edit/avatar")
  async deleteAvatar(@CurrentUser() user: User): Promise<User> {
    return this.usersService.setAvatar(user.id, this.envService.get('DEFAULT_AVATAR'));
  }

  @Post("edit/paddle-color")
  async editPaddleColor(@CurrentUser() user: User, @MessageBody() data: { color: string }) {
    return await this.usersService.setPaddleColor(user.id, data.color);
  }

  @Post("add-friend/")
  async addFriend(@CurrentUser() user: User, @MessageBody() data: { friendUsername: string }) {
    return await this.usersService.addFriend(user.id, data.friendUsername);
  }

  @Delete("remove-friend/:friendUsername")
  async removeFriend(@CurrentUser() user: User, @Param("friendUsername") friendUsername: string) {
	return await this.usersService.removeFriend(user.id, friendUsername);
  }
	
  @Post("block-user/")
  async blockUser(@CurrentUser() user: User, @MessageBody() data: { username: string }) {
	return await this.usersService.blockUser(user.id, data.username);
  }

  @Delete("unblock/:username")
  async unblockUser(@CurrentUser() user: User, @Param("username") username: string) {
    return await this.usersService.unblockUser(user.id, username);
  }

  @Get('edit/is-valid-username')
  async isValidUsername(@Query("username") username: string): Promise<string> {
    if (username.length < 3) {
      return 'too short';
    }
    if (username.length > 15) {
      return 'too long';
    }
    const user = await this.usersService.findOneUsername(username);
    if (!user) {
      return 'ok';
    }
    return 'already in use';
  }

  /*---Chat---*/

  @Post('channels/create-channel')
  async createChannel(@CurrentUser() user: User, @MessageBody() data: { name: string, password: string, isDm: boolean}): Promise<Channel> {
		console.log('create-channel');
	  return await this.channelService.create(data.name, data.password, data.isDm, user.id, this.usersService);
  }

  @Delete('channels/delete-channel/:id')
  async deleteChannel(@CurrentUser() user: User, @Param("id") id: number): Promise<Channel> {
	  return await this.channelService.delete(id, user.id, this.usersService);
  }

  @Post('channels/join-channel/:id')
  async joinChannel(@CurrentUser() user: User, @Param("id") id: number, @MessageBody() password: string) {
	  return await this.channelService.addUser(id, user.id, password);
  }

  @Post('channels/leave-channel/:id')
  async leaveChannel(@CurrentUser() user: User, @Param("id") id: number) {
	console.log('leave-channel: ', id);
	  return await this.channelService.removeUser(id, user.id, this.usersService);
  }

  @Get('channels/user-channels')
  async getUserChannels(@CurrentUser() user: User): Promise<Channel[]> {
	console.log('get-user-channels');
	return await this.usersService.getUserChannels(user, this.channelService);
  }

  @Get('channels/channel-users/:id')
  async getChannelUsers(@CurrentUser() user: User, @Param("id") id: number): Promise<User[]> {
	console.log('get-channel-users');
	return await this.channelService.getChannelUsers(id, this.usersService);
  }

  @Post('channels/edit-channel-password')
  async editChannelPassword(@CurrentUser() user: User, @MessageBody() data: { channelId: number, newPassword: string }): Promise<Channel> {
	console.log('editChannelPassword', data.newPassword);
    return await this.channelService.editPassword(user.id, data.channelId, data.newPassword);
  }

  @Get('channels/all')
  async getAllChannels(): Promise<Channel[]> {
	return await this.channelService.findAll();
  }
}
