"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await axiosInstance.get("/api/logout-user");
      } catch (error) {
        // no-op: even if API fails, navigate away
      } finally {
        router.replace("/login");
      }
    };
    doLogout();
  }, [router]);

  return (
    <div className="w-full h-[60vh] flex items-center justify-center text-sm text-gray-600">
      Logging you out...
    </div>
  );
};

export default LogoutPage;



