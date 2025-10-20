import React from 'react';
import { Input } from '@/components/ui/input';

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TimePickerInput({ value, onChange }: TimePickerInputProps) {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  );
}