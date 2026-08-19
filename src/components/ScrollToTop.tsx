import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // If there's an anchor hash (e.g. #calculator), scroll to that element if it exists
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    // Default: Reset scroll to top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 50);
  }, [pathname, search, hash]);

  return null;
}
