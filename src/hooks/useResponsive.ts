import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400,
};

export type BreakpointKey = keyof BreakpointConfig;

export function useResponsive() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('lg');
  const [screenWidth, setScreenWidth] = useState<number>(0);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setScreenWidth(width);

      if (width >= defaultBreakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= defaultBreakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= defaultBreakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= defaultBreakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= defaultBreakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else if (width >= defaultBreakpoints.xs) {
        setCurrentBreakpoint('xs');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const isBreakpoint = (breakpoint: BreakpointKey): boolean => {
    return screenWidth >= defaultBreakpoints[breakpoint];
  };

  const isMobile = !isBreakpoint('sm');
  const isTablet = isBreakpoint('sm') && !isBreakpoint('lg');
  const isDesktop = isBreakpoint('lg');

  return {
    currentBreakpoint,
    screenWidth,
    isBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${defaultBreakpoints.sm - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < defaultBreakpoints.sm);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < defaultBreakpoints.sm);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}