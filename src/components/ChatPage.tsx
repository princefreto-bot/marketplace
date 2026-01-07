import { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, SendIcon, ImageIcon, CloseIcon } from './Icons';
import { Avatar } from './UI';
import { useAuth, useMessages, useUsers } from '../store/useStore';
import { Message, User } from '../types';

interface ChatPageProps {
  conversationId: string;
  demandeId: string;
  demandeTitre: string;
  otherUserId: string;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export function ChatPage({ conversationId, demandeId, demandeTitre, otherUserId, onNavigate }: ChatPageProps) {
  const { user } = useAuth();
  const { getMessagesByConversation, sendMessage } = useMessages();
  const { getUserById } = useUsers();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const msgs = getMessagesByConversation(conversationId);
    setMessages(msgs);
    const other = getUserById(otherUserId);
    setOtherUser(other);
  }, [conversationId, otherUserId, getMessagesByConversation, getUserById]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !imagePreview) return;
    if (!user) return;

    setSending(true);
    
    const images = imagePreview ? [{ url: imagePreview, publicId: `img_${Date.now()}` }] : [];
    
    await sendMessage({
      conversationId,
      demandeId,
      demandeTitre,
      senderId: user._id,
      receiverId: otherUserId,
      message: newMessage.trim(),
      images,
    });

    setNewMessage('');
    setImagePreview(null);
    setMessages(getMessagesByConversation(conversationId));
    setSending(false);
    inputRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = formatDate(msg.dateCreation);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button 
            onClick={() => onNavigate('messages')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar src={otherUser?.avatar} name={otherUser?.nom || 'Utilisateur'} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{otherUser?.nom}</p>
              <p className="text-xs text-gray-500 truncate">{demandeTitre}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demande Banner */}
      <button 
        onClick={() => onNavigate('detail', { demandeId })}
        className="bg-blue-50 px-4 py-2 text-center text-sm text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
      >
        📌 Voir la demande: {demandeTitre}
      </button>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {groupMessagesByDate(messages).map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                {group.date}
              </span>
            </div>
            
            {group.messages.map((msg) => {
              const isMe = msg.senderId === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isMe ? 'order-1' : 'order-2'}`}>
                    {msg.images.length > 0 && (
                      <div className="mb-2">
                        {msg.images.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.url} 
                            alt="" 
                            className="rounded-2xl max-w-full"
                          />
                        ))}
                      </div>
                    )}
                    
                    {msg.message && (
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-[15px] whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    )}
                    
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                      {formatTime(msg.dateCreation)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="relative inline-block">
            <img src={imagePreview} alt="" className="h-20 rounded-xl" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area - TOUJOURS VISIBLE */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0 safe-bottom">
        <div className="flex items-end gap-2">
          <label className="p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
            <ImageIcon className="w-6 h-6 text-gray-500" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </label>
          
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écrire un message..."
              className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={sending || (!newMessage.trim() && !imagePreview)}
            className={`p-3 rounded-xl transition-colors ${
              newMessage.trim() || imagePreview
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
