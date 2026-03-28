---
layout: post
title: "Liveness vs Readiness Probes in Kubernetes"
date: 2026-03-27 21:45
categories: [systems]
author: hungneox
tags: [kubernetes]
description: "How liveness and readiness probes differ in Kubernetes, and how misconfiguration can take down your whole stack"
image: /assets/images/k8s.jpg
comments: true
published: true
---

# Introduction

If you have deployed applications to Kubernetes, you have almost certainly seen `livenessProbe` and `readinessProbe`. Many people treat them as two boxes to tick, copy a YAML snippet from Stack Overflow, point both at the same `/health` endpoint, and forget about it. Everything works—until the database goes down.

This post explains how the two probe types differ, and more importantly why **bad configuration can turn a small incident into a full-blown outage**.

# Health checks in Kubernetes

Kubernetes offers three probe types to assess container health:

| Probe | Purpose | When it fails |
|-------|---------|---------------|
| **Liveness** | Is the process still alive? | Kubernetes **restarts** the container |
| **Readiness** | Can this pod accept traffic? | Kubernetes **stops sending traffic** to the pod |
| **Startup** | Has startup finished? | Blocks liveness/readiness until it passes |

All three support three check mechanisms: `httpGet`, `tcpSocket`, and `exec`. This post focuses on liveness and readiness, where mistakes are most common.

# Liveness probe — “Are you still breathing?”

A liveness probe has exactly **one job**: confirm that the process inside the container is still running. It answers: “Is the process deadlocked, stuck in an infinite loop, or a zombie?”

If the liveness probe fails, Kubernetes **kills the container and starts a new one**. That is a heavy-handed action—like pulling the plug and plugging it back in.

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 10
  failureThreshold: 3
```

What should `/healthz` actually check? **As little as possible.** Ideally, only whether the event loop (Node.js), main thread (Java), or your app’s main process can still respond.

```python
@app.get("/healthz")
async def liveness():
    return {"status": "alive"}
```

Yes—returning 200 is enough. If the process is deadlocked or the event loop is stuck, it cannot answer this request, the probe times out → fails → triggers a restart. That is exactly the behavior we want.

# Readiness probe — “Are you ready to work?”

A readiness probe answers a different question: “Can this container serve traffic?” Unlike liveness, when readiness fails, Kubernetes **does not** restart the container. It removes the pod from Service endpoints—no more traffic is routed to that pod.

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  periodSeconds: 5
  failureThreshold: 3
```

This is where you **should** check dependencies:

```python
@app.get("/ready")
async def readiness():
    try:
        await db.execute("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

    return {"status": "ready"}
```

When the database is unavailable, the readiness probe fails, Kubernetes pulls the pod out of service endpoints, and no requests hit the pod. The pod keeps running, waiting for the database to recover. When the database is back, the app reconnects, the readiness probe passes, and traffic returns. Smooth—no restarts, no drama.

# Death spiral — when the liveness probe checks the database

Now imagine you configure the liveness probe to **also** hit the **database**:

```python
# ❌ DO NOT DO THIS
@app.get("/healthz")
async def bad_liveness():
    await db.execute("SELECT 1")  # checking the database in liveness!
    return {"status": "alive"}
```

Everything works—until Postgres has a problem. Maybe it is slow because of a heavy query, maybe it is failing over, maybe it is just a few seconds of network jitter. Regardless, this is what happens:

1. **Postgres is slow or unresponsive** → liveness probe times out
2. Failures exceed `failureThreshold` → **Kubernetes restarts the container**
3. The new container starts → tries to **reconnect to Postgres** (which is already overloaded)
4. Connection fails → liveness fails again → **another restart**
5. Repeat across **every pod** at once

This is a **death spiral**, also known as a **thundering herd**. Kubernetes keeps killing and restarting containers; each new container hammers connection attempts against a dying database. Instead of letting the database recover, you pour fuel on the fire.

From a monitoring perspective, you see pods stuck in `CrashLoopBackOff` and assume the application code is broken. In reality the app is fine—it just cannot reach the database. You cannot tell infrastructure failures from application bugs. That is the cost of a bad probe split.

