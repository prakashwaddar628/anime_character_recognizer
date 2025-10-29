import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CharacterCard } from "@/components/CharacterCard";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CharacterData {
  character_name: string;
  anime_name: string;
  description: string;
  related_characters: Array<{ name: string; reason: string }>;
  streaming_platforms: Array<{ name: string; url: string }>;
  appearance: {
    hair_color: string;
    eye_color: string;
    notable_features: string[];
  };
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const { toast } = useToast();

  const handleImageSelect = async (file: File) => {
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsAnalyzing(true);
    setCharacters([]);

    try {
      // For now, mock the response since Lovable Cloud isn't enabled yet
      // In production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockCharacters: CharacterData[] = [
        {
          character_name: "Naruto Uzumaki",
          anime_name: "Naruto",
          description: "Naruto Uzumaki is a spirited ninja of Konohagakure known for his dream of becoming Hokage and his bond with Kurama, the Nine-Tails.",
          related_characters: [
            { name: "Sasuke Uchiha", reason: "Rival and teammate in Team 7" },
            { name: "Jiraiya", reason: "Mentor and inspiration figure" }
          ],
          streaming_platforms: [
            { name: "Crunchyroll", url: "https://www.crunchyroll.com/series/GY9PJ5KWR/naruto" },
            { name: "Netflix", url: "https://www.netflix.com/title/70205012" }
          ],
          appearance: {
            hair_color: "Blond",
            eye_color: "Blue",
            notable_features: ["Whisker-like marks", "Orange jumpsuit"]
          }
        }
      ];

      setCharacters(mockCharacters);
      toast({
        title: "Analysis Complete!",
        description: `Found ${mockCharacters.length} character(s) in the image`,
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCharacters([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              AnimeVision
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an anime image and discover detailed information about the characters using AI-powered recognition
          </p>
        </div>

        {/* Main Content */}
        {!selectedImage ? (
          <div className="max-w-2xl mx-auto">
            <ImageUpload onImageSelect={handleImageSelect} isAnalyzing={isAnalyzing} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-primary/30 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Upload New Image
              </Button>
            </div>

            {/* Image Preview */}
            <div className="max-w-2xl mx-auto">
              <div className="gradient-card rounded-2xl p-4 shadow-card">
                <img
                  src={selectedImage}
                  alt="Uploaded anime"
                  className="w-full rounded-lg"
                />
              </div>
            </div>

            {/* Results */}
            {isAnalyzing && (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-lg">
                  <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-muted-foreground">Analyzing characters...</span>
                </div>
              </div>
            )}

            {characters.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-center mb-8">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Detected Characters
                  </span>
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {characters.map((character, idx) => (
                    <CharacterCard key={idx} character={character} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Powered by AI • Made with love for anime fans</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
