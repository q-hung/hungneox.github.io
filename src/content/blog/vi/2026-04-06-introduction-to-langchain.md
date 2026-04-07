---
layout: post
title: "Giới thiệu về LangChain"
date: 2026-04-06 21:00
categories: [ai, llm]
author: hungneox
tags: [ai, llm, langchain]
description: "Giới thiệu cơ bản về framework LangChain: Các thành phần cốt lõi, khái niệm về LLM và cách xây dựng ứng dụng AI với Python."
image: /assets/posts/langchain/cover.jpg
comments: true
published: true
---

# Giới thiệu

![Langchain cover](/assets/posts/langchain/cover.jpg)

LangChain là một Python framework để xây dựng các ứng dụng trên nền tảng các mô hình ngôn ngữ (language models). Thay vì phải tự viết các raw API calls trực tiếp đến OpenAI hay Google, LangChain cung cấp cho bạn một giao diện tiêu chuẩn và một tập hợp các lớp trừu tượng hữu ích giúp cho toàn bộ quá trình trở nên bớt "khổ sở" hơn.

# Các thành phần cốt lõi của Langchain

LangChain được tổ chức xoay quanh một vài component chính. Một khi bạn hiểu được những thành phần này, phần còn lại của framework sẽ trở nên rất dễ dàng nắm bắt:

- **Models**: Một giao diện lập trình hợp nhất (unified interface) để giao tiếp với bất kỳ LLM nào (OpenAI, Anthropic, Gemini, v.v.). Bạn có thể thay đổi nhà cung cấp chỉ với một dòng code mà không cần phải viết lại toàn bộ ứng dụng.
- **Prompts**: Các template giúp bạn cấu trúc và tái sử dụng các câu lệnh (instructions) gửi tới model. Hãy nghĩ về chúng như những công cụ định dạng chuỗi với sức mạnh siêu phàm — nơi bạn có thể định nghĩa sẵn các biến thay thế (placeholders) cho các phân vai (roles), các ràng buộc (constraints) và dữ liệu đầu vào.
- **Chains**: Chuỗi các thao tác được liên kết với nhau. Ví dụ: `[Lấy dữ liệu] → [Tóm tắt bằng LLM] → [Dịch thuật]`. Đây chính là điểm mà LangChain thực sự tỏa sáng.
- **Indexes & Retrievers**: Các công cụ dành cho RAG (Retrieval-Augmented Generation). Chúng cho phép AI "đọc hiểu" các file PDF, cơ sở dữ liệu hoặc trang web của bạn để có thể trả lời các câu hỏi dựa trên chính dữ liệu thực tế của bạn, chứ không chỉ dựa vào những gì nó học được trong quá trình huấn luyện ban đầu.
- **Memory**: Mặc định các LLM ở trạng thái không lữu trữ (stateless) — mỗi request đều hoàn toàn độc lập. Các thành phần Memory giúp AI theo dõi hội thoại, nhờ đó nó sẽ không quên tên của bạn hoặc những gì bạn vừa hỏi ở các tin nhắn trước.

# LLM

Trước khi đi sâu vào code, việc hiểu rõ các LLM thực sự làm tốt việc gì — và điểm nào chúng sẽ làm khó bạn — là rất hữu ích.

**Những điểm chúng làm xuất sắc**
- **Tóm tắt (Summarization) & viết lại (rewriting)**: Biến 50 trang ghi chú cuộc họp thành năm dòng gạch đầu dòng, hoặc viết lại một tài liệu kỹ thuật rườm rà thành một văn bản cho những người không có chuyên môn.
- **Brainstorming & sinh mã code**: Tuyệt vời trong việc phá vỡ hội chứng bí ý tưởng hoặc tạo ra các đoạn mã khung (boilerplate) tốn thời gian.
- **Suy luận có cấu trúc**: Chúng hoạt động tốt hơn hẳn khi bạn sử dụng các kỹ thuật như prompt engineering, RAG, và Chain of Thought.

