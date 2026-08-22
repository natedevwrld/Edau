'use client';

import { useState, useEffect } from 'react';
import WelcomeTutorial from '@/components/WelcomeTutorial';

export default function WelcomeTutorialWrapper() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Check if user has been guided before
    const hasBeenGuided = localStorage.getItem('edaufarm-tutorial-guided');
    const completedDate = localStorage.getItem('edaufarm-tutorial-completed-date');

    // Show tutorial for new users who haven't been guided
    if (!hasBeenGuided) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      };
    }

    // Optional: Show tutorial again after 90 days for users who skipped
    if (hasBeenGuided === 'skipped' && completedDate) {
      const completedTime = new Date(completedDate).getTime();
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (now - completedTime > ninetyDays) {
        setShowTutorial(true);
      }
    }
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('edaufarm-tutorial-guided', 'true');
    localStorage.setItem('edaufarm-tutorial-completed-date', new Date().toISOString());
  };

  if (!showTutorial) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };

  return (
    <WelcomeTutorial
      onClose={handleCloseTutorial}
      onInstall={handleInstall}
      canInstall={Boolean(installPrompt)}
    />
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}