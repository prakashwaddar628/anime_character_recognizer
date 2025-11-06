import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { CharacterCard } from "@/components/CharacterCard";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { LoadingProgress } from "@/components/LoadingProgress";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeAnimeCharacters } from "@/lib/local-inference";

interface CharacterData {
  character_name: string;
  anime_name: string;
  description: string;
  related_characters: Array<{ 
    name: string; 
    reason: string; 
    similarity?: number;
    image?: string;
  }>;
  streaming_platforms: Array<{ name: string; url: string }>;
  appearance: {
    hair_color: string;
    eye_color: string;
    notable_features: string[];
  };
  image?: string;
}

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [suggestions, setSuggestions] = useState<any>(null);
  const { toast } = useToast();

  const handleImageSelect = async (file: File) => {
    // Create image URL for preview and analysis
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setIsAnalyzing(true);
    setCharacters([]);
    setSuggestions(null);

    try {
      // Use local browser-based ML models
      const result = await analyzeAnimeCharacters(imageUrl, (step) => {
        setCurrentStep(step);
      });

      console.log('Analysis result:', result);
      
      // Map the result to match the expected format
      const analyzedCharacters = result.characters.map((char) => ({
        character_name: char.name,
        anime_name: char.anime,
        description: char.description,
        related_characters: char.relatedCharacters.map((rc) => ({
          name: rc.name,
          reason: `${(rc.similarity * 100).toFixed(1)}% similar`,
          similarity: rc.similarity,
          image: rc.image,
        })),
        streaming_platforms: char.streamingPlatforms,
        appearance: {
          hair_color: 'Unknown',
          eye_color: 'Unknown',
          notable_features: [],
        },
        image: char.image,
      }));
      
      setCharacters(analyzedCharacters);
      setSuggestions(result.suggestions);
      
      if (analyzedCharacters.length > 0) {
        toast({
          title: "Analysis Complete!",
          description: `Found ${analyzedCharacters.length} character(s) with personalized suggestions`,
        });
      } else {
        toast({
          title: "No Characters Found",
          description: "Please add character data to the knowledge base in src/lib/ml-models.ts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze image. Make sure models are loaded.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCharacters([]);
    setSuggestions(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Anime Character Recognizer
            </h1>
            <Sparkles className="w-8 h-8 text-secondary" />
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
              <div className="py-8">
                <LoadingProgress currentStep={currentStep} />
              </div>
            )}

            {characters.length > 0 && (
              <div className="space-y-12">
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

                {suggestions && <SuggestionsPanel suggestions={suggestions} />}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Made with love for anime fans</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