**Những điểm cần cẩn trọng**
- **Ảo giác (Hallucinations)**: Chúng có thể tuyên bố các thông tin sai lệch với sự tự tin tuyệt đối. Hãy luôn xác minh lại các thông tin sự thật, trích dẫn, cũng như mọi thứ liên quan đến pháp lý hoặc y tế.
- **Quyền riêng tư dữ liệu (Data privacy)**: Tuyệt đối không đưa các dữ liệu nhạy cảm của công ty hoặc PII (Thông tin cá nhân) vào một public model, trừ khi bạn đang dùng một phiên bản doanh nghiệp và được mã hóa.
- **Ba phải và dữ liệu không cập nhật**: Chúng có xu hướng đồng tình với bạn ngay cả khi bạn nói sai, và dữ liệu huấn luyện của chúng có ngày giới hạn (cutoff date) trễ hơn thời gian thực.

## Các kỹ thuật làm việc với LLMs quan trọng

Mình đã nhắc đến prompt engineering, RAG, và Chain of Thought ở trên. Đây là những kỹ thuật rất đáng để hiểu rõ trước khi viết bất kỳ đoạn code LangChain nào, bởi vì framework này về cơ bản được xây dựng nhằm mục đích giúp cho việc ứng dụng các kỹ thuật này trở nên thuận lợi hơn.

### Prompt Engineering

Thay vì hỏi model một câu mập mờ kiểu "Hãy viết báo cáo," bạn cung cấp cho nó một ngữ cảnh có cấu trúc. Thông thường, điều này bao gồm việc chỉ định một **vai trò** ("Act as a financial analyst"), một **nhiệm vụ** ("Analyze the quarterly report"), và các **ràng buộc** ("Write under 300 words, with a professional tone"). Càng cụ thể, output trả về càng tốt. Các prompt template của LangChain tồn tại chính vì mục đích này — chúng cho phép bạn định nghĩa các cấu trúc này một lần và tái sử dụng chúng với nhiều loại dữ liệu đầu vào.

### Retrieval-Augmented Generation (RAG)

Ý tưởng đằng sau RAG rất đơn giản: đừng phụ thuộc vào dữ liệu huấn luyện của model đối với các sự kiện thực tế. Thay vào đó, hãy cung cấp cho nó các tài liệu thực tế mà bạn muốn nó suy luận — các tệp PDF nội bộ, dữ liệu từ database, các trang wiki, v.v. Model sẽ sử dụng các thông tin này để tạo ra câu trả lời được dựa trên thông tin thực tế, cập nhật nhất thay vì tự "đoán mò" từ bộ nhớ. Đây là một trong những pattern thực tiễn nhất trong việc xây dựng ứng dụng LLM trong môi trường production, và các retrievers cùng indexes của LangChain được tính toán đặc biệt chuyên trị cho vấn đề này.

### Chain of Thought (CoT)

Khi bạn yêu cầu một model "hãy suy nghĩ từng bước một" trước khi đưa ra câu trả lời cuối cùng, đó là lúc bạn đang sử dụng kiểu Chain of Thought prompting. Bằng cách ép model phải trình bày từng bước quy trình suy luận của mình, bạn sẽ giảm thiểu khả năng lỗi logc — đặc biệt là trong các bài toán, những vấn đề quy trình phức tạp nhiều bước, hoặc quá trình gỡ lỗi (troubleshooting). Đây là một trick đơn giản một cách bất ngờ nhưng mang lại sự khác biệt lớn về chất lượng đầu ra.

# Ứng dụng LLM với LangChain

```bash
# Cài đặt LangChain và package tích hợp Google GenAI
pip install langchain langchain-google-genai
```

## Các câu hỏi đơn giản

```python
from langchain_google_genai import ChatGoogleGenerativeAI

# Khởi tạo mô hình Gemini 2.5 Flash Lite
# Đảm bảo bạn đã export biến môi trường GOOGLE_API_KEY
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

response = llm.invoke("Hello, how are you?")

print(response.content)
```

