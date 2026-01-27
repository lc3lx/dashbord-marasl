# إعدادات Nginx للداشبورد

## التكوين المطلوب في Nginx

### 1. إضافة map للـ WebSocket (في بداية ملف الإعدادات، قبل أي server block):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

### 2. إعداد server block للداشبورد:

```nginx
server {
    listen 80;
    listen [::]:80;
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name marasil.site www.marasil.site www1.marasil.site;

    ssl_certificate /etc/letsencrypt/live/marasil.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marasil.site/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/marasil.site/chain.pem;

    root /home/marasil/htdocs/www.marasil.site;
    index index.html;

    access_log /home/marasil/logs/nginx/access.log cloudflare;
    error_log /home/marasil/logs/nginx/error.log;

    # --- allow certbot /.well-known ---
    location ^~ /.well-known/ {
        root /home/marasil/htdocs/www.marasil.site;
        allow all;
    }

    include /etc/nginx/global_settings;

    # --- static uploads (serve directly) ---
    location ^~ /api/uploads/ {
        alias /home/marasil/web/www.marasil.site/public/marasil.sa/uploads/;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept";
        try_files $uri $uri/ =404;
    }

    # --- API proxy ---
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_pass_request_headers on;
    }

    # --- Dashboard mounted under /dashboard/ (important: before location /) ---
    location ^~ /dashboard/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Prefix /dashboard;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_pass_request_headers on;
        
        # Don't rewrite - Next.js handles basePath automatically
    }

    # --- AI API proxy ---
    location ^~ /ai/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_pass_request_headers on;
    }

    # --- catch-all proxy (main Next.js app) ---
    location / {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Server $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_pass_request_headers on;
    }

    # redirect non-https to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

## ملاحظات مهمة:

1. **ترتيب location blocks مهم**: يجب أن يكون `/dashboard/` قبل `/` في الإعدادات
2. **Next.js basePath**: تم ضبط `basePath: '/dashboard'` في `next.config.mjs`
3. **المنفذ**: الداشبورد يعمل على المنفذ 3001
4. **WebSocket**: تم إضافة دعم WebSocket للاتصالات المباشرة

## خطوات التشغيل:

1. تأكد من أن الداشبورد يعمل على المنفذ 3001:
   ```bash
   cd /path/to/dash
   npm run build
   PORT=3001 npm start
   ```

2. أعد تحميل إعدادات Nginx:
   ```bash
   sudo nginx -t  # للتحقق من صحة الإعدادات
   sudo systemctl reload nginx
   ```

3. تحقق من أن الداشبورد يعمل على:
   - `https://marasil.site/dashboard/`
   - `https://www.marasil.site/dashboard/`

## استكشاف الأخطاء:

- إذا ظهر 404: تأكد من أن Next.js يعمل على المنفذ 3001
- إذا ظهرت أخطاء في المسارات: تأكد من أن `basePath` مضبوط في `next.config.mjs`
- إذا لم تعمل WebSocket: تأكد من إضافة `map $http_upgrade` في بداية ملف الإعدادات

