import fs from 'fs';
import path from 'path';

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

class RAGService {
  private documents: LegalDocument[] = [];
  private dataPath = path.join(process.cwd(), 'public/data');

  constructor() {
    this.loadDocuments();
  }

  private loadDocuments() {
    try {
      const filePath = path.join(this.dataPath, 'indian_laws_en.json');
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.documents = Array.isArray(parsed) ? parsed : parsed.laws || [];
      }
    } catch (error) {
      console.error('Error loading legal documents:', error);
      this.documents = [];
    }
  }

  private calculateSimilarity(query: string, text: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const textLower = text.toLowerCase();
    
    let matches = 0;
    for (const term of queryTerms) {
      if (textLower.includes(term)) {
        matches++;
      }
    }
    
    return matches / queryTerms.length;
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'by'
    ]);
    
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3 && !commonWords.has(w));
    
    return [...new Set(words)];
  }

  search(query: string, language: string = 'en', limit: number = 5): SearchResult[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const keywords = this.extractKeywords(query);
    
    const scoredDocs = this.documents
      .filter(doc => doc.language === language)
      .map(doc => {
        let score = 0;
        
        // Title match (weighted higher)
        if (doc.title.toLowerCase().includes(query.toLowerCase())) {
          score += 2;
        }
        
        // Content match
        score += this.calculateSimilarity(query, doc.content) * 1.5;
        
        // Keyword matching
        const docKeywords = this.extractKeywords(doc.content);
        const matchingKeywords = keywords.filter(k => docKeywords.includes(k));
        score += matchingKeywords.length * 0.5;
        
        return { doc, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scoredDocs.map(({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.content.substring(0, 200) + '...',
      score,
      category: doc.category,
    }));
  }

  getDocumentById(id: string): LegalDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  getCategories(): string[] {
    return [...new Set(this.documents.map(doc => doc.category))];
  }

  searchByCategory(category: string, language: string = 'en'): LegalDocument[] {
    return this.documents.filter(
      doc => doc.category === category && doc.language === language
    );
  }

  getTopicsForFallback(): string[] {
    const topics = [
      'Criminal Law',
      'Civil Rights',
      'Family Law',
      'Property Rights',
      'Labor Law',
      'Constitutional Rights',
      'Consumer Rights',
      'Women Rights',
      'Child Protection',
      'Disability Rights',
    ];
    return topics;
  }
}

export const ragService = new RAGService();
