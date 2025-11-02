"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

let isLoading = false;
const listeners = new Set<() => void>();

export const setNavigationLoading = (loading: boolean) => {
  isLoading = loading;
  listeners.forEach((listener) => listener());
};

export const useNavigationLoader = () => {
  const [, forceUpdate] = useState({});
  const router = useRouter();

  useEffect(() => {
    const listener = () => {
      forceUpdate({});
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Intercept router methods
  const push = (href: string) => {
    setNavigationLoading(true);
    router.push(href);
    // Hide after navigation completes
    setTimeout(() => setNavigationLoading(false), 500);
  };

  const replace = (href: string) => {
    setNavigationLoading(true);
    router.replace(href);
    setTimeout(() => setNavigationLoading(false), 500);
  };

  return {
    isLoading,
    router: {
      ...router,
      push,
      replace,
    },
  };
};

