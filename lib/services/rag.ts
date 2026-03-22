interface LegalDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  score: number;
  category: string;
}

// Sample legal categories and content for fallback
const DEFAULT_LEGAL_CONTENT = {
  'Indian Penal Code': 'The Indian Penal Code, 1860 is the main criminal law of India.',
  'Constitution of India': 'The Constitution of India is the supreme law of India.',
  'Civil Procedure Code': 'The Civil Procedure Code, 1908 governs civil proceedings.',
  'Criminal Procedure Code': 'The Criminal Procedure Code, 1973 governs criminal procedures.',
  'Indian Contract Act': 'The Indian Contract Act, 1872 governs contracts in India.',
  'Sale of Goods Act': 'The Sale of Goods Act, 1930 regulates sale of goods.',
  'Limited Liability Partnership Act': 'The Limited Liability Partnership Act, 2008 governs LLPs.',
  'Patents Act': 'The Patents Act, 1970 protects inventions and patents.',
  'Trademarks Act': 'The Trademarks Act, 1999 protects trademarks.',
  'Copyrights Act': 'The Copyrights Act, 1957 protects literary and artistic works.',
};

// Initialize documents
const documents: LegalDocument[] = Object.entries(DEFAULT_LEGAL_CONTENT).map(
  ([title, content], index) => ({
    id: `doc-${index}`,
    title,
    content,
    category: 'Indian Law',
    language: 'en',
  })
);

function calculateSimilarity(query: string, text: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const textLower = text.toLowerCase();

  let matches = 0;
  for (const term of queryTerms) {
    if (textLower.includes(term)) {
      matches++;
    }
  }

  return matches / Math.max(queryTerms.length, 1);
}

export function search(query: string, topK: number = 5): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const results = documents
    .map(doc => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.content.substring(0, 200),
      score: calculateSimilarity(query, `${doc.title} ${doc.content}`),
      category: doc.category,
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (results.length === 0) {
    return getTopicFallback(query);
  }

  return results;
}

function getTopicFallback(query: string): SearchResult[] {
  const queryLower = query.toLowerCase();
  const keywords: { [key: string]: string[] } = {
    criminal: ['Indian Penal Code', 'Criminal Procedure Code'],
    civil: ['Civil Procedure Code', 'Constitution of India'],
    contract: ['Indian Contract Act', 'Sale of Goods Act'],
    business: ['Limited Liability Partnership Act', 'Patents Act'],
    intellectual: ['Patents Act', 'Trademarks Act', 'Copyrights Act'],
    property: ['Sale of Goods Act', 'Constitution of India'],
  };

  let relevantDocs: string[] = [];
  for (const [keyword, docs] of Object.entries(keywords)) {
    if (queryLower.includes(keyword)) {
      relevantDocs = docs;
      break;
    }
  }

  if (relevantDocs.length === 0) {
    relevantDocs = Object.keys(DEFAULT_LEGAL_CONTENT).slice(0, 3);
  }

  return relevantDocs
    .map((title, index) => ({
      id: `fallback-${index}`,
      title,
      excerpt: DEFAULT_LEGAL_CONTENT[title as keyof typeof DEFAULT_LEGAL_CONTENT] || '',
      score: 0.5,
      category: 'Indian Law',
    }))
    .slice(0, 5);
}

export function getCategories(): string[] {
  const categories = new Set(documents.map(d => d.category));
  return Array.from(categories);
}

export function getDocumentsByCategory(category: string): SearchResult[] {
  return documents
    .filter(d => d.category === category)
    .map(d => ({
      id: d.id,
      title: d.title,
      excerpt: d.content.substring(0, 200),
      score: 1,
      category: d.category,
    }));
}

export type { SearchResult, LegalDocument };
