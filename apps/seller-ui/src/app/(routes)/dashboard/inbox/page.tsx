"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "apps/seller-ui/src/context/web-socket-context";
import useSeller from "apps/seller-ui/src/hooks/useSeller";
import ChatInput from "apps/seller-ui/src/shared/components/chats/chatinput";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const { seller } = useSeller();
  const conversationId = searchParams.get("conversationId");
  const { ws } = useWebSocket();
  const queryClient = useQueryClient();

  // Debug seller and conversationId
  console.log("🔍 Seller:", seller);
  console.log("🔍 Seller ID:", seller?.id);
  console.log("🔍 Current conversationId from URL:", conversationId);
  console.log("🔍 URL search params:", searchParams.toString());

  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      console.log("🔍 Fetching messages for conversationId:", conversationId);
      console.log("🔍 Query enabled:", !!conversationId);
      if (!conversationId) {
        console.log("❌ No conversationId, returning empty array");
        return [];
      }
      
      try {
        console.log("🌐 Making API call to:", `chatting/api/get-seller-messages/${conversationId}?page=1`);
        console.log("⏰ API call started at:", new Date().toISOString());
        
        const res = await axiosInstance.get(
          `chatting/api/get-seller-messages/${conversationId}?page=1`
        );
        
        console.log("⏰ API call completed at:", new Date().toISOString());
        console.log("✅ Messages API response:", res.data);
        console.log("✅ Messages count:", res.data.messages?.length || 0);
        console.log("✅ Full response status:", res.status);
        
        if (!res.data.messages || res.data.messages.length === 0) {
          console.log("⚠️ No messages found in response");
          return [];
        }
        
        return res.data.messages.reverse();
      } catch (error: any) {
        console.error("❌ Error fetching messages:", error);
        console.error("❌ Error response:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);
        console.error("❌ Error message:", error.message);
        throw error;
      }
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  // Debug query state
  console.log("🔍 Query Debug - conversationId:", conversationId, "enabled:", !!conversationId, "messagesLoading:", messagesLoading, "messagesError:", messagesError);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      console.log("🔍 Fetching conversations...");
      try {
        const res = await axiosInstance.get(
          "/chatting/api/get-seller-conversations"
        );
        console.log("✅ Conversations API response:", res.data);
        return res.data.conversations;
      } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        throw error;
      }
    },
    enabled: !!seller?.id, // Only run when seller is available
  });

  // Debug conversations query state
  console.log("🔍 Conversations Debug - seller:", seller?.id, "conversationsEnabled:", !!seller?.id, "conversationsLoading:", isLoading, "conversations:", conversations);

  useEffect(() => {
    if (conversations) {
      console.log("📋 Conversations loaded:", conversations);
      console.log("📋 First conversation structure:", conversations[0]);
      setChats(conversations);
    }
  }, [conversations]);

  // Debug logging for key state changes
  useEffect(() => {
    console.log("📊 Current state - conversationId:", conversationId, "messages.length:", messages.length, "selectedChat:", selectedChat?.conversationId);
  }, [conversationId, messages.length, selectedChat]);

  // Track conversationId changes
  useEffect(() => {
    console.log("🔄 conversationId changed to:", conversationId);
    console.log("🔄 conversationId type:", typeof conversationId);
    console.log("🔄 conversationId truthy:", !!conversationId);
    if (conversationId) {
      console.log("✅ conversationId is set, query should be enabled");
      console.log("✅ Messages query should now run for conversationId:", conversationId);
    } else {
      console.log("❌ conversationId is null/undefined, query will be disabled");
    }
  }, [conversationId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const container = messageContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    });
  };

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const timoeout = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timoeout);
  }, [conversationId, messages.length]);

  useEffect(() => {
    console.log("🔄 useEffect triggered - conversationId:", conversationId, "chats.length:", chats.length);
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      console.log("🎯 Found chat:", chat);
      setSelectedChat(chat || null);
    }
  }, [conversationId, chats]);

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);

      if (data.type === "NEW_MESSAGE") {
        const newMsg = data?.payload;

        // Skip if this is a message from the current seller (to prevent duplicates)
        if (newMsg.senderId === seller?.id || newMsg.fromUserId === seller?.id) {
          return;
        }

        if (newMsg.conversationId === conversationId) {
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: any = []) => {
              // Check if message already exists to prevent duplicates
              const messageExists = old.some((msg: any) => 
                msg.id === newMsg.id || 
                (msg.content === newMsg.content && 
                 msg.createdAt === newMsg.createdAt &&
                 msg.senderType === newMsg.senderType)
              );
              
              if (messageExists) {
                return old;
              }
              
              return [
                ...old,
                {
                  content: newMsg.messageBody || newMsg.content || "",
                  senderType: newMsg.senderType,
                  seen: false,
                  createdAt: newMsg.createdAt || new Date().toISOString(),
                },
              ];
            }
          );
          scrollToBottom();
        }

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === newMsg.conversationId
              ? { ...chat, lastMessage: newMsg.content || newMsg.messageBody }
              : chat
          )
        );
      }

      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === conversationId
              ? { ...chat, unreadCount: count }
              : chat
          )
        );
      }
    };
  }, [ws, conversationId, seller?.id]);

  const handleChatSelect = (chat: any) => {
    console.log("🖱️ Chat selected:", chat);
    console.log("🖱️ Chat conversationId:", chat.conversationId);
    console.log("🖱️ Current conversationId before selection:", conversationId);
    console.log("🔄 Invalidating queries for conversationId:", chat.conversationId);
    
    // Invalidate the messages query to force refetch
    queryClient.invalidateQueries({ queryKey: ["messages", chat.conversationId] });
    
    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
    
    console.log("🔄 Navigating to URL with conversationId:", chat.conversationId);
    const newUrl = `/dashboard/inbox?conversationId=${chat.conversationId}`;
    console.log("🔄 New URL:", newUrl);
    router.push(newUrl);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "MARK_AS_SEEN",
          conversationId: chat.conversationId,
        })
      );
    }
  };

  const handleSend = (e: any) => {
    e.preventDefault();
    
    console.log("📤 Attempting to send message...");
    console.log("📤 selectedChat:", selectedChat);
    console.log("📤 seller:", seller);
    console.log("📤 message:", message);
    
    if (
      !message.trim() ||
      !selectedChat ||
      ws.readyState !== WebSocket.OPEN
    ) {
      console.log("❌ Send blocked - missing requirements");
      return;
    }

    if (!selectedChat?.user?.id) {
      console.error("❌ selectedChat.user.id is null/undefined:", selectedChat?.user);
      return;
    }

    const payload = {
      type: "NEW_MESSAGE",
      fromUserId: seller?.id,
      toUserId: selectedChat?.user?.id,
      conversationId: selectedChat?.conversationId,
      messageBody: message,
      senderType: "seller",
    };
    
    console.log("📤 Sending payload:", payload);

    // Add message to UI immediately for better UX
    const tempMessageId = `temp_${Date.now()}_${Math.random()}`;
    queryClient.setQueryData(["messages", selectedChat.conversationId], (old: any = []) => [
      ...old,
      {
        id: tempMessageId,
        content: message,
        senderType: "seller",
        seen: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    ws?.send(JSON.stringify(payload));

    setMessage("");
    scrollToBottom();
  };


  const testQuery = () => {
    console.log("🧪 Testing query manually...");
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
  };

  return (
    <div className="w-full">
      {/* Temporary test button */}
      <div className="p-4 bg-red-500 text-white">
        <button onClick={testQuery} className="bg-white text-red-500 px-4 py-2 rounded">
          Test Query (Remove this button later)
        </button>
        <span className="ml-4">conversationId: {conversationId || "null"}</span>
      </div>
      <div className="flex h-screen shadow-inner overflow-hidden bg-gray-950 text-white">
        <div className="w-[320px] border-r border-gray-800 bg-gray-950">
          <div className="p-4 border-b border-gray-800 text-lg font-semibold">
            Messages
          </div>
          <div className="divide-y divide-gray-900">
            {isLoading ? (
              <div className="text-center py-5 text-sm">Loading...</div>
            ) : chats.length == 0 ? (
              <p className="text-center py-5 text-sm">No conversations yet.</p>
            ) : (
              chats.map((chat) => {
                const isActive =
                  selectedChat?.conversationId === chat.conversationId;

                return (
                  <button
                    key={chat.conversationId}
                    onClick={() => handleChatSelect(chat)}
                    className={`w-full text-left px-4 py-3 transition ${
                      isActive ? "bg-blue-950" : "hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={chat.user?.avatar}
                        alt={chat.user?.name}
                        width={36}
                        height={36}
                        className="rounded-full border w-[40px] h-[40px] object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">
                            {chat.user?.name}
                          </span>
                          {chat.user?.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400 truncate max-w-[170px]">
                            {chat.lastMessage || ""}{" "}
                          </p>
                          {chat?.unreadCount > 0 && (
                            <span className="ml-2 text-[10px] bg-blue-600 text-white">
                              {chat?.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 bg-gray-950">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center">
                <Image
                  src={selectedChat.user?.avatar}
                  alt={selectedChat.user.name}
                  width={40}
                  height={40}
                  className="rounded-full border w-[40px] h-[40px] object-cover border-gray-500"
                />
                <div>
                  <h2 className="text-white font-semibold text-base">
                    {selectedChat.user?.name}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {selectedChat.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm"
                ref={messageContainerRef}
              >
                {messages.map((msg: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.senderType === "seller"
                        ? "items-end ml-auto"
                        : "items-start"
                    } max-w-[80%]`}
                  >
                    <div
                      className={`${
                        msg.senderType === "seller"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-200"
                      } px-4 py-2 rounded-lg shadow-sm w-fit`}
                    >
                      {msg.content}
                    </div>
                    <div
                      className={`text-[11px] text-gray-400 mt-1 flex items-center ${
                        msg.senderType === "user" ? "mr-1 justify-end" : "ml-1"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleDateString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSend}
                
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start Chatting.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
