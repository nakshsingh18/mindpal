import { useState } from 'react';
import { motion } from 'framer-motion';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    if (window.botpressWebChat) {
      if (isOpen) {
        window.botpressWebChat.hide();
      } else {
        window.botpressWebChat.show();
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 left-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 300 }}
    >
      <motion.button
        onClick={toggleChat}
        className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        💬
      </motion.button>
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

declare global {
  interface Window {
    botpressWebChat: {
      show: () => void;
      hide: () => void;
    };
  }
}