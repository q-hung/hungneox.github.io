---
layout: post
title: "Tìm hiểu asyncio trong Python"
date: 2026-03-27 21:30
categories: [python, async]
author: hungneox
tags: [python, asyncio, fastapi, concurrency]
description: "Tìm hiểu về asyncio trong Python và ứng dụng trong FastAPI"
image: /assets/images/asyncio.png
comments: true
published: true
---

!["Python asyncio"](/assets/images/asyncio.png){: .center-image }

# Giới thiệu


Nếu bạn đã từng làm việc với JavaScript/TypeScript thì chắc hẳn đã quen thuộc với `async/await`. Python cũng có cơ chế tương tự thông qua thư viện `asyncio`, được đưa vào standard library từ Python 3.4 (2014) và dần trưởng thành qua các phiên bản sau đó. Tuy nhiên, khác với JavaScript vốn là single-threaded và event-driven từ đầu, Python có một lịch sử phức tạp hơn với concurrency, và `asyncio` ra đời để giải quyết một bài toán rất cụ thể: **I/O-bound concurrency**.

Bài viết này sẽ đi từ căn bản đến ứng dụng thực tế, đặc biệt là cách `asyncio` được tận dụng trong [FastAPI](https://fastapi.tiangolo.com/) — một trong những web framework phổ biến nhất của Python hiện nay.

# Tại sao cần asyncio?

Trước khi có `asyncio`, muốn xử lý đồng thời nhiều tác vụ I/O trong Python, bạn thường phải dùng `threading` hoặc `multiprocessing`. Cả hai đều có nhược điểm riêng:

- **Threading**: bị giới hạn bởi GIL (Global Interpreter Lock), các thread không thực sự chạy song song cho CPU-bound tasks. Quản lý thread cũng phức tạp và dễ gặp race condition.
- **Multiprocessing**: tốn tài nguyên hơn vì mỗi process có bộ nhớ riêng. Overhead khi tạo và giao tiếp giữa các process cũng không nhỏ.

Với các tác vụ I/O-bound (gọi API, đọc/ghi database, đọc file...), phần lớn thời gian chương trình chỉ **ngồi chờ** response. Trong lúc chờ đó, CPU hoàn toàn rảnh. `asyncio` cho phép chương trình tận dụng khoảng thời gian chờ này để làm việc khác, tất cả trên **một thread duy nhất**.

Về bản chất, `asyncio` sử dụng một **event loop** để quản lý các coroutine. Khi một coroutine gặp điểm `await` (tức là phải chờ I/O), event loop sẽ tạm dừng coroutine đó và chuyển sang thực thi coroutine khác đang sẵn sàng. Cơ chế này gọi là **cooperative multitasking** — các coroutine tự nguyện nhường quyền thực thi cho nhau.

# Các khái niệm cơ bản

## Coroutine

Một `coroutine` trong Python được khai báo bằng `async def`. Khác với hàm thông thường, khi gọi một coroutine nó không chạy ngay mà trả về một coroutine object. Bạn cần `await` nó hoặc đưa vào event loop để thực thi.

```python
import asyncio

async def say_hello(name: str) -> str:
    await asyncio.sleep(1)  # giả lập I/O operation
    return f"Hello, {name}!"

# Gọi trực tiếp say_hello("World") sẽ KHÔNG chạy hàm
# mà chỉ trả về một coroutine object
coro = say_hello("World")
print(type(coro))  # <class 'coroutine'>

# Để thực sự chạy, cần dùng asyncio.run()
result = asyncio.run(say_hello("World"))
print(result)  # Hello, World!
```

## Event Loop

Event loop là trái tim của `asyncio`. Nó chịu trách nhiệm lập lịch và thực thi các coroutine, xử lý I/O events, và chạy callbacks. Từ Python 3.10 trở đi, bạn hiếm khi cần tương tác trực tiếp với event loop — `asyncio.run()` lo hết.

```python
import asyncio

async def main():
    print("Bắt đầu")
    await asyncio.sleep(1)
    print("Sau 1 giây")

# asyncio.run() tạo event loop, chạy coroutine, rồi đóng loop
asyncio.run(main())
```

## Task và chạy đồng thời

Đây là phần thú vị nhất. Nếu bạn chỉ `await` tuần tự từng coroutine thì không khác gì code synchronous. Sức mạnh thực sự nằm ở việc chạy **đồng thời** nhiều coroutine.

```python
import asyncio
import time

async def fetch_data(source: str, delay: float) -> str:
    print(f"Bắt đầu fetch từ {source}...")
    await asyncio.sleep(delay)  # giả lập network call
    print(f"Xong {source}!")
    return f"Data from {source}"

async def main():
    start = time.perf_counter()

    # ❌ Cách tuần tự — tổng thời gian = 1 + 2 + 3 = 6 giây
    # r1 = await fetch_data("API A", 1)
    # r2 = await fetch_data("API B", 2)
    # r3 = await fetch_data("API C", 3)

    # ✅ Cách đồng thời — tổng thời gian ≈ 3 giây (max của 3 task)
    results = await asyncio.gather(
        fetch_data("API A", 1),
        fetch_data("API B", 2),
        fetch_data("API C", 3),
    )

    elapsed = time.perf_counter() - start
    print(f"Kết quả: {results}")
    print(f"Hoàn thành trong {elapsed:.1f}s")

asyncio.run(main())
```

Output sẽ kiểu như:

```
Bắt đầu fetch từ API A...
Bắt đầu fetch từ API B...
Bắt đầu fetch từ API C...
Xong API A!
Xong API B!
Xong API C!
Kết quả: ['Data from API A', 'Data from API B', 'Data from API C']
Hoàn thành trong 3.0s
```

Thay vì chờ 6 giây như cách tuần tự, `asyncio.gather()` cho phép cả 3 coroutine chạy đồng thời và tổng thời gian chỉ bằng task lâu nhất.

## asyncio.gather vs asyncio.create_task vs TaskGroup

Python cung cấp nhiều cách để chạy coroutine đồng thời, mỗi cách có ưu nhược điểm riêng:

### asyncio.gather()

Cách đơn giản nhất, gom nhiều coroutine lại và chờ tất cả hoàn thành. Kết quả trả về theo đúng thứ tự đầu vào.

```python
results = await asyncio.gather(
    fetch_data("A", 1),
    fetch_data("B", 2),
    return_exceptions=True  # không raise exception, trả về trong list
)
```

### asyncio.create_task()

Tạo một `Task` object và lập lịch chạy trên event loop. Bạn có thể `await` nó sau hoặc cancel nó.

```python
async def main():
    task1 = asyncio.create_task(fetch_data("A", 1))
    task2 = asyncio.create_task(fetch_data("B", 2))

    # Làm việc khác trong khi task1, task2 đang chạy...
    print("Đang xử lý gì đó...")

    result1 = await task1
    result2 = await task2
```

### asyncio.TaskGroup (Python 3.11+)

Đây là cách mới và được khuyến khích nhất. `TaskGroup` sử dụng context manager, đảm bảo tất cả task được cleanup đúng cách khi có exception.

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_data("A", 1))
        task2 = tg.create_task(fetch_data("B", 2))
        task3 = tg.create_task(fetch_data("C", 3))

    # Tất cả task đã hoàn thành khi thoát context manager
    print(task1.result(), task2.result(), task3.result())
