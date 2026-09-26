# UI Refresh — AI Studio Pro

Giao diện đã được làm mới theo hướng một professional video editor / color-grading control room, nhưng giữ nguyên luồng xử lý và các component chức năng hiện có.

## Thay đổi chính

- Header 60px dạng glass, thương hiệu đổi thành **AI Studio Pro**.
- Workspace có nền lưới rất nhẹ và glow gradient để tạo chiều sâu.
- Khu vực editor được tổ chức thành 3 vùng: Asset / Preview / Inspector.
- Preview có khung monitor nổi bật hơn, giảm cảm giác "khối xanh đậm".
- Timeline và mixer dùng surface đồng nhất, viền mảnh, bóng nhẹ.
- Input / textarea / select có focus ring cyan và nền tối đồng nhất.
- Responsive breakpoint được tinh chỉnh cho màn hình hẹp.
- Giữ nguyên các API, state, modal và logic AI; đây là thay đổi presentation-first.

## File đã thay đổi

- `src/index.css`
- `src/components/Header.tsx`
- `src/App.tsx`
