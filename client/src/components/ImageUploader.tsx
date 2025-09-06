import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { uploadURL: string }) => void;
  maxFileSize?: number;
  accept?: string;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  uploading: boolean;
  error?: string;
}

export function ImageUploader({
  onGetUploadParameters,
  onComplete,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  accept = "image/*",
  disabled = false,
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Por favor, selecione apenas arquivos de imagem.";
    }
    if (file.size > maxFileSize) {
      return `O arquivo deve ter no máximo ${Math.round(maxFileSize / (1024 * 1024))}MB.`;
    }
    return null;
  };

  const uploadFile = async (uploadingFile: UploadingFile) => {
    try {
      const { method, url } = await onGetUploadParameters();
      
      setUploadingFiles(prev =>
        prev.map(f => f.file === uploadingFile.file ? { ...f, uploading: true, progress: 0 } : f)
      );

      const xhr = new XMLHttpRequest();
      
      return new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadingFiles(prev =>
              prev.map(f => f.file === uploadingFile.file ? { ...f, progress } : f)
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 204) {
            setUploadingFiles(prev => prev.filter(f => f.file !== uploadingFile.file));
            onComplete?.({ uploadURL: url });
            resolve();
          } else {
            reject(new Error("Falha no upload"));
          }
        };

        xhr.onerror = () => reject(new Error("Erro de rede"));
        
        xhr.open(method, url);
        xhr.setRequestHeader("Content-Type", uploadingFile.file.type);
        xhr.send(uploadingFile.file);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      setUploadingFiles(prev =>
        prev.map(f => f.file === uploadingFile.file ? { ...f, uploading: false, error: errorMessage } : f)
      );
    }
  };

  const handleFiles = useCallback((files: FileList) => {
    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        setUploadingFiles(prev => [...prev, {
          file,
          preview: "",
          progress: 0,
          uploading: false,
          error
        }]);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const uploadingFile: UploadingFile = {
          file,
          preview,
          progress: 0,
          uploading: false,
        };
        
        setUploadingFiles(prev => [...prev, uploadingFile]);
        uploadFile(uploadingFile);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={cn(
          "cursor-pointer transition-colors",
          dragActive && "border-primary bg-primary/5",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={!disabled ? handleFileSelect : undefined}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Clique para fazer upload ou arraste e solte
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF até {Math.round(maxFileSize / (1024 * 1024))}MB
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            disabled={disabled}
            data-testid="file-input"
          />
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Preview */}
                  <div className="flex-shrink-0">
                    {uploadingFile.preview ? (
                      <img
                        src={uploadingFile.preview}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadingFile.file.size / (1024 * 1024)).toFixed(1)}MB
                    </p>

                    {/* Progress */}
                    {uploadingFile.uploading && (
                      <div className="mt-2">
                        <Progress value={uploadingFile.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadingFile.progress}% enviado
                        </p>
                      </div>
                    )}

                    {/* Error */}
                    {uploadingFile.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {uploadingFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadingFile.file)}
                    className="flex-shrink-0"
                    data-testid={`remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}