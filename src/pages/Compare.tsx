import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingProgress } from "@/components/LoadingProgress";
import { analyzeAnimeCharacters, type CharacterAnalysisResult } from "@/lib/local-inference";
import { cosineSimilarity, generateEmbedding } from "@/lib/ml-models";

interface ImageAnalysis {
  imageUrl: string;
  characters: CharacterAnalysisResult[];
  isAnalyzing: boolean;
  currentStep: string;
}

const Compare = () => {
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const { toast } = useToast();

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const imageUrl = URL.createObjectURL(file);
      const newImageIndex = images.length;
      
      setImages(prev => [...prev, {
        imageUrl,
        characters: [],
        isAnalyzing: true,
        currentStep: 'Initializing analysis...',
      }]);

      try {
        const result = await analyzeAnimeCharacters(imageUrl, (step) => {
          setImages(prev => prev.map((img, idx) => 
            idx === newImageIndex ? { ...img, currentStep: step } : img
          ));
        });

        setImages(prev => prev.map((img, idx) =>
          idx === newImageIndex ? {
            ...img,
            characters: result.characters,
            isAnalyzing: false,
          } : img
        ));

        toast({
          title: "Analysis Complete!",
          description: `Found ${result.characters.length} character(s)`,
        });
      } catch (error) {
        console.error('Analysis error:', error);
        toast({
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Failed to analyze image",
          variant: "destructive",
        });
        setImages(prev => prev.filter((_, idx) => idx !== newImageIndex));
      }
    };
    input.click();
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const calculateCharacterSimilarity = async (char1: CharacterAnalysisResult, char2: CharacterAnalysisResult) => {
    try {
      const embedding1 = await generateEmbedding(`${char1.name} ${char1.description}`);
      const embedding2 = await generateEmbedding(`${char2.name} ${char2.description}`);
      return cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('Similarity calculation error:', error);
      return 0;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="border-primary/30 hover:bg-primary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
          </div>
          
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Character Comparison
            </h1>
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload multiple anime images and compare detected characters with similarity scores
          </p>
        </div>

        {/* Add Image Button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleAddImage}
            size="lg"
            className="gap-2"
            disabled={images.length >= 4}
          >
            <Plus className="w-5 h-5" />
            Add Image to Compare {images.length > 0 && `(${images.length}/4)`}
          </Button>
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {images.map((image, idx) => (
              <Card key={idx} className="p-4">
                <div className="relative">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 z-10 h-8 w-8"
                    onClick={() => handleRemoveImage(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  
                  <img
                    src={image.imageUrl}
                    alt={`Comparison ${idx + 1}`}
                    className="w-full rounded-lg mb-4"
                  />

                  {image.isAnalyzing ? (
                    <LoadingProgress currentStep={image.currentStep} />
                  ) : (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">
                        Detected Characters ({image.characters.length})
                      </h3>
                      {image.characters.map((char, charIdx) => (
                        <div key={charIdx} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{char.name}</p>
                          <p className="text-sm text-muted-foreground">{char.anime}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Comparison Results */}
        {images.length >= 2 && !images.some(img => img.isAnalyzing) && (
          <ComparisonResults images={images} calculateSimilarity={calculateCharacterSimilarity} />
        )}

        {images.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Upload at least 2 images to start comparing characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ComparisonResultsProps {
  images: ImageAnalysis[];
  calculateSimilarity: (char1: CharacterAnalysisResult, char2: CharacterAnalysisResult) => Promise<number>;
}

const ComparisonResults = ({ images, calculateSimilarity }: ComparisonResultsProps) => {
  const [similarities, setSimilarities] = useState<Map<string, number>>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateAllSimilarities = async () => {
    setIsCalculating(true);
    const newSimilarities = new Map<string, number>();

    for (let i = 0; i < images.length; i++) {
      for (let j = i + 1; j < images.length; j++) {
        for (const char1 of images[i].characters) {
          for (const char2 of images[j].characters) {
            const key = `${i}-${char1.name}-${j}-${char2.name}`;
            const similarity = await calculateSimilarity(char1, char2);
            newSimilarities.set(key, similarity);
          }
        }
      }
    }

    setSimilarities(newSimilarities);
    setIsCalculating(false);
  };

  if (similarities.size === 0 && !isCalculating) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Calculate Similarities</h3>
          <Button onClick={calculateAllSimilarities} size="lg">
            Compare All Characters
          </Button>
        </div>
      </Card>
    );
  }

  if (isCalculating) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Calculating similarities...</span>
          </div>
        </div>
      </Card>
    );
  }

  // Group similarities by pairs
  const pairs: Array<{
    image1Idx: number;
    image2Idx: number;
    matches: Array<{
      char1: string;
      char2: string;
      similarity: number;
    }>;
  }> = [];

  for (let i = 0; i < images.length; i++) {
    for (let j = i + 1; j < images.length; j++) {
      const matches: Array<{ char1: string; char2: string; similarity: number }> = [];
      
      for (const char1 of images[i].characters) {
        for (const char2 of images[j].characters) {
          const key = `${i}-${char1.name}-${j}-${char2.name}`;
          const similarity = similarities.get(key) || 0;
          matches.push({
            char1: char1.name,
            char2: char2.name,
            similarity,
          });
        }
      }

      matches.sort((a, b) => b.similarity - a.similarity);
      pairs.push({ image1Idx: i, image2Idx: j, matches });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Comparison Results
        </span>
      </h2>

      {pairs.map((pair, idx) => (
        <Card key={idx} className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Image {pair.image1Idx + 1} vs Image {pair.image2Idx + 1}
          </h3>
          <div className="space-y-3">
            {pair.matches.slice(0, 10).map((match, matchIdx) => (
              <div
                key={matchIdx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted"
              >
                <div className="flex-1">
                  <span className="font-medium">{match.char1}</span>
                  <span className="mx-2 text-muted-foreground">vs</span>
                  <span className="font-medium">{match.char2}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${match.similarity * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-sm w-12 text-right">
                    {(match.similarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default Compare;
