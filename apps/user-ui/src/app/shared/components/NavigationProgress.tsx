"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const NavigationProgress = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const previousPathname = useRef<string>(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show loader immediately on link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (link && link.href) {
        try {
          const url = new URL(link.href);
          const currentUrl = new URL(window.location.href);

          // Only intercept internal navigation
          if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
            setIsVisible(true);
            setIsLoading(true);

            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            // Hide loader after navigation completes or timeout
            clickTimeoutRef.current = setTimeout(() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(() => {
                setIsLoading(false);
                setTimeout(() => {
                  setIsVisible(false);
                }, 300);
              }, 200);
            }, 100);
          }
        } catch (error) {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // Also handle pathname changes (for programmatic navigation)
  useEffect(() => {
    // Only show loader if pathname changed (not on initial mount)
    if (previousPathname.current && previousPathname.current !== pathname) {
      // Clear any click-based timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      if (!isVisible) {
        setIsVisible(true);
        setIsLoading(true);
      }

      // Hide loader after navigation completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        // Allow fade out animation before removing from DOM
        setTimeout(() => {
          setIsVisible(false);
        }, 300);
      }, 300);
    }

    // Update previous pathname
    previousPathname.current = pathname;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] bg-white transition-opacity duration-300 flex items-center justify-center ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        {/* Loading Spinner - Amber theme matching brand */}
        <div className="relative w-12 h-12 mb-3">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        {/* Loading text */}
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default NavigationProgress;

