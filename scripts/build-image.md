# 🚀 Triển khai Ứng Dụng với Docker & Docker Swarm

## 🧱 Cấu trúc Dự án

```bash
project/
├── backend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## ⚙️ Dockerfile

### 🖥 Backend – `backend/Dockerfile`

```Dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Stage 2: Run
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"]
```

---

### 💻 Frontend – `frontend/Dockerfile`

```Dockerfile
# Stage 1: Build React App
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🌐 Cấu hình Nginx – `frontend/nginx.conf`

```nginx
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

---

## 🏗 Build Docker Images

### 🔧 Backend

```bash
cd backend
docker build -t myapp-backend:latest . (tag)
```

### 🎨 Frontend

```bash
cd ../frontend
docker build -t myapp-frontend:latest .
```

### 📋 Kiểm tra Images

```bash
docker images
```

---

## ☁️ Push Images lên Docker Registry

### 🐳 Docker Hub

```bash
# Tag images
docker tag myapp-backend:latest your-dockerhub-username/myapp-backend:latest
docker tag myapp-frontend:latest your-dockerhub-username/myapp-frontend:latest

# Login Docker Hub
docker login

# Push images
docker push your-dockerhub-username/myapp-backend:latest
docker push your-dockerhub-username/myapp-frontend:latest
```

---

### 🔒 Private Registry (tùy chọn)

```bash
# Chạy Private Registry
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Tag và push
docker tag myapp-backend:latest localhost:5000/myapp-backend:latest
docker tag myapp-frontend:latest localhost:5000/myapp-frontend:latest

docker push localhost:5000/myapp-backend:latest
docker push localhost:5000/myapp-frontend:latest
```

---

## ⚡ Khởi tạo Docker Swarm

```bash
# Khởi tạo Swarm (chạy trên node chính)
docker swarm init

# Deploy stack từ docker-compose.yml
docker stack deploy -c docker-compose.yml myapp

# Kiểm tra trạng thái
docker stack ps myapp
docker service ls
```

---

✅ **Hoàn tất!**  
Ứng dụng của bạn đã sẵn sàng triển khai trong môi trường Swarm với **zero-downtime** và **quản lý container tập trung**.
