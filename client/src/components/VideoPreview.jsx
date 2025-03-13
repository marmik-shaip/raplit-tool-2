import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function VideoPreview({ video, isLoading }) {
  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (!video) {
    return null;
  }

  const isProcessing = video.status === "processing";
  const isCompleted = video.status === "completed";
  const hasError = video.status === "error";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{video.filename}</h3>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <span className="text-sm capitalize text-muted-foreground">
            {video.status}
          </span>
        </div>
      </div>

      {hasError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          {video.error}
        </div>
      )}

      {isCompleted && video.processedPath && (
        <div className="space-y-4">
          <video
            className="w-full rounded-lg"
            controls
            src={`/api/videos/${video.id}/stream`}
          />
          <Button
            className="w-full"
            onClick={() => window.location.href = `/api/videos/${video.id}/download`}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Processed Video
          </Button>
        </div>
      )}
    </div>
  );
}
