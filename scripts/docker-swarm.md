# Hướng dẫn triển khai Docker Swarm

## 1. Chuẩn bị

- Ít nhất 2 máy chủ (1 manager, 1+ worker)
- Docker Engine đã cài đặt (phiên bản 1.12+)
- Mở các port cần thiết:
  - TCP 2377: cluster management
  - TCP/UDP 7946: node communication
  - UDP 4789: overlay network traffic

---

## 2. Khởi tạo Swarm trên Manager Node

**Trên máy Manager:**

```bash
docker swarm init --advertise-addr <MANAGER-IP>
```

**Danh sách node:**
docker node ls

**Rời khỏi node:**
docker swarm leave

**Rời khỏi node nếu là manager:**
docker swarm leave --force // nếu node là manager

- Lệnh này sẽ trả về token để join worker nodes
- Ví dụ:

```bash
docker swarm join --token SWMTKN-1-xxxxx <MANAGER-IP>:2377
```

---

## 3. Thêm Worker Nodes

**Trên các máy Worker:**

```bash
docker swarm join --token <TOKEN> <MANAGER-IP>:2377
```

---

## 4. Kiểm tra cluster

**Trên Manager node:**

```bash
docker node ls
```

---

## 5. Deploy service

**Ví dụ deploy nginx:**

```bash
docker service create --name web --replicas 3 -p 80:80 nginx
```

**Kiểm tra service:**

```bash
docker service ls
docker service ps web
```

---

## 6. Scale service

```bash
docker service scale web=5
```

---

## 7. Update service

```bash
docker service update --image nginx:alpine web
```

---

## 8. Các lệnh quản lý hữu ích

**Xem thông tin swarm:**

```bash
docker info
```

**Lấy token join (nếu mất):**

```bash
docker swarm join-token worker
docker swarm join-token manager
```

**Promote worker thành manager:**

```bash
docker node promote <NODE-ID>
```

**Remove node:**

```bash
docker node rm <NODE-ID>
```

**Leave swarm (từ node đó):**

```bash
docker swarm leave
```

---

## Deploy stack (sử dụng docker-compose.yml)

```bash
docker stack deploy -c docker-compose.yml myapp
docker stack ls
docker stack services myapp
```
