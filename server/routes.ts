import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { insertVideoSchema } from "@shared/schema";
import cv from "@techstark/opencv-js";

const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['video/mp4', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4 and MOV files are allowed.'));
    }
  }
});

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  await fs.mkdir("uploads").catch(() => {});

  app.post("/api/videos", upload.single("video"), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        throw new Error("No video file uploaded");
      }

      const video = await storage.createVideo({
        filename: req.file.originalname,
        originalPath: req.file.path
      });

      // Start processing in background
      processVideo(video.id).catch(console.error);

      res.json(video);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideo(parseInt(req.params.id));
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/videos/:id/stream", async (req, res) => {
    try {
      const video = await storage.getVideo(parseInt(req.params.id));
      if (!video || !video.processedPath) {
        return res.status(404).json({ message: "Processed video not found" });
      }
      res.sendFile(video.processedPath, { root: process.cwd() });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/videos/:id/download", async (req, res) => {
    try {
      const video = await storage.getVideo(parseInt(req.params.id));
      if (!video || !video.processedPath) {
        return res.status(404).json({ message: "Processed video not found" });
      }
      res.download(video.processedPath);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processVideo(videoId: number) {
  try {
    const video = await storage.getVideo(videoId);
    if (!video) throw new Error("Video not found");

    await storage.updateVideoStatus(videoId, "processing");
    await storage.addProcessingLog(videoId, "Started processing video");

    // Implement face detection and blurring here
    // This is where we would use OpenCV to process the video
    // For now we'll just simulate processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    const processedPath = video.originalPath + "_processed.mp4";
    await storage.updateProcessedPath(videoId, processedPath);
    await storage.updateVideoStatus(videoId, "completed");
    await storage.addProcessingLog(videoId, "Completed processing video");
  } catch (error: any) {
    await storage.setError(videoId, error.message);
    console.error(`Error processing video ${videoId}:`, error);
  }
}