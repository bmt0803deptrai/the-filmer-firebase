# 🎬 The Filmer — Deploy qua GitHub → Firebase

## Flow tổng quan

```
Anh push code lên GitHub
        ↓
GitHub Actions tự động chạy
        ↓
Build React app + Functions
        ↓
Deploy lên Firebase Hosting + DB
        ↓
App live tại: https://YOUR_PROJECT.web.app
```

---

## BƯỚC 1 — Tạo Firebase Project

1. Vào https://console.firebase.google.com → **Add project**
2. Đặt tên: `the-filmer` (hoặc tuỳ anh)
3. Tắt Google Analytics → **Create project**

---

## BƯỚC 2 — Bật Realtime Database

1. **Build → Realtime Database → Create Database**
2. Location: **Singapore (asia-southeast1)**
3. Mode: **Start in test mode**
4. **Enable**

---

## BƯỚC 3 — Upgrade lên Blaze plan (cho Cloud Functions)

1. **Build → Functions → Upgrade project → Blaze**
2. Nhập thẻ (free tier đủ dùng, ~$0/tháng)

---

## BƯỚC 4 — Lấy Firebase Web Config

1. **Project Settings** (⚙️) → **Your apps → <>** → **Register app**
2. Copy config:

```js
{
  apiKey: "AIzaSy...",
  authDomain: "the-filmer.firebaseapp.com",
  databaseURL: "https://the-filmer-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "the-filmer",
  storageBucket: "the-filmer.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
}
```

---

## BƯỚC 5 — Tạo Service Account key

1. **Project Settings → Service accounts**
2. **Generate new private key** → Download file JSON

---

## BƯỚC 6 — Tạo GitHub repo và push code

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/TÊN_ANH/the-filmer.git
git branch -M main
git push -u origin main
```

---

## BƯỚC 7 — Thêm Secrets vào GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Giá trị |
|-------------|---------|
| `FIREBASE_API_KEY` | `AIzaSy...` |
| `FIREBASE_AUTH_DOMAIN` | `the-filmer.firebaseapp.com` |
| `FIREBASE_DATABASE_URL` | `https://the-filmer-default-rtdb...` |
| `FIREBASE_PROJECT_ID` | `the-filmer` |
| `FIREBASE_STORAGE_BUCKET` | `the-filmer.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | `123456789` |
| `FIREBASE_APP_ID` | `1:123456789:web:abc123` |
| `FIREBASE_SERVICE_ACCOUNT` | **Toàn bộ nội dung file JSON ở Bước 5** |

---

## BƯỚC 8 — Cập nhật .firebaserc

```json
{
  "projects": {
    "default": "the-filmer"
  }
}
```

```bash
git add .firebaserc
git commit -m "add project id"
git push
```

→ GitHub Actions tự deploy! Xem tại tab **Actions** trên GitHub.

---

## BƯỚC 9 — Deploy Database Rules (1 lần thôi)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

---

## Từ đây về sau

```bash
# Mỗi khi thay đổi gì
git add .
git commit -m "mô tả"
git push
# Tự động deploy sau ~2 phút
```

---

## Auto-reset 0h05

```
00:05 — Cloud Function chạy:
  1. Copy queue → history/YYYY-MM-DD/
  2. Xoá queue hiện tại
  3. Reset số về 1
  4. App sẵn sàng ngày mới
```

Thống Kê vẫn đủ lịch sử theo ngày / tuần / tháng.

---

## Database structure

```
/
├── queue/           ← Reset mỗi ngày 0h05
├── nextNumbers/     ← Reset về 1
├── roomNumbers/     ← Reset về 0
├── settings/        ← KHÔNG reset (tên phòng, giá)
└── history/
    ├── 2026-04-09/
    ├── 2026-04-10/
    └── ...
```
