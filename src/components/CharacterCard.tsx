import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RelatedCharacter {
  name: string;
  reason: string;
}

interface StreamingPlatform {
  name: string;
  url: string;
}

interface Appearance {
  hair_color: string;
  eye_color: string;
  notable_features: string[];
}

interface CharacterData {
  character_name: string;
  anime_name: string;
  description: string;
  related_characters: RelatedCharacter[];
  streaming_platforms: StreamingPlatform[];
  appearance: Appearance;
}

interface CharacterCardProps {
  character: CharacterData;
}

export const CharacterCard = ({ character }: CharacterCardProps) => {
  return (
    <Card className="gradient-card shadow-card border-border/50 hover:shadow-glow transition-smooth overflow-hidden group">
      <div className="absolute inset-0 gradient-anime opacity-0 group-hover:opacity-10 transition-smooth" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {character.character_name}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">
              from <span className="text-foreground font-semibold">{character.anime_name}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative">
        <div>
          <h4 className="text-sm font-semibold text-primary mb-2">Description</h4>
          <p className="text-sm text-foreground/90 leading-relaxed">{character.description}</p>
        </div>

        {character.appearance && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Appearance</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-muted/50">
                Hair: {character.appearance.hair_color}
              </Badge>
              <Badge variant="secondary" className="bg-muted/50">
                Eyes: {character.appearance.eye_color}
              </Badge>
              {character.appearance.notable_features?.map((feature, idx) => (
                <Badge key={idx} variant="outline" className="border-primary/30">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {character.related_characters && character.related_characters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Related Characters</h4>
            <div className="space-y-2">
              {character.related_characters.map((related, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50"
                >
                  <p className="font-semibold text-sm text-foreground">{related.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{related.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {character.streaming_platforms && character.streaming_platforms.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-primary mb-3">Watch On</h4>
            <div className="flex flex-wrap gap-2">
              {character.streaming_platforms.map((platform, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10"
                  asChild
                >
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    {platform.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
