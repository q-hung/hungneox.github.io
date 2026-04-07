---
layout: post
title: "What Exactly Is MCP? The Model Context Protocol in Brief"
date: 2026-03-29 21:00
categories: [ai]
author: hungneox
tags: [ai, mcp]
description: "A concise introduction to the Model Context Protocol (MCP): why it exists, and how hosts, clients, servers, and transports connect assistants to tools and data."
image: /assets/posts/what-is-exactly-mcp/ai-touch.jpg
comments: true
published: true
---

# The idea

![AI Human Interaction](/assets/posts/what-is-exactly-mcp/ai-touch.jpg)

In short, the **Model Context Protocol (MCP)** is an open standard introduced by Anthropic. It defines a **shared protocol** so assistants and tools can exchange context in a consistent way. Conceptually it is straightforward: publish the specification, ship open-source reference implementations, and let the ecosystem build on one integration model instead of dozens of ad hoc ones.

Before MCP, connecting a model to each product or datastore usually meant **custom glue code**—one-off integrations for services such as Google Drive, GitHub, Slack, or your own databases. MCP replaces that sprawl with a **single, standardized way** for an assistant (for example Claude) to discover capabilities, invoke tools, and read resources across those backends.


# How does it work?

- **MCP Host:** The application that embeds the assistant and owns the session—e.g. Claude Desktop, Cursor, or another IDE. The host runs one or more MCP clients, decides when to use tools or read resources, and wires model output (such as tool calls) to those clients. It is not only a “data requester”; it orchestrates the whole flow.
- **MCP Client:** A module inside the host that maintains a connection to a **single** MCP server (the usual pattern is one client per server). It speaks the MCP protocol—typically [JSON-RPC 2.0](https://www.jsonrpc.org/specification) messages over the [stdio](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#stdio) or [HTTP with SSE](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports#http-with-sse) transports defined in the [MCP spec](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports). It sends requests from the host to the server and returns structured results. The client runs in your local host process even when the model itself is hosted remotely; it formats protocol messages and handles the session to the server on the host’s behalf.
- **MCP Server:** A program that implements MCP and **exposes capabilities**—for example tools (actions the model can invoke), resources (readable data), and prompts. It fulfills requests from the client and returns results. A server often runs **locally** (filesystem, database, Git) but can also be **remote**, depending on transport and deployment; it is not inherently “only on your laptop,” though many setups use local servers for privacy and latency.


## Example flow

Summary of the Flow
- User asks a question in the Host (Cursor).
- AI Model realizes it needs external data.
- MCP Client (inside Cursor) sends a formal request to the MCP Server.
- MCP Server fetches the data (from GitHub, File System, etc.) and sends it back.
- MCP Client feeds that data to the AI Model to generate the final answer.


# Example MCP server

Below is a minimal **weather** MCP server built with the official [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) (`FastMCP`). It exposes one tool, `current_weather`, that resolves a city name with [Open-Meteo’s geocoding API](https://open-meteo.com/en/docs/geocoding-api) and reads the current forecast from the [weather API](https://open-meteo.com/en/docs)—no API key, but the host machine needs outbound HTTPS.

Install the SDK, save the script, and run it; the host (e.g. Cursor or Claude Desktop) starts the process and talks to it over **stdio** by default when you use `mcp.run()`.

```bash
pip install "mcp[cli]"
python weather_server.py
```

```python
"""weather_server.py — tiny MCP server: current weather by city (Open-Meteo)."""

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
        raise ValueError(f'No coordinates found for city: "{city}"')
    r = results[0]
    return float(r["latitude"]), float(r["longitude"])


@mcp.tool()
def current_weather(city: str) -> str:
    """Current temperature and humidity for a city (e.g. Hanoi, Tokyo, Berlin)."""
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
    return f"{city.strip()}: {t}°C, relative humidity {hum} (Open-Meteo)"


if __name__ == "__main__":
    mcp.run()
```

Point your MCP host at this script (same pattern as other stdio servers: run `python /path/to/weather_server.py`). The assistant can then call `current_weather` when a user asks for the weather.


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

# References

**MCP**

- [Model Context Protocol (Anthropic announcement)](https://www.anthropic.com/news/model-context-protocol)
- [MCP specification: transports](https://modelcontextprotocol.io/specification/2024-11-05/basic/transports) (stdio, HTTP with SSE)
- [Build an MCP server](https://modelcontextprotocol.io/docs/develop/build-server)

**Protocol and transports**

- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

**SDKs and sample data**

- [MCP Python SDK (FastMCP)](https://github.com/modelcontextprotocol/python-sdk)
- [Open-Meteo API](https://open-meteo.com/) (weather + geocoding used in the example above)

**Other**

- [LinkedIn: MCP / system design (diagram)](https://www.linkedin.com/posts/alexxubyte_systemdesign-coding-interviewtips-share-7441153714280800256-sYCp/)