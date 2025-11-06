import { Brain, Search, Users, Sparkles, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingProgressProps {
  currentStep: string;
}

interface Step {
  id: string;
  label: string;
  icon: typeof Brain;
  keywords: string[];
}

const steps: Step[] = [
  {
    id: 'recognizing',
    label: 'Recognizing Characters',
    icon: Brain,
    keywords: ['recognizing', 'analyzing', 'detecting'],
  },
  {
    id: 'gathering',
    label: 'Gathering Details',
    icon: Search,
    keywords: ['gathering', 'fetching', 'loading'],
  },
  {
    id: 'finding',
    label: 'Finding Similar Characters',
    icon: Users,
    keywords: ['finding', 'similar', 'calculating'],
  },
  {
    id: 'generating',
    label: 'Generating Suggestions',
    icon: Sparkles,
    keywords: ['generating', 'suggestions', 'recommendations'],
  },
];

export const LoadingProgress = ({ currentStep }: LoadingProgressProps) => {
  const getCurrentStepIndex = () => {
    const lowerStep = currentStep.toLowerCase();
    return steps.findIndex(step =>
      step.keywords.some(keyword => lowerStep.includes(keyword))
    );
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <Card className="p-6 w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Analyzing Your Image</h3>
          <p className="text-sm text-muted-foreground">{currentStep}</p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex items-center gap-4 p-3 rounded-lg transition-all"
                style={{
                  backgroundColor: isCurrent
                    ? 'hsl(var(--accent))'
                    : isCompleted
                    ? 'hsl(var(--muted))'
                    : 'transparent',
                }}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary/20 text-primary animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCompleted || isCurrent
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>

                {isCurrent && (
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
};
