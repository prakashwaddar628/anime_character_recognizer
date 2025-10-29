import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Play, ExternalLink } from "lucide-react";

interface RecommendedAnimes {
  title: string;
  reason: string;
  genre: string;
}

interface SuggestedCharacters {
  name: string;
  anime: string;
  why_similar: string;
}

interface WatchNexts {
  title: string;
  description: string;
}

interface SuggestionsData {
  recommended_anime: RecommendedAnimes[];
  suggested_characters: SuggestedCharacters[];
  watch_next: WatchNexts[];
}

interface SuggestionsPanelProp {
  suggestions: SuggestionsData;
}

export const SuggestionsPanel = ({ suggestions }: SuggestionsPanelProp) => {
  if (!suggestions) return null;

  const hasContent = 
    suggestions.recommended_anime?.length > 0 || 
    suggestions.suggested_characters?.length > 0 || 
    suggestions.watch_next?.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-secondary" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            Personalized Suggestions
          </h2>
        </div>
        <p className="text-muted-foreground">Based on the detected characters</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recommended Anime */}
        {suggestions.recommended_anime && suggestions.recommended_anime.length > 0 && (
          <Card className="gradient-card shadow-card border-border/50 hover:shadow-glow transition-smooth">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <CardTitle className="text-xl">Recommended Anime</CardTitle>
              </div>
              <CardDescription>Similar series you might enjoy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.recommended_anime.map((anime, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-secondary/50 transition-smooth"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-foreground">{anime.title}</h4>
                    <Badge variant="secondary" className="text-xs bg-secondary/20 text-secondary flex-shrink-0">
                      {anime.genre}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{anime.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Suggested Characters */}
        {suggestions.suggested_characters && suggestions.suggested_characters.length > 0 && (
          <Card className="gradient-card shadow-card border-border/50 hover:shadow-glow transition-smooth">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <CardTitle className="text-xl">Similar Characters</CardTitle>
              </div>
              <CardDescription>Characters you might like</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.suggested_characters.map((char, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-accent/50 transition-smooth"
                >
                  <h4 className="font-semibold text-sm text-foreground mb-1">
                    {char.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    from <span className="text-foreground font-medium">{char.anime}</span>
                  </p>
                  <p className="text-xs text-muted-foreground italic">{char.why_similar}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Watch Next */}
        {suggestions.watch_next && suggestions.watch_next.length > 0 && (
          <Card className="gradient-card shadow-card border-border/50 hover:shadow-glow transition-smooth md:col-span-2 lg:col-span-1">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">Watch Next</CardTitle>
              </div>
              <CardDescription>Recommended episodes & arcs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.watch_next.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 rounded-lg p-3 border border-border/50 hover:border-primary/50 transition-smooth"
                >
                  <h4 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                    <Play className="w-3 h-3 text-primary" />
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
