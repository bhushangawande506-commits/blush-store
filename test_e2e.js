require('dotenv').config();
const http = require('http');

async function runTests() {
  console.log('🚀 Starting Automated Full-Stack E2E Verification Suite for Blush...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Test Health
  console.log('1. Testing Server Health & Brand Configuration...');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint responds with HTTP 200');
  assert(healthData.brand === 'Blush', 'Brand name is confirmed as "Blush" (NOT "Blush Pune")');
  assert(healthData.location === 'Pune, Maharashtra, India', 'Location is Pune, Maharashtra, India');
  assert(healthData.established === 2014, 'Established year is 2014');

  // 2. Test Products
  console.log('\n2. Testing Product Catalogue & Inventory API...');
  const prodsRes = await fetch('http://localhost:5000/api/products');
  const prodsData = await prodsRes.json();
  assert(prodsData.success === true, 'Products API returned success: true');
  assert(prodsData.count === 20, `Products API returned exactly 20 distinct garments (Found: ${prodsData.count})`);

  // Verify categories
  const categories = new Set(prodsData.products.map(p => p.category));
  assert(categories.has('Dresses'), 'Catalogue contains Dresses');
  assert(categories.has('Tops'), 'Catalogue contains Tops');
  assert(categories.has('Co-ord Sets'), 'Catalogue contains Co-ord Sets');
  assert(categories.has('Skirts'), 'Catalogue contains Skirts');
  assert(categories.has('Partywear'), 'Catalogue contains Partywear');

  // 3. Test Static Assets (Logo & Hero Video)
  console.log('\n3. Testing Static Assets Serving...');
  const logoRes = await fetch('http://localhost:5000/images/brand/blush-logo.png');
  assert(logoRes.status === 200, 'Original Blush Circular Logo is served at /images/brand/blush-logo.png');
  assert(logoRes.headers.get('content-type')?.includes('image'), 'Logo has image content-type');

  const videoRes = await fetch('http://localhost:5000/video/blush-hero-video.mp4');
  assert(videoRes.status === 200, 'Hero Video is served at /video/blush-hero-video.mp4');
  assert(videoRes.headers.get('content-type')?.includes('video'), 'Hero video has video/mp4 content-type');

  const origVideoRes = await fetch('http://localhost:5000/video/blush%20hiro%20section%20video%20desktop%20mode.mp4');
  assert(origVideoRes.status === 200, 'Original video filename also served with 200 OK');

  // 4. Test Order Creation & Authoritative Calculation
  console.log('\n4. Testing Order Creation & Inventory Validation...');
  const firstProd = prodsData.products[0];
  const initialStock = firstProd.stock;

  const orderPayload = {
    customer_name: 'Pooja Sharma',
    customer_email: 'pooja.sharma@example.com',
    customer_phone: '9503917333',
    shipping_address: 'Flat 402, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    order_notes: 'Urgent weekend occasion',
    items: [
      {
        product_id: firstProd.id,
        quantity: 2,
        size: 'M',
        color: firstProd.colors[0]
      }
    ]
  };

  const createOrderRes = await fetch('http://localhost:5000/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  const orderResData = await createOrderRes.json();
  assert(createOrderRes.status === 200 && orderResData.success === true, 'Order created successfully');
  const orderId = orderResData.orderId;
  assert(orderId && orderId.startsWith('BLUSH-'), `Valid order ID generated: ${orderId}`);
  assert(orderResData.subtotal === firstProd.price * 2, `Authoritative subtotal verified (₹${orderResData.subtotal})`);
  assert(orderResData.shippingFee === 0, 'Free shipping applied for order >= ₹2,499');

  // 5. Test Payment Order Creation
  console.log('\n5. Testing Payment Gateway Order Initialization...');
  const payOrderRes = await fetch('http://localhost:5000/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  const payOrderData = await payOrderRes.json();
  assert(payOrderData.success === true, 'Payment order created with gateway');
  assert(payOrderData.razorpayOrderId !== undefined, `Gateway order ID generated: ${payOrderData.razorpayOrderId}`);

  // 6. Test Signature Verification & Payment Confirmation
  console.log('\n6. Testing Payment Verification & Inventory Decrement...');
  const mockPaymentId = `pay_test_${Date.now()}`;
  const verifyRes = await fetch('http://localhost:5000/api/payment/verify-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      razorpay_order_id: payOrderData.razorpayOrderId,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: 'test_signature_verified'
    })
  });
  const verifyData = await verifyRes.json();
  assert(verifyData.success === true, 'Payment signature verified successfully');
  assert(verifyData.status === 'paid', 'Order status marked as PAID');

  // 7. Verify Stock Decrement in Database
  const checkProdRes = await fetch(`http://localhost:5000/api/products/${firstProd.id}`);
  const checkProdData = await checkProdRes.json();
  assert(checkProdData.product.stock === initialStock - 2, `Inventory decremented correctly from ${initialStock} to ${checkProdData.product.stock}`);

  // 8. Test Admin Authentication & Protected Operations
  console.log('\n7. Testing Protected Admin Operations & Authentication Gate...');
  const adminKey = process.env.ADMIN_KEY;
  assert(adminKey !== undefined && adminKey.length > 0, 'ADMIN_KEY environment variable is configured in .env');

  // 8a. Test unauthorized access fails
  const unauthorizedRes = await fetch('http://localhost:5000/api/admin/stats');
  assert(unauthorizedRes.status === 401, 'Unauthorized request without token is rejected with HTTP 401');

  // 8b. Test verify endpoint with incorrect password
  const badAuthRes = await fetch('http://localhost:5000/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'wrong_password_attempt' })
  });
  assert(badAuthRes.status === 401, 'Verification with incorrect credentials returns HTTP 401');

  // 8c. Test verify endpoint with valid password
  const goodAuthRes = await fetch('http://localhost:5000/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: adminKey })
  });
  const goodAuthData = await goodAuthRes.json();
  assert(goodAuthRes.status === 200 && goodAuthData.success === true, 'Server-side verification succeeds with valid credentials');
  const validToken = goodAuthData.token;

  // 8d. Test authorized access with token
  const adminOrdersRes = await fetch('http://localhost:5000/api/admin/orders', {
    headers: { 'x-admin-token': validToken }
  });
  const adminOrdersData = await adminOrdersRes.json();
  assert(adminOrdersData.success === true, 'Admin orders retrieved successfully with valid session token');
  const foundOrder = adminOrdersData.orders.find(o => o.id === orderId);
  assert(foundOrder !== undefined, `Order #${orderId} found in admin database`);
  assert(foundOrder.payment_status === 'paid', 'Admin order shows paid payment_status');

  // Update order status via admin
  const updateStatusRes = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': validToken
    },
    body: JSON.stringify({ order_status: 'processing' })
  });
  const updateStatusData = await updateStatusRes.json();
  assert(updateStatusData.success === true, 'Admin status updated to "processing"');

  // 9. Frontend HTML / Client Verification
  console.log('\n8. Testing Frontend HTML & App Bundle...');
  const frontendRes = await fetch('http://localhost:3000/');
  const frontendHtml = await frontendRes.text();
  assert(frontendRes.status === 200, 'Frontend Vite dev server responds with HTTP 200');
  assert(frontendHtml.includes('<title>Blush'), 'Title contains "Blush"');
  assert(!frontendHtml.includes('<title>Blush Pune'), 'Title does NOT contain "Blush Pune"');
  assert(frontendHtml.includes('blush-logo.png'), 'Favicon links to original circular logo');
  assert(frontendHtml.includes('checkout.razorpay.com'), 'Razorpay SDK script included');

  console.log('\n===============================================');
  console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
