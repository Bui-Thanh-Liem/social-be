Scale service:

```bash
docker service scale myapp_backend=5
```

Update image (Rolling Update):

```bash
docker service update --image your-dockerhub-username/myapp-backend:v2 myapp_backend
```

Xem chi tiết service:

```bash
docker service inspect myapp_backend
```

Remove stack:

```bash
docker stack rm myapp
```
