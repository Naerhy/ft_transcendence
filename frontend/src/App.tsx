import './App.css'
import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Context, UserContext } from './context'
import { Socket, io } from 'socket.io-client'
import { CssBaseline } from '@mui/material'
import { IUser } from './types'
import Navbar from './layouts/Navbar'
import axios from "axios";
import { DefaultEventsMap } from '@socket.io/component-emitter'
import Request from './components/Request'

function App() {
  const serverUrl = "http://192.168.1.178:3000";
  const socket = useRef<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [connected, setConnected] = useState(true);
  const [loadingSocket, setLoadingSocket] = useState(true);

  const contextValue = {
    serverUrl,
    pongSocket: socket,
    loadingSocket: loadingSocket,
    setLoadingSocket: setLoadingSocket,
  };

  async function connect(data: IUser) {
    if (socket.current && socket.current.connected) {
      return ;
    }
    socket.current = io(serverUrl + '/pong', {
      autoConnect: false,
      query: data,
    });
    if (socket) {
      socket.current.on('connect', onConnect);
      socket.current.on('disconnect', onDisconnect);
      socket.current.connect();
    }
  }

  async function onConnect() {
    setConnected(true);
    setLoadingSocket(false);
    console.log(`Connected to ${serverUrl}.`);
  }

  function onDisconnect() {
    setConnected(false);
    setLoadingSocket(true);
    console.log(`Disconnected from ${serverUrl}.`);
  }

  useEffect(() => {
    Request.me().then(res => {
      if (res) {
        setUser(res); // navbar lag comes from this
        connect(res);
      }
    }).catch(err => {
      if (axios.isAxiosError(err) && err.code === "ERR_CANCELED") {
        console.error("Request has been canceled!");
      } else {
        console.error(err);
      }
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current.removeAllListeners();
      }
    };
  }, []);

  return (
    <div className="App">
      <CssBaseline />
      <UserContext.Provider value={{ user, setUser }}>
        <Navbar />
        {
          user && !connected && 
          <div className="alert-disconnected">
            <h3>
              You are disconnected. Please refresh the page.
            </h3>
          </div>
        }
        <Context.Provider value={contextValue}>
          {
            <Outlet />
          }
        </Context.Provider>
      </UserContext.Provider>
    </div>
  )
}

export default App;