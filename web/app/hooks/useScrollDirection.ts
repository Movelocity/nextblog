import { useState, useEffect } from 'react';

type ScrollDirection = 'up' | 'down';

export const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const threshold = 100;
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (direction !== scrollDirection) {
        setScrollDirection(direction);
        setVisible(direction === 'up' || scrollY < 50);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollDirection]);

  return { scrollDirection, visible };
}; 