## Giải quyết nhiều tin nhắn (Multiple messages)

Việc truyền một chuỗi string duy nhất sẽ phù hợp cho những bài test nhanh, nhưng các ứng dụng thực tế sẽ đòi hỏi bạn phải kiểm soát khắt khe hơn thế. LangChain cho phép bạn cấu trúc lại các đoạn hội thoại bằng cách sử dụng các đối tượng tin nhắn khác nhau: một `SystemMessage` dùng để đóng khung vai trò và các luật định cho AI, trong khi các đối tượng `HumanMessage` sẽ đem theo các các câu hỏi truy vấn của người dùng. Trong thực tế, bạn sẽ phải định hướng hành vi của model bằng cách này.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Khởi tạo mô hình Gemini 2.5 Flash Lite
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

# Khởi tạo mô hình Gemini 2.5 Flash Lite
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Tạo một mẫu prompt với biến tham số thay thế
template = "You are an expert naming consultant. What is a good name for a company that makes {product}?"
prompt = PromptTemplate.from_template(template)

# Format lại prompt với dữ liệu cụ thể
formatted_prompt = prompt.format(product="eco-friendly water bottles")

response = llm.invoke(formatted_prompt)

print(response.content)
```

## Output Parser

Các LLM bình thường luôn trả về chuỗi text thuần túy (raw text), nhưng trong thực tế người ta làm việc nhiều hơn với các cấu trúc dữ liệu — một `list` trong Python, một đối tượng JSON v.v. Output parsers sẽ gánh lấy công việc biên dịch đó cho bạn. Một hàm đơn giản như `StrOutputParser` chỉ trích xuất duy nhất văn bản text ra khỏi đối tượng được phản hồi, nhưng những parser cao cấp hơn như `CommaSeparatedListOutputParser` có thể thay thế và "chuyển hóa" đầu ra của model trực tiếp vào các cấu trúc dữ liệu của Python.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import CommaSeparatedListOutputParser

# Khởi tạo mô hình Gemini 2.5 Flash Lite
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Khởi tạo một output parser để biến hóa nội dung phân cách bằng dấu phẩy thành một Python list
output_parser = CommaSeparatedListOutputParser()

# Parser cũng có thể cung cấp đoạn hướng dẫn định dạng để làm cơ sở cho LLM
format_instructions = output_parser.get_format_instructions()

prompt = f"List 5 popular programming languages. {format_instructions}"

# Gọi thực thi model
response = llm.invoke(prompt)

# Parser bóc tách tin nhắn AIMessage ra và đóng thành cấu trúc mảng Python sạch sẽ
parsed_list = output_parser.invoke(response)

print(parsed_list)
# Example output: ['Python', 'JavaScript', 'Java', 'C++', 'Go']
```

## Tạo ra một chain

Một chain là nơi mọi dòng chảy tập hợp lại. Thay vì bạn phải tự tay định dạng prompt, gọi thực thi model, và sau đó phân tích các output trong nhiều công đoạn gãy vụn, bạn có thể nối chúng vào một đường ống (pipeline) duy nhất.

LangChain phiên bản hiện đại sử dụng LCEL (LangChain Expression Language) với loại toán tử pipe (`|`) biểu thị sự kết nối giữa các component — kết quả đầu ra của thao tác trước sẽ tự động chạy thẳng vào thao tác sau, gần tương tự như các Unix pipes.

```python
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Khởi tạo mô hình Gemini 2.5 Flash Lite
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    temperature=0.7
)

# Khởi tạo một mẫu prompt
template = "You are an expert naming consultant. What is a good name for a company that makes {product}?"
prompt = PromptTemplate.from_template(template)

# Tạo một trình parser để bóc tách string ra khỏi tin nhắn của model trả về
output_parser = StrOutputParser()

# Khởi tạo một chain sử dụng LCEL
chain = prompt | llm | output_parser

# Thực thi toàn bộ chain
response = chain.invoke({"product": "eco-friendly water bottles"})

print(response)
```

# Nguồn tham khảo

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