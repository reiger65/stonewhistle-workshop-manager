import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Globale variabele die het preloaded audio element bijhoudt
const preloadedAudio: { [key: string]: HTMLAudioElement } = {};

// Directe functie om geluid af te spelen zonder hooks of preloading
export const playSound = (src: string, volume = 1.0) => {
  console.log(`Attempting to play sound: ${src} at volume ${volume}`);
  
  try {
    // Altijd een nieuw audio element maken voor maximale compatibiliteit
    const audio = new Audio(src);
    audio.volume = volume;
    
    // Speel het geluid af
    console.log('Playing sound with new Audio element');
    
    // Op iOS/Safari is een gebruikersinteractie nodig voor audio
    // We doen alsof de gebruiker heeft geklikt (dit kan werken in sommige browsers)
    document.body.click();
    
    // Probeer het geluid af te spelen
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio played successfully!');
        })
        .catch(error => {
          console.error('Error playing audio with new element:', error);
          
          // Gebruik een audio HTML element in de DOM als fallback
          try {
            console.log('Trying to play with a DOM audio element as fallback');
            const audioElement = document.createElement('audio');
            audioElement.src = src;
            audioElement.volume = volume;
            document.body.appendChild(audioElement);
            
            const domPlayPromise = audioElement.play();
            domPlayPromise
              .then(() => {
                console.log('DOM audio played successfully!');
                // Cleanup na afspelen
                audioElement.onended = () => {
                  document.body.removeChild(audioElement);
                };
              })
              .catch(e => {
                console.error('DOM audio fallback failed too:', e);
                document.body.removeChild(audioElement);
              });
          } catch (domError) {
            console.error('DOM audio creation failed:', domError);
          }
        });
    }
  } catch (error) {
    console.error('Unexpected error creating audio:', error);
  }
};

export function useAudio(src: string) {
  return {
    play: (volume = 1.0) => {
      playSound(src, volume);
    }
  };
}

export function AudioLoader() {
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log("AudioLoader: Initializing...");
    
    // Lijst van alle geluiden die we willen preloaden
    const audioSources: string[] = [
      // Geen geluiden meer nodig na verwijderen van water reminder
    ];

    // Preload alle audio bestanden
    audioSources.forEach(src => {
      try {
        console.log(`AudioLoader: Loading ${src}`);
        const audio = new Audio(src);
        
        // Event listeners om de status bij te houden
        audio.addEventListener('canplaythrough', () => {
          console.log(`AudioLoader: ${src} loaded successfully`);
        });
        
        audio.addEventListener('error', (e) => {
          console.error(`AudioLoader: Error loading ${src}`, e);
        });
        
        audio.load(); // Preload het audiobestand
        preloadedAudio[src] = audio;
        
        // Try to unlock audio by interacting with it
        const unlockAudio = () => {
          console.log("AudioLoader: Attempting to unlock audio...");
          
          // Probeer het geluid af te spelen met volume 0
          audio.volume = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("AudioLoader: Audio unlocked successfully");
                audio.pause();
                audio.currentTime = 0;
                setLoaded(true);
              })
              .catch(error => {
                console.error("AudioLoader: Failed to unlock audio", error);
              });
          }
        };
        
        // Unlock bij een gebruikersactie
        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('keydown', unlockAudio, { once: true });
        
        // Ook direct proberen (kan werken in sommige browsers)
        unlockAudio();
      } catch (error) {
        console.error(`AudioLoader: Unexpected error for ${src}`, error);
      }
    });

    // Log een bericht na 3 seconden als het laden voltooid is
    const timer = setTimeout(() => {
      console.log("AudioLoader: Audio preloading completed");
    }, 3000);

    // Cleanup bij unmount
    return () => {
      clearTimeout(timer);
      Object.values(preloadedAudio).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, [toast]);

  // Render niets - dit is alleen een funktionele component
  return null;
}