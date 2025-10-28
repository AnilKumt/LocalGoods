"use client";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Pencil,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  TrainTrack,
  User,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import StatCard from "../../shared/components/cards/stat.card";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import Image from "next/image";
import QuickActionCard from "../../shared/components/cards/quick-action.card";
import ShippingAddressSection from "../../shared/components/shippingAddress/page";
import OrdersTable from "../../shared/components/tables/orders-table";
import useRequiredAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import ChangePassword from "../../shared/components/change-password";
import Link from "next/link";

const page = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  console.log("CAME TO PRofile page");

  const { user, isLoading } = useRequiredAuth();
  const queryTab = searchParams.get("active") || "Profile";
  const [activeTab, setActiveTab] = useState(queryTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await axiosInstance.get(`/order/api/get-user-orders`);
      return res.data.orders;
    },
  });

  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o: any) =>
      o?.deliveryStatus !== "Delivered" && o?.deliveryStatus !== "Cancelled"
  ).length;
  const completedOrders = orders.filter(
    (o: any) => o?.deliveryStatus === "Delivered"
  ).length;

  useEffect(() => {
    if (activeTab !== queryTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("active", activeTab);
      router.replace(`/profile?${newParams.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await axiosInstance.get("/api/logout-user").then((res) => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/login");
    });
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await axiosInstance.post(
        "/api/upload-avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        // Update user data in cache
        queryClient.setQueryData(["user"], (oldUser: any) => ({
          ...oldUser,
          avatar: response.data.avatarUrl,
        }));

        // Invalidate user query to refetch
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Notifications query should be here
  const { data: notifications = [], isLoading: notificationsLoading } =
    useQuery({
      queryKey: ["notifications"],
      queryFn: async () => {
        const res = await axiosInstance.get("admin/api/get-user-notifications");
        return res.data.notifications;
      },
    });

  // Then define markAsRead as a normal async function
  const markAsRead = async (notificationId: string) => {
    await axiosInstance.post("/seller/api/mark-notification-as-read", {
      notificationId,
    });
    // Optionally re-fetch notifications after marking as read
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back,
            <span className="text-amber-600">
              {isLoading ? (
                <Loader2 className="inline animate-spin w-5 h-5" />
              ) : (
                `${user?.name}` || "User"
              )}
            </span>{" "}
            👋
          </h1>
          <p className="text-gray-600">
            Manage your account and explore new features
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Orders" count={totalOrders} Icon={Clock} />
          <StatCard
            title="Processing Orders"
            count={processingOrders}
            Icon={TrainTrack}
          />
          <StatCard
            title="Completed Orders"
            count={completedOrders}
            Icon={CheckCircle}
          />
        </div>
        <div className="mt-10 flex flex-col md:flex-row gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full md:w-1/5">
            <nav className="space-y-2">
              <NavItems
                label="Profile"
                Icon={User}
                active={activeTab === "Profile"}
                onClick={() => setActiveTab("Profile")}
              />
              <NavItems
                label="My orders"
                Icon={ShoppingBag}
                active={activeTab === "My orders"}
                onClick={() => setActiveTab("My orders")}
              />
              <NavItems
                label="Inbox"
                Icon={Inbox}
                active={activeTab === "Inbox"}
                onClick={() => router.push("/inbox")}
              />
              <NavItems
                label="Notifications"
                Icon={Bell}
                active={activeTab === "Notifications"}
                onClick={() => setActiveTab("Notifications")}
              />
              <NavItems
                label="Shipping address"
                Icon={MapPin}
                active={activeTab === "Shipping address"}
                onClick={() => setActiveTab("Shipping address")}
              />
              <NavItems
                label="Change Password"
                Icon={Lock}
                active={activeTab === "Change Password"}
                onClick={() => setActiveTab("Change Password")}
              />
              <NavItems
                label="Logout"
                Icon={LogOut}
                danger
                onClick={() => logOutHandler()}
              />
            </nav>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full md:w-[55%]">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {activeTab}
            </h2>
            {activeTab === "Profile" && !isLoading && user ? (
              <div className="space-y-6 text-sm text-gray-700">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Image
                      src={
                        user?.avatar ||
                        "https://res.cloudinary.com/duqrxy27h/image/upload/v1761314606/user-default_zmngxs.png"
                      }
                      alt="profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      ) : (
                        <Pencil className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={triggerFileUpload}
                      disabled={isUploading}
                      className="flex items-center gap-2 text-amber-600 hover:text-amber-700 text-sm font-medium px-4 py-2 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />{" "}
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Change Photo
                        </>
                      )}
                    </button>
                    <span className="text-xs text-gray-500">
                      Click to update your profile picture
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <p>
                  <span className="font-semibold">Name:</span>
                  {user.name}
                </p>
                <p>
                  <span className="font-semibold">Email:</span>
                  {user.email}
                </p>
                <p>
                  <span className="font-semibold">Joined:</span>{" "}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Earned Points:</span>{" "}
                  {user.points || 0}
                </p>
              </div>
            ) : activeTab === "Shipping address" ? (
              <ShippingAddressSection />
            ) : activeTab === "My orders" ? (
              <OrdersTable />
            ) : activeTab === "Change Password" ? (
              <ChangePassword />
            ) : activeTab === "Notifications" ? (
              <div className="space-y-4 text-sm text-gray-700">
                {!notificationsLoading && notifications.length == 0 && (
                  <p>No Notifications available yet!</p>
                )}

                {!notificationsLoading && notifications?.length > 0 && (
                  <div className="md:w-[80%] my-6 rounded-lg divide-y divide-gray-800 bg-black/40 backdrop-blur-lg shadow-sm">
                    {notifications.map((d: any) => (
                      <Link
                        key={d.id}
                        href={`${d.redirect_link}`}
                        className={`block px-5 py-4 transition ${
                          d.status !== "Unread"
                            ? "hover:bg-gray-800/40"
                            : "bg-gray-800/50 hover:bg-gray-800/70"
                        }`}
                        onClick={() => markAsRead(d.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">
                              {d.title}
                            </span>
                            <span className="text-gray-300 text-sm">
                              {d.message}
                            </span>
                            <span className="text-gray-500 text-xs mt-1">
                              {new Date(d.createdAt).toLocaleString("en-UK", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p></p>
            )}
          </div>

          <div className="w-full md:w-1/4 space-y-4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
              comingSoon={true}
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
              comingSoon={true}
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage your preferences and security."
              comingSoon={true}
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
              comingSoon={true}
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support."
              comingSoon={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const NavItems = ({ label, Icon, active, danger, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
      active
        ? "bg-amber-50 text-amber-600"
        : danger
        ? "text-red-500 hover:bg-red-50"
        : "text-gray-700 hover:bg-gray-50"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

export default page;
