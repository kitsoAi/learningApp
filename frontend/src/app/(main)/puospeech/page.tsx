"use client";

import { useMemo, useRef, useState } from "react";
import { Mic, Square, Loader2, AlertCircle, Languages, MessageSquare, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "transcribe" | "translate" | "tts";

export default function PuoSpeechPage() {
  const [mode, setMode] = useState<Mode>("transcribe");
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState<string>("");
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const apiBase = useMemo(() => {
    const explicitApiUrl = process.env.NEXT_PUBLIC_PUOSPEECH_API_URL;
    if (explicitApiUrl) return explicitApiUrl.replace(/\/$/, "");

    if (typeof window !== "undefined") {
      // Default to same host as frontend, but model API on port 3001.
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }

    return "";
  }, []);

  const endpoint = mode === "translate" ? "translate-speech" : "transcribe-speech";

  const sendAudio = async (audioBlob: Blob) => {
    setLoading(true);
    setError(null);
    setResult("");

    try {
      const formData = new FormData();
      formData.append("user_audio", audioBlob, "user_speech.wav");

      const response = await fetch(`${apiBase}/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      setResult(data.translation || data.transcription || "No output received.");
    } catch (e) {
      setError("Failed to process speech. Check model API status and URL.");
    } finally {
      setLoading(false);
    }
  };

  const sendTts = async () => {
    if (!ttsText.trim()) {
      setError("Enter text to synthesize.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult("");
    setTtsAudioUrl(null);

    try {
      const response = await fetch(`${apiBase}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const audioBlob = await response.blob();
      setTtsAudioUrl(URL.createObjectURL(audioBlob));
    } catch {
      setError("Failed to generate speech. Check model API status and URL.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setAudioUrl(URL.createObjectURL(blob));
        sendAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !recording) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="px-4 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-neutral-800">PuoSpeech</h1>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase text-sky-600">
          Model Test
        </span>
      </div>

      <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex gap-2">
          <Button
            variant={mode === "transcribe" ? "secondary" : "outline"}
            onClick={() => setMode("transcribe")}
          >
            <MessageSquare className="mr-2 h-4 w-4" /> Transcribe
          </Button>
          <Button
            variant={mode === "translate" ? "secondary" : "outline"}
            onClick={() => setMode("translate")}
          >
            <Languages className="mr-2 h-4 w-4" /> Translate
          </Button>
          <Button variant={mode === "tts" ? "secondary" : "outline"} onClick={() => setMode("tts")}>
            <Volume2 className="mr-2 h-4 w-4" /> TTS
          </Button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <Button
            variant={recording ? "danger" : "secondary"}
            size="lg"
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
          >
            {recording ? <Square className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
            {recording ? "Stop Recording" : "Start Recording"}
          </Button>

          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            Upload Audio
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setAudioUrl(URL.createObjectURL(file));
              sendAudio(file);
            }}
          />
        </div>

        {mode === "tts" && (
          <div className="mb-6">
            <textarea
              className="w-full rounded-xl border border-slate-200 p-3 text-sm"
              rows={4}
              placeholder="Type text to synthesize..."
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              disabled={loading}
            />
            <div className="mt-3">
              <Button onClick={sendTts} disabled={loading || !ttsText.trim()}>
                Generate Speech
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-4 flex items-center text-sky-600">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
            <AlertCircle className="mr-2 h-4 w-4" />
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase text-slate-500">Result</p>
            <p className="text-lg font-semibold text-neutral-800">{result}</p>
          </div>
        )}

        {audioUrl && (
          <div className="mt-4">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {ttsAudioUrl && (
          <div className="mt-4">
            <audio src={ttsAudioUrl} controls className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
