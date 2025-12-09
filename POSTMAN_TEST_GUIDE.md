# 🚀 HƯỚNG DẪN TEST BACKEND VỚI POSTMAN

## 📋 Chuẩn bị

### 1. Khởi động Server
```bash
cd "c:\Users\giang\OneDrive\Máy tính\MOBILE solo\backEnd-eventBooking"
node server.js
```
✅ Server phải chạy trên port 3000

### 2. Import Collection vào Postman
1. Mở Postman
2. Click **Import** (góc trên bên trái)
3. Chọn file: `Postman_Collection_Event_Booking.json`
4. Click **Import**

---

## 🔥 FLOW TEST HOÀN CHỈNH

### BƯỚC 1: Authentication (Folder 1)

#### 1.1 Register User
- Endpoint: `POST /api/auth/register`
- Mục đích: Tạo user thường
- Email: `testuser@example.com`
- Password: `password123`

#### 1.2 Login User  
- Endpoint: `POST /api/auth/login`
- ✅ **Token tự động lưu vào biến `{{token}}`**

#### 1.3 Register Organizer User
- Endpoint: `POST /api/auth/register`
- Email: `organizer@example.com`
- Password: `password123`

#### 1.4 Login Organizer
- Endpoint: `POST /api/auth/login`
- ✅ **Token tự động lưu vào biến `{{organizer_token}}`**

---

### BƯỚC 2: Organizer Registration (Folder 2)

#### 2.1 Register as Organizer
- Endpoint: `POST /api/organizer/register`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: JSON với 6 trường
  - organization_name
  - tax_code
  - address
  - bank_account
  - contact_email
  - contact_phone
- ✅ Chuyển user thành organizer

---

### BƯỚC 3: Event Management (Folder 3)

#### 3.1 Create Event with Tickets
- Endpoint: `POST /api/organizer/events/create`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: Sự kiện + 2 loại vé (VIP, Regular)
- ✅ **Event ID tự động lưu vào biến `{{event_id}}`**

#### 3.2 Get Organizer Dashboard
- Endpoint: `GET /api/organizer/dashboard`
- Header: `Authorization: Bearer {{organizer_token}}`
- Response: Danh sách events với stats

#### 3.3 View All Events (Public)
- Endpoint: `GET /api/event/viewAll`
- Không cần auth
- Response: Tất cả events public

#### 3.4 Get Event Detail
- Endpoint: `GET /api/event/detail/{{event_id}}`
- Không cần auth
- Response: Chi tiết 1 event

#### 3.5 Update Event
- Endpoint: `PUT /api/organizer/events/{{event_id}}`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: Thông tin cập nhật

---

### BƯỚC 4: Ticket Management (Folder 4)

#### 4.1 Get Ticket Types for Event
- Endpoint: `GET /api/events/{{event_id}}/ticket-types`
- Không cần auth
- Response: Danh sách loại vé

#### 4.2 Update Ticket Quantity
- Endpoint: `PUT /api/ticket-types/update-quantity`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: 
  - ticket_type_id: 1
  - new_quantity: 150

---

### BƯỚC 5: Booking System (Folder 5)

#### 5.1 Create Booking
- Endpoint: `POST /api/bookings`
- Header: `Authorization: Bearer {{token}}` (user thường)
- Body: event_id + items array (ticket_type_id, quantity)
- ✅ **Booking ID tự động lưu vào biến `{{booking_id}}`**

#### 5.2 Get My Bookings
- Endpoint: `GET /api/bookings`
- Header: `Authorization: Bearer {{token}}`
- Response: Danh sách bookings của user

#### 5.3 Get Booking Detail
- Endpoint: `GET /api/bookings/{{booking_id}}`
- Header: `Authorization: Bearer {{token}}`
- Response: Chi tiết booking + tickets

---

### BƯỚC 6: Payment System - VNPay (Folder 6)

#### 6.1 Create Payment URL
- Endpoint: `POST /api/payment/create`
- Header: `Authorization: Bearer {{token}}`
- Body: `{ "bookingId": {{booking_id}} }`
- Response: VNPay payment URL
- ✅ Copy URL này để thanh toán

#### 6.2 Query Transaction Status
- Endpoint: `GET /api/payment/query/{{booking_id}}`
- Header: `Authorization: Bearer {{token}}`
- Response: Trạng thái giao dịch từ VNPay

---

### BƯỚC 7: Seat Management (Folder 7)

#### 7.1 Create Seat Map
- Endpoint: `POST /api/events/{{event_id}}/seat-map`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: mapJson + seats array
- ✅ Tạo sơ đồ ghế cho event

#### 7.2 Get Available Seats
- Endpoint: `GET /api/events/{{event_id}}/seats/available`
- Không cần auth
- Response: Danh sách ghế còn trống

#### 7.3 Reserve Seats
- Endpoint: `POST /api/seats/reserve`
- Header: `Authorization: Bearer {{token}}`
- Body: `{ "seatIds": [1, 2] }`
- ✅ Đặt ghế (lock)

---

### BƯỚC 8: Promotions (Folder 8)

