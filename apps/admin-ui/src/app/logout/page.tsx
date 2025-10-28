"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";

const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await axiosInstance.get("/api/logout-user");
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        router.replace("/");
      }
    };
    doLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-800">Logging you out...</h2>
        <p className="text-sm text-gray-600 mt-2">Please wait a moment</p>
      </div>
    </div>
  );
};

export default LogoutPage;


