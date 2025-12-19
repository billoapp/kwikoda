'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone } from 'lucide-react';

export default function PaymentPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');

  useEffect(() => {
    const ordersData = sessionStorage.getItem('orders');
    if (ordersData) {
      setOrders(JSON.parse(ordersData));
    }

    const paymentsData = sessionStorage.getItem('payments');
    if (paymentsData) {
      setPayments(JSON.parse(paymentsData));
    }
  }, []);

  const tabTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const paidTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = tabTotal - paidTotal;

  useEffect(() => {
    setPaymentAmount(balance.toString());
  }, [balance]);

  const processPayment = () => {
    if (!phoneNumber || !paymentAmount) {
      alert('Please fill in all fields');
      return;
    }

    const newPayment = {
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(paymentAmount),
      method: paymentMethod,
      status: 'success',
      createdAt: new Date().toISOString(),
      reference: `MP${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    const updatedPayments = [...payments, newPayment];
    sessionStorage.setItem('payments', JSON.stringify(updatedPayments));
    
    router.push('/tab');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-3">
        <button onClick={() => router.push('/tab')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Make Payment</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Info */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
          <p className="text-3xl font-bold text-orange-600">KSh {balance}</p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
          <div className="space-y-2">
            <button
              onClick={() => setPaymentMethod('mpesa')}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 ${
                paymentMethod === 'mpesa' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Phone size={24} className="text-green-600" />
              <div className="text-left">
                <p className="font-semibold">M-Pesa</p>
                <p className="text-sm text-gray-600">Pay with M-Pesa</p>
              </div>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Amount to Pay</label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-gray-500 font-semibold">KSh</span>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full pl-16 pr-4 py-4 border-2 border-gray-200 rounded-xl font-bold text-lg focus:border-orange-500 focus:outline-none"
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPaymentAmount((balance / 2).toString())}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Half
            </button>
            <button
              onClick={() => setPaymentAmount(balance.toString())}
              className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Full
            </button>
          </div>
        </div>

        {/* Phone Number */}
        {paymentMethod === 'mpesa' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">M-Pesa Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              placeholder="0712345678"
            />
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={processPayment}
          disabled={!phoneNumber || !paymentAmount}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Pay KSh {paymentAmount}
        </button>
      </div>
    </div>
  );
}