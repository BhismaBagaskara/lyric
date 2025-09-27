'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { synchronizeLyricsWithAudio } from '@/ai/flows/synchronize-lyrics-with-audio';

const lyricsData = [
  { startTime: 1.9, endTime: 4.7, text: "temanku semua pada jahat tante" },
  { startTime: 4.7, endTime: 7.9, text: "aku lagi susah mereka gak ada" },
  { startTime: 7.9, endTime: 10.4, text: "coba kalau lagi jayaaa" },
  { startTime: 10.4, endTime: 13.7, text: "aku dipuja-pujanya tante" },
  { startTime: 14.2, endTime: 17.2, text: "sudah terbiasa terjadi tante" },
  { startTime: 17.2, endTime: 20.6, text: "teman datang ketika lagi butuh saja" },
  { startTime: 20.6, endTime: 23.0, text: "coba kalau lagi susaaah" },
  { startTime: 23.0, endTime: 26.2, text: "mereka semua menghilanggg" },
];

export default function LyricSyncPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [highlightedWidth, setHighlightedWidth] = useState('0%');
  const [isClient, setIsClient] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
      } else {
        audioRef.current.play();
        animationFrameRef.current = requestAnimationFrame(animateKaraoke);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentLineIndex(-1);
      setHighlightedWidth('0%');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const animateKaraoke = useCallback(async () => {
    if (!audioRef.current) return;
  
    const currentTime = audioRef.current.currentTime;
    
    try {
      const result = await synchronizeLyricsWithAudio({
        currentTime,
        lyricsData,
      });
      
      const activeLineIndex = result.currentLineIndex;

      if (activeLineIndex !== -1) {
        if (activeLineIndex !== currentLineIndex) {
          setCurrentLineIndex(activeLineIndex);
        }
        
        const currentLine = lyricsData[activeLineIndex];
        const timeIntoLine = currentTime - currentLine.startTime;
        const lineDuration = currentLine.endTime - currentLine.startTime;
        const progress = Math.max(0, Math.min(1, timeIntoLine / lineDuration));
        setHighlightedWidth(`${progress * 100}%`);

      } else {
         const isBeforeFirst = currentTime < (lyricsData[0]?.startTime || 0);
         if (isBeforeFirst) {
           setCurrentLineIndex(-1);
           setHighlightedWidth('0%');
         }
      }

    } catch (error) {
      console.error("Error synchronizing lyrics:", error);
    }
  
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animateKaraoke);
    }
  }, [isPlaying, currentLineIndex]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const onPlay = () => {
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(animateKaraoke);
    };
    const onPause = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentLineIndex(lyricsData.length - 1);
      setHighlightedWidth('100%');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
  
    // Start animation loop if playing
    if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animateKaraoke);
    }
  
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isClient, animateKaraoke, isPlaying]);

  if (!isClient) {
    return null;
  }

  const currentLine = currentLineIndex !== -1 ? lyricsData[currentLineIndex] : null;

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-2xl overflow-hidden border-primary/20 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <CardHeader className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary sm:text-5xl">TanteCulikAkuDong!</h1>
          <p className="text-accent">In Engineer We Trust</p>
        </CardHeader>
        <CardContent>
          <div className="relative flex h-80 flex-col items-center justify-center space-y-2 overflow-hidden rounded-md p-4 text-center">
            {currentLine ? (
              <div className="relative text-2xl font-bold text-primary transition-all duration-300 scale-110">
                <p aria-hidden="true" className="text-muted-foreground/50">{currentLine.text}</p>
                <div
                  className="absolute left-0 top-0 h-full overflow-hidden whitespace-nowrap"
                  style={{ width: highlightedWidth }}
                >
                  <p className="text-primary-foreground bg-primary">{currentLine.text}</p>
                </div>
              </div>
            ) : (
              <p className="absolute text-center text-2xl font-bold text-muted-foreground">
                {isPlaying ? '...' : 'Tekan Play untuk memulai'}
              </p>
            )}
          </div>
          <audio ref={audioRef} src="/audio.mp3" preload="metadata" className="hidden" />
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center gap-4 border-t border-border/50 pt-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleRewind} aria-label="Rewind">
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="h-16 w-16 rounded-full bg-primary/20 text-primary shadow-lg shadow-primary/20 ring-2 ring-primary/50 transition-all hover:bg-primary/30 hover:scale-105"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleStop} aria-label="Stop">
              <Square className="h-6 w-6" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
