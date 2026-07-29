// app/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Code2, Sparkles, Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const techStack = [
    'Next.js 15',
    'TypeScript',
    'Better Auth',
    'Prisma',
    'PostgreSQL',
    'Tailwind v4',
    'Shadcn/UI',
    'Vercel Ready',
    'Role-Based Access Control',
  ];

  // ✅ Handle Showcase - store return URL for authenticated users
  const handleShowcase = () => {
    if (!user) {
      // Store current page as return URL before redirect
      sessionStorage.setItem('auth-return-url', '/');
      router.push('/login');
    } else {
      router.push('/showcase');
    }
  };

  // ✅ Handle Clear Cache
  const handleClearCache = async () => {
    try {
      // 1. Clear localStorage
      localStorage.clear();
      
      // 2. Clear sessionStorage
      sessionStorage.clear();
      
      // 3. Clear all cookies
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        // Delete cookie for all possible paths and domains
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      }
      
      // 4. Clear Service Worker cache if exists
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 5. Clear Cache API
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      toast.success('Cache ถูกล้างสำเร็จ', {
        description: 'กำลังรีโหลดหน้าเว็บ...'
      });
      
      // 6. Hard reload after 1 second
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('Clear cache error:', error);
      toast.error('ล้าง cache ไม่สำเร็จ', {
        description: 'กรุณาลองใหม่อีกครั้ง'
      });
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-brand-primary/10 via-brand-secondary/10 to-brand-tertiary/10 pointer-events-none dark:hidden" />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-secondary rounded-full border border-border-primary">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium text-content-primary">
                Taro First Branch
              </span>
            </div>

            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-content-primary">
                Next.js Healthcare
                <span className="block gradient-text-semantic">Starter Template</span>
              </h1>
              <p className="text-xl text-content-secondary max-w-3xl mx-auto">
                Production-ready starter template for building healthcare applications.
                Authentication, database, theme system, and more — all configured and ready to go.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="gradient-brand-semantic hover:opacity-90 w-full sm:w-auto" 
                onClick={handleShowcase}
              >
                <Code2 className="w-4 h-4 mr-2" />
                Showcase
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto border-border-primary text-content-primary hover:bg-surface-interactive"
                onClick={handleClearCache}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
              </Button>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {techStack.map((tech) => (
                <Badge 
                  key={tech} 
                  variant="secondary" 
                  className="px-3 py-1 bg-surface-secondary text-content-primary border-border-primary"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}