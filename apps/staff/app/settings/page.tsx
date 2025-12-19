'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Code, Bell, CreditCard, Users, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [webhookUrl, setWebhookUrl] = useState('https://your-pos.com/api/orders');
  const [showWebhookDocs, setShowWebhookDocs] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6">
        <button 
          onClick={() => router.push('/')}
          className="mb-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 inline-block"
        >
          <ArrowRight size={24} className="transform rotate-180" />
        </button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Webhook Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">POS Webhook</h3>
              <p className="text-sm text-gray-500">Send orders to your POS system</p>
            </div>
            <button
              onClick={() => setShowWebhookDocs(!showWebhookDocs)}
              className="text-orange-600 text-sm font-medium flex items-center gap-1"
            >
              <Code size={16} />
              Docs
            </button>
          </div>

          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-pos.com/api/orders"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none mb-3"
          />

          <button className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600">
            Test Webhook
          </button>

          {showWebhookDocs && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Webhook Documentation</h4>
              <p className="text-sm text-gray-600 mb-3">
                When an order is confirmed, we'll POST to your URL:
              </p>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`POST https://your-pos.com/api/orders
Content-Type: application/json

{
  "tab_id": "uuid",
  "tab_number": 27,
  "bar_id": "uuid",
  "items": [
    {
      "name": "Tusker",
      "quantity": 2,
      "price": 300,
      "total": 600
    }
  ],
  "total": 600,
  "timestamp": "2024-12-18T20:30:00Z"
}`}
              </pre>
              <p className="text-xs text-gray-500 mt-2">
                Your POS should respond with status 200. We'll retry on failures.
              </p>
            </div>
          )}
        </div>

        {/* Other Settings */}
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-800">Notifications</p>
                <p className="text-sm text-gray-500">Manage alert preferences</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <CreditCard size={20} className="text-gray-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-800">Payment Methods</p>
                <p className="text-sm text-gray-500">Configure M-Pesa, Cash, Card</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400" />
          </button>

          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-gray-600" />
              <div className="text-left">
                <p className="font-semibold text-gray-800">Staff Accounts</p>
                <p className="text-sm text-gray-500">Manage access & permissions</p>
              </div>
            </div>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
              Pro
            </span>
          </button>
        </div>

        {/* Integration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <ExternalLink size={16} />
            Need Help Integrating?
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            We have guides for popular POS systems:
          </p>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Square POS</li>
            <li>• Toast POS</li>
            <li>• Custom systems (via webhook)</li>
          </ul>
          <button className="mt-3 text-orange-600 text-sm font-medium">
            View Integration Guides →
          </button>
        </div>
      </div>
    </div>
  );
}