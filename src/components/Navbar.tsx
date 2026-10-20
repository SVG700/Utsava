'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Calendar,
  Plus,
  Sun,
  Moon,
  KeyRound,
  Check,
  Compass,
  HelpCircle,
  Menu,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('utsava_theme');
    const shouldBeDark = saved === 'dark' || (!saved && isSystemDark);

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const timer = setTimeout(() => {
      setIsDark(shouldBeDark);
      const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('utsava_gemini_key') : null;
      if (savedKey) setApiKeyInput(savedKey);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('utsava_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('utsava_theme', 'dark');
      setIsDark(true);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      sessionStorage.setItem('utsava_gemini_key', cleanKey);
      setKeySaved(true);
      setTimeout(() => {
        setKeySaved(false);
        setIsKeyModalOpen(false);
      }, 1000);
    } else {
      sessionStorage.removeItem('utsava_gemini_key');
      setIsKeyModalOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e8e2d7] dark:border-[#26332b] bg-[#faf8f5]/90 dark:bg-[#111614]/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[#134e3a] dark:focus-visible:ring-[#2dd4bf] rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-[#134e3a] dark:bg-[#2dd4bf] flex items-center justify-center text-white dark:text-[#042f2e] shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#1c2420] dark:text-[#f3f5f4] flex items-center gap-2">
              Utsava
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#e8f3ee] text-[#134e3a] dark:bg-[#152a22] dark:text-[#34d399] border border-[#cbe4d7] dark:border-[#1d4235]">
                AI Planner
              </span>
            </span>
            <span className="text-[10px] text-[#606d66] dark:text-[#94a19b] -mt-1 font-medium hidden sm:block">
              Celebration & Event Assistant
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
          <Link
            href="/"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-[#f0ece3] text-[#1c2420] dark:bg-[#222d27] dark:text-[#f3f5f4]'
                : 'text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3]/60 dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27]/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Events</span>
          </Link>
          <Link
            href="/#categories"
            className="px-3 py-1.5 text-xs font-medium text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3]/60 dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27]/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Categories</span>
          </Link>
          <Link
            href="/#how-it-works"
            className="px-3 py-1.5 text-xs font-medium text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3]/60 dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27]/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* API Key Modal Button */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            title="Configure Gemini API Key"
            className="p-2 rounded-xl text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27] transition-colors relative cursor-pointer"
            aria-label="Configure Gemini API Key"
          >
            <KeyRound className="w-4 h-4" />
            {apiKeyInput ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#faf8f5] dark:ring-[#111614]" />
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#faf8f5] dark:ring-[#111614]" />
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27] transition-colors cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#4a5851]" />}
          </button>

          {/* Primary CTA */}
          <Link href="/new">
            <Button
              variant="primary"
              size="sm"
              className="hidden sm:inline-flex gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Plan a Celebration</span>
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden rounded-xl text-[#606d66] hover:text-[#1c2420] hover:bg-[#f0ece3] dark:text-[#94a19b] dark:hover:text-[#f3f5f4] dark:hover:bg-[#222d27] transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#e8e2d7] dark:border-[#26332b] bg-[#faf8f5] dark:bg-[#111614] px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#1c2420] dark:text-[#f3f5f4] rounded-lg hover:bg-[#f0ece3] dark:hover:bg-[#222d27]"
          >
            <Calendar className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
            <span>My Events</span>
          </Link>
          <Link
            href="/#categories"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#1c2420] dark:text-[#f3f5f4] rounded-lg hover:bg-[#f0ece3] dark:hover:bg-[#222d27]"
          >
            <Compass className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
            <span>Event Categories</span>
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-[#1c2420] dark:text-[#f3f5f4] rounded-lg hover:bg-[#f0ece3] dark:hover:bg-[#222d27]"
          >
            <HelpCircle className="w-4 h-4 text-[#134e3a] dark:text-[#2dd4bf]" />
            <span>How It Works</span>
          </Link>
          <div className="pt-2">
            <Link href="/new" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full gap-2 justify-center">
                <Plus className="w-4 h-4" />
                <span>Plan a Celebration</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="Google Gemini API Key (Session Only)"
        description="Session-Only Key: For local testing without a server .env.local file, you can enter an API key for this browser session. It is stored only in sessionStorage (never written to permanent disk or localStorage), transmitted only over HTTPS headers to your backend, and automatically deleted when you close this browser tab."
      >
        <form onSubmit={handleSaveKey} className="space-y-4">
          <Input
            id="gemini-api-key"
            label="Gemini API Key"
            type="password"
            placeholder="AIzaSy... or AQ.Ab8..."
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            helperText="Default key in server .env.local will be used if left blank."
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsKeyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="gap-1.5"
            >
              {keySaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
