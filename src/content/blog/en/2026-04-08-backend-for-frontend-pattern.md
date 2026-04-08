---
layout: post
title: "Backend for Frontend Pattern"
date: 2026-04-08 23:00
categories: [architecture, systems]
author: hungneox
tags: [architecture, design-patterns, microservices]
description: "A practical look at the Backend for Frontend (BFF) pattern: why it exists, how it compares to direct service calls, and when you should (and shouldn't) reach for it."
image: /assets/posts/backend-for-frontend/bff.png
comments: true
published: true
---

# Context and problem

![BFF](/assets/posts/backend-for-frontend/bff.png)

When you have a single general-purpose API serving multiple clients — a web app, a mobile app, maybe a smart TV app — things get messy fast. The mobile client needs a compact payload with only the fields it can actually render on a small screen, while the web dashboard wants rich, nested data in a single round-trip. The TV app wants something else entirely. Before long, your "general" API is full of query parameters like `?platform=ios&slim=true`, conditional logic in controllers, and response shapes that satisfy nobody perfectly.

This is the exact problem that the **Backend for Frontend (BFF)** pattern was designed to solve.

The term was coined by **Sam Newman** around 2015, while he was working with teams at SoundCloud and writing *Building Microservices*. The idea came from a practical observation: different frontends have fundamentally different needs, and trying to serve them all from one monolithic API gateway leads to bloat, slower iteration, and painful coupling between teams. Instead of one API that compromises for everyone, you create a **dedicated backend for each frontend experience**.

Each BFF is a thin server-side component — owned by the frontend team — that sits between the client and the downstream microservices. It aggregates, transforms, and tailors the data specifically for its client. The iOS team gets an iOS BFF. The web team gets a web BFF. Each one evolves independently.

# How it works

## Without BFF: direct service calls

In a typical microservices setup without BFF, the client talks to multiple backend services directly (or through a single generic API gateway):

```
┌──────────────┐
│   Mobile App │
└──────┬───────┘
       │  ┌──────────────────┐
       ├──► User Service     │
       │  └──────────────────┘
       │  ┌──────────────────┐
       ├──► Product Service  │
       │  └──────────────────┘
       │  ┌──────────────────┐
       └──► Order Service    │
          └──────────────────┘

┌──────────────┐
│   Web App    │
└──────┬───────┘
       │  ┌──────────────────┐
       ├──► User Service     │
       │  └──────────────────┘
       │  ┌──────────────────┐
       ├──► Product Service  │
       │  └──────────────────┘
       │  ┌──────────────────┐
       └──► Order Service    │
          └──────────────────┘
```

Every client makes multiple calls, handles its own data aggregation, and deals with the mismatch between what the service returns and what the UI actually needs. On a slow mobile connection, this is brutal.

## With BFF

Each client gets its own backend that does the heavy lifting:

```
┌──────────────┐    ┌──────────────┐
│   Mobile App │    │   Web App    │
└──────┬───────┘    └──────┬───────┘
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Mobile BFF  │    │   Web BFF    │
└──────┬───────┘    └──────┬───────┘
       │                   │
       │   ┌───────────────┤
       │   │               │
       ▼   ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│   User     │  │  Product   │  │   Order    │
│  Service   │  │  Service   │  │  Service   │
└────────────┘  └────────────┘  └────────────┘
```

The Mobile BFF calls the same downstream services but returns a compact, mobile-optimized response — maybe fewer fields, pre-formatted dates, combined payloads. The Web BFF returns richer data suited for a desktop layout. Each BFF is a separate deployable, often owned by the respective frontend team.

# Comparison

| Aspect | Direct calls / generic gateway | BFF |
|---|---|---|
| **Client complexity** | High — client aggregates data from multiple services | Low — single call to the BFF returns everything needed |
| **Payload optimization** | One-size-fits-all responses, over-fetching common | Tailored per client, minimal payload |
| **Latency** | Multiple round-trips from client | One round-trip; aggregation happens server-side |
| **Team autonomy** | Frontend teams depend on backend API changes | Frontend team owns their BFF, iterates independently |
| **Deployment coupling** | Changes to one client's needs can break others | Each BFF deploys independently |
| **Operational overhead** | Fewer services to maintain | More services — one BFF per frontend |
| **Code duplication** | Minimal on the backend | Some shared logic across BFFs if not managed carefully |
| **Security surface** | Each client connects directly to services | BFF acts as a controlled entry point per client |

