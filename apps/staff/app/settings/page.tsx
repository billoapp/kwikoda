// apps/staff/app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Store, Bell, CreditCard, Users, Download, QrCode, Save, X, Webhook, Upload, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [barInfo, setBarInfo] = useState({
    name: '',
    location: '',
    city: '',
    phone: '',
    email: ''
  });
  const [originalBarInfo, setOriginalBarInfo] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [notifications, setNotifications] = useState({
    newOrders: true,
    pendingApprovals: true,
    payments: true
  });
  
  const [showProModal, setShowProModal] = useState(false);
  const [proFeature, setProFeature] = useState({ title: '', description: '' });

  useEffect(() => {
    loadBarInfo();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(barInfo) !== JSON.stringify(originalBarInfo);
    setHasChanges(changed);
  }, [barInfo, originalBarInfo]);

  const loadBarInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const info = {
          name: data.name || '',
          location: data.location || '',
          city: data.location?.split(',')[1]?.trim() || '',
          phone: data.phone || '',
          email: data.email || ''
        };
        setBarInfo(info);
        setOriginalBarInfo(info);
      }
    } catch (error) {
      console.error('Error loading bar info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBarInfo = async () => {
    setSaving(true);
    try {
      const { data: bars } = await supabase.from('bars').select('id').limit(1);
      
      if (bars && bars.length > 0) {
        const { error } = await supabase
          .from('bars')
          .update({
            name: barInfo.name,
            location: `${barInfo.location}, ${barInfo.city}`,
            phone: barInfo.phone,
            email: barInfo.email
          })
          .eq('id', bars[0].id);

        if (error) throw error;

        setOriginalBarInfo(barInfo);
        setHasChanges(false);
        alert('✅ Restaurant information updated successfully!');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProFeature = (feature: string) => {
    if (feature === 'Webhooks') {
      setProFeature({
        title: 'POS Integration via Webhooks',
        description: 'Connect Kwikoda with your existing POS system. Orders sync automatically to your kitchen printer, inventory, and accounting.'
      });
    } else if (feature === 'Payment Methods') {
      setProFeature({
        title: 'Advanced Payment Options',
        description: 'Accept payments via M-Pesa, credit cards, and custom payment providers. Automatic reconciliation with your accounting system.'
      });
    } else if (feature === 'Staff Accounts') {
      setProFeature({
        title: 'Multi-Staff Management',
        description: 'Create separate accounts for your team with custom permissions. Track who added orders, closed tabs, and more.'
      });
    }
    setShowProModal(true);
  };

  const handleDownloadQR = () => {
    // Create download link for QR code pointing to your actual domain
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=https://mteja.vercel.app&bgcolor=ffffff&color=f97316&qzone=2&format=png`;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `${barInfo.name || 'kwikoda'}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
        <button 
          onClick={() => router.push('/')}
          className="mb-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 inline-block"
        >
          <ArrowRight size={24} className="transform rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-orange-100 text-sm">Manage your restaurant</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Restaurant Information */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Store size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Restaurant Information</h3>
              <p className="text-sm text-gray-500">Basic details about your bar</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={barInfo.name}
                onChange={(e) => setBarInfo({...barInfo, name: e.target.value})}
                placeholder="The Spot Lounge"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location/Address</label>
              <input
                type="text"
                value={barInfo.location}
                onChange={(e) => setBarInfo({...barInfo, location: e.target.value})}
                placeholder="Westlands"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={barInfo.city}
                onChange={(e) => setBarInfo({...barInfo, city: e.target.value})}
                placeholder="Nairobi"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={barInfo.phone}
                onChange={(e) => setBarInfo({...barInfo, phone: e.target.value})}
                placeholder="+254712345678"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={barInfo.email}
                onChange={(e) => setBarInfo({...barInfo, email: e.target.value})}
                placeholder="info@thespot.co.ke"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition cursor-pointer">
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">Click to upload banner image</p>
                <p className="text-xs text-gray-500">Recommended: 1200x400px, JPG or PNG</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Use this for your start page or when sharing your restaurant on social media
              </p>
            </div>

            {hasChanges && (
              <button
                onClick={handleSaveBarInfo}
                disabled={saving}
                className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Customer QR Code</h3>
              <p className="text-sm text-gray-500">Scan to start ordering</p>
            </div>
          </div>

          {/* QR Code Image - Large Block Style */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 mb-4">
            <div className="bg-white rounded-xl p-6 shadow-lg mx-auto max-w-xs">
              <div className="aspect-square bg-white rounded-lg overflow-hidden border-4 border-gray-100">
                {/* Using QR code generator with your actual domain */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://mteja.vercel.app&bgcolor=ffffff&color=f97316&qzone=2&format=svg`}
                  alt="Restaurant QR Code"
                  className="w-full h-full"
                />
              </div>
              <div className="text-center mt-4">
                <p className="font-bold text-gray-800">{barInfo.name || 'Your Restaurant'}</p>
                <p className="text-sm text-gray-500">Scan to order digitally</p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownloadQR}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Download QR Code
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            💡 Print and display at tables, bar counter, or entrance
          </p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-500">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm font-medium text-gray-700">New Orders</span>
              <input
                type="checkbox"
                checked={notifications.newOrders}
                onChange={(e) => setNotifications({...notifications, newOrders: e.target.checked})}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Pending Approvals</span>
              <input
                type="checkbox"
                checked={notifications.pendingApprovals}
                onChange={(e) => setNotifications({...notifications, pendingApprovals: e.target.checked})}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Payment Received</span>
              <input
                type="checkbox"
                checked={notifications.payments}
                onChange={(e) => setNotifications({...notifications, payments: e.target.checked})}
                className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
              />
            </label>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl shadow-sm">
          <button
            onClick={() => alert('Feedback form coming soon! Share your challenges, suggestions, or issues.')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MessageSquare size={20} className="text-yellow-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Send Feedback</p>
                <p className="text-sm text-gray-500">Share issues & suggestions</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Pro Features - Coming Soon */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <button
            onClick={() => handleProFeature('Webhooks')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Webhook size={20} className="text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">POS Integration</p>
                <p className="text-sm text-gray-500">Connect via webhooks</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          </button>

          <button
            onClick={() => handleProFeature('Payment Methods')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Payment Methods</p>
                <p className="text-sm text-gray-500">Configure M-Pesa, Cash, Card</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          </button>

          <button
            onClick={() => handleProFeature('Staff Accounts')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users size={20} className="text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Staff Accounts</p>
                <p className="text-sm text-gray-500">Manage access & permissions</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Coming Soon
            </span>
          </button>
        </div>
      </div>

      {/* Pro Feature Modal */}
      {showProModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">✨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Coming Soon</h3>
                  <p className="text-sm text-gray-500">Premium feature</p>
                </div>
              </div>
              <button onClick={() => setShowProModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {proFeature.title}
              </p>
              <p className="text-sm text-gray-600">
                {proFeature.description}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setShowProModal(false)}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition"
              >
                Join Waitlist
              </button>
              <button 
                onClick={() => setShowProModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              Be the first to know when this feature launches
            </p>
          </div>
        </div>
      )}
    </div>
  );
}