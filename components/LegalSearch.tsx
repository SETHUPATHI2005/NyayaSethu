'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

interface LegalSearchProps {
  user: any;
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  score: number;
  category: string;
}

export default function LegalSearch({ user }: LegalSearchProps) {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [submitted, setSubmitted] = useState(false);

  const { data: results, isLoading } = useSWR(
    submitted && query.trim() ? `/api/legal/search?q=${encodeURIComponent(query)}&lang=${language}` : null,
    fetcher
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold mb-2 text-primary">Legal Information Search</h1>
      <p className="text-gray-600 mb-8">
        Search through Indian laws and legal resources to find relevant information
      </p>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="card">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for laws, acts, or legal topics..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Search size={20} />
              Search
            </button>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : results && results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result: SearchResult) => (
            <div key={result.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-primary">{result.title}</h3>
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
                  {result.category}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{result.excerpt}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  Relevance: {Math.round(result.score * 100)}%
                </span>
                <button className="text-primary hover:underline text-sm">Read More</button>
              </div>
            </div>
          ))}
        </div>
      ) : submitted && !isLoading ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">No results found. Try different search terms.</p>
        </div>
      ) : null}
    </div>
  );
}
