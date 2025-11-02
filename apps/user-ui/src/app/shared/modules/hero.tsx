"use client"
import { ArrowRight, MapPin, Star, Users } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import { useRouter } from "next/navigation"
import useLayout from 'apps/user-ui/src/hooks/useLayout'

const Hero = () => {
  const router = useRouter();
  const { layout } = useLayout();

  return (
    <div className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 overflow-hidden -mt-16">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(245, 158, 11, 0.3) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>Trusted by customers</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Discover Authentic
                <span className="block text-amber-600">Local Treasures</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Connect with local artisans and discover unique antiques, handmade goods, and vintage finds from your community.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Local Sellers</p>
                  <p className="text-sm text-gray-600">Support your community</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Authentic Items</p>
                  <p className="text-sm text-gray-600">Verified quality</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Community</p>
                  <p className="text-sm text-gray-600">Connect & discover</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/products")}
                className="inline-flex items-center justify-center px-8 py-4 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Explore Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push("/shops")}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
              >
                Browse Shops
              </button>
            </div>

            {/* Stats */}
            {/* <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600">Local Sellers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">10K+</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">50K+</p>
                <p className="text-sm text-gray-600">Happy Customers</p>
              </div>
            </div> */}
          </div>

          {/* Right Content - Enhanced Image Gallery */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-3">
              {/* Main Image - Indian Antiques */}
              <div className="col-span-2 row-span-2 relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={layout?.banner || "https://res.cloudinary.com/duqrxy27h/image/upload/v1762094692/4_zw9pct.png"}
                    alt="Indian antiques and handmade goods"
                    width={600}
                    height={450}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating Card */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600 fill-current" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Authentic Indian</p>
                      <p className="text-xs text-gray-600">Handpicked treasures</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indian Pottery & Ceramics */}
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/duqrxy27h/image/upload/v1762094692/2_hdvthx.png"
                  alt="Indian pottery and ceramics"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Traditional Indian Jewelry */}
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/duqrxy27h/image/upload/v1762094692/3_xqtcc9.png"
                  alt="Traditional Indian jewelry"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Vintage Indian Textiles */}
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/duqrxy27h/image/upload/v1762094692/1_dja2mu.png"
                  alt="Vintage Indian textiles"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Indian Handicrafts */}
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/duqrxy27h/image/upload/v1762094692/5_m84iew.png"
                  alt="Indian handicrafts"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Indian Art & Paintings */}
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="https://res.cloudinary.com/duqrxy27h/image/upload/v1762095163/6_sbonjl.png"
                  alt="Indian art and paintings"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Additional floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Local Sellers</p>
                  <p className="text-xs text-gray-600">From your city</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero