// components/CookieConsent/index.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const COOKIE_CONSENT_KEY = 'nextjs-starter-cookie-consent';
const COOKIE_PREFERENCES_KEY = 'nextjs-starter-cookie-preferences';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }

    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    
    saveConsent(allAccepted);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    saveConsent(preferences);
    setShowSettings(false);
    setShowBanner(false);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    
    // Apply cookie preferences here
    applyCookiePreferences(prefs);
  };

  const applyCookiePreferences = (prefs: CookiePreferences) => {
    // Implement cookie management based on preferences
    // For example: Load/unload analytics scripts
    if (prefs.analytics) {
      // Load analytics scripts
      console.log('Analytics enabled');
    } else {
      // Remove analytics scripts
      console.log('Analytics disabled');
    }
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return; // Necessary cookies can't be disabled
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {/* Cookie Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border-primary shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Content */}
                <div className="flex-1 flex items-start gap-3">
                  <Cookie className="w-5 h-5 text-interactive-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-content-primary mb-1">
                      เราใช้คุกกี้บนเว็บไซต์เพื่อเพิ่มประสบการณ์การใช้งานที่ดีขึ้น 
                      การยอมรับหมายถึงคุณยินยอมให้เราใช้คุกกี้ดังกล่าว{' '}
                      <Link 
                        href="/privacy-policy" 
                        className="text-interactive-primary hover:underline font-medium"
                        target="_blank"
                      >
                        นโยบายความเป็นส่วนตัว
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSettings(true)}
                    className="flex-1 md:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    ตั้งค่า
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex-1 md:flex-none gradient-brand-semantic hover:opacity-90"
                  >
                    ยอมรับทั้งหมด
                  </Button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowBanner(false)}
                  className="absolute top-2 right-2 md:relative md:top-0 md:right-0 p-1 rounded-full hover:bg-surface-interactive transition-colors"
                  aria-label="ปิด"
                >
                  <X className="w-5 h-5 text-content-secondary" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Cookie className="w-5 h-5 text-interactive-primary" />
              การตั้งค่าความเป็นส่วนตัว
            </DialogTitle>
            <DialogDescription>
              เลือกประเภทของคุกกี้ที่คุณยินยอมให้เราใช้งาน
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-semibold">
                    คุกกี้ที่จำเป็น
                  </Label>
                  <p className="text-sm text-content-secondary mt-1">
                    คุกกี้เหล่านี้จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ 
                    และไม่สามารถปิดการใช้งานได้
                  </p>
                </div>
                <Switch checked={true} disabled />
              </div>
            </div>

            <Separator />

            {/* Functional Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">
                    คุกกี้เพื่อการใช้งาน
                  </Label>
                  <p className="text-sm text-content-secondary mt-1">
                    ช่วยเพิ่มฟังก์ชันการทำงานและปรับแต่งประสบการณ์การใช้งาน
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={() => togglePreference('functional')}
                />
              </div>
            </div>

            <Separator />

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">
                    คุกกี้เพื่อการวิเคราะห์
                  </Label>
                  <p className="text-sm text-content-secondary mt-1">
                    ช่วยให้เราเข้าใจว่าผู้เข้าชมใช้งานเว็บไซต์อย่างไร เพื่อปรับปรุงประสิทธิภาพ
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={() => togglePreference('analytics')}
                />
              </div>
            </div>

            <Separator />

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">
                    คุกกี้เพื่อการตลาด
                  </Label>
                  <p className="text-sm text-content-secondary mt-1">
                    ใช้เพื่อแสดงเนื้อหาและโฆษณาที่เกี่ยวข้องกับความสนใจของคุณ
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={() => togglePreference('marketing')}
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end mt-6 pt-6 border-t border-border-primary">
            <Button
              onClick={handleAcceptSelected}
              className="gradient-brand-semantic hover:opacity-90"
            >
              ยอมรับการตั้งค่า
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}