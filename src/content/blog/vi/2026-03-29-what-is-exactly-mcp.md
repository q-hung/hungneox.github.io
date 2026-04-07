---
layout: post
title: "Chính xác thì MCP là gì? Tóm tắt về Model Context Protocol"
date: 2026-03-29 21:00
categories: [ai]
author: hungneox
tags: [ai, mcp]
description: "Phần giới thiệu súc tích về Model Context Protocol (MCP): tại sao nó tồn tại, và cách mà các host, client, server, và transport kết nối trợ lý AI với các công cụ và dữ liệu."
image: /assets/posts/what-is-exactly-mcp/ai-touch.jpg
comments: true
published: true
---

# Ý tưởng chính

![AI Human Interaction](/assets/posts/what-is-exactly-mcp/ai-touch.jpg)

Nói một cách ngắn gọn, ***Model Context Protocol (MCP)*** là một tiêu chuẩn mở do Anthropic giới thiệu. Nó định nghĩa một ***giao thức chung*** để các trợ lý AI và công cụ có thể trao đổi ngữ cảnh một cách nhất quán. Về mặt ý tưởng, giao thức này rất trực diện: công bố đặc tả kỹ thuật, cung cấp các bản thực thi tham chiếu mã nguồn mở, và để hệ sinh thái cùng phát triển dựa trên một mô hình tích hợp duy nhất thay vì hàng tá các giải pháp tự phát (ad hoc) riêng lẻ.

Trước khi có MCP, việc kết nối một model AI tới từng loại dịch vụ hay kho dữ liệu thông thường đồng nghĩa với việc bạn phải dùng những đoạn **code chắp vá (custom glue code)**—để thực hiện các tích hợp riêng lẻ một lần cho các dịch vụ như Google Drive, GitHub, Slack, hoặc cho chính kho cơ sở dữ liệu của bạn. MCP ra đời để thế chân đi sự lộn xộn đó bằng **một phương thức tiêu chuẩn hóa, duy nhất** để một trợ lý AI (chẳng hạn như Claude) tự định vị được những chức năng (capabilities), trực tiếp gọi các công cụ (invoke tools), và bới tìm các tài nguyên trên khắp các dải backend này.


# Cơ chế hoạt động

