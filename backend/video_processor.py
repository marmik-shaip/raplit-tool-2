import cv2
import numpy as np
import os
from typing import List

class VideoProcessor:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    async def process_video(self, video_path: str, output_path: str, progress_callback) -> List[str]:
        logs = []
        try:
            logs.append("Started processing video")
            await progress_callback("Started processing video")
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception("Error opening video file")
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Create video writer
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
            
            logs.append("Initialized video processing")
            await progress_callback("Processing frames...")
            
            frame_count = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                    
                # Convert frame to grayscale for face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                
                # Blur detected faces
                for (x, y, w, h) in faces:
                    roi = frame[y:y+h, x:x+w]
                    blur = cv2.GaussianBlur(roi, (99, 99), 30)
                    frame[y:y+h, x:x+w] = blur
                
                out.write(frame)
                frame_count += 1
                
                if frame_count % (total_frames // 10) == 0:
                    progress = int((frame_count / total_frames) * 100)
                    await progress_callback(f"Processing: {progress}% complete")
                    logs.append(f"Processed {progress}% of frames")
            
            cap.release()
            out.release()
            
            logs.append("Video processing completed")
            await progress_callback("Video processing completed")
            return logs
            
        except Exception as e:
            error_msg = f"Error processing video: {str(e)}"
            logs.append(error_msg)
            await progress_callback(error_msg)
            raise Exception(error_msg)
