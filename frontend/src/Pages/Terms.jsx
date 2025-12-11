import React from "react";

function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
        <h1 className="text-3xl font-bold mb-4">Terms & Risks</h1>
        <p className="text-sm opacity-80">Placeholder terms. Replace with your legal copy.</p>
        <ul className="list-disc ml-6 mt-4 space-y-2 text-sm">
          <li>AI outputs are advisory; users should verify before acting.</li>
          <li>Payments are processed by IntaSend; refunds per policy.</li>
          <li>Data usage follows our Privacy Policy.</li>
        </ul>
      </div>
    </div>
  );
}

export default Terms;


