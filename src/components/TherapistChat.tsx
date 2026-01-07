import React, { useEffect, useState, useRef } from 'react';
import { fetchMessages, sendMessage, subscribeToChat } from '../utils/therapistApi';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, User, Stethoscope } from 'lucide-react';

interface Props {
  chatId: string;
  therapistId: string;
  userId: string;
  onClose: () => void;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

export const TherapistChat: React.FC<Props> = ({ chatId, therapistId, userId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [therapistName, setTherapistName] = useState('Therapist');
  const [userName, setUserName] = useState('User');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          
          // Fetch user and therapist names
          const [therapistRes, userRes] = await Promise.all([
            supabase.from('therapists').select('name').eq('id', therapistId).single(),
            supabase.from('users').select('username').eq('id', userId).single()
          ]);
          
          if (therapistRes.data) setTherapistName(therapistRes.data.name);
          if (userRes.data) setUserName(userRes.data.username);
        }

        // Fetch messages with better error handling
        const { data, error } = await fetchMessages(chatId);
        if (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        } else {
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    // Subscribe to new messages
    const channel = subscribeToChat(chatId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId, therapistId, userId]);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setIsSending(true);
    const messageText = input.trim();
    setInput(''); // Clear input immediately for better UX
    
    try {
      const receiverId = user.id === therapistId ? userId : therapistId;
      const { error } = await sendMessage(chatId, user.id, receiverId, messageText);
      
      if (error) {
        console.error('Error sending message:', error);
        setInput(messageText); // Restore input on error
        alert('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setInput(messageText);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isCurrentUserTherapist = currentUserId === therapistId;
  const chatPartnerName = isCurrentUserTherapist ? userName : therapistName;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-blue-400 flex items-center justify-center text-white">
            {isCurrentUserTherapist ? (
              <User size={20} />
            ) : (
              <Stethoscope size={20} />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{chatPartnerName}</h3>
            <p className="text-sm text-gray-500">
              {isCurrentUserTherapist ? 'Client' : 'Therapist'}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClose}
          className="rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 flex items-center justify-center mb-4">
              <Stethoscope className="text-teal-600" size={24} />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">Start the conversation</h4>
            <p className="text-gray-500 text-sm max-w-xs">
              {isCurrentUserTherapist 
                ? 'Send a message to begin helping your client'
                : 'Send a message to start your therapy session'
              }
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => {
              const isFromCurrentUser = message.sender_id === currentUserId;
              const isFromTherapist = message.sender_id === therapistId;
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`p-3 rounded-2xl shadow-sm ${
                        isFromCurrentUser
                          ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                    <div className={`flex items-center mt-1 space-x-2 ${
                      isFromCurrentUser ? 'justify-end' : 'justify-start'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isFromTherapist 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-teal-100 text-teal-600'
                      }`}>
                        {isFromTherapist ? (
                          <Stethoscope size={12} />
                        ) : (
                          <User size={12} />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder={`Message ${chatPartnerName}...`}
              disabled={isSending}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-2xl px-4 py-3 shadow-md transition-all duration-200"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
        
        {/* Typing indicator placeholder */}
        <div className="mt-2 h-4">
          {/* Could add typing indicator here */}
        </div>
      </div>
    </div>
  );
};