## Security and scalability considerations

**Security** is actually one of the strengths of BFF. Each BFF can enforce its own authentication and authorization logic. A mobile BFF might use OAuth with short-lived tokens, while an internal admin BFF uses mTLS. You can also limit the data each BFF exposes — the public-facing mobile BFF never needs to return internal admin fields, so those fields never leave the backend. This reduces the blast radius if a client is compromised.

**Scalability** can go either way. On one hand, BFFs are typically stateless and easy to scale horizontally — you just spin up more instances behind a load balancer. On the other hand, you now have N more services to monitor, deploy, and keep healthy. If your organization already has mature DevOps practices (CI/CD pipelines, container orchestration, observability), this is manageable. If you're a small team without that infrastructure, the operational cost can outweigh the benefits.

# When to use this pattern

BFF makes sense when:

- **You have multiple client types with meaningfully different needs.** A mobile app and a web dashboard consuming the same data but requiring different shapes, volumes, and interaction patterns.
- **Frontend teams need autonomy.** When the web team shouldn't have to wait for the "platform API team" to add a field or change a response format.
- **You want to reduce client-side complexity.** Especially on mobile, where battery, bandwidth, and latency matter — pushing aggregation to the server makes a real difference.
- **You need client-specific security boundaries.** Different auth flows, rate limits, or data exposure rules per client.

BFF is probably overkill when:

- **You have a single client** or all your clients need roughly the same data. A well-designed REST or GraphQL API will serve you better with less overhead.
- **Your team is small** and can't absorb the operational cost of maintaining multiple backends.
- **The data needs are simple.** If your frontend just reads a few resources without complex aggregation, a generic API is fine.

## BFF vs. GraphQL

GraphQL is often proposed as an alternative to BFF, and it does solve part of the same problem — specifically, the over-fetching and under-fetching issue. With GraphQL, the client specifies exactly what fields it needs, so a mobile app can request a slim response while the web app requests a richer one, all from the same endpoint.

But GraphQL and BFF solve the problem at different layers. GraphQL gives the **client** control over the response shape. BFF gives the **server** control, which is sometimes what you actually want — especially when the "tailoring" involves orchestrating multiple services, applying business logic, caching, or enforcing security rules that shouldn't live on the client.

In practice, **they can be complementary**. Some teams use a BFF that exposes a GraphQL endpoint to its specific client, getting the best of both worlds: server-side aggregation and client-side query flexibility.

## Is it still relevant?

Absolutely. The BFF pattern is alive and well in large-scale production systems:

- **Netflix** uses BFFs extensively. Each device type (TV, mobile, web) has its own backend that calls shared microservices and returns device-optimized responses. Their engineering blog has written about this multiple times.
- **SoundCloud** — where the pattern was originally formalized — used per-client BFFs to let frontend teams ship independently of the core platform.
- **Spotify** adopted BFF-like patterns to serve different experiences (mobile player, desktop app, embedded devices) from tailored backends.
- **Microsoft** documents BFF as a recommended cloud design pattern in the [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends).

The pattern hasn't lost relevance because the underlying problem hasn't gone away: different clients still have different needs, and trying to solve that with a single API still leads to the same compromises it did a decade ago.

# References

- Newman, S. "Pattern: Backends For Frontends." Sam Newman's Blog. [https://samnewman.io/patterns/architectural/bff/](https://samnewman.io/patterns/architectural/bff/)
- Microsoft. "Backends for Frontends pattern." Azure Architecture Center. [https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends)
- Newman, S. *Building Microservices: Designing Fine-Grained Systems.* O'Reilly Media, 2015.
- Netflix Technology Blog. "Optimizing the Netflix API." [https://netflixtechblog.com/optimizing-the-netflix-api-5c9ac715cf19](https://netflixtechblog.com/optimizing-the-netflix-api-5c9ac715cf19)
- Thoughtworks Technology Radar. "BFF — Backend for Frontend." [https://www.thoughtworks.com/radar/techniques/bff-backend-for-frontends](https://www.thoughtworks.com/radar/techniques/bff-backend-for-frontends)
- [https://bff-patterns.com/](https://bff-patterns.com/)
