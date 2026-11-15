import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="LinguaMate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranslateRequest(BaseModel):
    chinese: str = Field(min_length=1, max_length=500)


class Vocabulary(BaseModel):
    word: str
    meaning: str
    explanation: str


class Phrase(BaseModel):
    phrase: str
    meaning: str
    explanation: str


class SentencePattern(BaseModel):
    pattern: str
    meaning: str
    example: str
    example_meaning: str


class TranslationResult(BaseModel):
    english: str
    vocabulary: list[Vocabulary]
    phrases: list[Phrase]
    sentence_patterns: list[SentencePattern]


@app.get("/")
def home():
    return {"message": "LinguaMate 后端运行成功！"}


@app.post("/translate", response_model=TranslationResult)
def translate(request: TranslateRequest):
    api_key = os.getenv("DEEPSEEK_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="未配置 DeepSeek API Key，请检查 backend/.env。",
        )

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com",
        timeout=60.0,
        max_retries=1,
    )

    prompt = f"""
你是一位专业的英语表达学习助手。

请分析用户提供的中文，生成自然、地道、符合语境的英文表达，
并用中文解释重点词汇、固定搭配和可迁移的句式。

用户的中文：
{request.chinese}

请严格返回 JSON 对象，不要添加 Markdown 代码块。
必须包含以下字段：
{{
  "english": "自然地道的英文表达",
  "vocabulary": [
    {{
      "word": "重点单词或短语",
      "meaning": "中文含义",
      "explanation": "结合当前语境解释用法"
    }}
  ],
  "phrases": [
    {{
      "phrase": "固定搭配",
      "meaning": "中文含义",
      "explanation": "搭配的使用说明"
    }}
  ],
  "sentence_patterns": [
    {{
      "pattern": "重要句式",
      "meaning": "句式的中文含义",
      "example": "可迁移的英文例句",
      "example_meaning": "例句的中文翻译"
    }}
  ]
}}

要求：
1. 英文表达准确、自然，不要逐字硬译。
2. 词汇、搭配和句式必须与本次表达相关。
3. 提供 2 至 4 个重点词汇、1 至 3 个固定搭配、
   1 至 2 个句式。
4. 所有字段都必须填写。
"""

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {
                    "role": "system",
                    "content": "你是严谨的英语学习助手，必须按要求返回有效 JSON。",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("模型返回了空内容")

        result = TranslationResult.model_validate(json.loads(content))
        return result.model_dump()

    except Exception as exc:
        print(f"DeepSeek 调用失败：{type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="AI 生成失败，请检查 API 配置、账户额度或稍后重试。",
        ) from exc