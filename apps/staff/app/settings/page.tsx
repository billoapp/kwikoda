// apps/staff/app/settings/page.tsx - REAL DATA ONLY, NO PLACEHOLDERS
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Store, Bell, QrCode, Save, X, MessageSquare, Copy, Check, Edit2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [barInfo, setBarInfo] = useState({
    id: '',
    name: '',
    location: '',
    city: '',
    phone: '',
    email: '',
    slug: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [editedInfo, setEditedInfo] = useState({ ...barInfo });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [notifications, setNotifications] = useState({
    newOrders: true,
    pendingApprovals: true,
    payments: true
  });

  useEffect(() => {
    loadBarInfo();
  }, []);

  const loadBarInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user');
        router.push('/login');
        return;
      }

      const userBarId = user.user_metadata?.bar_id;
      
      if (!userBarId) {
        console.error('❌ No bar_id in user metadata');
        alert('Your account is not linked to a bar. Please contact support.');
        router.push('/login');
        return;
      }

      console.log('🔍 Loading bar for authenticated user, bar_id:', userBarId);

      const { data, error } = await supabase
        .from('bars')
        .select('*')
        .eq('id', userBarId)
        .single();

      if (error) {
        console.error('❌ Error loading bar:', error);
        throw error;
      }

      if (!data) {
        alert('Bar not found. Please contact support.');
        router.push('/login');
        return;
      }

      const locationParts = data.location ? data.location.split(',') : ['', ''];
      const info = {
        id: data.id,
        name: data.name || '',
        location: locationParts[0]?.trim() || '',
        city: locationParts[1]?.trim() || '',
        phone: data.phone || '',
        email: data.email || '',
        slug: data.slug || ''
      };
      
      setBarInfo(info);
      setEditedInfo(info);
      console.log('✅ Loaded bar:', info.name, 'ID:', info.id);
    } catch (error) {
      console.error('Error loading bar info:', error);
      alert('Failed to load bar information');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBarInfo = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.user_metadata?.bar_id) {
        alert('Authentication error. Please log in again.');
        router.push('/login');
        return;
      }

      const userBarId = user.user_metadata.bar_id;
      const fullLocation = editedInfo.city 
        ? `${editedInfo.location}, ${editedInfo.city}`
        : editedInfo.location;

      console.log('💾 Saving bar info for bar_id:', userBarId);

      const { error } = await supabase
        .from('bars')
        .update({
          name: editedInfo.name,
          location: fullLocation,
          phone: editedInfo.phone,
          email: editedInfo.email,
          active: true
        })
        .eq('id', userBarId);

      if (error) throw error;

      await loadBarInfo();
      setEditMode(false);
      alert('✅ Restaurant information updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedInfo({ ...barInfo });
    setEditMode(false);
  };

  const handleCopyQRUrl = () => {
    if (barInfo.slug) {
      const url = `https://mteja.vercel.app/?bar=${barInfo.slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = async () => {
    try {
      if (!barInfo.id || !barInfo.slug) {
        alert('Bar information not loaded. Please refresh the page.');
        return;
      }

      const qrData = `https://mteja.vercel.app/?bar=${barInfo.slug}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=f97316&qzone=2&format=png`;
      
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `${barInfo.slug}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`✅ QR code downloaded for ${barInfo.name}`);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  const qrUrl = barInfo.slug ? `https://mteja.vercel.app/?bar=${barInfo.slug}` : '';

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Store size={20} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Restaurant Information</h3>
                <p className="text-sm text-gray-500">Current registered details</p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedInfo.name}
                  onChange={(e) => setEditedInfo({...editedInfo, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 font-medium">{barInfo.name || '(Not set)'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location/Area</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedInfo.location}
                  onChange={(e) => setEditedInfo({...editedInfo, location: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{barInfo.location || '(Not set)'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              {editMode ? (
                <input
                  type="text"
                  value={editedInfo.city}
                  onChange={(e) => setEditedInfo({...editedInfo, city: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{barInfo.city || '(Not set)'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {editMode ? (
                <input
                  type="tel"
                  value={editedInfo.phone}
                  onChange={(e) => setEditedInfo({...editedInfo, phone: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{barInfo.phone || '(Not set)'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {editMode ? (
                <input
                  type="email"
                  value={editedInfo.email}
                  onChange={(e) => setEditedInfo({...editedInfo, email: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{barInfo.email || '(Not set)'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bar Slug (URL)</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <code className="text-sm text-gray-600 break-all">{barInfo.slug || '(No slug)'}</code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used in QR code: mteja.vercel.app/?bar={barInfo.slug}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bar ID (Database)</label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                <code className="text-xs text-gray-600 break-all font-mono">{barInfo.id}</code>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your unique restaurant identifier
              </p>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-3">
                <button
                  onClick={handleSaveBarInfo}
                  disabled={saving}
                  className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
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
              <p className="text-sm text-gray-500">For {barInfo.name}</p>
            </div>
          </div>

          {barInfo.slug ? (
            <>
              {/* QR Code Image */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 mb-4">
                <div className="bg-white rounded-xl p-6 shadow-lg mx-auto max-w-xs">
                  <div className="aspect-square bg-white rounded-lg overflow-hidden border-4 border-gray-100">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=f97316&qzone=2&format=svg`}
                      alt={`${barInfo.name} QR Code`}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-center mt-4">
                    <p className="font-bold text-gray-800">{barInfo.name}</p>
                    <p className="text-sm text-gray-500">Scan to order</p>
                    <p className="text-xs text-orange-600 mt-1 font-mono">{barInfo.slug}</p>
                  </div>
                </div>
              </div>

              {/* QR Code URL with Copy Button */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">QR Code URL:</p>
                  <button
                    onClick={handleCopyQRUrl}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="text-sm text-gray-800 break-all">{qrUrl}</code>
              </div>

              <button
                onClick={handleDownloadQR}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download QR Code
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No QR code available</p>
              <p className="text-sm text-gray-400">Contact support to get your bar slug</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-500">Alert preferences</p>
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
            onClick={() => alert('Feedback form coming soon!')}
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
      </div>
    </div>
  );
}