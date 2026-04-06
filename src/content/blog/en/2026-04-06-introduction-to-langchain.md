---
layout: post
title: "Introduction to Langchain"
date: 2026-04-06 21:00
categories: [ai, llm, programming]
author: hungneox
tags: [ai, llm, langchain]
description: "Introduction to Langchain"
image: /assets/posts/langchain/cover.jpg
comments: true
published: true
---

# Introduction

![Langchain cover](/assets/posts/langchain/cover.jpg)

LangChain is a Python framework for building applications on top of language models. Instead of writing raw API calls to OpenAI or Google yourself, LangChain gives you a standard interface and a set of useful abstractions that make the whole process much less painful.


# Langchain core components
LangChain is organized around a few key building blocks. Once you understand these, the rest of the framework clicks into place:

- **Models**: A unified interface to talk to any LLM (OpenAI, Anthropic, Gemini, etc.). You can swap providers with one line of code without rewriting your app.
- **Prompts**: Templates that help you construct and reuse the instructions you send to the model. Think of them like string formatters with superpowers — you define placeholders for roles, constraints, and data inputs.
- **Chains**: Sequences of operations linked together. For example: `[Retrieve Data] → [Summarize with LLM] → [Translate]`. This is where LangChain really shines.
- **Indexes & Retrievers**: Tools for RAG (Retrieval-Augmented Generation). These let the AI "read" your PDFs, databases, or websites so it can answer questions based on your own data, not just what it learned during training.
- **Memory**: LLMs are stateless by default — every request is independent. Memory components let the AI keep track of a conversation, so it doesn't forget your name or what you asked two messages ago.

# LLM

Before diving into code, it helps to know what LLMs are actually good at — and where they will bite you.

**Where they excel**
- **Summarization & rewriting**: Turning 50 pages of meeting notes into five bullet points, or rewriting a technical doc for a non-technical audience.
- **Brainstorming & code generation**: Great for breaking writer's block or churning out boilerplate.
- **Structured reasoning**: They perform much better when you use techniques like prompt engineering, RAG, and Chain of Thought.

**Where to be careful**
- **Hallucinations**: They will state falsehoods with absolute confidence. Always verify facts, citations, and anything legal or medical.
- **Data privacy**: Never feed sensitive company data or PII into a public model unless you're using an enterprise-grade, private instance.
- **Sycophancy & stale knowledge**: They tend to agree with you even when you're wrong, and their training data has a cutoff date.

## Key techniques for working with LLMs

I mentioned prompt engineering, RAG, and Chain of Thought above. These are worth understanding before writing any LangChain code, because the framework is essentially built around making these techniques easier to implement.

### Prompt Engineering

Instead of asking the model a vague question like "Write a report," you give it a structured context. Typically this means specifying a **role** ("Act as a senior financial analyst"), a **task** ("Analyze this quarterly statement"), and **constraints** ("Keep it under 300 words, professional tone"). The more specific you are, the better the output. LangChain's prompt templates exist precisely for this — they let you define these structures once and reuse them with different inputs.

### Retrieval-Augmented Generation (RAG)

The idea behind RAG is simple: don't rely on the model's training data for facts. Instead, feed it the actual documents you want it to reason about — your internal PDFs, database records, wiki pages, etc. The model uses this context to generate an answer grounded in real, up-to-date information rather than guessing from memory. This is one of the most practical patterns in production LLM applications, and LangChain's retrievers and indexes are built specifically for it.

### Chain of Thought (CoT)

When you ask a model to "think step-by-step" before giving a final answer, you're using Chain of Thought prompting. By forcing the model to show its reasoning process, you significantly reduce logic errors — especially in math, multi-step problems, or complex troubleshooting. It's a surprisingly simple trick that makes a big difference in output quality.

# Using LLM with LangChain

```bash
# Install LangChain and the Google GenAI integration package
pip install langchain langchain-google-genai
```

## Simple question

```python
from langchain_google_genai import ChatGoogleGenerativeAI

# Initialize the Gemini 2.5 Flash Lite model
# Ensure your GOOGLE_API_KEY is set in your environment variables
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

response = llm.invoke("Hello, how are you?")

print(response.content)
```


## Multiple messages

Passing a single string works for quick tests, but real applications need more control. LangChain lets you structure conversations using different message types: a `SystemMessage` sets the AI's persona and rules, while `HumanMessage` objects carry the actual user queries. This is how you steer the model's behavior in practice.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Initialize the Gemini 2.5 Flash Lite model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

