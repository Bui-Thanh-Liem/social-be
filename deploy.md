# 1.1 Build FE

Trên máy local hoặc CI/CD:

cd frontend
npm install
npm run build # sinh ra /dist hoặc /build

# 1.2 Copy lên VPS

Giả sử Nginx VPS phục vụ FE ở /var/www/html/social:

scp -r dist/ liemdev@42.112.147.46:/var/www/html/social

# 1.3 Cấu hình nginx proxy

sudo nginx -t

sudo ln -s /etc/nginx/sites-available/social.liemdev.info.vn /etc/nginx/sites-enabled/

sudo systemctl reload nginx

# 1.4 Đăng kí SSL

sudo certbot --nginx -d social.liemdev.info.vn -d www.social.liemdev.info.vn
