'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: string;
}

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export default function ChatMessage({ message, isLast }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-primary text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {!isUser && isLast && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>
        )}

        <p className="text-xs mt-2 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
