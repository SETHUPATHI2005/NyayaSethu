interface LLMResponse {
  text: string;
  sources?: string[];
  language: string;
}

interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Fallback responses for legal queries
const LEGAL_RESPONSES: { [key: string]: string } = {
  'default': 'I appreciate your question. For accurate legal advice, please consult with a qualified legal professional. However, I can provide general information about Indian legal concepts.',
  'contract': 'In Indian law, contracts are governed by the Indian Contract Act, 1872. A valid contract requires an offer, acceptance, consideration, and intent to create legal relations.',
  'rights': 'Every citizen of India has fundamental rights as described in the Constitution of India, including the right to equality, freedom of speech, and the right to constitutional remedies.',
  'employment': 'Employment law in India is governed by various acts including the Industrial Disputes Act and the Code on Industrial Relations. Employees have rights regarding working hours, wages, and safety.',
  'property': 'Property rights in India are protected by the Constitution and various property laws. Property can be transferred through sale, gift, mortgage, or lease.',
  'criminal': 'Criminal law in India is primarily governed by the Indian Penal Code, 1860 and the Criminal Procedure Code, 1973. Criminal offenses range from minor offenses to serious crimes.',
  'court': 'India has a three-tier court system: Supreme Court, High Courts, and District Courts. Civil cases are heard in civil courts and criminal cases in criminal courts.',
};

function translateToHindi(text: string): string {
  const translations: { [key: string]: string } = {
    'I appreciate your question': 'मैं आपके प्रश्न की सराहना करता हूं',
    'legal advice': 'कानूनी सलाह',
    'qualified legal professional': 'योग्य कानूनी पेशेवर',
    'general information': 'सामान्य जानकारी',
    'Indian law': 'भारतीय कानून',
    'contract': 'अनुबंध',
    'agreement': 'समझौता',
  };

  let result = text;
  Object.entries(translations).forEach(([en, hi]) => {
    const regex = new RegExp(en, 'gi');
    result = result.replace(regex, hi);
  });

  return result;
}

function getFallbackResponse(prompt: string, context: string, language: string): string {
  const promptLower = prompt.toLowerCase();

  let response = LEGAL_RESPONSES['default'];

  if (promptLower.includes('contract') || promptLower.includes('agreement')) {
    response = LEGAL_RESPONSES['contract'];
  } else if (promptLower.includes('right') || promptLower.includes('freedom')) {
    response = LEGAL_RESPONSES['rights'];
  } else if (promptLower.includes('employment') || promptLower.includes('job') || promptLower.includes('worker')) {
    response = LEGAL_RESPONSES['employment'];
  } else if (promptLower.includes('property') || promptLower.includes('land') || promptLower.includes('house')) {
    response = LEGAL_RESPONSES['property'];
  } else if (promptLower.includes('crime') || promptLower.includes('criminal') || promptLower.includes('offense')) {
    response = LEGAL_RESPONSES['criminal'];
  } else if (promptLower.includes('court') || promptLower.includes('judge') || promptLower.includes('legal action')) {
    response = LEGAL_RESPONSES['court'];
  }

  if (language === 'hi') {
    response = translateToHindi(response);
  }

  return response;
}

export async function generateResponse(
  prompt: string,
  context: string = '',
  language: string = 'en'
): Promise<string> {
  try {
    return getFallbackResponse(prompt, context, language);
  } catch (error) {
    console.error('LLM error:', error);
    return getFallbackResponse(prompt, context, language);
  }
}

export async function chat(
  messages: LLMMessage[],
  language: string = 'en'
): Promise<string> {
  try {
    const lastMessage = messages[messages.length - 1];
    return getFallbackResponse(lastMessage.content, '', language);
  } catch (error) {
    console.error('Chat error:', error);
    return getFallbackResponse('', '', language);
  }
}

export type { LLMResponse, LLMMessage };
