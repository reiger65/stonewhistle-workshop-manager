// A class to handle pitch detection using the Web Audio API
export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private onFrequencyChange: (frequency: number) => void = () => {};
  private animationFrameId: number | null = null;

  constructor(onFrequencyChange?: (frequency: number) => void) {
    if (onFrequencyChange) {
      this.onFrequencyChange = onFrequencyChange;
    }
  }

  async initialize(): Promise<boolean> {
    try {
      // Create audio context with fallbacks for various browsers
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error("AudioContext not supported in this browser");
        return false;
      }
      
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 48000 // Higher sample rate for better precision
      });
      
      // On iOS, we need to resume the audio context after a user gesture
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log("Requesting microphone with optimized parameters for flute detection...");
      
      // Request microphone access with optimized parameters for musical instrument detection
      // Disable audio processing that can affect pitch detection
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false, // Echo cancellation can distort pitch
          noiseSuppression: false, // Noise suppression can filter out important harmonics
          autoGainControl: false,  // Auto gain can cause volume fluctuations
          sampleRate: 48000,
          channelCount: 1  // Mono is better for pitch detection
        } 
      });
      
      // Setup audio processing
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      
      // Optimize for better frequency resolution
      // Smaller FFT size provides faster updates with some loss of frequency precision
      // This is a good tradeoff for wind instruments like flutes
      this.analyser.fftSize = 1024; 
      this.analyser.smoothingTimeConstant = 0.75; // Less smoothing for more responsive updates
      
      // Connect the audio graph
      source.connect(this.analyser);
      
      console.log("Pitch detector initialized successfully with optimized settings for flutes");
      return true;
    } catch (err) {
      console.error("Error initializing pitch detector:", err);
      return false;
    }
  }

  start() {
    if (!this.analyser || this.isRunning) return;
    
    this.isRunning = true;
    this.detectPitchLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Main detection loop
  private detectPitchLoop = () => {
    if (!this.isRunning) return;
    
    const frequency = this.detectPitch();
    if (frequency > 0) {
      this.onFrequencyChange(frequency);
    }
    
    this.animationFrameId = requestAnimationFrame(this.detectPitchLoop);
  };

  // Highly optimized YIN algorithm for flute pitch detection
  detectPitch(): number {
    if (!this.analyser || !this.isRunning) return 0;
    
    const bufferLength = this.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(buffer);
    
    // Check if there's enough signal - use a lower threshold for flutes which can be quiet
    const rms = Math.sqrt(buffer.reduce((acc, val) => acc + val * val, 0) / bufferLength);
    
    // Log signal strength for debugging
    if (rms > 0.005) {
      console.log(`Signal strength: ${rms.toFixed(4)} (${rms > 0.008 ? 'Good' : 'Weak'})`);
    }
    
    // Lower threshold specifically for flutes which may produce quieter sounds
    if (rms < 0.005) return 0; // Extremely low signal - nothing detected
    
    // Implements a modified version of the YIN algorithm optimized for flutes
    // Reference: http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf
    
    // Lower threshold for increased sensitivity
    const threshold = 0.12; // Lower value increases sensitivity (standard YIN uses 0.15-0.2)
    
    // Constrain frequency range to typical flute ranges (slightly wider than concert flute range)
    // This is critical for avoiding octave errors and improving detection in the flute's range
    const minFrequency = 140;  // Low E3 on flute is around 165Hz, but we go a bit lower
    const maxFrequency = 1400; // High C7 on flute is around 2093Hz, but we cap lower to avoid errors
    
    if (!this.audioContext) return 0;
    const sampleRate = this.audioContext.sampleRate;
    
    // Restrict search to periods corresponding to flute frequency range
    const minPeriod = Math.floor(sampleRate / maxFrequency);
    const maxPeriod = Math.ceil(sampleRate / minFrequency);
    
    // Step 1 & 2: Difference function (we skip the separate autocorrelation step for efficiency)
    const yinBuffer = new Float32Array(maxPeriod);
    
    // Calculate the difference function directly
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < bufferLength - tau; i++) {
        const diff = buffer[i] - buffer[i + tau];
        sum += diff * diff;
      }
      yinBuffer[tau] = sum;
    }
    
    // Step 3: Cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      runningSum += yinBuffer[tau];
      if (runningSum === 0) continue;
      yinBuffer[tau] *= tau / runningSum;
    }
    
    // Step 4: Find all minima below the threshold
    // We'll find multiple candidates and pick the best one
    const candidates: {tau: number, value: number}[] = [];
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      // Is this a local minimum?
      if (tau > minPeriod && tau < maxPeriod - 1 && 
          yinBuffer[tau] < yinBuffer[tau-1] && 
          yinBuffer[tau] <= yinBuffer[tau+1]) {
        
        if (yinBuffer[tau] < threshold) {
          // This is a good candidate
          candidates.push({tau, value: yinBuffer[tau]});
        }
      }
    }
    
    // If we found candidates, find the one with lowest value (highest confidence)
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.value - b.value);
      const bestCandidate = candidates[0];
      
      // Parabolic interpolation for higher accuracy
      const tau = bestCandidate.tau;
      const y1 = yinBuffer[tau - 1];
      const y2 = yinBuffer[tau];
      const y3 = yinBuffer[tau + 1];
      
      const a = (y1 + y3 - 2 * y2) / 2;
      const b = (y3 - y1) / 2;
      
      let estimatedFreq;
      const confidence = 1 - bestCandidate.value; // Higher is better
      
      // If a is 0 or very close to it, use tau directly to avoid division by zero
      if (Math.abs(a) < 0.0001) {
        estimatedFreq = sampleRate / tau;
      } else {
        const betterTau = tau - b / (2 * a);
        estimatedFreq = sampleRate / betterTau;
      }
      
      // Final check to make sure we're in the flute range
      if (estimatedFreq >= minFrequency && estimatedFreq <= maxFrequency) {
        // Only log high-confidence detections to keep console cleaner
        if (confidence > 0.7) {
          console.log(`YIN detected frequency: ${estimatedFreq.toFixed(1)} Hz (confidence: ${confidence.toFixed(2)})`);
        }
        return estimatedFreq;
      }
    }
    
    // If all else fails, find the global minimum - use with caution, signal may be too weak
    let minTau = 0;
    let minVal = Number.MAX_VALUE;
    
    for (let tau = minPeriod; tau < maxPeriod; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        minTau = tau;
      }
    }
    
    // Only use this as a last resort if the minimum is reasonably confident (value is low)
    if (minTau !== 0 && minVal < 0.2) {
      const frequency = sampleRate / minTau;
      if (frequency >= minFrequency && frequency <= maxFrequency) {
        return frequency;
      }
    }
    
    return 0; // No valid pitch found
  }

  // Convert frequency to musical note with support for both 440Hz and 432Hz tuning
  frequencyToNote(frequency: number, referenceFrequency: number = 440.0): { note: string, centsOffset: number } {
    if (!frequency || frequency === 0) {
      return { note: '', centsOffset: 0 };
    }
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Default to A4 = 440Hz standard tuning, but support 432Hz if specified
    const A4 = referenceFrequency; // 440Hz standard or 432Hz alternative
    
    // Calculate how many half steps away from A4
    const halfStepsFromA4 = 12 * Math.log2(frequency / A4);
    
    // Round to nearest half step
    const roundedHalfSteps = Math.round(halfStepsFromA4);
    
    // Calculate the 'perfect' frequency for this note in the given tuning system
    const perfectFrequency = A4 * Math.pow(2, roundedHalfSteps / 12);
    
    // Calculate cents deviation (100 cents = 1 half step)
    // Positive cents means the pitch is sharp, negative means it's flat
    const centsOffset = Math.round(1200 * Math.log2(frequency / perfectFrequency));
    
    // Calculate note and octave
    let noteIndex = (roundedHalfSteps + 9) % 12;
    if (noteIndex < 0) {
      noteIndex += 12;
    }
    const octave = Math.floor((roundedHalfSteps + 9) / 12) + 4;
    
    // For very high or low notes, check if we're within reasonable range
    if (octave < 0 || octave > 8) {
      console.warn(`Detected note outside normal range: ${noteNames[noteIndex]}${octave} (${frequency.toFixed(1)}Hz)`);
    }
    
    return { 
      note: `${noteNames[noteIndex]}${octave}`, 
      centsOffset
    };
  }

  // Cleanup resources
  cleanup() {
    this.stop();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }
}