import React, { useState, useEffect } from 'react';

interface DurationInputProps {
  value?: number | null; // Duration in milliseconds
  onChange: (durationMs: number | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  includeSeconds?: boolean;
}

export default function DurationInput({
  value,
  onChange,
  placeholder = "Enter duration",
  className = "",
  required = false,
  includeSeconds = false
}: DurationInputProps) {
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');

  // Convert milliseconds to hours, minutes, seconds
  useEffect(() => {
    if (value && value > 0) {
      const totalSeconds = Math.floor(value / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setHours(h > 0 ? h.toString() : '');
      setMinutes(m > 0 ? m.toString() : '');
      setSeconds(s > 0 ? s.toString() : '');
    } else {
      setHours('');
      setMinutes('');
      setSeconds('');
    }
  }, [value]);

  // Convert hours, minutes, seconds to milliseconds and notify parent
  const updateDuration = (h: string, m: string, s: string) => {
    const hoursNum = parseInt(h) || 0;
    const minutesNum = parseInt(m) || 0;
    const secondsNum = parseInt(s) || 0;

    if (hoursNum === 0 && minutesNum === 0 && secondsNum === 0) {
      onChange(null);
    } else {
      const totalMs = (hoursNum * 3600 + minutesNum * 60 + secondsNum) * 1000;
      onChange(totalMs);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = e.target.value;
    setHours(newHours);
    updateDuration(newHours, minutes, seconds);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = e.target.value;
    if (parseInt(newMinutes) > 59) return; // Prevent minutes > 59
    setMinutes(newMinutes);
    updateDuration(hours, newMinutes, seconds);
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSeconds = e.target.value;
    if (parseInt(newSeconds) > 59) return; // Prevent seconds > 59
    setSeconds(newSeconds);
    updateDuration(hours, minutes, newSeconds);
  };

  // Determine if we should show seconds based on includeSeconds prop or if there are seconds in the value
  const shouldShowSeconds = includeSeconds || (value && (Math.floor(value / 1000) % 60) > 0);

  // The inputs should only be required when the component-level `required` is true
  // AND none of the three inputs has a value. This allows the form to validate
  // as satisfied when the user fills any of hours/minutes/seconds.
  const isFieldRequired = required && hours === '' && minutes === '' && seconds === '';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hours */}
      <div className="flex items-center">
        <input
          type="number"
          min="0"
          max="23"
          value={hours}
          onChange={handleHoursChange}
          className="w-36 px-2 py-3 border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white text-center"
          placeholder="0"
          required={isFieldRequired}
        />
        <span className="text-gray-400 ml-1 text-3xl">h</span>
      </div>

      {/* Minutes */}
      <div className="flex items-center">
        <input
          type="number"
          min="0"
          max="59"
          value={minutes}
          onChange={handleMinutesChange}
          className="w-36 px-2 py-3 border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white text-center"
          placeholder="0"
          required={isFieldRequired}
        />
        <span className="text-gray-400 ml-1 text-3xl">m</span>
      </div>

      {/* Seconds (conditional) */}
      {shouldShowSeconds && (
        <div className="flex items-center">
          <input
            type="number"
            min="0"
            max="59"
            value={seconds}
            onChange={handleSecondsChange}
            className="w-36 px-2 py-3  border border-[#fbb033] rounded-3xl focus:ring-2 focus:ring-[#fbb033] focus:border-transparent text-white text-center"
            placeholder="0"
            required={isFieldRequired}
          />
          <span className="text-gray-400 ml-1 text-3xl">s</span>
        </div>
      )}

      {/* Toggle seconds button */}
      {/* {!shouldShowSeconds && (
        <button
          type="button"
          onClick={() => setSeconds('0')} // This will trigger shouldShowSeconds to become true
          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-gray-300"
        >
          +s
        </button>
      )} */}
    </div>
  );
}