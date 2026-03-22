'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const router = useRouter();

  const t = {
    en: {
      title: 'Create Account',
      name: 'Full Name',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      signup: 'Sign Up',
      login: 'Login here',
      haveAccount: 'Already have an account? ',
      error: 'Sign up failed. Please try again.',
      passwordMismatch: 'Passwords do not match.',
    },
    hi: {
      title: 'खाता बनाएं',
      name: 'पूरा नाम',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      signup: 'साइन अप',
      login: 'यहाँ लॉगिन करें',
      haveAccount: 'पहले से खाता है? ',
      error: 'साइन अप विफल। कृपया पुनः प्रयास करें।',
      passwordMismatch: 'पासवर्ड मेल नहीं खाते।',
    },
  }[language as keyof typeof t];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        language,
      });

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('language', language);
        router.push('/chat');
      } else {
        setError(response.data.message || t.error);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card bg-white shadow-lg">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-primary">{t.title}</h1>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.name}
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.email}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.password}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.confirmPassword}
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {error && <div className="p-3 bg-error/10 text-error rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : t.signup}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            {t.haveAccount}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              {t.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
