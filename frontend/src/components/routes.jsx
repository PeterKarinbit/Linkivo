import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PaymentSuccess from '../Pages/PaymentSuccess';

// Import other components
// ... other imports

export default function AppRoutes() {
  return (
    <Routes>
      {/* Add the payment success route */}
      <Route path="/payment-success" element={<PaymentSuccess />} />

      {/* Other routes */}
      {/* ... */}
    </Routes>
  );
}
