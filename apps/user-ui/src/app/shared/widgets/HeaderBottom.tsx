"use client";
import React, { useState } from "react";
import { TextAlignStart, ChevronDown } from "lucide-react";
import { navItems } from "apps/user-ui/src/configs/constants";
import Link from "next/link";

const HeaderBottom = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Categories specific to local goods and antiques
  const categories = [
    "Handicrafts",
    "Vintage Furniture",
    "Artifacts",
    "Traditional Textiles",
    "Handmade Jewelry",
    "Pottery and Ceramics",
    "Folk Paintings",
    "Collectibles",
    "Woodcrafts",
    "Metal Works",
  ];

  const buildCategoryHref = (name: string) => {
    const params = new URLSearchParams();
    params.set("priceRange", "0,1199");
    params.set("categories", encodeURIComponent(name));
    params.set("page", "1");
    return `/products?${params.toString()}`;
  };

  return (
    <nav className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* Categories Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCategories(!showCategories);
                setShowMobileMenu(false);
              }}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <TextAlignStart className="h-4 w-4" />
              <span>Categories</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showCategories && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {categories.map((name, index) => (
                  <Link
                    key={index}
                    href={buildCategoryHref(name)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setShowCategories(false)}
                  >
                    {name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item: NavItemsTypes, index: number) => (
              <Link
                key={index}
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowCategories(false);
              }}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <TextAlignStart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item: NavItemsTypes, index: number) => (
              <Link
                key={index}
                href={item.href}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setShowMobileMenu(false)}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default HeaderBottom;
