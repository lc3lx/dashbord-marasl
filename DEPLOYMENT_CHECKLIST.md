# قائمة التحقق من النشر (Deployment Checklist)

## ✅ الإعدادات المكتملة:

1. **Next.js Config:**
   - ✅ `basePath: '/dashboard'` مضبوط في `next.config.mjs`
   - ✅ `assetPrefix: '/dashboard'` مضبوط

2. **المسارات:**
   - ✅ جميع المسارات تستخدم `/` بدلاً من `/dashboard` (لأن basePath يضاف تلقائياً)
   - ✅ `router.push("/")` بدلاً من `router.push("/dashboard")`
   - ✅ `router.push("/login")` يعمل بشكل صحيح

3. **Nginx Configuration:**
   - ✅ `location ^~ /dashboard/` مضبوط
   - ✅ `proxy_pass http://127.0.0.1:3001` (بدون `/` في النهاية)
   - ✅ WebSocket support مضاف

## 🔗 الروابط المتوقعة:

بعد النشر، يجب أن تكون الروابط التالية تعمل:

- **الصفحة الرئيسية:** `https://www.marasil.site/dashboard/`
- **تسجيل الدخول:** `https://www.marasil.site/dashboard/login`
- **تسجيل دخول الموظفين:** `https://www.marasil.site/dashboard/employee-login`
- **لوحة التحكم:** `https://www.marasil.site/dashboard/` (بعد تسجيل الدخول)

## 📋 خطوات النشر:

### 1. بناء المشروع:
```bash
cd /path/to/dash
npm install
npm run build
```

### 2. تشغيل الداشبورد على المنفذ 3001:
```bash
PORT=3001 npm start
```

أو باستخدام PM2:
```bash
pm2 start npm --name "dashboard" -- start -- --port 3001
```

### 3. التحقق من Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. التحقق من الوصول:
- افتح `https://www.marasil.site/dashboard/`
- يجب أن ترى صفحة تسجيل الدخول أو لوحة التحكم (إذا كنت مسجلاً)

## 🐛 استكشاف الأخطاء:

### إذا ظهر 404:
1. تأكد من أن Next.js يعمل على المنفذ 3001:
   ```bash
   netstat -tulpn | grep 3001
   ```

2. تأكد من أن `basePath` مضبوط في `next.config.mjs`

3. تحقق من logs:
   ```bash
   sudo tail -f /home/marasil/logs/nginx/error.log
   ```

### إذا ظهرت أخطاء في المسارات:
- تأكد من أن جميع `router.push()` تستخدم `/` وليس `/dashboard`
- تأكد من أن `Link` components تستخدم المسارات النسبية

### إذا لم تعمل WebSocket:
- تأكد من إضافة `map $http_upgrade` في بداية ملف Nginx config
- تأكد من إضافة headers في location block:
  ```nginx
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection $connection_upgrade;
  ```

## 📝 ملاحظات مهمة:

1. **ترتيب location blocks في Nginx مهم جداً:**
   - `/dashboard/` يجب أن يكون قبل `/`
   - `/api/` يجب أن يكون قبل `/`

2. **Next.js basePath:**
   - عند استخدام `basePath: '/dashboard'`، Next.js يضيف `/dashboard` تلقائياً لجميع المسارات
   - لذلك استخدم `/` في الكود وليس `/dashboard`

3. **المنفذ:**
   - تأكد من أن المنفذ 3001 غير مستخدم من قبل تطبيق آخر
   - يمكنك تغيير المنفذ في `package.json` أو استخدام متغير البيئة `PORT`

