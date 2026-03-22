'use client';

import { useEffect } from 'react';
import { useUIStore, DeviceType } from '@/store/useUIStore';

export function DeviceListener() {
  const setDevice = useUIStore((state) => state.setDevice);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let device: DeviceType = 'desktop';
      
      if (width < 640) {
        device = 'mobile';
      } else if (width < 1024) {
        device = 'tablet';
      }
      
      setDevice(device);
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setDevice]);

  return null; // This component doesn't render anything
}
