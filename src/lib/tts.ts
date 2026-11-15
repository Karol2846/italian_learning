let voice: SpeechSynthesisVoice | undefined

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() ?? []
  voice = voices.find((v) => v.lang === 'it-IT') ?? voices.find((v) => v.lang.startsWith('it'))
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  pickVoice()
  window.speechSynthesis.addEventListener('voiceschanged', pickVoice)
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

export function speak(text: string, slow = false) {
  if (!canSpeak()) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'it-IT'
  if (voice) u.voice = voice
  u.rate = slow ? 0.6 : 0.9
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}
