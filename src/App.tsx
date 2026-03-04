import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, TouchEvent } from 'react';
import styles from './App.module.scss';
import { BACKGROUND_IMAGES, CHARACTERS, type SoundOption } from './config';

const VISIBLE_SOUND_COUNT = 20;
const GLITCH_AUTO_DISABLE_KEY = 'gumi-alise-glitch-auto-disabled';
const CHARACTER_SWITCH_OVERLAY_MS = 2350;
const CHARACTER_SWITCH_VISIBLE_SWAP_MS = 1860;
const CHARACTER_SWITCH_SOUND_PATH = '/hanako/goat.mp3';

const getStoredGlitchAutoDisabled = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.sessionStorage.getItem(GLITCH_AUTO_DISABLE_KEY) === '1';
  } catch {
    return false;
  }
};

const storeGlitchAutoDisabled = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(GLITCH_AUTO_DISABLE_KEY, '1');
  } catch {
    // Ignore storage errors and keep behavior in-memory only.
  }
};

const getRandomSounds = (sounds: SoundOption[], count: number) => {
  if (sounds.length <= count) {
    return [...sounds];
  }

  const selectedIndexes = new Set<number>();

  while (selectedIndexes.size < count) {
    selectedIndexes.add(Math.floor(Math.random() * sounds.length));
  }

  // Preserve original array order while still selecting random sounds.
  return sounds.filter((_, index) => selectedIndexes.has(index));
};

const createGlitchOverlayVars = (): CSSProperties => {
  const stripeWidth = 7 + Math.random() * 7;
  const darkA = 0.16 + Math.random() * 0.1;
  const darkB = 0.11 + Math.random() * 0.09;
  const light = 0.03 + Math.random() * 0.04;
  const thickWidth = 16 + Math.random() * 24;
  const thickGap = 180 + Math.random() * 150;
  const thickOpacity = 0.07 + Math.random() * 0.08;
  const offsetX = Math.floor(Math.random() * 42);

  return {
    '--glitch-stripe-width': `${stripeWidth.toFixed(2)}px`,
    '--glitch-dark-a': `rgba(0, 0, 0, ${darkA.toFixed(3)})`,
    '--glitch-dark-b': `rgba(0, 0, 0, ${darkB.toFixed(3)})`,
    '--glitch-light': `rgba(255, 255, 255, ${light.toFixed(3)})`,
    '--glitch-thick-width': `${thickWidth.toFixed(2)}px`,
    '--glitch-thick-gap': `${thickGap.toFixed(2)}px`,
    '--glitch-thick-opacity': `${thickOpacity.toFixed(3)}`,
    '--glitch-offset-x': `${offsetX}px`,
  } as CSSProperties;
};

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;

    if (image.complete) {
      resolve();
    }
  });

