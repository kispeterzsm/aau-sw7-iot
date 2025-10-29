from typing import Optional, Any, Dict
from pydantic import BaseModel, AnyHttpUrl, Field

class WrapRequest(BaseModel):
    url: AnyHttpUrl
    search_depth: Optional[int] = Field(2, ge=0, le=5)

class WrapResponse(BaseModel):
    status: str
    cached: bool
    source_url: AnyHttpUrl
    downstream_ms: int
    data: Dict[str, Any]
