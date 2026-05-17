export class SoundManager {
  private enabled: boolean
  private audioContext: AudioContext | null = null

  constructor(enabled: boolean) {
    this.enabled = enabled
    if (typeof window !== "undefined" && enabled) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  playSound(type: "place" | "mill" | "win" | "lose"): void {
    if (!this.enabled || !this.audioContext) return

    const frequencies: { [key: string]: number } = {
      place: 440, // A4
      mill: 660, // E5
      win: 880, // A5
      lose: 220, // A3
    }

    const frequency = frequencies[type]
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = "sine"

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + 0.3)
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