function App() {
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isCharacterSwitching, setIsCharacterSwitching] = useState(false);
  const [renderMode, setRenderMode] = useState<'stable' | 'glitch'>('stable');
  const [glitchOverlayVars, setGlitchOverlayVars] = useState<CSSProperties>(() => createGlitchOverlayVars());
  const [autoGlitchDisabled, setAutoGlitchDisabled] = useState<boolean>(() => getStoredGlitchAutoDisabled());
  const [touchDraggedSound, setTouchDraggedSound] = useState<string | null>(null);
  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const defaultCharacter = CHARACTERS[0];
  const [visibleSounds, setVisibleSounds] = useState<SoundOption[]>(() =>
    getRandomSounds(defaultCharacter.sounds, VISIBLE_SOUND_COUNT),
  );

  const activeCharacter = CHARACTERS[characterIndex] ?? defaultCharacter;
  const characterSounds = activeCharacter.sounds;

  const soundById = useMemo(() => new Map(visibleSounds.map((sound) => [sound.id, sound] as const)), [visibleSounds]);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const characterSwitchRunIdRef = useRef(0);
  const characterSwitchAudioRef = useRef<HTMLAudioElement | null>(null);

  const rememberGlitchDisabled = useCallback(() => {
    setAutoGlitchDisabled(true);
    storeGlitchAutoDisabled();
  }, []);

  const stopAllAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current = {};
  }, []);

  const stopCharacterSwitchAudio = useCallback(() => {
    const audio = characterSwitchAudioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    characterSwitchAudioRef.current = null;
  }, []);

  const startCharacterSwitchAudio = useCallback(() => {
    stopCharacterSwitchAudio();
    const audio = new Audio(CHARACTER_SWITCH_SOUND_PATH);
    audio.loop = true;
    audio.volume = 0.85;
    void audio.play().catch(() => undefined);
    characterSwitchAudioRef.current = audio;
  }, [stopCharacterSwitchAudio]);

  const enableSound = useCallback(
    (soundId: string) => {
      const sound = soundById.get(soundId);
      if (!sound) {
        return;
      }

      const existingAudio = audioRefs.current[soundId];
      if (existingAudio) {
        existingAudio.currentTime = 0;
        void existingAudio.play().catch(() => undefined);
      } else {
        const nextAudio = new Audio(sound.path);
        nextAudio.loop = true;
        void nextAudio.play().catch(() => undefined);
        audioRefs.current[soundId] = nextAudio;
      }

      if (!autoGlitchDisabled && renderMode !== 'glitch') {
        setGlitchOverlayVars(createGlitchOverlayVars());
        setRenderMode('glitch');
      }

      setActiveSoundIds((previous) => (previous.includes(soundId) ? previous : [...previous, soundId]));
    },
    [autoGlitchDisabled, renderMode, soundById],
  );

  const disableSound = useCallback((soundId: string) => {
    const audio = audioRefs.current[soundId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete audioRefs.current[soundId];
    }
    setActiveSoundIds((previous) => previous.filter((id) => id !== soundId));
  }, []);

  const toggleSound = useCallback(
    (soundId: string) => {
      if (activeSoundIds.includes(soundId)) {
        disableSound(soundId);
        return;
      }

      enableSound(soundId);
    },
    [activeSoundIds, disableSound, enableSound],
  );

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, soundId: string) => {
    event.dataTransfer.setData('text/plain', soundId);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTouchStart = (soundId: string) => {
    setTouchDraggedSound(soundId);
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDropActive(false);
    const soundId = event.dataTransfer.getData('text/plain');
    enableSound(soundId);
  };

  const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (!touchDraggedSound) {
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const isCharacterTarget = Boolean(dropTarget?.closest('[data-drop-target="character"]'));
    setIsDropActive(isCharacterTarget);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!touchDraggedSound) {
      return;
    }

    const touch = event.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const isCharacterTarget = dropTarget?.closest('[data-drop-target="character"]');

    if (isCharacterTarget) {
      enableSound(touchDraggedSound);
    }

    setTouchDraggedSound(null);
    setIsDropActive(false);
  };

  const rotateCharacter = () => {
    if (isCharacterSwitching) {
      return;
    }

    const nextCharacterIndex = (characterIndex + 1) % CHARACTERS.length;
    const nextCharacter = CHARACTERS[nextCharacterIndex] ?? defaultCharacter;
    const runId = characterSwitchRunIdRef.current + 1;
    characterSwitchRunIdRef.current = runId;
    setIsCharacterSwitching(true);
    startCharacterSwitchAudio();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const startTime = performance.now();

    void (async () => {
      await Promise.all([preloadImage(nextCharacter.img), wait(CHARACTER_SWITCH_VISIBLE_SWAP_MS)]);
      if (characterSwitchRunIdRef.current !== runId) {
        return;
      }

      stopAllAudio();
      setActiveSoundIds([]);
      setTouchDraggedSound(null);
      setIsDropActive(false);
      setVisibleSounds(getRandomSounds(nextCharacter.sounds, VISIBLE_SOUND_COUNT));
      setCharacterIndex(nextCharacterIndex);

      const elapsedMs = performance.now() - startTime;
      const remainingOverlayMs = CHARACTER_SWITCH_OVERLAY_MS - elapsedMs;

      if (remainingOverlayMs > 0) {
        await wait(remainingOverlayMs);
        if (characterSwitchRunIdRef.current !== runId) {
          return;
        }
      }

      setIsCharacterSwitching(false);
      stopCharacterSwitchAudio();
    })();
  };

  const dropTargetPulseClass = useMemo(() => {
    if (activeSoundIds.length === 0) {
      return '';
    }

    const hasFastAnimation = activeSoundIds.some((soundId) => {
      const animation = soundById.get(soundId)?.animation;
      return animation === 'fast' || animation === 'both';
    });
    const hasSlowAnimation = activeSoundIds.some((soundId) => {
      const animation = soundById.get(soundId)?.animation;
      return animation === 'slow' || animation === 'both';
    });

    if (hasFastAnimation && hasSlowAnimation) {
      return styles.dropTargetPulseBoth;
    }

    if (hasFastAnimation) {
      return styles.dropTargetPulseFast;
    }

    return styles.dropTargetPulseSlow;
  }, [activeSoundIds, soundById]);

  const resetBoard = useCallback(() => {
    stopAllAudio();
    setActiveSoundIds([]);
    setTouchDraggedSound(null);
    setIsDropActive(false);
    setVisibleSounds(getRandomSounds(characterSounds, VISIBLE_SOUND_COUNT));
    if (renderMode === 'glitch') {
      setRenderMode('stable');
      rememberGlitchDisabled();
    }
  }, [characterSounds, rememberGlitchDisabled, renderMode, stopAllAudio]);

  const toggleRenderMode = useCallback(() => {
    if (renderMode === 'glitch') {
      setRenderMode('stable');
      rememberGlitchDisabled();
      return;
    }

    setGlitchOverlayVars(createGlitchOverlayVars());
    setRenderMode('glitch');
  }, [rememberGlitchDisabled, renderMode]);

  useEffect(() => {
    if (BACKGROUND_IMAGES.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setBackgroundIndex((previous) => (previous + 1) % BACKGROUND_IMAGES.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => () => stopAllAudio(), [stopAllAudio]);

  useEffect(() => {
    if (isCharacterSwitching) {
      return;
    }

    stopCharacterSwitchAudio();
  }, [isCharacterSwitching, stopCharacterSwitchAudio]);

  useEffect(() => {
    if (!isCharacterSwitching) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCharacterSwitching]);

  useEffect(
    () => () => {
      characterSwitchRunIdRef.current += 1;
      stopCharacterSwitchAudio();
    },
    [stopCharacterSwitchAudio],
  );

  return (
    <div className={`${styles.page} ${renderMode === 'glitch' ? styles.pageGlitch : ''}`} style={glitchOverlayVars}>
      <div className={styles.background} style={{ backgroundImage: `url(${BACKGROUND_IMAGES[backgroundIndex]})` }} />
      <div className={styles.backgroundOverlay} />

      <main className={styles.content} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <section
          className={styles.panel}
          style={
            {
              '--character-primary': activeCharacter.primaryColor,
              '--character-primary-soft': activeCharacter.primaryColorSoft,
              '--character-drop-bottom': activeCharacter.dropTargetBottomColor,
              '--character-drop-bottom-active': activeCharacter.dropTargetBottomActiveColor,
            } as CSSProperties
          }
        >
          <header className={styles.titleBlock}>
            <h1 className={styles.titleJapanese}>おめでとう、</h1>
            <p className={styles.titleRomanized}>(OMEDETO)</p>
            <p className={styles.titleName}>ALISE!</p>
          </header>

          <section className={styles.characterStage}>
            <div
              className={`${styles.dropTarget} ${isDropActive ? styles.dropTargetActive : ''} ${dropTargetPulseClass}`}
              data-drop-target="character"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={handleDrop}
            >
              <p className={styles.dropLabel}>{activeCharacter.mixLabel}</p>
              <div className={styles.characterImageWrap}>
                <img
                  className={styles.characterImage}
                  src={activeCharacter.img}
                  alt={`${activeCharacter.name} character`}
                />
                <button
                  type="button"
                  className={styles.characterCycleButton}
                  onClick={rotateCharacter}
                  disabled={isCharacterSwitching}
                  aria-label="Show next character"
                >
                  ↻
                </button>
              </div>
            </div>

            <p className={styles.activeSummary}>
              {activeSoundIds.length === 0
                ? 'No active sounds'
                : `${activeSoundIds.length} active sound${activeSoundIds.length > 1 ? 's' : ''}`}
            </p>
            <div className={styles.activeTags}>
              {activeSoundIds.map((soundId) => (
                <button
                  key={soundId}
                  type="button"
                  className={styles.activeTagButton}
                  onClick={() => disableSound(soundId)}
                  aria-label={`Disable ${soundById.get(soundId)?.name ?? soundId}`}
                >
                  {soundById.get(soundId)?.name ?? soundId}
                </button>
              ))}
            </div>
          </section>

          <details className={styles.soundDropdown} open>
            <summary>Tap or Drag</summary>
            <p className={styles.dropdownHelper}>Tap to turn on, tap again to turn off!</p>
            <div className={styles.soundGrid}>
              {visibleSounds.map((sound) => {
                const isActive = activeSoundIds.includes(sound.id);

                return (
                  <button
                    key={sound.id}
                    type="button"
                    className={`${styles.soundChip} ${isActive ? styles.soundChipActive : ''}`}
                    draggable
                    onDragStart={(event) => handleDragStart(event, sound.id)}
                    onTouchStart={() => handleTouchStart(sound.id)}
                    onClick={() => toggleSound(sound.id)}
                    style={{
                      backgroundColor: isActive ? `var(${sound.colorToken})` : `var(${sound.colorToken}-opq)`,
                    }}
                  >
                    {sound.name}
                  </button>
                );
              })}
            </div>
          </details>
        </section>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={resetBoard}
          aria-label="Reset all active sounds"
        >
          Reset & Change
        </button>

        <button
          type="button"
          className={styles.fxButton}
          onClick={toggleRenderMode}
          aria-pressed={renderMode === 'glitch'}
          aria-label="Toggle visual effects mode"
        >
          Glitch: {renderMode === 'glitch' ? 'ON' : 'OFF'}
        </button>
      </main>

      {isCharacterSwitching && (
        <div className={styles.characterSwitchOverlay} aria-hidden="true">
          <div className={styles.characterSwitchContent}>
            <img className={styles.characterSwitchPony} src="/rb-storm.png" alt="" />
            <p className={styles.characterSwitchText}>Switching character...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