# The right configuration

The rule of thumb is simple:

- **Liveness** = **internal** checks (is the process stuck or deadlocked?)
- **Readiness** = **ability to serve** (can we reach dependencies?)

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

And on the application side:

```python
from fastapi import FastAPI, HTTPException
import asyncpg

app = FastAPI()
db_pool: asyncpg.Pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(dsn="postgresql://...")

# Liveness: only prove the process is alive
@app.get("/healthz")
async def liveness():
    return {"status": "alive"}

# Readiness: check dependencies
@app.get("/ready")
async def readiness():
    try:
        async with db_pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception:
        raise HTTPException(status_code=503, detail="Not ready")
    return {"status": "ready"}
```

# When Postgres goes down—with correct configuration

Suppose you use [CloudNativePG](https://cloudnative-pg.io/) (CNPG) to run a Postgres cluster on Kubernetes. When the primary has issues, this is roughly what happens:

| Step | State |
|------|--------|
| Postgres primary fails | CNPG starts failover to a replica |
| App loses DB connection | Readiness fails → K8s stops sending traffic |
| Liveness still passes | Pod stays `Running`, no restart |
| CNPG finishes failover | New primary is ready |
| App reconnects | Readiness passes → traffic returns |

When you run `kubectl get pods`, you might see:

```
NAME                    READY   STATUS    RESTARTS   AGE
my-app-abc123-x7k9p     0/1     Running   0          2h
my-app-abc123-m4n2q     0/1     Running   0          2h
my-app-abc123-r8v5w     0/1     Running   0          2h
```

`0/1 Running` means the pod is running (`Running`) but not ready for traffic (`0/1 Ready`). That state is useful: it tells you **“the process is fine; only the data path is blocked.”** No restarts, no `CrashLoopBackOff`, no drama. When the database recovers, things recover automatically.

If you had used liveness to check the database, you would instead see:

```
NAME                    READY   STATUS             RESTARTS   AGE
my-app-abc123-x7k9p     0/1     CrashLoopBackOff   5          2h
my-app-abc123-m4n2q     0/1     CrashLoopBackOff   4          2h
my-app-abc123-r8v5w     0/1     CrashLoopBackOff   6          2h
```

…and you would waste time hunting for bugs in application code while the real issue was Postgres failing over.

# A few more notes

## Startup probe

If your app takes a long time to start (loading an ML model, warming a cache, running migrations…), use a `startupProbe`. Without it, the liveness probe can kill the container before startup finishes.

```yaml
startupProbe:
  httpGet:
    path: /healthz
    port: 8080
  failureThreshold: 30
  periodSeconds: 10
  # Allows up to 30 * 10 = 300 seconds for startup
```

## Do not forget timeouts

`timeoutSeconds` on probes matters. The default is one second, which may be too short if the endpoint queries the database (readiness). Do not set it sky-high either, or Kubernetes will react slowly when something is wrong.

## Do not do too much inside a probe

Readiness probes should be **light and fast**. `SELECT 1` is enough to verify a database connection. Do not run complex queries or check ten external services in one probe—it becomes its own bottleneck.

# Summary

| | Liveness | Readiness |
|---|----------|-----------|
| **Question** | Is the process alive? | Can it serve traffic? |
| **On failure** | Restart container | Stop routing traffic to the pod |
| **What to check** | Internal health (event loop, main thread) | Dependencies (DB, cache, external services) |
| **Check the DB?** | **No** | **Yes** |

Golden rule: **liveness checks only the process itself; readiness checks whether it can do useful work.** Misconfiguration does not just fail to help—it can turn a 30-second database blip into a full-stack outage.

# References

1. [Kubernetes - Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
2. [Google Cloud - Best practices for Kubernetes health checks](https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-setting-up-health-checks-with-readiness-and-liveness-probes)
3. [CloudNativePG Documentation](https://cloudnative-pg.io/documentation/)
4. [Kubernetes Documentation - Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
