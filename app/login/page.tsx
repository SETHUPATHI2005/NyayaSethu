'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState('en');
  const router = useRouter();

  const t = {
    en: {
      title: 'Login to NyayaMithran',
      email: 'Email Address',
      password: 'Password',
      login: 'Login',
      signup: 'Sign up here',
      noAccount: "Don't have an account? ",
      error: 'Login failed. Please check your credentials.',
      success: 'Login successful!',
    },
    hi: {
      title: 'NyayaMithran में लॉगिन करें',
      email: 'ईमेल पता',
      password: 'पासवर्ड',
      login: 'लॉगिन',
      signup: 'यहाँ साइन अप करें',
      noAccount: 'खाता नहीं है? ',
      error: 'लॉगिन विफल। अपनी साख जांचें।',
      success: 'लॉगिन सफल!',
    },
  }[language as keyof typeof t];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-6 shadow-lg">
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

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {error && <div className="p-3 bg-error/10 text-error rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : t.login}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            {t.noAccount}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              {t.signup}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
