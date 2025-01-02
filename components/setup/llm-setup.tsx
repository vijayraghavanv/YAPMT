'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LLMSetupState } from "@/types/settings";
import { useRouter } from "next/navigation";
import { saveSetting } from "@/app/actions";

const steps = [
  { title: "Choose LLM", description: "Select your Language Model provider" },
  { title: "API Key", description: "Enter your API key" },
];

export function LLMSetup() {
  const router = useRouter();
  const [state, setState] = useState<LLMSetupState>({
    step: 0,
    selectedLLM: null,
    apiKey: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLLMSelect = (llm: 'openai' | 'anthropic') => {
    setState(prev => ({ ...prev, selectedLLM: llm }));
  };

  const handleNext = async () => {
    if (state.step === steps.length - 1) {
      setIsSubmitting(true);
      setError(null);
      
      try {
        await saveSetting({
          key: state.selectedLLM === 'openai' ? 'openai_api_key' : 'anthropic_api_key',
          type: 'api_key',
          value: state.apiKey,
          description: `${state.selectedLLM === 'openai' ? 'OpenAI' : 'Anthropic'} API key for GPT models`
        });

        // Refresh the page to trigger settings check
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const handleBack = () => {
    setError(null);
    setState(prev => ({ ...prev, step: prev.step - 1 }));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>LLM Setup</CardTitle>
          <CardDescription>Configure your Language Model settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  index <= state.step ? "border-primary" : "border-muted",
                  index < state.step && "bg-primary text-primary-foreground"
                )}>
                  {index < state.step ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <div className="text-sm mt-2 text-center">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-muted-foreground text-xs">{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {state.step === 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={state.selectedLLM === 'openai' ? 'default' : 'outline'}
                className="h-24"
                onClick={() => handleLLMSelect('openai')}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-2">O</span>
                  <span>OpenAI</span>
                </div>
              </Button>
              <Button
                variant={state.selectedLLM === 'anthropic' ? 'default' : 'outline'}
                className="h-24"
                onClick={() => handleLLMSelect('anthropic')}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl mb-2">A</span>
                  <span>Anthropic</span>
                </div>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder={`Enter your ${state.selectedLLM} API key`}
                value={state.apiKey}
                onChange={(e) => setState(prev => ({ ...prev, apiKey: e.target.value }))}
              />
              {error && (
                <div className="text-sm text-red-500 mt-2">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={state.step === 0}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (state.step === 0 && !state.selectedLLM) ||
                (state.step === 1 && !state.apiKey) ||
                isSubmitting
              }
            >
              {isSubmitting ? 'Saving...' : state.step === steps.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
