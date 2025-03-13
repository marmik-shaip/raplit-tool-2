import { useState, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useMutation } from '@tanstack/react-query';

export function VideoUpload({ onUploadComplete }) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('video', file);

      const xhr = new XMLHttpRequest();
      return new Promise((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.responseText));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('POST', '/api/videos');
        xhr.send(formData);
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: "Your video is now being processed"
      });
      setProgress(0);
      onUploadComplete(data.id);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
      setProgress(0);
    }
  });

  const handleFileSelect = async (e) => {
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

  const openFileDialog = () => {
    fileInputRef.current?.click();
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
        onClick={openFileDialog}
        onDrop={handleFileSelect}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="video/*"
          onChange={handleFileSelect}
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