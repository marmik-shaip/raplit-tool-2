import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { VideoUpload } from '../components/VideoUpload';
import { VideoPreview } from '../components/VideoPreview';
import { ProcessingLogs } from '../components/ProcessingLogs';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const [currentVideoId, setCurrentVideoId] = useState(null);

  const { data: videoData, isLoading } = useQuery({
    queryKey: ['/api/videos', currentVideoId],
    enabled: !!currentVideoId
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Video De-identification Platform
          </h1>
          <p className="text-muted-foreground">
            Upload your videos and automatically blur faces for privacy protection
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <VideoUpload onUploadComplete={setCurrentVideoId} />
            </CardContent>
          </Card>

          {currentVideoId && (
            <Card>
              <CardContent className="p-6">
                <VideoPreview video={videoData} isLoading={isLoading} />
              </CardContent>
            </Card>
          )}
        </div>

        {currentVideoId && videoData?.processingLogs?.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <ProcessingLogs logs={videoData.processingLogs} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