```

Nếu bất kỳ task nào trong `TaskGroup` raise exception, tất cả task còn lại sẽ bị cancel. Đây là hành vi an toàn hơn so với `gather()` — tránh tình trạng task "zombie" chạy ngầm khi đã có lỗi.

# Một số pattern hữu ích

## Semaphore — giới hạn concurrency

Chạy đồng thời 10,000 request cùng lúc nghe có vẻ hay, nhưng server đầu kia (hoặc chính hệ thống của bạn) sẽ không vui. `asyncio.Semaphore` giúp giới hạn số coroutine chạy đồng thời.

```python
import asyncio
import aiohttp

async def fetch_url(session: aiohttp.ClientSession, url: str, sem: asyncio.Semaphore) -> str:
    async with sem:
        async with session.get(url) as response:
            return await response.text()

async def main():
    sem = asyncio.Semaphore(10)  # tối đa 10 request đồng thời
    urls = [f"https://httpbin.org/delay/1?n={i}" for i in range(100)]

    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url, sem) for url in urls]
        results = await asyncio.gather(*tasks)
```

## Timeout

Đừng bao giờ chờ một I/O operation mà không có timeout. `asyncio.wait_for()` hoặc `asyncio.timeout()` (Python 3.11+) giúp bạn làm điều này.

```python
async def risky_operation():
    await asyncio.sleep(10)
    return "done"

async def main():
    # Python 3.11+
    async with asyncio.timeout(5):
        result = await risky_operation()  # raise TimeoutError sau 5 giây

    # Hoặc cách cũ (vẫn hoạt động)
    try:
        result = await asyncio.wait_for(risky_operation(), timeout=5.0)
    except asyncio.TimeoutError:
        print("Hết thời gian chờ!")
