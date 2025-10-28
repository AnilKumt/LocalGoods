"use client";

import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Loader2, CheckCircle2, Package, Truck } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const page = () => {
  const params = useParams();
  const orderId = (params as any)?.orderId as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`
        );
        setOrder(res.data.order);
      } catch (error) {
        console.error("Failed to fetch order details ", error);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  const steps = useMemo(
    () => [
      { key: "Ordered", icon: Package },
      { key: "Packed", icon: Package },
      { key: "Shipped", icon: Truck },
      { key: "Out for Delivery", icon: Truck },
      { key: "Delivered", icon: CheckCircle2 },
    ],
    []
  );

  const currentIndex = useMemo(() => {
    if (!order?.deliveryStatus) return 0;
    const idx = steps.findIndex(
      s => s.key.toLowerCase() === String(order.deliveryStatus).toLowerCase()
    );
    return idx === -1 ? 0 : idx;
  }, [order?.deliveryStatus, steps]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] text-gray-600">
        <Loader2 className="animate-spin w-6 h-6 mb-3" />
        <p className="text-sm">Fetching your order details...</p>
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{String(order.id).slice(-6)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Delivery Status</span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                String(order.deliveryStatus).toLowerCase() === "delivered"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {order.deliveryStatus}
              </span>
            </div>
            <div className="flex items-center">
              {steps.map((s, idx) => {
                const Icon = s.icon;
                const reached = idx <= currentIndex;
                const isLast = idx === steps.length - 1;
                return (
                  <div key={s.key} className="flex items-center flex-1">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs ${
                      reached
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isLast && (
                      <div className={`h-0.5 flex-1 mx-2 ${
                        idx < currentIndex ? "bg-amber-500" : "bg-gray-200"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                <span className="text-sm text-gray-500">{order.items?.length} item(s)</span>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item: any) => (
                  <div key={item.productId} className="p-6 flex items-center gap-4">
                    <img
                      src={item.product?.images?.[0]?.url?.[0] || item.product?.images?.[0]?.url}
                      alt={item.product?.title || "Product"}
                      className="w-16 h-16 object-cover rounded-md border border-gray-200"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.product?.title || "Unamed Product"}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          {Object.entries(item.selectedOptions).map(([key, value]: [string, any]) =>
                            value ? (
                              <span key={key} className="mr-3">
                                <span className="font-medium capitalize">{key}:</span> {String(value)}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">₹{Number(item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    String(order.status).toLowerCase() === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-medium text-gray-900">₹{Number(order.total).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600 font-medium">
                      -₹{Number(order.discountAmount).toFixed(2)} (
                      {order.couponCode?.discountType === "percentage"
                        ? `${order.couponCode.discountValue}%`
                        : `₹${order.couponCode?.discountValue}`
                      } off)
                    </span>
                  </div>
                )}
                {order.couponCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Coupon</span>
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs font-medium">
                      {order.couponCode.public_name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span className="text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                  <p>
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.zip}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
