import { Socket } from "socket.io";

export const STATUS_ONLINE = 'online';
export const STATUS_PLAYING = 'playing';
export const STATUS_OFFLINE = 'offline';
export type _Status = typeof STATUS_ONLINE | typeof STATUS_PLAYING | typeof STATUS_OFFLINE;

export interface IClient {
  id: number,
  name: string,
  avatar: string,
  backgroundColor: string,
  status: string,
  rating: number,
}

class Client {
  private static __clients_ = new Set<Client>;

  private __socket_: Socket;
  private _id: number;
  private _name: string;
  private _avatar: string;
  private _backgroundColor: string;
  private _status: _Status;
  private _rating: number;
  private _friends: IClient[];

  private __newId(): number {
    let _new_id = 0;
    while (Client.at(_new_id)) {
      _new_id++;
    }
    return _new_id;
  }

  private constructor(socket: Socket) {
    this.__socket_ = socket;
    this._id = this.__newId();
    this._name = 'User' + socket.id;
    this._avatar = "http://localhost:3000/public/images/noavatar.png";
    this._backgroundColor = socket.data.backgroundColor;
    this._status = STATUS_ONLINE;
    this._rating = 1200;
    this._friends = [];
  }

  public get __socket(): Socket { return this.__socket_; }
  public get id(): number { return this._id; }
  public get name(): string { return this._name; }
  public get avatar(): string { return this._avatar; }
  public get backgroundColor(): string { return this._backgroundColor; }
  public get status(): typeof STATUS_ONLINE | typeof STATUS_PLAYING | typeof STATUS_OFFLINE { return this._status; }
  public get rating(): number { return this._rating; }
  public get friends(): IClient[] { return this._friends; }

  public set __socket(__socket_: Socket) { this.__socket_ = __socket_; }
  public set id(id: number) { this._id = id; }
  public set name(name: string) { this._name = name; }
  public set avatar(avatar: string) { this._avatar = avatar; }
  public set backgroundColor(backgroundColor: string) { this._backgroundColor = backgroundColor; }
  public set status(status: _Status ) { this._status = status; }
  public set rating(rating: number) { this._rating = rating; }
  public set friends(friends: IClient[]) { this._friends = friends; }

  public IClient(): IClient {
    const iClient: IClient = {
      id: this._id,
      name: this._name,
      avatar: this._avatar,
      backgroundColor: this._backgroundColor,
      status: this._status,
      rating: this._rating,
    }
    return iClient;
  }

  public addFriend(client: Client) {
    this._friends.push(client.IClient());
  }

  public removeFriend(client: Client) {
    const index = this._friends.findIndex(c => c.name === client.name);
    if (index > -1) {
      this._friends.splice(index, 1);
    }
  }

  public static nullIClient(): IClient {
    const iClient: IClient = {
      id: -1,
      name: '',
      avatar: "http://localhost:3000/public/images/noavatar.png",
      backgroundColor: 'black',
      status: STATUS_OFFLINE,
      rating: 1200,
    }
    return iClient;
  }

  public static new(clientSocket: Socket): Client {
    const client = new Client(clientSocket);
    Client.__clients_.add(client);
    return client;
  }

  public static at(username: string): Client | null;
  public static at(id: number): Client | null;
  public static at(clientSocket: Socket): Client | null;
  public static at(client: number | Socket | string): Client | null {
    // Client ID
    if (typeof client === 'number') {
      for (const clt of Client.__clients_.values()) {
        if (clt._id === client) {
          return clt;
        }
      }
    }

    else if (typeof client === 'string') {
      for (const clt of Client.__clients_.values()) {
        if (clt._name.toLowerCase() === client.toLowerCase()) {
          return clt;
        }
      }
    }
    
    // Socket
    else {
      for (const clt of Client.__clients_.values()) {
        if (clt.__socket_.id === client.id) {
          return clt;
        }
      }
    }
    return null;
  }

  public static delete(socket: Socket) {
    for (const client of Client.__clients_.values()) {
      if (client.__socket_.id === socket.id) {
        Client.__clients_.delete(client);
        return ;
      }
    }
  }

  public static list() {
    const clientList: IClient[] = [];

    Client.__clients_.forEach((client: Client) => {
      clientList.push(client.IClient());
    });
    return clientList;
  }
}

export default Client;