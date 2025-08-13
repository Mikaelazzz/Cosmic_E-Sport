'use client';
import React, { useState, useRef, useEffect } from 'react';

interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  onComplete,
  disabled = false
}) => {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newValues = [...values];
    newValues[index] = value.slice(-1); // Only take last character
    setValues(newValues);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if all inputs are filled
    if (newValues.every(val => val !== '')) {
      onComplete(newValues.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newValues = [...values];
    
    for (let i = 0; i < pasteData.length && i < length; i++) {
      newValues[i] = pasteData[i];
    }
    
    setValues(newValues);
    
    // Focus on next empty input or last input
    const nextIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
    
    // Check if complete
    if (newValues.every(val => val !== '')) {
      onComplete(newValues.join(''));
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={el => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-600 bg-[#393B4A] text-white rounded-md focus:border-[#FFD700] focus:outline-none transition-colors disabled:opacity-50"
        />
      ))}
    </div>
  );
};
