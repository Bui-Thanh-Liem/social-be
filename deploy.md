# 1.1 Build FE

Trên máy local hoặc CI/CD:

cd frontend
npm install
npm run build # sinh ra /dist hoặc /build

# 1.2 Copy lên VPS

Giả sử Nginx VPS phục vụ FE ở /var/www/html/social:

scp -r dist/ liemdev@42.113.31.90:/var/www/html/social

# 1.3 Cấu hình nginx proxy

sudo nginx -t

sudo ln -s /etc/nginx/sites-available/social.liemdev.info.vn /etc/nginx/sites-enabled/

sudo systemctl reload nginx

# 1.4 Đăng kí SSL

sudo certbot --nginx -d social.liemdev.info.vn -d www.social.liemdev.info.vn

# 2.1 Mongod

CREATE
  rs.initiate({ ... _id: "rs0", ... members: [{ _id: 0, host: "localhost:27017" }] ... })

DELETE replica
  sudo systemctl stop mongod
  sudo rm -rf /var/lib/mongodb/local.\*
  sudo systemctl start mongod

CONFIG replica
  cfg = rs.conf()
  cfg.members[0].host = "social.liemdev.info.vn:27017"
  rs.reconfig(cfg, { force: true })
