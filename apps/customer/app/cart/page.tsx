// apps/customer/app/cart/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      setCart(JSON.parse(cartData));
    }
  }, []);

  const updateQuantity = (id: number, delta: number) => {
    const newCart = cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? {...item, quantity: newQty} : item;
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const confirmOrder = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    
    try {
      const tabData = sessionStorage.getItem('currentTab');
      if (!tabData) {
        alert('No tab found. Please start over.');
        router.push('/');
        return;
      }

      const currentTab = JSON.parse(tabData);
      console.log('📋 Submitting order for tab:', currentTab.id);

      const orderItems = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));

      // ⭐ KEY CHANGE: Mark as customer-initiated
      const { data: order, error } = await supabase
        .from('tab_orders')
        .insert({
          tab_id: currentTab.id,
          items: orderItems,
          total: cartTotal,
          status: 'pending',
          initiated_by: 'customer'  // 👈 Customer-initiated order
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Order error:', error);
        throw error;
      }

      console.log('✅ Customer order created:', order);

      sessionStorage.removeItem('cart');
      setCart([]);
      
      alert('Order confirmed! 🎉');
      router.push('/tab');

    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <button onClick={() => router.push('/menu')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Review Order</h1>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-3">
        {cart.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{item.image}</div>
                <div>
                  <h3 className="font-semibold text-gray-800">{item.name}</h3>
                  <p className="text-sm text-gray-600">KSh {item.price} each</p>
                </div>
              </div>
              <p className="font-bold text-orange-600">KSh {item.price * item.quantity}</p>
            </div>
            
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Total</span>
          <span className="text-2xl font-bold text-orange-600">KSh {cartTotal}</span>
        </div>
        <button
          onClick={confirmOrder}
          disabled={cart.length === 0 || submitting}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle size={20} />
          {submitting ? 'Submitting...' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
}