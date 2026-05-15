"use client";

import { formatAssetUrl } from "@/lib/utils";

const audioCache = new Map<string, HTMLAudioElement>();
let sharedAudioContext: AudioContext | null = null;

function canUseAudio() {
  return typeof window !== "undefined";
}

function resolveAudioUrl(src: string) {
  return formatAssetUrl(src) ?? src;
}

export function primeAudio(src: string) {
  if (!canUseAudio()) {
    return null;
  }

  const url = resolveAudioUrl(src);
  const cached = audioCache.get(url);
  if (cached) {
    return cached;
  }

  const audio = new Audio(url);
  audio.preload = "auto";
  audio.load();
  audioCache.set(url, audio);
  return audio;
}

export function playCachedAudio(src: string) {
  if (!canUseAudio()) {
    return;
  }

  const audio = primeAudio(src);
  if (!audio) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function getSharedAudioContext() {
  if (!canUseAudio()) {
    return null;
  }

  if (sharedAudioContext) {
    return sharedAudioContext;
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) {
    return null;
  }

  sharedAudioContext = new AudioContextCtor();
  return sharedAudioContext;
}

