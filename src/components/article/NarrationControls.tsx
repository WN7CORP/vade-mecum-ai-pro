
import React from 'react';
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, MicOffIcon } from "lucide-react";
import { speechService } from '@/services/SpeechService';

interface NarrationControlsProps {
  isReading: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

const NarrationControls = ({
  isReading,
  isPaused,
  onStart,
  onPause,
  onStop
}: NarrationControlsProps) => {
  return (
    <div className="flex items-center gap-2">
      {!isReading ? (
        <Button variant="outline" size="sm" onClick={onStart} className="gap-1">
          <PlayIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Ouvir</span>
        </Button>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={onPause} className="gap-1">
            {isPaused ? (
              <>
                <PlayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Continuar</span>
              </>
            ) : (
              <>
                <PauseIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Pausar</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onStop} className="gap-1">
            <MicOffIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Parar</span>
          </Button>
        </>
      )}
    </div>
  );
};

export default NarrationControls;
