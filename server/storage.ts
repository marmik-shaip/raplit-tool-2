import { videos, type Video, type InsertVideo } from "@shared/schema";
import type { ProcessingStatus } from "@shared/schema";

export interface IStorage {
  createVideo(video: InsertVideo): Promise<Video>;
  getVideo(id: number): Promise<Video | undefined>;
  updateVideoStatus(id: number, status: ProcessingStatus): Promise<Video>;
  updateProcessedPath(id: number, path: string): Promise<Video>;
  addProcessingLog(id: number, log: string): Promise<Video>;
  setError(id: number, error: string): Promise<Video>;
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video>;
  private currentId: number;

  constructor() {
    this.videos = new Map();
    this.currentId = 1;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.currentId++;
    const video: Video = {
      ...insertVideo,
      id,
      status: "pending",
      processingLogs: [],
      processedPath: null,
      error: null
    };
    this.videos.set(id, video);
    return video;
  }

  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async updateVideoStatus(id: number, status: ProcessingStatus): Promise<Video> {
    const video = await this.getVideo(id);
    if (!video) throw new Error("Video not found");

    const updated = { ...video, status };
    this.videos.set(id, updated);
    return updated;
  }

  async updateProcessedPath(id: number, path: string): Promise<Video> {
    const video = await this.getVideo(id);
    if (!video) throw new Error("Video not found");

    const updated = { ...video, processedPath: path };
    this.videos.set(id, updated);
    return updated;
  }

  async addProcessingLog(id: number, log: string): Promise<Video> {
    const video = await this.getVideo(id);
    if (!video) throw new Error("Video not found");

    // Ensure processingLogs is initialized as an array if null
    const currentLogs = video.processingLogs || [];

    const updated = {
      ...video,
      processingLogs: [...currentLogs, log]
    };
    this.videos.set(id, updated);
    return updated;
  }

  async setError(id: number, error: string): Promise<Video> {
    const video = await this.getVideo(id);
    if (!video) throw new Error("Video not found");

    const updated = {
      ...video,
      status: "error",
      error
    };
    this.videos.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();