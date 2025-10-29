import { useState, useCallback } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProp {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const ImageUpload = ({ onImageSelect, isAnalyzing }: ImageUploadProp) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
          onImageSelect(file);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please upload an image file",
            variant: "destructive",
          });
        }
      }
    },
    [onImageSelect, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-smooth ${
        dragActive
          ? "border-primary bg-primary/10 scale-105"
          : "border-border hover:border-primary/50"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*"
        onChange={handleFileInput}
        disabled={isAnalyzing}
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 gradient-anime opacity-20 blur-2xl rounded-full" />
          <div className="relative bg-card p-6 rounded-full shadow-card">
            {dragActive ? (
              <ImageIcon className="w-12 h-12 text-primary" />
            ) : (
              <Upload className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Upload Anime Image
          </h3>
          <p className="text-muted-foreground mb-6">
            Drag and drop or click to select an image with anime characters
          </p>
        </div>

        <Button
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={isAnalyzing}
          className="gradient-anime text-background font-semibold px-8 py-6 text-lg shadow-glow hover:scale-105 transition-smooth"
        >
          {isAnalyzing ? "Analyzing..." : "Choose Image"}
        </Button>
      </div>
    </div>
  );
};