```

## Queue — producer/consumer pattern

`asyncio.Queue` rất hữu ích cho pattern producer/consumer khi bạn cần pipeline dữ liệu.

```python
import asyncio
import random

async def producer(queue: asyncio.Queue, name: str):
    for i in range(5):
        item = f"{name}-item-{i}"
        await queue.put(item)
        await asyncio.sleep(random.uniform(0.1, 0.5))
    await queue.put(None)  # signal done

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Processing: {item}")
        await asyncio.sleep(0.2)
        queue.task_done()

async def main():
    queue: asyncio.Queue[str | None] = asyncio.Queue(maxsize=10)

    producers = [
        asyncio.create_task(producer(queue, f"P{i}"))
        for i in range(3)
    ]
    consumer_task = asyncio.create_task(consumer(queue))

    await asyncio.gather(*producers)
    await queue.join()
```

# asyncio trong FastAPI

[FastAPI](https://fastapi.tiangolo.com/) là một web framework được thiết kế từ đầu để tận dụng `asyncio`. Nó chạy trên [uvicorn](https://www.uvicorn.org/) (một ASGI server), tức là bản thân server đã có sẵn event loop. Đây là lý do FastAPI có thể xử lý hàng nghìn request đồng thời mà không cần phải spawn nhiều thread hay process như các WSGI framework truyền thống (Flask, Django).

## Cơ bản: async endpoint

```python
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/external-data")
async def get_external_data():
    async with httpx.AsyncClient() as client:
        response = await client.get("https://jsonplaceholder.typicode.com/todos/1")
        return response.json()
```

Khi bạn khai báo endpoint với `async def`, FastAPI sẽ chạy nó trực tiếp trên event loop. Điều này có nghĩa là trong khi một request đang chờ response từ external API, event loop có thể xử lý các request khác. Không có thread nào bị block.

## Khi nào dùng async def, khi nào dùng def?

Đây là câu hỏi hay mà nhiều người mới dùng FastAPI thường thắc mắc:

- **`async def`**: Dùng khi endpoint cần gọi các async I/O operations (gọi API, query database với async driver, đọc file async...).
- **`def`** (không có async): Dùng khi endpoint chỉ thực hiện CPU-bound operations hoặc gọi các thư viện synchronous. FastAPI sẽ tự động chạy hàm này trong một thread pool riêng để không block event loop.

```python
from fastapi import FastAPI
import httpx
import time

app = FastAPI()

# ✅ Async endpoint — dùng khi có async I/O
@app.get("/async-data")
async def get_async_data():
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.example.com/data")
        return resp.json()

# ✅ Sync endpoint — FastAPI tự chạy trong thread pool
@app.get("/cpu-heavy")
def compute_something():
    # Giả lập CPU-bound work
    result = sum(i * i for i in range(1_000_000))
    return {"result": result}

# ❌ SAI — async def nhưng dùng sync I/O sẽ block event loop
@app.get("/bad-example")
async def bad_endpoint():
    time.sleep(5)  # BLOCK cả event loop!
    return {"oops": "đừng làm thế này"}
```

Ví dụ thứ ba là một lỗi rất phổ biến. Khi bạn dùng `async def` nhưng gọi `time.sleep()` (hoặc bất kỳ blocking I/O nào), nó sẽ **block toàn bộ event loop**, nghĩa là tất cả request khác đều phải chờ. Nếu bạn phải dùng blocking I/O trong async context, hãy dùng `asyncio.to_thread()`:

```python
import asyncio

@app.get("/safe-blocking")
async def safe_blocking():
    result = await asyncio.to_thread(some_blocking_function)
    return {"result": result}
```

## Gọi nhiều service đồng thời

Một pattern rất phổ biến trong microservice architecture là endpoint cần aggregate dữ liệu từ nhiều service khác nhau. Với `asyncio`, bạn có thể gọi song song tất cả thay vì tuần tự.

```python
from fastapi import FastAPI
import httpx
import asyncio

app = FastAPI()

async def fetch_user(client: httpx.AsyncClient, user_id: int) -> dict:
    resp = await client.get(f"https://api.example.com/users/{user_id}")
    return resp.json()

async def fetch_orders(client: httpx.AsyncClient, user_id: int) -> list:
    resp = await client.get(f"https://api.example.com/orders?user_id={user_id}")
    return resp.json()

async def fetch_notifications(client: httpx.AsyncClient, user_id: int) -> list:
    resp = await client.get(f"https://api.example.com/notifications/{user_id}")
    return resp.json()

