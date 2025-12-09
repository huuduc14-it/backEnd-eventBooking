const crypto = require('crypto');
const querystring = require('querystring');

// VNPay configuration (should be in .env)
const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMN_CODE || 'YOUR_TMN_CODE',
  vnp_HashSecret: process.env.VNP_HASH_SECRET || 'YOUR_HASH_SECRET',
  vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/api/payment/vnpay-return',
  vnp_Api: process.env.VNP_API || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
};

// Sort object by key
const sortObject = (obj) => {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
};

// Create VNPay payment URL
const createPaymentUrl = (req, bookingId, amount, orderInfo, ipAddr) => {
  let date = new Date();
  let createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  
  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: bookingId.toString(),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: amount * 100, // VNPay requires amount in smallest currency unit (VND * 100)
    vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate
  };

  vnp_Params = sortObject(vnp_Params);

  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;

  let paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
  
  return paymentUrl;
};

// Verify VNPay return signature
const verifyReturnUrl = (vnpParams) => {
  let secureHash = vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  vnpParams = sortObject(vnpParams);

  let signData = querystring.stringify(vnpParams, { encode: false });
  let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  return secureHash === signed;
};

// Query transaction status from VNPay
const queryTransaction = async (txnRef, transactionDate) => {
  let date = new Date();
  let requestId = date.getTime();
  let vnp_RequestId = requestId.toString();
  let vnp_Command = 'querydr';
  let vnp_TxnRef = txnRef;
  let vnp_OrderInfo = 'Query transaction ' + txnRef;
  let vnp_TransactionDate = transactionDate;

  let data = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: '2.1.0',
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    vnp_IpAddr: '127.0.0.1'
  };

  data = sortObject(data);

  let signData = querystring.stringify(data, { encode: false });
  let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  let vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  data['vnp_SecureHash'] = vnp_SecureHash;

  // Make request to VNPay API
  const axios = require('axios');
  try {
    const response = await axios.post(vnpayConfig.vnp_Api, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error querying VNPay transaction:', error);
    throw error;
  }
};

// Refund transaction
const refundTransaction = async (txnRef, transactionDate, amount, transactionType, user) => {
  let date = new Date();
  let requestId = date.getTime();
  let vnp_RequestId = requestId.toString();
  let vnp_Command = 'refund';
  let vnp_TxnRef = txnRef;
  let vnp_Amount = amount * 100;
  let vnp_TransactionDate = transactionDate;
  let vnp_TransactionType = transactionType; // '02' for partial refund, '03' for full refund
  let vnp_CreateBy = user;

  let data = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: '2.1.0',
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_TransactionType: vnp_TransactionType,
    vnp_TxnRef: vnp_TxnRef,
    vnp_Amount: vnp_Amount,
    vnp_OrderInfo: 'Refund transaction ' + txnRef,
    vnp_TransactionNo: '', // VNPay transaction number (optional)
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    vnp_CreateBy: vnp_CreateBy,
    vnp_IpAddr: '127.0.0.1'
  };

  data = sortObject(data);

  let signData = querystring.stringify(data, { encode: false });
  let hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  let vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  data['vnp_SecureHash'] = vnp_SecureHash;

  // Make request to VNPay API
  const axios = require('axios');
  try {
    const response = await axios.post(vnpayConfig.vnp_Api, data, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error refunding VNPay transaction:', error);
    throw error;
  }
};

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  queryTransaction,
  refundTransaction,
  vnpayConfig
};
