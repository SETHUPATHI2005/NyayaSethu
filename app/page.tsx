'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState('en');

  const content = {
    en: {
      title: 'NyayaMithran',
      subtitle: 'Your Legal Aid Assistant',
      description: 'AI-powered legal guidance and assistance for accessible justice',
      getStarted: 'Get Started',
      features: 'Features',
      about: 'About',
      login: 'Login',
      signup: 'Sign Up',
      featureTitle: 'Empowering Access to Justice',
      features_list: [
        { title: 'AI Legal Assistant', desc: 'Get instant legal guidance' },
        { title: 'Document Templates', desc: 'Pre-made legal documents' },
        { title: 'Case Search', desc: 'Find relevant legal cases' },
        { title: 'Rights Awareness', desc: 'Know your legal rights' },
      ],
    },
    hi: {
      title: 'न्यायमित्रान',
      subtitle: 'आपका कानूनी सहायता सहायक',
      description: 'सुलभ न्याय के लिए AI-संचालित कानूनी मार्गदर्शन',
      getStarted: 'शुरू करें',
      features: 'विशेषताएं',
      about: 'परिचय',
      login: 'लॉगिन',
      signup: 'साइन अप',
      featureTitle: 'न्याय तक पहुंच को सशक्त बनाना',
      features_list: [
        { title: 'AI कानूनी सहायक', desc: 'तत्काल कानूनी मार्गदर्शन प्राप्त करें' },
        { title: 'दस्तावेज़ टेम्पलेट', desc: 'पूर्व-निर्मित कानूनी दस्तावेज़' },
        { title: 'केस खोज', desc: 'प्रासंगिक कानूनी मामले खोजें' },
        { title: 'अधिकार जागरूकता', desc: 'अपने कानूनी अधिकार जानें' },
      ],
    },
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <div className="flex gap-4 items-center">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/20 text-white border border-white/40"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
          <Link href="/login" className="px-4 py-2 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-primary transition-colors">
            {t.login}
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
            {t.signup}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-5xl font-bold mb-4">{t.subtitle}</h2>
        <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">{t.description}</p>
        <button
          onClick={() => router.push('/chat')}
          className="bg-accent text-primary font-bold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors text-lg"
        >
          {t.getStarted}
        </button>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-primary-dark/50">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t.featureTitle}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features_list.map((feature, i) => (
              <div key={i} className="bg-white/10 p-6 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-colors">
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8 text-center text-gray-300">
        <p>&copy; 2024 NyayaMithran. All rights reserved.</p>
      </footer>
    </div>
  );
}
