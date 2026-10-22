'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
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

function subscribeToTheme(callback: () => void) {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'class') {
        callback();
      }
    }
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot(): boolean {
  return false;
}

export function Navbar() {
  const pathname = usePathname();
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('utsava_gemini_key') || '';
    }
    return '';
  });
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
  }, []);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('utsava_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('utsava_theme', 'dark');
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
    <header className="sticky top-0 z-40 w-full border-b border-sand-200 dark:border-moss-830 bg-sand-50/90 dark:bg-moss-915/90 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-forest-700 dark:focus-visible:ring-mint-285 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-forest-700 dark:bg-mint-285 flex items-center justify-center text-white dark:text-mint-850 shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-moss-875 dark:text-moss-45 flex items-center gap-2">
              Utsava
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 dark:bg-moss-860 dark:text-mint-295 border border-moss-145 dark:border-moss-795">
                AI Planner
              </span>
            </span>
            <span className="text-[10px] text-moss-620 dark:text-moss-415 -mt-1 font-medium hidden sm:block">
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
                ? 'bg-linen-85 text-moss-875 dark:bg-moss-845 dark:text-moss-45'
                : 'text-moss-620 hover:text-moss-875 hover:bg-linen-85/60 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Events</span>
          </Link>
          <Link
            href="/#categories"
            className="px-3 py-1.5 text-xs font-medium text-moss-620 hover:text-moss-875 hover:bg-linen-85/60 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845/60 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Categories</span>
          </Link>
          <Link
            href="/#how-it-works"
            className="px-3 py-1.5 text-xs font-medium text-moss-620 hover:text-moss-875 hover:bg-linen-85/60 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845/60 rounded-lg transition-colors flex items-center gap-1.5"
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
            className="p-2 rounded-xl text-moss-620 hover:text-moss-875 hover:bg-linen-85 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845 transition-colors relative cursor-pointer"
            aria-label="Configure Gemini API Key"
          >
            <KeyRound className="w-4 h-4" />
            {apiKeyInput ? (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sand-50 dark:ring-moss-915" />
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-sand-50 dark:ring-moss-915" />
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-moss-620 hover:text-moss-875 hover:bg-linen-85 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845 transition-colors cursor-pointer"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-moss-700" />
            )}
          </button>

          {/* Primary CTA */}
          <Link href="/new">
            <Button variant="primary" size="sm" className="hidden sm:inline-flex gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Plan a Celebration</span>
            </Button>
          </Link>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden rounded-xl text-moss-620 hover:text-moss-875 hover:bg-linen-85 dark:text-moss-415 dark:hover:text-moss-45 dark:hover:bg-moss-845 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-sand-200 dark:border-moss-830 bg-sand-50 dark:bg-moss-915 px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-moss-875 dark:text-moss-45 rounded-lg hover:bg-linen-85 dark:hover:bg-moss-845"
          >
            <Calendar className="w-4 h-4 text-forest-700 dark:text-mint-285" />
            <span>My Events</span>
          </Link>
          <Link
            href="/#categories"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-moss-875 dark:text-moss-45 rounded-lg hover:bg-linen-85 dark:hover:bg-moss-845"
          >
            <Compass className="w-4 h-4 text-forest-700 dark:text-mint-285" />
            <span>Event Categories</span>
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-moss-875 dark:text-moss-45 rounded-lg hover:bg-linen-85 dark:hover:bg-moss-845"
          >
            <HelpCircle className="w-4 h-4 text-forest-700 dark:text-mint-285" />
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
            <Button type="submit" variant="primary" size="sm" className="gap-1.5">
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
