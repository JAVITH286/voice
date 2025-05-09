
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mic, StopCircle, Download, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { speechToTextConversion, SpeechToTextConversionInput } from '@/ai/flows/speech-to-text-conversion';
import { reduceNoise, ReduceNoiseInput } from '@/ai/flows/noise-reduction';

export default function ClearVoiceApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [finalTranscription, setFinalTranscription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [useNoiseReduction, setUseNoiseReduction] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup stream on component unmount
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartRecording = async () => {
    if (isRecording) {
      handleStopRecording();
      return;
    }

    setError(null);
    setFinalTranscription("");
    setTranscription("Initializing recorder...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsLoading(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;
          try {
            let currentAudioUri = audioDataUri;
            if (useNoiseReduction) {
              setLoadingMessage("Reducing noise...");
              setTranscription(""); // Clear previous message
              const noiseReductionResult = await reduceNoise({ audioDataUri: currentAudioUri });
              currentAudioUri = noiseReductionResult.noiseReducedAudioDataUri;
            }
            setLoadingMessage("Transcribing audio...");
            setTranscription(""); // Clear previous message
            const transcriptionResult = await speechToTextConversion({ audioDataUri: currentAudioUri });
            setFinalTranscription(transcriptionResult.transcription);
            toast({ title: "Transcription Complete", description: "Your audio has been transcribed." });
          } catch (e) {
            console.error("Processing error:", e);
            setError("Failed to process audio. Please try again.");
            toast({ variant: "destructive", title: "Processing Error", description: "Could not process audio." });
          } finally {
            setIsLoading(false);
            setLoadingMessage("");
            // Stop all tracks on the stream to release the microphone
            if (audioStreamRef.current) {
                audioStreamRef.current.getTracks().forEach(track => track.stop());
                audioStreamRef.current = null;
            }
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription("Recording... Click stop when done.");
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not start recording. Please ensure microphone access is allowed.");
      toast({ variant: "destructive", title: "Recording Error", description: "Microphone access denied or recorder failed." });
      setTranscription("");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTranscription("Processing audio...");
    }
  };

  const handleDownload = () => {
    if (!finalTranscription) return;
    const blob = new Blob([finalTranscription], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Download Started", description: "Transcription.txt is downloading." });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">
          ClearVoice Transcribe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted rounded-lg">
          <Button
            onClick={handleStartRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="w-full sm:w-auto"
            disabled={isLoading}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <StopCircle className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="noise-reduction"
              checked={useNoiseReduction}
              onCheckedChange={setUseNoiseReduction}
              disabled={isRecording || isLoading}
              aria-labelledby="noise-reduction-label"
            />
            <Label htmlFor="noise-reduction" id="noise-reduction-label" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" />
              Noise Reduction
            </Label>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress value={undefined} className="w-full animate-pulse" />
            <p className="text-sm text-center text-muted-foreground">{loadingMessage || "Processing..."}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="transcription-output" className="text-lg font-semibold">Transcription:</Label>
          <Textarea
            id="transcription-output"
            value={finalTranscription || transcription}
            readOnly
            placeholder={isRecording ? "Speak now..." : "Your transcription will appear here..."}
            className="h-48 resize-none text-base p-4 rounded-md shadow-inner bg-background"
            aria-live="polite"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDownload}
          disabled={!finalTranscription || isLoading}
          variant="outline"
          className="w-full"
        >
          <Download className="mr-2 h-5 w-5" />
          Download Transcription (.txt)
        </Button>
      </CardFooter>
    </Card>
  );
}
