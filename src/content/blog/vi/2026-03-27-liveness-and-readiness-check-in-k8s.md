---
layout: post
title: "Liveness vs Readiness Probe trong Kubernetes"
date: 2026-03-27 21:45
categories: [kubernetes, devops]
author: hungneox
tags: [kubernetes, k8s, health-check, devops]
description: "Phân biệt liveness và readiness probe trong Kubernetes, và cách cấu hình sai có thể giết chết cả hệ thống"
image: /assets/images/k8s.jpg
comments: true
published: true
---

# Mở đầu

Nếu bạn đã từng deploy ứng dụng lên Kubernetes, chắc hẳn bạn đã gặp hai khái niệm `livenessProbe` và `readinessProbe`. Nhiều người coi chúng như hai cái checkbox cần tick cho đủ, copy một đoạn YAML từ StackOverflow, trỏ cả hai vào cùng một endpoint `/health` rồi quên luôn. Và mọi thứ chạy ngon lành — cho đến khi database sập.

Bài viết này sẽ giải thích sự khác biệt giữa hai loại probe, và quan trọng hơn là tại sao **cấu hình sai có thể biến một sự cố nhỏ thành thảm hoạ**.

# Health check trong Kubernetes

Kubernetes cung cấp 3 loại probe để kiểm tra sức khoẻ của container:

| Probe | Mục đích | Hậu quả khi fail |
|-------|----------|-------------------|
| **Liveness** | Process còn sống không? | Kubernetes **restart** container |
| **Readiness** | Có thể nhận traffic không? | Kubernetes **ngưng gửi traffic** đến pod |
| **Startup** | Đã khởi động xong chưa? | Chặn liveness/readiness cho đến khi pass |

Cả 3 đều hỗ trợ 3 cơ chế kiểm tra: `httpGet`, `tcpSocket`, và `exec`. Trong bài viết này chúng ta tập trung vào hai anh em liveness và readiness, vì đây là nơi mọi người hay mắc sai lầm nhất.

# Liveness Probe — "Mày còn thở không?"

Liveness probe có đúng **một nhiệm vụ**: xác nhận rằng process trong container vẫn còn hoạt động. Nó trả lời câu hỏi: "Process có bị deadlock, bị stuck trong infinite loop, hay bị zombie không?"

Nếu liveness probe fail, Kubernetes sẽ **kill container và tạo container mới**. Đây là hành động rất quyết liệt — tương đương với việc rút nguồn và cắm lại.

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3
```

Endpoint `/healthz` nên kiểm tra gì? **Càng ít càng tốt**. Lý tưởng nhất là chỉ kiểm tra xem event loop (Node.js), main thread (Java), hay process chính của ứng dụng có còn phản hồi được không.

```python
@app.get("/healthz")
async def liveness():
    return {"status": "alive"}