- **MCP Host:** Là ứng dụng tích hợp trợ lý và quản lý phiên làm việc (session)—ví dụ như Claude Desktop, Cursor hoặc các môi trường phát triển tích hợp (IDE) khác. Host vận hành một hoặc nhiều MCP client, quyết định thời điểm sử dụng công cụ (tools) hoặc đọc tài nguyên (resources), đồng thời điều phối kết quả đầu ra của mô hình (như các lệnh gọi công cụ - tool calls) tới các client đó. Host không chỉ đơn thuần là một "bên yêu cầu dữ liệu"; nó đóng vai trò điều phối (orchestrate) toàn bộ flow.
- **MCP Client:** Là một module nằm bên trong ứng dụng chủ (host), có nhiệm vụ duy trì kết nối tới một MCP server duy nhất (thông thường mỗi client sẽ tương ứng với một server). Client sử dụng giao thức MCP—thường là các thông điệp [JSON-RPC 2.0](https://www.jsonrpc.org/specification) truyền tải qua [stdio](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#stdio) hoặc [HTTP với SSE](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) theo [đặc tả của MCP](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports). Nó gửi các yêu cầu từ host đến server và trả về kết quả dưới dạng cấu trúc dữ liệu. MCP client chạy ngay trong tiến trình local của host ngay cả khi mô hình ngôn ngữ được lưu trữ từ xa; nó chịu trách nhiệm định dạng các thông điệp giao thức và thay mặt host quản lý phiên kết nối tới server.

- **MCP Server:** Là một chương trình thực thi giao thức MCP và cung cấp các khả năng (capabilities) — ví dụ như các công cụ (tools - các hành động mà mô hình có thể gọi), tài nguyên (resources - dữ liệu có thể đọc) và các mẫu lệnh (prompts). Server thực hiện các yêu cầu từ phía client và trả về kết quả tương ứng. Một server thường chạy tại cục bộ (như truy cập hệ thống tệp, cơ sở dữ liệu, Git) nhưng cũng có thể chạy từ xa, tùy thuộc vào phương thức truyền tải và triển khai; bản chất nó không chỉ giới hạn "trên máy tính cá nhân", dù nhiều thiết lập ưu tiên dùng server cục bộ để đảm bảo quyền riêng tư và giảm độ trễ.


## Một flow tham khảo

Tóm tắt quy trình hoạt động
- Người dùng đặt câu hỏi trên ứng dụng Host (ví dụ: Cursor).
- Mô hình AI nhận diện rằng nó cần dữ liệu từ bên ngoài để trả lời.
- MCP Client (nằm trong Cursor) gửi một yêu cầu (request) chính thức tới MCP Server.
- MCP Server truy xuất dữ liệu (từ GitHub, hệ thống files, v.v.) và gửi phản hồi ngược lại.
- MCP Client nạp dữ liệu đó cho mô hình AI để tạo ra câu trả lời cuối cùng cho người dùng.


# Một ví dụ thiết kế về MCP server

Dưới đây là một MCP server về thời tiết tối giản được xây dựng bằng bộ [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) chính thức (FastMCP). Server này cung cấp một công cụ duy nhất là `current_weather`, giúp phân giải tên thành phố thông qua [Open-Meteo’s geocoding API](https://open-meteo.com/en/docs/geocoding-api) và đọc thông tin dự báo thời tiết mới nhất từ [weather API](https://open-meteo.com/en/docs). Bạn không cần API key để chạy, nhưng máy chủ (host machine) cần có quyền truy cập HTTPS ra ngoài (outbound).

Chỉ cần cài đặt SDK, lưu mã nguồn và chạy; ứng dụng chủ (ví dụ: Cursor hoặc Claude Desktop) sẽ khởi động tiến trình này và mặc định giao tiếp với nó thông qua luồng stdio khi bạn sử dụng lệnh `mcp.run()`.

```bash
pip install "mcp[cli]"
python weather_server.py
```

```python
"""weather_server.py — Một MCP server tí hon: trả về thời tiết hiện tại qua tên thành phố (Open-Meteo)."""

from __future__ import annotations

import json
from urllib.parse import quote
from urllib.request import urlopen

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Weather")


def _geocode(city: str) -> tuple[float, float]:
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={quote(city)}&count=1"
    with urlopen(url, timeout=15) as resp:
        data = json.load(resp)
    results = data.get("results") or []
    if not results:
        raise ValueError(f'Cannot find the coordinate of the city: "{city}"')
    r = results[0]
    return float(r["latitude"]), float(r["longitude"])


@mcp.tool()
def current_weather(city: str) -> str:
    """Nhiệt độ hiện tại và độ ẩm của một thành phố (ví dụ: Hanoi, Tokyo, Berlin)."""
    lat, lon = _geocode(city.strip())
    q = (
        "https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m"
    )
    with urlopen(q, timeout=15) as resp:
        payload = json.load(resp)
    cur = payload["current"]
    t = cur["temperature_2m"]
    h = cur.get("relative_humidity_2m")
    hum = f"{h}%" if h is not None else "n/a"
    return f"{city.strip()}: {t}°C, humidity {hum} (Source: Open-Meteo)"


if __name__ == "__main__":
    mcp.run()
```

Hãy trỏ ứng dụng MCP host của bạn vào file script này (cấu hình tương tự như các stdio server khác: chạy lệnh `python /path/to/weather_server.py`). Sau đó, trợ lý có thể tự động gọi công cụ `current_weather` mỗi khi người dùng hỏi về thông tin thời tiết.


```jsonc
//  .cursor/mcp.json
{
  "mcpServers": {
    "weather": {
      "type": "stdio",
      "command": "py",
      "args": [
        "-3",
        "${workspaceFolder}/weather_server.py"
      ]
    }
  }
}
```

![Cursor MCP](/assets/posts/what-is-exactly-mcp/cursor-mcp.png)

# Nguồn tham khảo

**MCP**

- [Model Context Protocol (Tài liệu công bố của nền tảng Anthropic)](https://www.anthropic.com/news/model-context-protocol)
- [Bản đặc tả MCP: các hệ luồng giao tiếp](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports) (stdio, HTTP với SSE)
- [Tự phát triển một MCP server](https://modelcontextprotocol.io/docs/develop/build-server)

**Protocol và phương thức liên kết mạch**

- [Tài liệu chính thức JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

**Các phương thức SDK và tập hợp dữ liệu làm mẫu**

- [Bộ mã SDK MCP ở dạng ngôn ngữ Python (kiến trúc FastMCP)](https://github.com/modelcontextprotocol/python-sdk)
- [Môi trường API của Open-Meteo](https://open-meteo.com/) (Dịch vụ móc ngoặc tọa độ và đọc thời tiết nằm trong viễn cảnh code mẫu ở trên)

**Khác**

- [LinkedIn: Cấu trúc bề nổi của hệ tầng MCP (diagram)](https://www.linkedin.com/posts/alexxubyte_systemdesign-coding-interviewtips-share-7441153714280800256-sYCp/)