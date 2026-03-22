'use client';

import { useState } from 'react';
import { Download, X } from 'lucide-react';

interface DocumentGeneratorProps {
  templateId: string;
  onBack: () => void;
}

const templates: Record<string, any> = {
  complaint: {
    title: 'Legal Complaint',
    fields: [
      { name: 'petitionerName', label: 'Your Full Name', type: 'text', required: true },
      { name: 'respondentName', label: 'Respondent Name', type: 'text', required: true },
      { name: 'complaintDetails', label: 'Details of Complaint', type: 'textarea', required: true },
      { name: 'reliefSought', label: 'Relief Sought', type: 'textarea', required: true },
    ],
  },
  petition: {
    title: 'Petition',
    fields: [
      { name: 'petitionerName', label: 'Petitioner Name', type: 'text', required: true },
      { name: 'courtName', label: 'Name of Court', type: 'text', required: true },
      { name: 'caseDetails', label: 'Case Details', type: 'textarea', required: true },
      { name: 'reliefSought', label: 'Relief Sought', type: 'textarea', required: true },
    ],
  },
  affidavit: {
    title: 'Affidavit',
    fields: [
      { name: 'deponentName', label: 'Deponent Name', type: 'text', required: true },
      { name: 'statement', label: 'Statement of Facts', type: 'textarea', required: true },
      { name: 'courtName', label: 'Court Name', type: 'text', required: true },
    ],
  },
  letter: {
    title: 'Legal Notice Letter',
    fields: [
      { name: 'senderName', label: 'Your Name', type: 'text', required: true },
      { name: 'recipientName', label: 'Recipient Name', type: 'text', required: true },
      { name: 'noticeContent', label: 'Notice Content', type: 'textarea', required: true },
    ],
  },
  agreement: {
    title: 'Agreement',
    fields: [
      { name: 'party1', label: 'Party 1', type: 'text', required: true },
      { name: 'party2', label: 'Party 2', type: 'text', required: true },
      { name: 'terms', label: 'Terms and Conditions', type: 'textarea', required: true },
    ],
  },
  appeal: {
    title: 'Appeal',
    fields: [
      { name: 'appellantName', label: 'Appellant Name', type: 'text', required: true },
      { name: 'originalCaseNo', label: 'Original Case Number', type: 'text', required: true },
      { name: 'appellantArguments', label: 'Arguments for Appeal', type: 'textarea', required: true },
    ],
  },
};

export default function DocumentGenerator({ templateId, onBack }: DocumentGeneratorProps) {
  const template = templates[templateId];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState(false);

  if (!template) {
    return <div>Template not found</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGenerated(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = () => {
    // Generate document content
    let content = `${template.title}\n\n`;
    Object.entries(formData).forEach(([key, value]) => {
      content += `${key}: ${value}\n`;
    });

    // Create and download file
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', `${templateId}_document.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{template.title}</h1>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {!generated ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {template.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-error"> *</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    required={field.required}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                )}
              </div>
            ))}

            <button type="submit" className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors">
              Generate Document
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6 p-6 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{template.title}</h2>
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <p className="font-semibold text-gray-700">{key}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setGenerated(false)}
                className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
