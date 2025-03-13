import os
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
from typing import Dict, List
import asyncio

from .models import Video, VideoCreate
from .video_processor import VideoProcessor

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create required directories
UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Store videos in memory for demo
videos: Dict[int, Video] = {}
current_id = 1
video_processor = VideoProcessor()

async def update_video_status(video_id: int, log: str):
    if video_id in videos:
        videos[video_id].processing_logs.append(log)

@app.post("/api/videos", response_model=Video)
async def upload_video(video: UploadFile):
    global current_id
    
    if not video.filename:
        raise HTTPException(status_code=400, detail="No video file uploaded")
        
    if not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{current_id}_{video.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    # Create video entry
    new_video = Video(
        id=current_id,
        filename=video.filename,
        original_path=file_path,
        status="pending",
        processing_logs=[]
    )
    videos[current_id] = new_video
    video_id = current_id
    current_id += 1
    
    # Start processing in background
    asyncio.create_task(process_video(video_id))
    
    return new_video

async def process_video(video_id: int):
    video = videos[video_id]
    try:
        video.status = "processing"
        processed_path = os.path.join(PROCESSED_DIR, f"processed_{video_id}_{video.filename}")
        
        # Process video and update status
        logs = await video_processor.process_video(
            video.original_path,
            processed_path,
            lambda log: update_video_status(video_id, log)
        )
        
        video.processing_logs.extend(logs)
        video.processed_path = processed_path
        video.status = "completed"
        
    except Exception as e:
        video.status = "error"
        video.error = str(e)
        video.processing_logs.append(f"Error: {str(e)}")

@app.get("/api/videos/{video_id}", response_model=Video)
async def get_video(video_id: int):
    if video_id not in videos:
        raise HTTPException(status_code=404, detail="Video not found")
    return videos[video_id]

@app.get("/api/videos/{video_id}/stream")
async def stream_video(video_id: int):
    if video_id not in videos:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = videos[video_id]
    if not video.processed_path:
        raise HTTPException(status_code=404, detail="Processed video not found")
        
    return FileResponse(video.processed_path)

@app.get("/api/videos/{video_id}/download")
async def download_video(video_id: int):
    if video_id not in videos:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video = videos[video_id]
    if not video.processed_path:
        raise HTTPException(status_code=404, detail="Processed video not found")
        
    return FileResponse(
        video.processed_path,
        filename=f"processed_{video.filename}",
        media_type="video/mp4"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
