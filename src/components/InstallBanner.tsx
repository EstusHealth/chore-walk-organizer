
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const isMobile = useIsMobile();
  
  // Detect if we can install the PWA
  useEffect(() => {
    // Only show on mobile devices
    if (!isMobile) return;
    
    // Check if already installed
    const isInStandaloneMode = 'standalone' in window.navigator && 
      (window.navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;
    
    if (isInStandaloneMode) return;
    
    // Check if we should show the banner based on user preference
    const hasClosedBanner = localStorage.getItem('install-banner-closed') === 'true';
    if (hasClosedBanner) return;
    
    // Wait for browser's install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowBanner(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Set a timeout to show our custom banner if the native one doesn't appear
    const timer = setTimeout(() => {
      if (!installPromptEvent && !hasClosedBanner) {
        setShowBanner(true);
      }
    }, 3000);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [isMobile, installPromptEvent]);
  
  const handleInstall = async () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      
      const choiceResult = await installPromptEvent.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      setInstallPromptEvent(null);
    }
    closeBanner();
  };
  
  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('install-banner-closed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-chore-700 text-white py-3 px-4 flex items-center justify-between z-50 shadow-lg">
      <div className="flex-1 text-sm">
        <p>Add to Home Screen for a better experience</p>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleInstall}
          className="bg-white text-chore-700 text-sm font-medium px-3 py-1.5 rounded"
        >
          Install
        </button>
        <button 
          onClick={closeBanner}
          className="text-white p-1.5 rounded-full hover:bg-chore-600"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
