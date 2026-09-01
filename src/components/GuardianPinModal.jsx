import React, { useState, useRef, useEffect } from "react";

export default function GuardianPinModal({ isOpen, onClose, onSuccess, correctPin = "1234" }) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", ""]);
      setError(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      const fullPin = newPin.join("");
      if (fullPin === correctPin) {
        onSuccess();
      } else {
        setError(true);
        setPin(["", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 text-slate-100 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        <h3 className="text-center text-lg font-bold text-white">Guardian PIN Required</h3>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enter the 4-digit Family Protection PIN to authorize.
        </p>

        <div className="my-6 flex justify-center gap-3">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`h-12 w-12 rounded-xl border text-center text-xl font-bold bg-slate-950 outline-none transition ${
                error ? "border-red-500 text-red-400" : "border-slate-700 text-white focus:border-indigo-500"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-3 text-center text-xs text-red-400">Incorrect PIN. Try again.</p>
        )}
      </div>
    </div>
  );
}