'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';

interface NavigationProps {
  user: any;
}

export default function Navigation({ user }: NavigationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const navLinks = [
    { href: '/chat', label: 'Chat' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/legal-aid', label: 'Legal Search' },
    { href: '/documents', label: 'Documents' },
  ];

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="container-main py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          NyayaMithran
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <span className="border-l border-white/30 pl-8">Hello, {user.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-primary-dark">
          <div className="container-main py-4 space-y-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block hover:text-accent transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-white/30 pt-4">
              <p className="mb-4">Hello, {user.name}</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors w-full justify-center"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
