# AgriFlight DSS Frontend

Dashboard ho tro ra quyet dinh van hanh UAV nong nghiep theo du bao vi khi hau,
tinh trang cay trong va chi phi rui ro.

## Chay local

```bash
npm install
npm run dev
```

Lenh `npm run dev` tu khoi dong ca FastAPI backend tren cong `8000` va Vite
frontend. Nhan `Ctrl+C` de tat ca hai tien trinh.

Build production:

```bash
npm run build
```

## Debug tung tien trinh

Frontend goi API cua backend `agricultural-drone-scheduler` qua Vite proxy.
Neu can debug rieng tung phan, mo hai terminal va chay:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Dashboard doc forecast sach moi nhat, chay Decision Engine va lay KPI backtesting
tu backend. Khong con su dung mock data trong frontend.
