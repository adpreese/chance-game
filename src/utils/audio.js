const BEEP_WAV = 'data:audio/wav;base64,UklGRmQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YUABAAAAAKsIURAIFiUZSBluFu0QbAnNABf4UPBj6gXnm+Yx6Xru1vVl/iQHCw8sFcsYfBkpFxkS5gpoAqP5nfFL62vndOaC6FftYfTL/JUFtw06FFgYlhnNFzMTVQwBBDX7+fJH7OvnZ+br50fs+fI1+wEEVQwzE80XlhlYGDoUtw2VBcv8YfRX7YLodOZr50vrnfGj+WgC5goZEikXfBnLGCwVCw8kB2X+1vV67jHpm+YF52PqUPAX+M0AbAntEG4WSBklGQgWURCrCAAAVfev7/jp2+a45pLpE++U9jP/6QewD50V+xhlGc8WhhEqCpsB3Pj18NTqNeeE5tfo5+0a9Zj9XQZjDrUUlRiMGX4XqRKfCzUDa/pJ8sbrqOdq5jPozeyr8//7ywQHDbkTFRiZGRUYuRMHDcsE//ur883sM+hq5g==';

export const CORE_SFX = {
  buttonClick: { url: BEEP_WAV, volume: 0.5 },
  hover: { url: BEEP_WAV, volume: 0.3 },
  success: { url: BEEP_WAV, volume: 0.6 },
  fail: { url: BEEP_WAV, volume: 0.6 },
  impact: { url: BEEP_WAV, volume: 0.6 },
  ambient: { url: BEEP_WAV, volume: 0.2 },
};

export const CORE_SFX_KEYS = Object.keys(CORE_SFX);

export const registerSfx = (scene) => {
  if (!scene?.sound) {
    return;
  }

  CORE_SFX_KEYS.forEach((key) => {
    if (!scene.sound.get(key)) {
      scene.sound.add(key, { volume: CORE_SFX[key].volume });
    }
  });
};

export const playSfx = (scene, key, options = {}) => {
  if (!scene?.sound) {
    return;
  }

  if (!scene.sound.get(key)) {
    registerSfx(scene);
  }

  const sound = scene.sound.get(key);
  if (!sound) {
    return;
  }

  sound.play({
    volume: options.volume ?? CORE_SFX[key]?.volume ?? 0.6,
    ...options,
  });
};
