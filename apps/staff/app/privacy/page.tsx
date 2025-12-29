'use client';

import React from 'react';
import { ArrowLeft, Shield, Eye, Mail, Phone, MapPin, Lock, Database } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/login" className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="prose prose max-w-none">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={20} className="text-orange-500" />
              Tabeza Privacy Policy
            </h2>
            
            <p className="text-gray-600 mb-4">
              <strong>Effective Date:</strong> December 29, 2024
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Introduction</h3>
            <p className="text-gray-600 mb-4">
              Tabeza is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data in compliance with the Kenya Data Protection Act, 2019.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Information We Collect</h3>
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Personal Information</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Name and contact details</li>
                  <li>Email address and phone number</li>
                  <li>Payment information (encrypted)</li>
                  <li>Bar/establishment details</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Usage Data</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Order history and preferences</li>
                  <li>Payment transactions</li>
                  <li>App usage patterns</li>
                  <li>Device and browser information</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Location Data</h4>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>General location (with consent)</li>
                  <li>Bar/restaurant location data</li>
                  <li>GPS coordinates (optional features)</li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">3. Legal Basis for Processing (Kenya Data Protection Act)</h3>
            <p className="text-gray-600 mb-4">
              We process your personal data based on the following legal grounds under the Kenya Data Protection Act, 2019:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Consent:</strong> You freely give specific, informed, and unambiguous consent</li>
              <li><strong>Contract:</strong> Processing is necessary for our service contract with you</li>
              <li><strong>Legal Obligation:</strong> Compliance with Kenyan legal requirements</li>
              <li><strong>Legitimate Interests:</strong> For fraud prevention and service improvement</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Data Security Measures</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Lock className="text-orange-500 mt-1" size={20} />
                  <div>
                    <strong className="text-gray-700">Encryption</strong>
                    <p className="text-sm text-gray-600">All data is encrypted using industry-standard protocols</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Database className="text-orange-500 mt-1" size={20} />
                  <div>
                    <strong className="text-gray-700">Secure Storage</strong>
                    <p className="text-sm text-gray-600">Data stored in secure Kenyan data centers where possible</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">5. Your Data Rights</h3>
            <p className="text-gray-600 mb-4">
              Under the Kenya Data Protection Act, 2019, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Right to be Informed:</strong> Know what data is collected and why</li>
              <li><strong>Right of Access:</strong> Request access to your personal data</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Portability:</strong> Receive your data in a usable format</li>
              <li><strong>Right to Object:</strong> Object to automated decision-making</li>
              <li><strong>Right to Restrict:</strong> Limit processing of your data</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">6. Data Sharing and Disclosure</h3>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We only share data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li><strong>Payment Processors:</strong> For transaction processing (encrypted)</li>
              <li><strong>Service Providers:</strong> Essential for service delivery</li>
              <li><strong>Legal Requirements:</strong> When required by Kenyan law</li>
              <li><strong>Business Transfers:</strong> With notice in case of acquisition</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">7. International Data Transfers</h3>
            <p className="text-gray-600 mb-4">
              Your personal data may be transferred outside Kenya for service provision. Such transfers only occur to countries with adequate data protection laws or with appropriate safeguards in place, as required by the Kenya Data Protection Act.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">8. Data Retention</h3>
            <p className="text-gray-600 mb-4">
              We retain your personal data only as long as necessary for the purposes outlined in this policy, in accordance with Kenyan legal requirements and our legitimate business interests.
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Account data: Retained while your account is active</li>
              <li>Transaction data: Retained for 7 years (tax compliance)</li>
              <li>Support requests: Retained for 2 years</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">9. Cookies and Tracking</h3>
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to enhance your experience. You can control cookie settings through your browser preferences.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">10. Children's Privacy</h3>
            <p className="text-gray-600 mb-4">
              Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18 without parental consent.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">11. Data Breach Notification</h3>
            <p className="text-gray-600 mb-4">
              In accordance with the Kenya Data Protection Act, we will notify you and the Office of the Data Protection Commissioner of any data breach that is likely to pose a risk to your rights and freedoms within 72 hours of becoming aware of the breach.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">12. Changes to This Policy</h3>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last Updated" date.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">13. Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="flex items-center gap-2 text-gray-700">
                <Mail size={16} className="text-orange-500" />
                <strong>Data Protection Officer:</strong> dpo@tabeza.co.ke
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <Phone size={16} className="text-orange-500" />
                <strong>Hotline:</strong> +254 XXX XXX XXX
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <MapPin size={16} className="text-orange-500" />
                <strong>Office:</strong> Nairobi, Kenya
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <Eye size={16} className="text-orange-500" />
                <strong>Office of the Data Protection Commissioner:</strong> complaints@odpc.go.ke
              </p>
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Last Updated:</strong> December 29, 2024 | 
                <strong>Compliance:</strong> Kenya Data Protection Act, 2019
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
