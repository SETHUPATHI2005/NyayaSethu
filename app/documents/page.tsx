'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import DocumentGenerator from '@/components/DocumentGenerator';

const templates = [
  {
    id: 'complaint',
    title: 'Legal Complaint',
    description: 'File a formal legal complaint',
    category: 'Legal Documents',
  },
  {
    id: 'petition',
    title: 'Petition',
    description: 'Create a petition for legal relief',
    category: 'Legal Documents',
  },
  {
    id: 'affidavit',
    title: 'Affidavit',
    description: 'Prepare a sworn statement',
    category: 'Affidavits',
  },
  {
    id: 'letter',
    title: 'Legal Notice Letter',
    description: 'Send an official legal notice',
    category: 'Correspondence',
  },
  {
    id: 'agreement',
    title: 'Agreement',
    description: 'Create a legal agreement',
    category: 'Contracts',
  },
  {
    id: 'appeal',
    title: 'Appeal',
    description: 'File an appeal in court',
    category: 'Petitions',
  },
];

export default function DocumentsPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!user) return null;

  if (selectedTemplate) {
    return <DocumentGenerator templateId={selectedTemplate} onBack={() => setSelectedTemplate(null)} />;
  }

  const categories = [...new Set(templates.map(t => t.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">Legal Documents</h1>
        <p className="text-gray-600 mb-8">Choose a template to create your legal document</p>

        {categories.map(category => (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-neutral-700">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter(t => t.category === category)
                .map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <h3 className="text-xl font-bold text-primary mb-2">{template.title}</h3>
                    <p className="text-gray-600">{template.description}</p>
                    <button className="mt-4 px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-primary transition-colors w-full">
                      Start
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
