Payments (IntaSend) Integration

Overview
This app uses IntaSend to accept payments for plan upgrades. Frontend never calls IntaSend with secret keys. Instead, it calls our backend endpoint which uses the IntaSend Secret Key to create a checkout link or invoice, then redirects the user to complete payment.

Frontend Flow
- Upgrade page opens CheckoutForm modal.
- CheckoutForm POSTs to /api/payments/intasend/checkout with amount, currency, customer info, api_ref, and redirect_url.
- Backend returns a url (checkout link) or invoice. The frontend redirects user to the url or to /payment-status for MPesa push.
- After payment, IntaSend redirects back to /payment-success?invoice_id=... The page verifies payment via /api/payments/intasend/verify and upgrades the user.
- Additionally, a webhook on the backend receives definitive events and updates the user even if they close the browser.

Environment Variables
- Frontend: VITE_INTASEND_PUBLIC_KEY
- Backend: INTASEND_SECRET_KEY, INTASEND_BASE_URL (e.g. https://sandbox.intasend.com or https://payment.intasend.com)

Backend Endpoints (to implement)
- POST /api/payments/intasend/checkout
  - Body: amount, currency, email, first_name, last_name, phone_number, address, city, country, method, api_ref, redirect_url, metadata
  - Action: Calls IntaSend Checkout Link API using INTASEND_SECRET_KEY; stores invoice_id/api_ref vs userId/plan; returns { url, invoice_id }

- GET /api/payments/intasend/verify?invoice_id=...
  - Action: Calls IntaSend to fetch invoice/payment status; if paid, upgrades user plan; returns { paid: true/false, details }

- POST /api/payments/intasend/webhook
  - Action: Validates event (signature if available), confirms status with IntaSend, upgrades user plan.

Frontend Pages
- /payment-success: verifies payment and shows confirmation
- /payment-status: polls /verify for pending MPesa push payments

Security Notes
- Never expose INTASEND_SECRET_KEY in the frontend.
- Validate invoice_id/api_ref and user identity server-side before upgrading.

Testing
- Use sandbox base URL and sandbox keys.
- Confirm redirect, verify, and webhook flows.