```

Đúng vậy, chỉ cần return 200 là đủ. Nếu process bị deadlock hoặc event loop bị stuck, nó sẽ không thể phản hồi request này, và probe sẽ timeout → fail → restart. Đó chính xác là hành vi chúng ta muốn.

# Readiness Probe — "Mày sẵn sàng làm việc chưa?"

Readiness probe trả lời một câu hỏi khác: "Container có thể phục vụ traffic hay không?" Khác với liveness, khi readiness fail, Kubernetes **không restart** container. Thay vào đó, nó sẽ loại pod ra khỏi Service endpoints — nghĩa là không còn traffic nào được route đến pod đó nữa.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

Đây là nơi bạn **nên** kiểm tra dependencies:

```python
@app.get("/ready")
async def readiness():
    try:
        await db.execute("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    return {"status": "ready"}
```

Khi database không khả dụng, readiness probe fail, Kubernetes rút pod ra khỏi service endpoints, không có request nào đến pod nữa. Pod vẫn chạy bình thường, chờ database phục hồi. Khi database sống lại, pod reconnect, readiness probe pass, traffic quay lại. Mượt mà, không có restart, không có drama.

# Death Spiral — Khi liveness probe kiểm tra database

Bây giờ hãy tưởng tượng bạn cấu hình liveness probe kiểm tra **cả database connection**:

```python
# ❌ ĐỪNG LÀM THẾ NÀY
@app.get("/healthz")
async def bad_liveness():
    await db.execute("SELECT 1")  # kiểm tra database trong liveness!
    return {"status": "alive"}
```

Mọi thứ chạy ngon lành — cho đến khi Postgres gặp vấn đề. Có thể nó đang chậm vì heavy query, có thể đang failover, có thể chỉ là network hiccup kéo dài vài giây. Bất kể lý do gì, đây là chuỗi sự kiện sẽ xảy ra:

1. **Postgres chậm/không phản hồi** → liveness probe timeout
2. Probe fail vượt `failureThreshold` → **Kubernetes restart container**
3. Container mới khởi động → cố gắng **kết nối lại Postgres** (vốn đang bị quá tải)
4. Kết nối thất bại → liveness probe fail lại → **restart lần nữa**
5. Lặp lại cho **tất cả các pod** cùng lúc

Đây chính là **death spiral** hay còn gọi là **thundering herd**. Kubernetes liên tục kill và restart container, mỗi container mới lại gửi connection request đến database đang hấp hối. Thay vì để database yên để phục hồi, bạn đang đổ thêm dầu vào lửa.

Từ góc nhìn monitoring, bạn sẽ thấy pod liên tục `CrashLoopBackOff`, và nghĩ rằng application code có bug. Nhưng thực ra ứng dụng hoàn toàn khoẻ — chỉ là nó không kết nối được database mà thôi. Bạn không thể phân biệt được đâu là lỗi infrastructure, đâu là lỗi code. Đó là cái giá của một cấu hình sai.

# Cấu hình đúng

Nguyên tắc đơn giản:

- **Liveness** = kiểm tra **nội bộ** (process có stuck/deadlock không)
- **Readiness** = kiểm tra **khả năng phục vụ** (có kết nối được dependencies không)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 8080
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
```

Và phía application:

```python
from fastapi import FastAPI, HTTPException
import asyncpg

app = FastAPI()
db_pool: asyncpg.Pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(dsn="postgresql://...")

# Liveness: chỉ chứng minh process còn sống
@app.get("/healthz")
async def liveness():
    return {"status": "alive"}

# Readiness: kiểm tra dependencies
@app.get("/ready")
async def readiness():
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Not ready")
    return {"status": "ready"}
```

# Khi Postgres sập — nếu cấu hình đúng

Giả sử bạn dùng [CloudNativePG](https://cloudnative-pg.io/) (CNPG) để quản lý Postgres cluster trên Kubernetes. Khi primary instance gặp vấn đề, đây là những gì xảy ra:

| Bước | Trạng thái |
|------|------------|
| Postgres primary sập | CNPG bắt đầu failover sang replica |
| App mất kết nối DB | Readiness probe fail → K8s ngưng gửi traffic |
| Liveness probe vẫn pass | Pod vẫn `Running`, không bị restart |
| CNPG hoàn tất failover | Postgres primary mới sẵn sàng |
| App reconnect thành công | Readiness probe pass → traffic quay lại |

Khi bạn chạy `kubectl get pods`, bạn sẽ thấy:

```
NAME                    READY   STATUS    RESTARTS   AGE
my-app-abc123-x7k9p     0/1     Running   0          2h
my-app-abc123-m4n2q     0/1     Running   0          2h
my-app-abc123-r8v5w     0/1     Running   0          2h
```

`0/1 Running` — pod đang chạy (`Running`) nhưng không sẵn sàng nhận traffic (`0/1 Ready`). Đây là trạng thái rất hữu ích: nó nói cho bạn biết **"process hoàn toàn bình thường, chỉ là data path bị chặn"**. Không có restart, không có `CrashLoopBackOff`, không có drama. Khi database phục hồi, mọi thứ tự động quay lại bình thường.

Ngược lại, nếu bạn dùng liveness để check database, bạn sẽ thấy:

```
NAME                    READY   STATUS             RESTARTS   AGE
my-app-abc123-x7k9p     0/1     CrashLoopBackOff   5          2h
my-app-abc123-m4n2q     0/1     CrashLoopBackOff   4          2h
my-app-abc123-r8v5w     0/1     CrashLoopBackOff   6          2h
```

Và bạn sẽ mất thời gian quý báu đi tìm bug trong application code — trong khi vấn đề chỉ là Postgres đang failover.

# Một vài lưu ý thêm

## Startup Probe

Nếu ứng dụng của bạn mất nhiều thời gian để khởi động (load model ML, warm cache, run migration...), hãy dùng `startupProbe`. Nếu không có startup probe, liveness probe có thể kill container trước khi nó kịp khởi động xong.

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
  # Cho phép tối đa 30 * 10 = 300 giây để khởi động
```

## Đừng quên timeout

Cấu hình `timeoutSeconds` cho probe là rất quan trọng. Mặc định là 1 giây — có thể quá ngắn nếu endpoint cần query database (readiness). Nhưng cũng đừng đặt quá cao, nếu không Kubernetes sẽ phản ứng chậm khi có sự cố.

## Đừng làm quá nhiều thứ trong probe

Readiness probe nên **nhẹ và nhanh**. `SELECT 1` là đủ để kiểm tra database connection. Đừng chạy complex query hay kiểm tra 10 external services trong một probe — nó sẽ tự biến thành bottleneck.

# Tổng kết

| | Liveness | Readiness |
|---|----------|-----------|
| **Hỏi gì** | Process còn sống không? | Có thể phục vụ traffic không? |
| **Khi fail** | Restart container | Ngưng route traffic đến pod |
| **Nên check** | Internal health (event loop, main thread) | Dependencies (DB, cache, external services) |
| **Nên check DB?** | **Không** | **Có** |

Quy tắc vàng: **liveness chỉ kiểm tra bản thân process, readiness kiểm tra khả năng làm việc**. Cấu hình sai không chỉ không giúp gì mà còn có thể biến một sự cố database 30 giây thành outage toàn hệ thống.

# Tham khảo

1. [Kubernetes - Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
2. [Google Cloud - Best practices for Kubernetes health checks](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-setting-up-health-checks-with-readiness-and-liveness-probes)
3. [CloudNativePG Documentation](https://cloudnative-pg.io/documentation/)
4. [Kubernetes Documentation - Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
