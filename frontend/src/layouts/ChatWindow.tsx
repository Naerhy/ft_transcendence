import "./style/ChatWindow.css"
import { useContext, useEffect, useRef, useState } from "react";
import { IChannel, IUser } from "../types";
import { Context, UserContext } from "../context";
import { IMessage } from "../types/IMessage";
import { IChat } from "../pages/Chat";

interface MessageProps {
  message: IMessage,
  sender: IUser | undefined,
}

function Message({ message, sender }: MessageProps) {
  const user = useContext(UserContext).user;

  return (
    <>
      {
        (message && sender && user && !user.blocked.includes(sender.id)) &&
        <div className="chat-window-message">
          <img
            id="chat-user-info-avatar"
            src={sender.avatar}
            width={30}
            height={30}
          />
          <li>
            <section className="message-info">
              <b id="sender-username">{sender.username}</b>
              <h6 id="message-timestamp">{message.timestamp}</h6>
            </section>
            {message.content}
          </li>
        </div>
      }
    </>
  )
}

interface ChatWindowProps {
  chat: IChat,
}

function ChatWindow({ chat }: ChatWindowProps) {
  const user = useContext(UserContext).user;
  const socket = useContext(Context).pongSocket.current;
  const messagesEndRef = useRef<HTMLSpanElement | null>(null);
  const [input, setInput] = useState<string>("");
  const {
    currentChannel,
    setChannel,
    channelMessages,
    getChannelMessages,
    loadingChannel,
    channelSenders,
  } = chat;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!user) {
      return;
    }
    if (event.key === 'Enter') {
      handleSubmitNewMessage(input, user.id);
    }
  };

  function handleSubmitNewMessage(message: string, userId: number) {
    if (!socket || !socket.connected || !currentChannel || input.trim() === '' || currentChannel.muted.includes(userId)) {
      return;
    }
    socket.emit('send-message', { message: message, currentChannelId: currentChannel.id });
    setInput("");
  }

  function scrollToBottom(): void {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView();
    }
  }

  async function getMessages() {
    if (!currentChannel) {
      return;
    }
    await getChannelMessages(currentChannel.messages, false);
  }

  async function onNewMessage(data: IChannel) {
    if (!currentChannel || currentChannel.id != data.id) {
      return ;
    }
    await getChannelMessages(data.messages, false);
  }

  useEffect(() => {
    if (!currentChannel) {
      loadingChannel.current = false;
      return;
    }
    if (!user || !socket || !currentChannel.users.includes(user.id)) {
      setChannel(undefined);
      return;
    }
    if (currentChannel.muted.includes(user.id)) {
      setInput("");
    }
    socket.on('new-message', onNewMessage);
    getMessages();

    return () => {
      socket.off('new-message', onNewMessage);
    }
  }, [currentChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages])

  return (
    <div className="ChatWindow">
      <h1 className="h1-main-title">{currentChannel ? currentChannel.name : 'Chat'}</h1>
      {
        loadingChannel.current ? <h3 style={{fontWeight: 'lighter'}}>Loading...</h3> :
        <>
          <section className="chat-window-messages-container">
            {
              currentChannel && (
                <div>
                  <ul style={{ listStyleType: 'none' }}>
                    {
                      currentChannel && channelMessages.length ? channelMessages.map((msg, index) => (
                        <Message key={index} message={msg} sender={channelSenders.get(msg.senderId)} />
                      )) : <h4 style={{ fontWeight: 'lighter' }}>No messages yet.</h4>
                    }
                  </ul>
                  <span ref={messagesEndRef}></span>
                </div>
              )
            }
          </section>
          {
            currentChannel ?
              <input
                disabled={(!!user && currentChannel.muted.includes(user.id))}
                autoComplete="off"
                placeholder={user && currentChannel.muted.includes(user.id) ? 'You are muted.' : `Message ${currentChannel.name}`}
                className="input-bar"
                name="input bar"
                type="text"
                value={input}
                onKeyDown={handleKeyDown}
                onChange={handleInputChange}
              />
              : <h4 id="chat-info-bar" style={{ fontWeight: 'lighter', textAlign: 'center' }}>Find or start a conversation</h4>
          }
        </>
      }
    </div>
  )
}

export default ChatWindow;