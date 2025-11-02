"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

const NavigationLoader = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Only show loader if pathname actually changed
    if (prevPathname.current !== pathname) {
      setShouldShow(true);
      setIsLoading(true);
      prevPathname.current = pathname;

      // Hide loader after navigation completes
      const timer = setTimeout(() => {
        setIsLoading(false);
        // Delay hiding to allow fade out animation
        setTimeout(() => {
          setShouldShow(false);
        }, 300);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed inset-0 z-[9998] bg-white transition-opacity duration-300 flex items-center justify-center ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        {/* Loading Spinner - Amber theme matching PreLoader */}
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

export default NavigationLoader;

