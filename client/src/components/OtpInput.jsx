import { useRef } from 'react'

export default function OtpInput({ value, onChange, disabled = false }) {
  const inputsRef = useRef([])
  const digits = value.padEnd(6, ' ').slice(0, 6).split('')

  const setDigit = (index, nextValue) => {
    const numeric = nextValue.replace(/\D/g, '')
    const current = value.padEnd(6, ' ').slice(0, 6).split('')
    current[index] = numeric.at(-1) || ' '
    onChange(current.join('').replace(/\s/g, '').slice(0, 6))
    if (numeric && index < 5) inputsRef.current[index + 1]?.focus()
  }

  const handlePaste = (event) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => { inputsRef.current[index] = element }}
          value={digit.trim()}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`OTP digit ${index + 1}`}
          maxLength="1"
          disabled={disabled}
          className="grid size-12 place-items-center rounded-card border border-line bg-white text-center text-xl font-black text-ink shadow-xs outline-none transition focus:border-emerald-brand focus:ring-4 focus:ring-emerald-brand/10 disabled:opacity-60 sm:size-14"
        />
      ))}
    </div>
  )
}
