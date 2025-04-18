
import React from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Highlighter } from "lucide-react";

type HighlightColor = "purple" | "yellow" | "blue" | "green" | "pink";

interface ArticleHighlighterProps {
  selectedColor: HighlightColor;
  onColorSelect: (color: HighlightColor) => void;
  onApplyHighlight: () => void;
  onClearHighlights: () => void;
  highlightsCount: number;
  isMobile?: boolean;
}

const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  purple: "bg-purple-500/30",
  yellow: "bg-yellow-500/30",
  blue: "bg-blue-500/30",
  green: "bg-green-500/30",
  pink: "bg-pink-500/30"
};

const ArticleHighlighter = ({
  selectedColor,
  onColorSelect,
  onApplyHighlight,
  onClearHighlights,
  highlightsCount,
  isMobile = false
}: ArticleHighlighterProps) => {
  const ColorPicker = () => (
    <div className="flex gap-1">
      {Object.entries(HIGHLIGHT_COLORS).map(([color, className]) => (
        <div
          key={color}
          className={`w-6 h-6 rounded-full cursor-pointer ${className} ${
            selectedColor === color ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onColorSelect(color as HighlightColor)}
        />
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Selecione a cor e depois o texto no artigo</p>
        <ColorPicker />
        <div className="flex justify-between pt-2">
          <Button size="sm" variant="outline" onClick={onApplyHighlight}>
            Aplicar
          </Button>
          {highlightsCount > 0 && (
            <Button size="sm" variant="destructive" onClick={onClearHighlights}>
              Limpar todos
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Highlighter className="h-4 w-4" />
          Destacar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <ColorPicker />
        <div className="flex justify-between pt-2">
          <Button size="sm" variant="outline" onClick={onApplyHighlight}>
            Aplicar
          </Button>
          {highlightsCount > 0 && (
            <Button size="sm" variant="destructive" onClick={onClearHighlights}>
              Limpar todos
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ArticleHighlighter;
