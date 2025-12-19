'use client';

// apps/customer/app/terms/page.tsx
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Use</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-4">Last updated: December 2024</p>
          
          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">1. Service Description</h2>
          <p className="text-gray-700 mb-4">
            Kwikoda provides a digital ordering platform for bars and restaurants. By using our service, you agree to these terms.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">2. Anonymous Usage</h2>
          <p className="text-gray-700 mb-4">
            We do not collect personal information. Your tab is temporary and exists only for your current visit.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">3. Payment</h2>
          <p className="text-gray-700 mb-4">
            All orders must be paid through the establishment's accepted payment methods. Kwikoda is not responsible for payment processing.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">4. User Conduct</h2>
          <p className="text-gray-700 mb-4">
            You agree to use the service responsibly and not to place fraudulent orders or misuse the platform.
          </p>

          <h2 className="text-xl font-bold text-gray-800 mt-6 mb-3">5. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            Kwikoda is a platform connecting customers with establishments. We are not responsible for order fulfillment, product quality, or service delivery.
          </p>
        </div>

        <button
          onClick={() => window.close()}
          className="mt-8 w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

