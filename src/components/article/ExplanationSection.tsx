
import React from 'react';
import { Button } from "@/components/ui/button";
import { Lightbulb, Info } from "lucide-react";

interface ExplanationSectionProps {
  explanation: string;
  isLoadingAI: boolean;
  explanationLoaded: boolean;
  explanationMode: 'technical' | 'formal';
  onLoadExplanation: (mode: 'technical' | 'formal') => void;
}

const ExplanationSection = ({
  explanation,
  isLoadingAI,
  explanationLoaded,
  explanationMode,
  onLoadExplanation
}: ExplanationSectionProps) => {
  return (
    <div className="bg-secondary/50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Explicação</h3>
        </div>
        
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant={explanationMode === 'technical' ? 'default' : 'outline'} 
            onClick={() => onLoadExplanation('technical')} 
            className="text-xs h-7 px-2"
          >
            <Info className="h-3 w-3 mr-1" />
            Técnica
          </Button>
          <Button 
            size="sm" 
            variant={explanationMode === 'formal' ? 'default' : 'outline'} 
            onClick={() => onLoadExplanation('formal')} 
            className="text-xs h-7 px-2"
          >
            <Info className="h-3 w-3 mr-1" />
            Simples
          </Button>
        </div>
      </div>
      
      {isLoadingAI ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !explanationLoaded ? (
        <div className="flex flex-col items-center justify-center h-40 gap-4">
          <p className="text-center text-muted-foreground">
            Selecione o tipo de explicação desejada
          </p>
        </div>
      ) : (
        <div className="prose prose-invert max-w-none whitespace-pre-line">
          {explanation}
        </div>
      )}
    </div>
  );
};

export default ExplanationSection;
