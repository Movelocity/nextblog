import { useState, useEffect } from 'react';

const getMobileDetect = (userAgent: string) => {
  const isAndroid = () => Boolean(userAgent.match(/Android/i));
  const isIos = () => Boolean(userAgent.match(/iPhone|iPad|iPod/i));
  const isOpera = () => Boolean(userAgent.match(/Opera Mini/i));
  const isWindows = () => Boolean(userAgent.match(/IEMobile/i));
  const isSSR = () => Boolean(userAgent.match(/SSR/i));

  const isMobile = () => Boolean(isAndroid() || isIos() || isOpera() || isWindows());
  const isDesktop = () => !isMobile() && !isSSR();
  
  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIos,
    isSSR
  };
};

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;
    const mobile = getMobileDetect(userAgent);
    setIsMobile(mobile.isMobile());
  }, []);

  return isMobile;
};

export default useIsMobile; 