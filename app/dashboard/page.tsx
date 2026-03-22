'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const { data: sessions, isLoading } = useSWR(
    user ? `/api/chat/sessions/${user.id}` : null,
    fetcher
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-primary">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 bg-gradient-to-br from-primary to-secondary text-white">
            <h3 className="text-lg font-semibold mb-2">Chat Sessions</h3>
            <p className="text-4xl font-bold">{sessions?.length || 0}</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 bg-gradient-to-br from-secondary to-accent text-white">
            <h3 className="text-lg font-semibold mb-2">Questions Asked</h3>
            <p className="text-4xl font-bold">
              {sessions?.reduce((sum: number, s: any) => sum + s.messages.length, 0) || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 bg-gradient-to-br from-success to-green-600 text-white">
            <h3 className="text-lg font-semibold mb-2">Joined</h3>
            <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Recent Chat Sessions</h2>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.slice(0, 5).map((session: any) => (
                <div
                  key={session.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/chat/${session.id}`)}
                >
                  <h3 className="font-semibold text-primary">{session.title}</h3>
                  <p className="text-sm text-gray-600">{session.messages.length} messages</p>
                  <p className="text-xs text-gray-500">
                    {new Date(session.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No chat sessions yet. Start a new conversation!</p>
          )}
        </div>
      </main>
    </div>
  );
}
