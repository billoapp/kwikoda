'use client';

import React from 'react';
import { ArrowLeft, FileText, Shield, Eye, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/login" className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="prose prose max-w-none">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-orange-500" />
              Tabeza Terms of Service
            </h2>
            
            <p className="text-gray-600 mb-4">
              <strong>Effective Date:</strong> December 29, 2024
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h3>
            <p className="text-gray-600 mb-4">
              By accessing and using Tabeza, you agree to be bound by these Terms of Service and all applicable laws and regulations in Kenya. If you do not agree to these terms, please do not use our service.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">2. Service Description</h3>
            <p className="text-gray-600 mb-4">
              Tabeza is a digital tab management system for bars and restaurants in Kenya. Our service allows customers to open tabs, place orders, and make payments, while enabling establishments to manage operations efficiently.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">3. User Responsibilities</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Provide accurate and complete information when registering</li>
              <li>Maintain the security of your login credentials</li>
              <li>Ensure sufficient funds are available for payments</li>
              <li>Use the service in compliance with Kenyan laws</li>
              <li>Report any unauthorized use of your account immediately</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">4. Payment Terms</h3>
            <p className="text-gray-600 mb-4">
              All payments are processed in Kenyan Shillings (KSh). Payment processing times may vary depending on your chosen payment method and your bank's policies.
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>M-Pesa payments are typically processed instantly</li>
              <li>Card payments may take 2-3 business days to reflect</li>
              <li>Cash payments are confirmed by staff manually</li>
              <li>All transactions are subject to applicable taxes under Kenyan law</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">5. Data Protection (Kenyan Context)</h3>
            <p className="text-gray-600 mb-4">
              We comply with the Kenya Data Protection Act, 2019. Your personal data is processed in accordance with applicable Kenyan data protection laws.
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>We collect only necessary information for service provision</li>
              <li>Your data is stored securely within Kenya where possible</li>
              <li>You have the right to access and correct your personal data</li>
              <li>We do not share your data with third parties without consent</li>
              <li>Data retention follows Kenyan legal requirements</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">6. Prohibited Activities</h3>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Using the service for illegal activities under Kenyan law</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Providing false or misleading information</li>
              <li>Interfering with or disrupting the service</li>
              <li>Using the service to defraud or harm others</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">7. Limitation of Liability</h3>
            <p className="text-gray-600 mb-4">
              Tabeza is provided "as is" without warranties. We are not liable for direct, indirect, incidental, or consequential damages arising from your use of our service, to the extent permitted by Kenyan law.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">8. Termination</h3>
            <p className="text-gray-600 mb-4">
              We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">9. Governing Law</h3>
            <p className="text-gray-600 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">10. Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="flex items-center gap-2 text-gray-700">
                <Mail size={16} className="text-orange-500" />
                <strong>Email:</strong> support@tabeza.co.ke
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <Phone size={16} className="text-orange-500" />
                <strong>Phone:</strong> +254 XXX XXX XXX
              </p>
              <p className="flex items-center gap-2 text-gray-700">
                <MapPin size={16} className="text-orange-500" />
                <strong>Location:</strong> Nairobi, Kenya
              </p>
            </div>

            <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Last Updated:</strong> December 29, 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
