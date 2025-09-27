'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { synchronizeLyricsWithAudio } from '@/ai/flows/synchronize-lyrics-with-audio';

const lyricsData = [
  { time: 1.5, text: "temanku semua pada jahat tante" },
  { time: 4.0, text: "aku lagi susah mereka gak ada" },
  { time: 7.5, text: "coba kalo lagi jaya" },
  { time: 10.0, text: "aku dipuja pujanya tante" },
  { time: 13.5, text: "sudah terbiasa terjadi tante" },
  { time: 16.5, text: "teman datang ketika lagi butuh saja" },
  { time: 20.0, text: "coba kalo lagi susah" },
  { time: 23.0, text: "mereka semua menghilang" },
];

export default function LyricSyncPage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
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
    }
  };

  const handleTimeUpdate = useCallback(async () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    try {
      const result = await synchronizeLyricsWithAudio({
        currentTime,
        lyricsData,
      });
      if (result.currentLineIndex !== currentLineIndex) {
        setCurrentLineIndex(result.currentLineIndex);
      }
    } catch (error) {
      console.error("Error synchronizing lyrics:", error);
    }
  }, [currentLineIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const onTimeUpdate = () => handleTimeUpdate();
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => {
        setIsPlaying(false);
        setCurrentLineIndex(-1);
      };
      
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [handleTimeUpdate, isClient]);

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-2xl overflow-hidden border-primary/20 bg-card/80 shadow-2xl shadow-primary/10 backdrop-blur-sm">
        <CardHeader className="text-center">
          <h1 className="font-headline text-4xl font-bold text-primary sm:text-5xl">TanteCulikAkuDong!</h1>
          <p className="text-accent">lagu viral di TikTok</p>
        </CardHeader>
        <CardContent>
          <div className="relative h-80 space-y-2 overflow-auto rounded-md p-4">
            <div
              className="flex w-full flex-col items-center gap-6"
            >
              {lyricsData.map((line, index) => (
                <p
                  key={index}
                  className={cn(
                    'text-center text-xl font-medium transition-all duration-300 ease-in-out',
                    currentLineIndex === index
                      ? 'scale-110 text-2xl font-bold text-primary'
                      : 'scale-100 text-muted-foreground opacity-70'
                  )}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
          <audio ref={audioRef} src="https://storage.googleapis.com/studiopublic/TanteCulikAkuDong.mp3" preload="metadata" className="hidden" />
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
