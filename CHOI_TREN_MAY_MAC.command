#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Chưa cài Node.js. Hãy tải bản LTS tại https://nodejs.org rồi chạy lại file này."
  read -r -p "Nhấn Enter để đóng..."
  exit 1
fi
echo "Đang chuẩn bị (lần đầu sẽ lâu hơn một chút)..."
npm install --no-audit --no-fund
npm run build
(sleep 2 && open http://localhost:8080) &
echo "Đang chạy game. Đóng cửa sổ này để tắt máy chủ."
npm start
