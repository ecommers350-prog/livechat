import { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages = [],
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    setMessages,
  } = useContext(ChatContext) || {};

  const { authUser, onlineUsers = [], socket } = useContext(AuthContext) || {};

  const scrollEnd = useRef(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  /* ======================
     SEND MESSAGE
  ====================== */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sendMessage || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({ text: input.trim() });
      setInput("");
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendImage = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsSending(true);
      try {
        await sendMessage({ image: reader.result });
        e.target.value = "";
        toast.success("Image sent");
      } catch (error) {
        console.error("Send image error:", error);
        toast.error(error?.response?.data?.message || "Failed to send image");
      } finally {
        setIsSending(false);
      }
    };
    reader.readAsDataURL(file);
  };

  /* ======================
     LOAD MESSAGES
  ====================== */
  useEffect(() => {
    if (selectedUser?._id && getMessages) {
      getMessages(selectedUser._id).catch((error) => {
        console.error("Load messages error:", error);
        toast.error("Failed to load messages");
      });
    }
  }, [selectedUser?._id, getMessages]);

  /* ======================
     SOCKET CONNECTION
  ====================== */
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      try {
        if (selectedUser && newMessage?.senderId === selectedUser._id) {
          setMessages((prev) => [...(prev || []), newMessage]);
        }
      } catch (error) {
        console.error("Socket message error:", error);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedUser, setMessages]);

  /* ======================
     AUTO SCROLL
  ====================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages?.length]);

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full">
        <img src={assets.logo_icon} className="max-w-16" alt="logo" />
        <p className="text-lg font-medium text-white">
          Chat anytime, anywhere
        </p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden relative backdrop-blur-lg bg-base-100">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500 flex-shrink-0">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          className="w-8 h-8 rounded-full object-cover"
          alt={selectedUser?.fullName}
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser?.fullName}
          {onlineUsers?.includes(selectedUser?._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser?.(null)}
          src={assets.help_icon}
          className="md:hidden max-w-7 cursor-pointer hover:opacity-70 transition"
          alt="close"
        />
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {Array.isArray(messages) && messages.length > 0 ? (
          messages.map((msg, index) => {
            const isOwn = msg?.senderId === authUser?._id;

            return (
              <div
                key={msg?._id || index}
                className={`flex items-end gap-2 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}
              >
                {msg?.image ? (
                  <img
                    src={msg.image}
                    alt="message"
                    className="max-w-xs md:max-w-sm border border-gray-700 rounded-lg"
                  />
                ) : (
                  <p
                    className={`p-2 max-w-xs md:max-w-sm font-light rounded-lg break-all text-white ${
                      isOwn
                        ? "bg-violet-500/30 rounded-br-none"
                        : "bg-gray-500/30 rounded-bl-none"
                    }`}
                  >
                    {msg?.text || ""}
                  </p>
                )}

                <div className="text-center text-xs flex-shrink-0">
                  <img
                    src={
                      isOwn
                        ? authUser?.profilePic || assets.avatar_icon
                        : selectedUser?.profilePic || assets.avatar_icon
                    }
                    alt="avatar"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    {msg?.createdAt
                      ? formatMessageTime(msg.createdAt)
                      : ""}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={scrollEnd} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-3 p-3 border-t border-stone-500 flex-shrink-0">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isSending}
            type="text"
            placeholder="Send a message..."
            className="flex-1 text-sm p-3 bg-transparent outline-none text-white placeholder-gray-400 disabled:opacity-50"
          />
          <input
            type="file"
            id="image"
            accept="image/png, image/jpeg"
            hidden
            onChange={handleSendImage}
            disabled={isSending}
          />
          <label htmlFor="image" className="cursor-pointer hover:opacity-70 transition">
            <img
              src={assets.gallery_icon}
              alt="gallery"
              className="w-5 mr-2"
            />
          </label>
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isSending || !input.trim()}
          className="flex-shrink-0 hover:opacity-70 transition disabled:opacity-50"
        >
          <img
            src={assets.send_button}
            alt="send"
            className="w-7 h-7"
          />
        </button>
      </div>
    </div>
  );
};

export default ChatContainer;