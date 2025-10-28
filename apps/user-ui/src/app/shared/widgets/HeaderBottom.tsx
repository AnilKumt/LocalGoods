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
    { name: "Handicrafts", href: "/products?priceRange=0,1199&categories=Handicrafts&page=1" },
    { name: "Vintage Furniture", href: "/products?priceRange=0,1199&categories=Vintage+Furniture&page=1" },
    { name: "Artifacts", href: "/products?priceRange=0,1199&categories=Artifacts&page=1" },
    { name: "Traditional Textiles", href: "/products?priceRange=0,1199&categories=Traditional+Textiles&page=1" },
    { name: "Handmade Jewelry", href: "/products?priceRange=0,1199&categories=Handmade+Jewelry&page=1" },
    { name: "Pottery and Ceramics", href: "/products?priceRange=0,1199&categories=Pottery+&+Ceramics&page=1" },
    { name: "Folk Paintings", href: "/products?priceRange=0,1199&categories=Folk+Paintings&page=1" },
    { name: "Collectibles", href: "/products?priceRange=0,1199&categories=Collectibles&page=1" },
    { name: "Woodcrafts", href: "/products?priceRange=0,1199&categories=Woodcrafts&page=1" },
    { name: "Metal Wroks", href: "/products?priceRange=0,1199&categories=Metal+Works&page=1" },
  ];

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
                {categories.map((category, index) => (
                  <Link
                    key={index}
                    href={category.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    onClick={() => setShowCategories(false)}
                  >
                    {category.name}
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
