import React, { useEffect, useState } from 'react';
import { fetchMessages, sendMessage, subscribeToChat } from '../utils/therapistApi';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';

interface Props {
  chatId: string;
  therapistId: string;
  userId: string;
  onClose: () => void;
}

export const TherapistChat: React.FC<Props> = ({ chatId, therapistId, userId, onClose }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    (async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Fetch messages
      const { data } = await fetchMessages(chatId);
      setMessages(data || []);
    })();

    // Subscribe to new messages
    const channel = subscribeToChat(chatId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await sendMessage(
      chatId, 
      user.id, 
      user.id === therapistId ? userId : therapistId, 
      input
    );
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chat</h3>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </div>

      <div className="h-80 overflow-y-auto bg-gray-50 p-4 rounded mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((m: any) => {
            const isTherapist = m.sender_id === therapistId;
            return (
              <div 
                key={m.id} 
                className={`p-3 rounded-lg max-w-[80%] ${
                  isTherapist 
                    ? 'bg-blue-100 ml-auto' 
                    : 'bg-gray-100'
                }`}
              >
                <div className="text-sm">{m.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
          placeholder="Type your message..." 
        />
        <Button 
          onClick={handleSend} 
          className="bg-teal-600 text-white hover:bg-teal-700"
          disabled={!input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
};