messages = [
    SystemMessage(content="You are a helpful and concise AI assistant."),
    HumanMessage(content="What is a good starting framework for AI?"),
    HumanMessage(content="What is 2+4?"),
]

response = llm.invoke(messages)

print(response.content)
```

# Prompt Template

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

# Initialize the Gemini 2.5 Flash Lite model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Create a prompt template with a variable placeholder
template = "You are an expert naming consultant. What is a good name for a company that makes {product}?"
prompt = PromptTemplate.from_template(template)

# Format the prompt with data
formatted_prompt = prompt.format(product="eco-friendly water bottles")

response = llm.invoke(formatted_prompt)

print(response.content)
```

## Output Parser

LLMs return raw text, but in practice you usually want structured data — a Python list, a JSON object, etc. Output parsers handle that conversion for you. A simple `StrOutputParser` just extracts the text string from the response object, but more advanced parsers like `CommaSeparatedListOutputParser` can turn the model's output directly into Python data structures.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import CommaSeparatedListOutputParser

# Initialize the Gemini 2.5 Flash Lite model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Initialize an output parser that converts comma-separated text into a Python list
output_parser = CommaSeparatedListOutputParser()

# The parser can also provide formatting instructions to guide the LLM
format_instructions = output_parser.get_format_instructions()

prompt = f"List 5 popular programming languages. {format_instructions}"

# Invoke the model
response = llm.invoke(prompt)

# Parse the raw AIMessage into a clean Python list
parsed_list = output_parser.invoke(response)

print(parsed_list)
# Example output: ['Python', 'JavaScript', 'Java', 'C++', 'Go']
```

## Creating a chain

A chain is where everything comes together. Instead of manually formatting a prompt, calling the model, and then parsing the output in separate steps, you wire them up into a single pipeline.

Modern LangChain uses LCEL (LangChain Expression Language) with the pipe operator (`|`) to connect components — the output of one step feeds directly into the next, similar to Unix pipes.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Initialize the Gemini 2.5 Flash Lite model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Create our prompt template
template = "You are an expert naming consultant. What is a good name for a company that makes {product}?"
prompt = PromptTemplate.from_template(template)

# Create an output parser to extract just the string from the model's message
output_parser = StrOutputParser()

# Create a chain using LCEL (LangChain Expression Language)
chain = prompt | llm | output_parser

# Invoke the entire chain at once
response = chain.invoke({"product": "eco-friendly water bottles"})

print(response)
```

# References

- LangChain. "Introduction." LangChain Python Documentation. [https://python.langchain.com/docs/get_started/introduction](https://python.langchain.com/docs/get_started/introduction)
- LangChain. "ChatGoogleGenerativeAI." LangChain Integrations. [https://python.langchain.com/docs/integrations/chat/google_generative_ai](https://python.langchain.com/docs/integrations/chat/google_generative_ai)
- LangChain. "Prompt Templates." LangChain Python Documentation. [https://python.langchain.com/docs/modules/model_io/prompts/](https://python.langchain.com/docs/modules/model_io/prompts/)
- LangChain. "Output Parsers." LangChain Python Documentation. [https://python.langchain.com/docs/modules/model_io/output_parsers/](https://python.langchain.com/docs/modules/model_io/output_parsers/)
- LangChain. "LangChain Expression Language (LCEL)." LangChain Python Documentation. [https://python.langchain.com/docs/expression_language/](https://python.langchain.com/docs/expression_language/)
- LangChain. "Build a Retrieval Augmented Generation (RAG) App." LangChain Tutorials. [https://python.langchain.com/docs/tutorials/rag/](https://python.langchain.com/docs/tutorials/rag/)
- DAIR.AI. "Prompt Engineering Guide." [https://www.promptingguide.ai/](https://www.promptingguide.ai/)
- DAIR.AI. "Chain-of-Thought Prompting." Prompt Engineering Guide. [https://www.promptingguide.ai/techniques/cot](https://www.promptingguide.ai/techniques/cot)
- Wei, J., et al. "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *Advances in Neural Information Processing Systems*, vol. 35, 2022. [https://arxiv.org/abs/2201.11903](https://arxiv.org/abs/2201.11903)
- Lewis, P., et al. "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks." *Advances in Neural Information Processing Systems*, vol. 33, 2020. [https://arxiv.org/abs/2005.11401](https://arxiv.org/abs/2005.11401)