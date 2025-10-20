import { useRef, useState, useEffect, ChangeEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';

// Definieer een eigen interface zonder overerving
interface OptimizedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  className?: string;
  rows?: number;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Een geoptimaliseerd textarea component dat debouncing gebruikt om typevertragingen te minimaliseren
 */
export function OptimizedTextarea({
  value,
  onChange,
  debounceMs = 50,
  className = '',
  rows = 5,
  placeholder = '',
  ...props
}: OptimizedTextareaProps) {
  // Interne state voor directe updates (voorkomt typevertraging)
  const [internalValue, setInternalValue] = useState(value);
  // Referentie naar de textarea DOM element
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Synchroniseer interne waarde wanneer externe waarde verandert
  useEffect(() => {
    setInternalValue(value);
  }, [value]);
  
  // Gebruik debouncing om het aantal keren dat we de parent component updaten te beperken
  useEffect(() => {
    const timer = setTimeout(() => {
      // Alleen updaten als de waarde daadwerkelijk is veranderd
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);
    
    // Cleanup timer wanneer component unmount of waarde verandert
    return () => clearTimeout(timer);
  }, [internalValue, onChange, value, debounceMs]);
  
  // Handler voor onmiddellijke lokale updates
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Direct de interne state bijwerken voor snelle feedback
    // React gebruik hier requestAnimationFrame onder de motorkap
    setInternalValue(e.target.value);
  };
  
  return (
    <Textarea
      ref={textareaRef}
      value={internalValue}
      onChange={handleChange}
      rows={rows}
      className={`font-mono text-sm ${className}`}
      placeholder={placeholder}
      {...props}
    />
  );
}