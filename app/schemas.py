# schemas.py
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from pydantic import BaseModel, AnyHttpUrl, HttpUrl, Field

class WrapRequest(BaseModel):
    # Accept either a real URL or free text (for /text workflows)
    input: Union[str, HttpUrl]
    search_depth: Optional[int] = Field(2, ge=0, le=5)

class RegisterRequest(BaseModel):
    email: str
    password: str

class SearchResultBase(BaseModel):
    title: str
    url: AnyHttpUrl
    snippet: Optional[str] = None
    # Accept ISO strings or parsed dates
    date: Optional[Union[str, date, datetime]] = None

class NewsResult(SearchResultBase):
    pass

class WebsiteResult(SearchResultBase):
    pass

class ResultItem(BaseModel):
    sentence: str
    search_term: str
    news_results: List[NewsResult] = Field(default_factory=list)
    website_results: List[WebsiteResult] = Field(default_factory=list)

class WrapData(BaseModel):
    warning: Optional[str] = None
    result: List[ResultItem]
    oldest_result: Optional[SearchResultBase] = None

class WrapResponse(BaseModel):
    status: str
    cached: bool
    # Use str so we can return either a URL or the original free-text input
    source_url: str
    downstream_ms: int
    data: WrapData