#### 8.1 Create Promotion
- Endpoint: `POST /api/promotions`
- Header: `Authorization: Bearer {{organizer_token}}`
- Body: Mã code, discount_type (percent/fixed), giá trị, dates
- ✅ Tạo mã khuyến mãi

#### 8.2 Validate Promotion
- Endpoint: `POST /api/promotions/validate`
- Body: `{ "code": "XMAS2025", "eventId": {{event_id}} }`
- Response: Mã hợp lệ hay không

#### 8.3 Apply Promotion to Booking
- Endpoint: `POST /api/bookings/apply-promotion`
- Header: `Authorization: Bearer {{token}}`
- Body: bookingId + promoCode
- ✅ Áp mã giảm giá vào booking

#### 8.4 Get Active Promotions
- Endpoint: `GET /api/promotions/active`
- Response: Danh sách mã đang active

---

### BƯỚC 9: Attendee Management (Folder 9)

#### 9.1 Get Event Attendees
- Endpoint: `GET /api/organizer/events/{{event_id}}/attendees`
- Header: `Authorization: Bearer {{organizer_token}}`
- Response: Danh sách người tham dự

#### 9.2 Export Attendees Excel
- Endpoint: `GET /api/organizer/events/{{event_id}}/export/excel`
- Header: `Authorization: Bearer {{organizer_token}}`
- Response: File Excel (.xlsx)
- ✅ Save file để mở

#### 9.3 Export Attendees PDF
- Endpoint: `GET /api/organizer/events/{{event_id}}/export/pdf`
- Header: `Authorization: Bearer {{organizer_token}}`
- Response: File PDF
- ✅ Save file để xem

---

### BƯỚC 10: Check-in System (Folder 10)

#### 10.1 Check-in Ticket by QR Code
- Endpoint: `POST /api/tickets/check-in`
- Body: `{ "qr_code": "QR-xxxxxx" }`
- ✅ Scan QR để check-in
- Response: Ticket info + status updated

---

## 🎯 TEST SCENARIOS

### Scenario 1: Complete User Journey
1. Register User → Login → Get token
2. View events → Get event detail
3. Create booking
4. Create payment URL
5. View my bookings

### Scenario 2: Complete Organizer Journey
1. Register User → Login
2. Register as Organizer
3. Create Event with tickets
4. View dashboard
5. Get attendees
6. Export Excel/PDF
7. Update ticket quantity
8. Create promotions

### Scenario 3: Booking with Promotion
1. Create booking (user)
2. Create promotion (organizer)
3. Apply promotion to booking
4. Check updated total amount

### Scenario 4: Seat Management
1. Create seat map (organizer)
2. Get available seats (public)
3. Reserve seats (user)
4. Check seats no longer available

---

## ✅ EXPECTED RESULTS

### Authentication
- ✅ Register: Status 201, success: true
- ✅ Login: Status 200, token returned

### Organizer
- ✅ Register as organizer: Status 201
- ✅ Create event: Status 201, event_id returned
- ✅ Dashboard: Status 200, events array with stats

### Booking
- ✅ Create booking: Status 201, booking_id + tickets
- ✅ Payment status: "pending"

### Payment
- ✅ Create payment: VNPay URL returned
- ✅ Query: Transaction details

### Promotions
- ✅ Validate: valid: true if code exists and not expired
- ✅ Apply: discount calculated, new total returned

### Attendees
- ✅ Get attendees: Array of attendees
- ✅ Export Excel: Binary file (.xlsx)
- ✅ Export PDF: Binary file (.pdf)

---

## 🔧 VARIABLES AUTO-SAVED

Collection tự động lưu các variables:
- `{{token}}` - User token (từ Login User)
- `{{organizer_token}}` - Organizer token (từ Login Organizer)
- `{{event_id}}` - Event ID (từ Create Event)
- `{{booking_id}}` - Booking ID (từ Create Booking)

✅ Không cần copy-paste thủ công!

---

## 🐛 TROUBLESHOOTING

### Error: Cannot connect to server
```bash
# Kiểm tra server có chạy không
node server.js
# Phải thấy: "Server running on port 3000"
```

### Error: Token expired / Invalid token
```bash
# Run lại Login để lấy token mới
POST /api/auth/login
```

### Error: Event not found
```bash
# Kiểm tra biến {{event_id}} có giá trị chưa
# Nếu chưa, run lại "Create Event"
```

### Error: Unauthorized (403)
```bash
# Endpoint yêu cầu organizer role
# Phải run "Register as Organizer" trước
```

---

## 📊 API ENDPOINT SUMMARY

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Auth | 2 | No |
| Organizer | 10 | Yes (Organizer) |
| Events | 4 | Mixed |
| Tickets | 2 | Mixed |
| Bookings | 5 | Yes (User) |
| Payment | 5 | Yes (User) |
| Seats | 9 | Mixed |
| Promotions | 8 | Mixed |
| Attendees | 4 | Yes (Organizer) |
| Check-in | 1 | No |

**TOTAL: 50+ endpoints**

---

## 🎉 DONE!

Bạn đã sẵn sàng test toàn bộ backend API với Postman!

Chạy theo thứ tự từ Folder 1 → 10 để test flow hoàn chỉnh.
