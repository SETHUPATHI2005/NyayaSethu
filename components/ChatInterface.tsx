'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from './Navigation';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import axios from 'axios';

interface ChatInterfaceProps {
  user: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: string;
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await axios.post('/api/chat/session', {
          userId: user.id,
          language: localStorage.getItem('language') || 'en',
        });
        setSessionId(response.data.sessionId);
      } catch (error) {
        console.error('Error initializing chat session:', error);
      }
    };

    initializeSession();
  }, [user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!sessionId || !message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      language: localStorage.getItem('language') || 'en',
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post('/api/chat/message', {
        sessionId,
        userId: user.id,
        message,
        language: localStorage.getItem('language') || 'en',
      });

      if (response.data.success) {
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(2),
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          language: localStorage.getItem('language') || 'en',
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        language: localStorage.getItem('language') || 'en',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation user={user} />

      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-96 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">Welcome to NyayaMithran</h2>
                  <p className="text-gray-600">
                    Ask me any legal question and I'll help guide you through the Indian legal system.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={msg.id} message={msg} isLast={index === messages.length - 1} />
              ))
            )}
            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-primary">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-2xl mx-auto p-4">
            <ChatInput onSend={handleSendMessage} disabled={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
