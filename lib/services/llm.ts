interface LLMResponse {
  text: string;
  sources?: string[];
  language: string;
}

interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

class LLMService {
  private apiKey: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models';

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  async generateResponse(
    prompt: string,
    context: string = '',
    language: string = 'en'
  ): Promise<LLMResponse> {
    try {
      // Check if we have API key, if not use fallback
      if (!this.apiKey) {
        return this.getFallbackResponse(prompt, context, language);
      }

      const fullPrompt = context
        ? `Context: ${context}\n\nQuestion: ${prompt}`
        : prompt;

      const response = await fetch(
        `${this.baseUrl}/mistral-community/Mistral-7B-Instruct-v0.3`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          method: 'POST',
          body: JSON.stringify({
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        return this.getFallbackResponse(prompt, context, language);
      }

      const data: any = await response.json();
      const text = Array.isArray(data)
        ? data[0]?.generated_text || ''
        : data.generated_text || '';

      return {
        text: text.replace(fullPrompt, '').trim(),
        language,
      };
    } catch (error) {
      console.error('LLM API error:', error);
      return this.getFallbackResponse(prompt, context, language);
    }
  }

  async chat(
    messages: LLMMessage[],
    language: string = 'en'
  ): Promise<LLMResponse> {
    try {
      if (!this.apiKey) {
        const lastMessage = messages[messages.length - 1];
        return this.getFallbackResponse(lastMessage.content, '', language);
      }

      const formattedMessages = messages
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

      const response = await fetch(
        `${this.baseUrl}/mistral-community/Mistral-7B-Instruct-v0.3`,
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          method: 'POST',
          body: JSON.stringify({
            inputs: formattedMessages + '\nAssistant:',
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.95,
            },
          }),
        }
      );

      if (!response.ok) {
        const lastMessage = messages[messages.length - 1];
        return this.getFallbackResponse(lastMessage.content, '', language);
      }

      const data: any = await response.json();
      const text = Array.isArray(data)
        ? data[0]?.generated_text || ''
        : data.generated_text || '';

      return {
        text: text.replace(formattedMessages, '').trim(),
        language,
      };
    } catch (error) {
      console.error('Chat API error:', error);
      const lastMessage = messages[messages.length - 1];
      return this.getFallbackResponse(lastMessage.content, '', language);
    }
  }

  private getFallbackResponse(
    prompt: string,
    context: string,
    language: string
  ): LLMResponse {
    const responses: Record<string, string> = {
      en: `I understand your question about: "${prompt}". Based on the available information, I can help guide you through legal matters. For specific legal advice, please consult with a qualified legal professional or visit a legal aid center. Would you like more information about a specific legal topic?`,
      hi: `मैं आपके प्रश्न को समझता हूं: "${prompt}"। उपलब्ध जानकारी के आधार पर, मैं आपको कानूनी मामलों में मार्गदर्शन दे सकता हूं। विशिष्ट कानूनी सलाह के लिए, कृपया एक योग्य कानूनी पेशेवर से परामर्श लें या कानूनी सहायता केंद्र जाएं।`,
    };

    return {
      text: responses[language] || responses['en'],
      language,
    };
  }

  extractEntities(text: string): Record<string, string[]> {
    const entities: Record<string, string[]> = {
      laws: [],
      places: [],
      people: [],
      organizations: [],
    };

    // Simple pattern matching for common entities
    const lawPatterns = [/Act of \d+|Constitution|IPC|CPC|Evidence Act/gi];
    lawPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) entities.laws.push(...matches);
    });

    return entities;
  }
}

export const llmService = new LLMService();
