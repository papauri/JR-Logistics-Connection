import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-editorial-dark border-t border-editorial-accent z-50 p-4 md:p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-sm text-zinc-300 font-sans leading-relaxed">
          <strong className="text-white">Cookie Policy:</strong> We use cookies to ensure you get the best experience on our website, process analytics, and securely manage your sessions. By continuing to use our site, you accept our use of cookies.
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button 
            onClick={handleDecline} 
            className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept} 
            className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-editorial-accent text-editorial-dark hover:bg-white transition-colors border border-transparent"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