@app.get("/dashboard/{user_id}")
async def get_dashboard(user_id: int):
    async with httpx.AsyncClient() as client:
        user, orders, notifications = await asyncio.gather(
            fetch_user(client, user_id),
            fetch_orders(client, user_id),
            fetch_notifications(client, user_id),
        )

    return {
        "user": user,
        "orders": orders,
        "notifications": notifications,
    }
```

Nếu mỗi service mất khoảng 200ms để phản hồi, cách tuần tự sẽ mất ~600ms, trong khi `asyncio.gather()` chỉ mất ~200ms. Với hệ thống có hàng trăm request/giây, sự khác biệt này là rất đáng kể.

## Dependency Injection với async

FastAPI hỗ trợ async dependencies một cách tự nhiên:

```python
from fastapi import FastAPI, Depends
import httpx

app = FastAPI()

async def get_http_client():
    async with httpx.AsyncClient() as client:
        yield client

@app.get("/data")
async def get_data(client: httpx.AsyncClient = Depends(get_http_client)):
    resp = await client.get("https://api.example.com/data")
    return resp.json()
```

## Background Tasks

FastAPI tích hợp sẵn `BackgroundTasks` để chạy các tác vụ không cần trả kết quả ngay cho client (gửi email, ghi log, xử lý file...).

```python
from fastapi import FastAPI, BackgroundTasks

app = FastAPI()

async def send_notification(email: str, message: str):
    # Giả lập gửi email
    await asyncio.sleep(2)
    print(f"Sent '{message}' to {email}")

@app.post("/register")
async def register_user(email: str, background_tasks: BackgroundTasks):
    # Tạo user ngay lập tức...
    user = {"email": email, "status": "active"}

    # Gửi email trong background, không block response
    background_tasks.add_task(send_notification, email, "Welcome!")

    return user  # Response trả về ngay, không chờ email
```

# Những lưu ý quan trọng

## 1. asyncio không phải silver bullet

`asyncio` tỏa sáng với I/O-bound tasks. Nhưng nếu bạn cần xử lý CPU-bound (tính toán nặng, xử lý ảnh, ML inference...), `asyncio` **không giúp gì**. Trong trường hợp đó, hãy dùng `multiprocessing` hoặc offload sang worker queue (Celery, RQ...).

## 2. Cẩn thận với blocking code

Đây là lỗi phổ biến nhất: trộn sync blocking code vào async context. Các thư viện như `requests`, `psycopg2`, hay `time.sleep()` sẽ block event loop. Dùng các async alternatives như `httpx`, `asyncpg`, `aiofiles`.

| Sync (blocking)       | Async alternative   |
|-----------------------|---------------------|
| `requests`            | `httpx` / `aiohttp` |
| `psycopg2`           | `asyncpg`           |
| `open()` (file I/O)  | `aiofiles`          |
| `time.sleep()`       | `asyncio.sleep()`   |
| `sqlite3`            | `aiosqlite`         |

## 3. Debug asyncio

Bật debug mode để phát hiện các vấn đề tiềm ẩn:

```python
import asyncio

async def main():
    ...

asyncio.run(main(), debug=True)
```

Hoặc set biến môi trường `PYTHONASYNCIODEBUG=1`. Debug mode sẽ cảnh báo bạn khi có coroutine bị await quá lâu hoặc không được await.

# Tổng kết

`asyncio` là một công cụ mạnh mẽ trong Python cho các tác vụ I/O-bound. Nó cho phép viết code concurrent mà không cần phải vật lộn với thread hay process. FastAPI tận dụng `asyncio` một cách triệt để, cho phép xây dựng API có throughput cao với cú pháp đơn giản và clean.

Tuy nhiên, cần nhớ rằng `asyncio` không phải là giải pháp cho mọi bài toán. Hiểu rõ khi nào nên dùng `async def` và khi nào nên dùng `def` thông thường là chìa khoá để khai thác tối đa hiệu năng trong FastAPI nói riêng và Python nói chung.

# Tham khảo

1. [Python asyncio documentation](https://docs.python.org/3/library/asyncio.html)
2. [FastAPI - Concurrency and async / await](https://fastapi.tiangolo.com/async/)
3. [Real Python - Async IO in Python: A Complete Walkthrough](https://realpython.com/async-io-python/)
4. [uvicorn - An ASGI web server](https://www.uvicorn.org/)
5. [httpx - A next-generation HTTP client for Python](https://www.python-httpx.org/)
