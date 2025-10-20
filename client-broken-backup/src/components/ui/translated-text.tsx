import { useLanguage } from '@/lib/languageContext';
import { TranslationKey } from '@/lib/translations';

interface TranslatedTextProps {
  translationKey: TranslationKey;
  className?: string;
}

/**
 * Component that renders text using the current language from context
 */
export function TranslatedText({ translationKey, className = '' }: TranslatedTextProps) {
  const { t } = useLanguage();
  
  return (
    <span 
      className={className}
      style={translationKey === 'nav.buildlist' ? { textTransform: 'uppercase' } : {}}
    >
      {t(translationKey)}
    </span>
  );
}