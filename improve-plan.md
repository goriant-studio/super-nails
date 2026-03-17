# Kế hoạch implementation: Improve UI + Fix bug cho Super Nails

## Tóm tắt

- Phạm vi đợt này là polish UI hiện tại, không redesign mạnh và không thêm feature mới ngoài 4 màn chính.
- Thứ tự thực hiện: fix bug blocking trước, đưa repo về trạng thái pass checks, rồi mới polish shared mobile UI và từng màn.
- Quyết định đã khóa: bottom nav chỉ giữ 3 tab thật là `Trang chủ`, `Dịch vụ`, `Đặt lịch`; `Lịch sử` và `Tài khoản` bị ẩn, không làm placeholder.

## Thay đổi chính

- Navigation và booking state
  - Sửa `AppHeader` để `onLeadingClick` chỉ là side effect trước khi navigate, không override navigation mặc định.
  - Với `leading="back"`, dùng safe fallback: nếu `window.history.state?.idx > 0` thì `navigate(-1)`, ngược lại `navigate(leadingFallbackTo ?? "/")`.
  - Booking page dùng `leading="home"` kèm `onLeadingClick={clearConfirmation}` để vừa clear state vừa điều hướng đúng.
  - Tạo client-only `ConfirmedBooking` snapshot trong booking context gồm `bookingId`, `confirmationCode`, `totalAmount`, `salonName`, `stylistName`, `appointmentDate`, `appointmentTime`, `serviceNames`, `needsConsultation`.
  - Khi submit thành công, chụp snapshot từ state hiện tại trước `refreshData()`, rồi render banner success chỉ từ snapshot này để không mất giờ/salon sau khi slot bị refresh thành unavailable.
  - Không persist `ConfirmedBooking` vào localStorage; reload trang sẽ mất banner success nhưng không làm sai state booking.

- Backend validation và API behavior
  - Giữ nguyên wire contract của `/api/bootstrap` và `/api/bookings`.
  - Trong `createBooking`, validate rõ: `salonId` tồn tại, `stylistId` tồn tại và thuộc đúng `salonId`, toàn bộ `serviceIds` hợp lệ.
  - Trả lỗi tiếng Việt nhất quán cho các case invalid payload và slot không còn trống.
  - Không đổi schema SQLite trong đợt này.

- PWA và base-path reliability
  - Chuyển toàn bộ asset path trong HTML, SW registration, manifest và icon sang base-aware hoặc scope-relative.
  - `manifest.webmanifest`: đổi `start_url` thành `"."`, icon `src` dùng path tương đối.
  - `sw.js`: app shell và navigation fallback resolve theo `self.registration.scope`, không hardcode `"/"`.
  - Giữ fallback static bootstrap hiện có; không đổi logic API fallback ngoài phần path safety.

- Shared mobile UI
  - Không thêm CSS page-specific mới; tiếp tục dùng Tailwind tokens hiện có.
  - Chuẩn hóa spacing, radius, shadow, safe-area cho `MobileShell`, `AppHeader`, `StickySummaryBar`, chips, cards, CTA buttons và time slots.
  - Tất cả control mobile đạt tap target tối thiểu 44px; fixed bars không che CTA chính hay nội dung cuối trang.
  - Xóa hoặc thay thế UI placeholder như tên người dùng hard-code, badge `VN`, action không gắn trạng thái thật.

- Polish theo màn
  - Home: đổi hero sang guest/default state thực tế, CTA chính là `Đặt lịch`, giữ visual direction xanh sáng hiện tại.
  - Salons: mặc định hiển thị tất cả salon (`nearbyOnly = false`), `Gần bạn` là opt-in filter; tăng contrast province chips và empty state rõ hơn.
  - Booking: làm rõ active/complete rail, giữ grid time slot 4 cột trên mobile, banner error/success ổn định và không phụ thuộc selected slot sau refresh.
  - Services: bỏ grid/list toggle và badge `VN`; giữ 1 layout mặc định 2 cột trên mobile, selected state rõ hơn, sticky summary bar chừa đủ khoảng trống.
  - Bottom nav không mở rộng sang các màn đang có fixed footer riêng trong đợt này.

## Public APIs / types / interfaces

- Không đổi response JSON public của backend.
- `AppHeaderProps` thêm `leadingFallbackTo?: string`; `onLeadingClick` đổi semantics thành pre-navigation side effect.
- `BookingContextValue.confirmation` đổi từ raw `BookingConfirmation | null` sang client snapshot type `ConfirmedBooking | null`; `BookingConfirmation` từ API giữ nguyên.
- Không đổi shape localStorage hiện tại để tránh migration trong đợt này.

## Test plan

- Checks bắt buộc: `npm run typecheck`, `npm run lint`, `npm run build`.
- Manual QA:
  - Mở trực tiếp `/`, `/booking`, `/salons`, `/services` và test nút back/home từ session mới.
  - Đặt lịch thành công rồi verify banner vẫn hiện đúng salon, ngày và giờ sau khi slot bị refresh thành unavailable.
  - Gửi payload sai `stylistId/salonId` và `serviceIds` để confirm backend trả lỗi đúng và không insert booking.
  - Test build chạy ở root path và base path `/super-nails/` với icon, manifest, SW và bootstrap JSON đều load đúng.
  - Check 375px, 390px, 412px: không overflow, không che CTA, bottom safe-area ổn trên iPhone và Samsung.
  - Verify salon list mặc định không bị lọc quá hẹp; services summary luôn đúng số lượng và tổng tiền.

## Assumptions

- Không thêm route hoặc màn mới cho `Lịch sử` và `Tài khoản` trong đợt này.
- Không redesign lại brand direction; chỉ polish trên nền visual system hiện có.
- Không thêm test framework mới ở đợt này; dùng checks hiện có và manual QA.
- Giữ các thay đổi chưa commit hiện có ở `client/src/api.ts` và `client/vite.config.ts`; implementation phải tương thích với chúng, không overwrite ngược.
