"use client";

import Link from "next/link";
import React, { useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import ProfileIcon from "apps/user-ui/src/assets/profile-icon";
import HeartIcon from "apps/user-ui/src/assets/heart-icon";
import HeaderBottom from "./HeaderBottom";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import { useAuthStore } from "apps/user-ui/src/store/authStore";
import Image from "next/image";
import useLayout from "apps/user-ui/src/hooks/useLayout";

const Header = () => {
  const { user, isLoading } = useUser();
  const { cart, wishlist, clearAll } = useStore();
  const { isLoggedIn, setLoggedIn } = useAuthStore();
  const { layout } = useLayout();

  // Keep Zustand state in sync with authentication state
  useEffect(() => {
    if (!isLoading) {
      // If user object is missing, mark as logged out and clear local store
      if (!user) {
        setLoggedIn(false);
        clearAll();
      } else {
        setLoggedIn(true);
      }
    }
  }, [user, isLoading, setLoggedIn, clearAll]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={layout?.logo || "https://res.cloudinary.com/dwzjncfin/image/upload/v1759744440/github_banner_2_gzkoq4.png"}
                width={200}
                height={60}
                alt="LocalGoods Logo"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for antiques, handmade goods, vintage items..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-6">
            
            {/* Profile Section */}
            <div className="flex items-center">
              {!isLoading && isLoggedIn && user ? (
                <Link href="/profile" className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <ProfileIcon />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">Hello, {user?.name?.split(" ")[0]}</p>
                    <p className="text-xs text-gray-500">View Profile</p>
                  </div>
                </Link>
              ) : (
                <Link href="/login" className="flex items-center space-x-3 group">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <ProfileIcon />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {isLoading ? "..." : "Sign In"}
                    </p>
                    <p className="text-xs text-gray-500">Account</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Wishlist & Cart (only show if logged in) */}
            {isLoggedIn && user && (
              <div className="flex items-center space-x-4">
                <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <HeartIcon />
                  {wishlist?.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {cart?.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Link>
              </div>
            )}

            {/* Sell Button */}
            <Link
              href="/sell"
              className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 transition-colors"
            >
              Sell Items
            </Link>
          </div>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <HeaderBottom />
    </header>
  );
};

export default Header;
