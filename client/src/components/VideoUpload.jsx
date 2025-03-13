import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function VideoUpload({ onUploadComplete }) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('video', file);

      const res = await apiRequest('POST', '/api/videos', formData);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "Your video is now being processed"
      });
      onUploadComplete(data.id);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  return (
    <div className="space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8
          ${uploadMutation.isPending ? 'border-primary' : 'border-muted'}
          hover:border-primary transition-colors
          flex flex-col items-center justify-center space-y-4
          cursor-pointer
        `}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          className="hidden"
          accept="video/*"
          onChange={onDrop}
          id="video-upload"
        />
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">
            Drop your video here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            MP4 or MOV up to 100MB
          </p>
        </div>
      </div>

      {uploadMutation.isPending && (
        <Progress value={progress} className="w-full" />
      )}
    </div>
  );
}
