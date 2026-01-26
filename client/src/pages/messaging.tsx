import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Send, MessageSquare, Circle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ConversationWithDetails, Message } from "@shared/schema";

export default function MessagingPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearch();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoSelectHandled, setAutoSelectHandled] = useState(false);

  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery<ConversationWithDetails[]>({
    queryKey: ["/api/messaging/conversations"],
    refetchInterval: 5000,
  });

  const { data: hygienists = [], isLoading: isLoadingHygienists } = useQuery<{
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    role: string;
    isOnline: boolean;
  }[]>({
    queryKey: ["/api/messaging/hygienists"],
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messaging/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation?.id,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) return;
      const res = await apiRequest(
        "POST",
        `/api/messaging/conversations/${selectedConversation.id}/messages`,
        { content, senderType: "practice_admin" }
      );
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/conversations"] });
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      const res = await apiRequest("POST", "/api/messaging/conversations", { professionalId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messaging/conversations"] });
      if (data) {
        const hyg = hygienists.find(h => h.id === data.professionalId);
        if (hyg) {
          setSelectedConversation({
            ...data,
            professional: hyg,
            unreadCount: 0,
            isOnline: hyg.isOnline,
          });
        }
      }
    },
  });

  // Handle ?professional= query parameter to auto-select or create conversation
  useEffect(() => {
    if (autoSelectHandled || isLoadingConversations || isLoadingHygienists) return;
    
    const params = new URLSearchParams(searchParams);
    const professionalId = params.get("professional");
    
    if (professionalId) {
      // Check if conversation already exists with this professional
      const existingConv = conversations.find(c => c.professional.id === professionalId);
      
      if (existingConv) {
        setSelectedConversation(existingConv);
        setAutoSelectHandled(true);
      } else {
        // Check if the professional exists in hygienists list
        const professional = hygienists.find(h => h.id === professionalId);
        if (professional) {
          // Start a new conversation
          startConversationMutation.mutate(professionalId);
          setAutoSelectHandled(true);
        } else {
          // Professional not found in hygienists, but might exist - try to create anyway
          startConversationMutation.mutate(professionalId);
          setAutoSelectHandled(true);
        }
      }
    }
  }, [searchParams, conversations, hygienists, isLoadingConversations, isLoadingHygienists, autoSelectHandled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const filteredConversations = conversations.filter(conv => {
    const fullName = `${conv.professional.firstName} ${conv.professional.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const hygienistsWithoutConversation = hygienists.filter(
    h => !conversations.some(c => c.professional.id === h.id)
  );

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden" data-testid="messaging-page">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold mb-3">Messaging</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.length === 0 && hygienistsWithoutConversation.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hygienists available</p>
                </div>
              )}

              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left hover-elevate transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-accent" : ""
                  }`}
                  data-testid={`conversation-item-${conv.id}`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      {conv.professional.photoUrl && (
                        <AvatarImage src={conv.professional.photoUrl} />
                      )}
                      <AvatarFallback>
                        {getInitials(conv.professional.firstName, conv.professional.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-current ${
                        conv.isOnline ? "text-green-500" : "text-gray-400"
                      }`}
                      data-testid={`status-indicator-${conv.id}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {conv.professional.firstName} {conv.professional.lastName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conv.lastMessage.createdAt!), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage?.content || "Start a conversation"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {hygienistsWithoutConversation.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground px-3 py-2">Start a new conversation</p>
                  {hygienistsWithoutConversation.map((hyg) => (
                    <button
                      key={hyg.id}
                      onClick={() => startConversationMutation.mutate(hyg.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover-elevate transition-colors"
                      data-testid={`new-conversation-${hyg.id}`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {hyg.photoUrl && <AvatarImage src={hyg.photoUrl} />}
                          <AvatarFallback>
                            {getInitials(hyg.firstName, hyg.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <Circle
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-current ${
                            hyg.isOnline ? "text-green-500" : "text-gray-400"
                          }`}
                          data-testid={`hygienist-status-${hyg.id}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {hyg.firstName} {hyg.lastName}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {hyg.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  {selectedConversation.professional.photoUrl && (
                    <AvatarImage src={selectedConversation.professional.photoUrl} />
                  )}
                  <AvatarFallback>
                    {getInitials(
                      selectedConversation.professional.firstName,
                      selectedConversation.professional.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <Circle
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-current ${
                    selectedConversation.isOnline ? "text-green-500" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <h2 className="font-semibold">
                  {selectedConversation.professional.firstName}{" "}
                  {selectedConversation.professional.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.isOnline ? (
                    <span className="text-green-600">Active now</span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                      <Skeleton className="h-12 w-48 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">Send a message to start the conversation</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedMessages.map((message) => {
                    const isAdmin = message.senderType === "practice_admin";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isAdmin
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(message.createdAt!), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Write a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
              <p className="text-sm">Choose a hygienist from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
