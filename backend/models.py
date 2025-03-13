from pydantic import BaseModel
from typing import Optional, List

class VideoBase(BaseModel):
    filename: str

class VideoCreate(VideoBase):
    pass

class Video(VideoBase):
    id: int
    status: str = "pending"
    processing_logs: List[str] = []
    original_path: str
    processed_path: Optional[str] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True
