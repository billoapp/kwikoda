// apps/customer/app/menu/page.tsx - UPDATED WITH APPROVAL SYSTEM
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Search, X, CreditCard, Clock, CheckCircle, Minus, User, UserCog, ThumbsUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MOCK_MENU = [
  { id: 1, name: "Tusker", category: "Beer", price: 300, image: "🍺" },
  { id: 2, name: "White Cap", category: "Beer", price: 280, image: "🍺" },
  { id: 3, name: "Guinness", category: "Beer", price: 350, image: "🍺" },
  { id: 4, name: "Tusker Malt", category: "Beer", price: 320, image: "🍺" },
  { id: 5, name: "Vodka Redbull", category: "Spirits", price: 600, image: "🍹" },
  { id: 6, name: "Whiskey Coke", category: "Spirits", price: 700, image: "🥃" },
  { id: 7, name: "Gin & Tonic", category: "Spirits", price: 650, image: "🍸" },
  { id: 8, name: "Soda", category: "Soft Drinks", price: 100, image: "🥤" },
  { id: 9, name: "Water", category: "Soft Drinks", price: 80, image: "💧" },
];

export default function MenuPage() {
  const router = useRouter();
  const [tab, setTab] = useState<any>(null);
  const [barName, setBarName] = useState('Loading...');
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const ordersRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTabData();
    const interval = setInterval(loadTabData, 5000);
    const cartData = sessionStorage.getItem('cart');
    if (cartData) {
      setCart(JSON.parse(cartData));
    }
    return () => clearInterval(interval);
  }, []);

  const loadTabData = async () => {
    const tabData = sessionStorage.getItem('currentTab');
    if (!tabData) {
      router.push('/');
      return;
    }

    const currentTab = JSON.parse(tabData);
    
    try {
      const { data: fullTab, error: tabError } = await supabase
        .from('tabs')
        .select('*, bar:bars(name, location)')
        .eq('id', currentTab.id)
        .single();

      if (tabError) throw tabError;
      setTab(fullTab);
      setBarName(fullTab.bar?.name || 'Bar');

      const { data: ordersData, error: ordersError } = await supabase
        .from('tab_orders')
        .select('*')
        .eq('tab_id', currentTab.id)
        .order('created_at', { ascending: false });

      if (!ordersError) setOrders(ordersData || []);

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('tab_payments')
        .select('*')
        .eq('tab_id', currentTab.id)
        .order('created_at', { ascending: false });

      if (!paymentsError) setPayments(paymentsData || []);
    } catch (error) {
      console.error('Error loading tab:', error);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setApprovingOrder(orderId);
    try {
      const { error } = await supabase
        .from('tab_orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);
      if (error) throw error;
      await loadTabData();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order.');
    } finally {
      setApprovingOrder(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!window.confirm('Reject this order?')) return;
    setApprovingOrder(orderId);
    try {
      const { error } = await supabase
        .from('tab_orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      if (error) throw error;
      await loadTabData();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order.');
    } finally {
      setApprovingOrder(null);
    }
  };

  const categories = ['All', ...new Set(MOCK_MENU.map(item => item.category))];
  
  let filteredMenu = selectedCategory === 'All' 
    ? MOCK_MENU 
    : MOCK_MENU.filter(item => item.category === selectedCategory);
  
  if (searchQuery.trim()) {
    filteredMenu = filteredMenu.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    const newCart = existing
      ? cart.map(c => c.id === item.id ? {...c, quantity: c.quantity + 1} : c)
      : [...cart, {...item, quantity: 1}];
    setCart(newCart);
    sessionStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateCartQuantity = (id: number, delta: number) => {
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

  const confirmOrder = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const orderItems = cart.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }));
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const { error } = await supabase
        .from('tab_orders')
        .insert({
          tab_id: tab.id,
          items: orderItems,
          total: cartTotal,
          status: 'pending',
          initiated_by: 'customer'
        });
      if (error) throw error;
      sessionStorage.removeItem('cart');
      setCart([]);
      setShowCart(false);
      await loadTabData();
      ordersRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(`Failed to create order: ${error.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const processPayment = async () => {
    if (!phoneNumber || !paymentAmount) {
      alert('Please enter phone and amount');
      return;
    }
    try {
      const { error } = await supabase
        .from('tab_payments')
        .insert({
          tab_id: tab.id,
          amount: parseFloat(paymentAmount),
          method: 'mpesa',
          status: 'success',
          reference: `MP${Date.now()}`
        });
      if (error) throw error;
      alert('Payment successful! 🎉');
      setPaymentAmount('');
      setPhoneNumber('');
      await loadTabData();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const tabTotal = orders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + parseFloat(order.total), 0);
  const paidTotal = payments.filter(payment => payment.status === 'success').reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const balance = tabTotal - paidTotal;
  const pendingStaffOrders = orders.filter(o => o.status === 'pending' && o.initiated_by === 'staff').length;

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (!tab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{barName}</h1>
            <p className="text-sm text-orange-100">Tab #{tab.tab_number}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm">Menu</button>
            <button onClick={() => ordersRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm">Orders</button>
            <button onClick={() => paymentRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm">Pay</button>
          </div>
        </div>
      </div>

      {pendingStaffOrders > 0 && (
        <div className="bg-yellow-400 border-b-2 border-yellow-500 p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <UserCog size={20} className="text-yellow-900" />
            <p className="text-sm font-bold text-yellow-900">
              {pendingStaffOrders} order{pendingStaffOrders > 1 ? 's' : ''} need your approval! Scroll to Orders ↓
            </p>
          </div>
        </div>
      )}

      <div ref={menuRef} className="bg-white p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Menu</h2>
        <div className="relative mb-3">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search drinks..." className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}>{cat}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-20">
          {filteredMenu.map(item => (
            <div key={item.id} className="bg-gray-50 rounded-xl p-3 shadow-sm">
              <div className="text-center mb-2">
                <div className="text-5xl mb-2">{item.image}</div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.name}</h3>
                <p className="text-orange-600 font-bold text-lg">KSh {item.price}</p>
              </div>
              <button onClick={() => addToCart(item)} className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-1">
                <Plus size={18} />
                <span className="text-sm font-medium">Add</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div ref={ordersRef} className="bg-gray-50 p-4 min-h-screen">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Orders</h2>
        <div className="bg-white rounded-xl p-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total Orders</span>
            <span className="font-bold">KSh {tabTotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Paid</span>
            <span className="font-bold text-green-600">KSh {paidTotal.toFixed(0)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-bold">Balance</span>
            <span className="text-xl font-bold text-orange-600">KSh {balance.toFixed(0)}</span>
          </div>
        </div>
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500"><p>No orders yet</p></div>
          ) : (
            orders.map(order => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              const initiatedBy = order.initiated_by || 'customer';
              const isStaffOrder = initiatedBy === 'staff';
              const needsApproval = order.status === 'pending' && isStaffOrder;
              return (
                <div key={order.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${isStaffOrder ? 'border-l-blue-500' : 'border-l-green-500'} ${needsApproval ? 'ring-2 ring-yellow-400' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isStaffOrder ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium text-blue-700 bg-blue-100">
                          <UserCog size={12} />
                          Staff Added
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium text-green-700 bg-green-100">
                          <User size={12} />
                          Your Order
                        </span>
                      )}
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{timeAgo(order.created_at)}</span>
                    </div>
                    {order.status === 'pending' ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${needsApproval ? 'bg-yellow-100 text-yellow-700 flex items-center gap-1' : 'bg-yellow-100 text-yellow-700'}`}>
                        {needsApproval ? (<><Clock size={12} />Needs Approval</>) : 'Pending'}
                      </span>
                    ) : order.status === 'confirmed' ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle size={12} />
                        Confirmed
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">Cancelled</span>
                    )}
                  </div>
                  <div className="space-y-1 mb-2">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">KSh {item.total}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 flex justify-between mb-3">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-orange-600">KSh {parseFloat(order.total).toFixed(0)}</span>
                  </div>
                  {needsApproval && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <UserCog size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900 mb-1">Staff Member Added This Order</p>
                          <p className="text-xs text-yellow-800">Please review and approve or reject</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveOrder(order.id)} disabled={approvingOrder === order.id} className="flex-1 bg-green-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
                          <ThumbsUp size={16} />
                          {approvingOrder === order.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button onClick={() => handleRejectOrder(order.id)} disabled={approvingOrder === order.id} className="flex-1 bg-red-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
                          <X size={16} />
                          {approvingOrder === order.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                  {order.status === 'pending' && !isStaffOrder && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs text-yellow-700 flex items-center gap-1">
                        <Clock size={12} />
                        Waiting for staff confirmation...
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {balance > 0 && (
        <div ref={paymentRef} className="bg-white p-4 min-h-screen">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Make Payment</h2>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
            <p className="text-3xl font-bold text-orange-600">KSh {balance.toFixed(0)}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Pay</label>
              <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" placeholder="0" />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setPaymentAmount((balance / 2).toFixed(0))} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium">Half</button>
                <button onClick={() => setPaymentAmount(balance.toFixed(0))} className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium">Full</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Number</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none" placeholder="0712345678" />
            </div>
            <button onClick={processPayment} disabled={!phoneNumber || !paymentAmount} className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 flex items-center justify-center gap-2">
              <CreditCard size={20} />
              Pay KSh {paymentAmount || '0'}
            </button>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Your Cart</h3>
              <button onClick={() => setShowCart(false)}><X size={24} /></button>
            </div>
            <div className="space-y-3 mb-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.image}</span>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">KSh {item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateCartQuantity(item.id, -1)} className="bg-gray-100 p-1 rounded"><Minus size={16} /></button>
                    <span className="font-bold w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, 1)} className="bg-orange-500 text-white p-1 rounded"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-bold">Total</span>
                <span className="text-xl font-bold text-orange-600">KSh {cartTotal}</span>
              </div>
              <button onClick={confirmOrder} disabled={submittingOrder} className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300">
                {submittingOrder ? 'Submitting...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cartCount > 0 && (
        <button onClick={() => setShowCart(true)} className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600 flex items-center gap-2 z-20">
          <ShoppingCart size={24} />
          <span className="font-bold">{cartCount}</span>
          <span className="ml-2 font-bold">KSh {cartTotal}</span>
        </button>
      )}

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}