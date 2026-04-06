export function playTimerEndSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    const beep = (startTime: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.4, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
      osc.start(startTime)
      osc.stop(startTime + duration)
    }

    beep(ctx.currentTime, 880, 0.15)
    beep(ctx.currentTime + 0.18, 880, 0.15)
    beep(ctx.currentTime + 0.36, 1100, 0.35)
  } catch {
    // Audio not available — silent fallback
  }
}
