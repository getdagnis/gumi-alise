import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, TouchEvent } from 'react';
import styles from './App.module.scss';
import { BACKGROUND_IMAGE_KEYS, CHARACTERS, type SoundOption } from './config';

const VISIBLE_SOUND_COUNT = 20;
const GLITCH_PREF_KEY = 'gumi-alise-glitch-mode';
const DEFAULT_GLITCH_MODE: 'stable' | 'glitch' = 'stable';
const CHARACTER_SWITCH_OVERLAY_MS = 2650;
const CHARACTER_SWITCH_VISIBLE_SWAP_MS = 1860;
const CHARACTER_SWITCH_SOUND_PATH = '/hanako/goat.mp3';
const BG_DESKTOP_SUFFIX = '1920';
const BG_MOBILE_SUFFIX = 'mob';

const getStoredGlitchMode = (): 'stable' | 'glitch' => {
  if (typeof window === 'undefined') {
    return DEFAULT_GLITCH_MODE;
  }

  try {
    const stored = window.localStorage.getItem(GLITCH_PREF_KEY);
    if (stored === 'stable' || stored === 'glitch') {
      return stored;
    }
    return DEFAULT_GLITCH_MODE;
  } catch {
    return DEFAULT_GLITCH_MODE;
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

const buildBackgroundImagePath = (backgroundKey: string, suffix: string) => `/${backgroundKey}-${suffix}.jpg`;

const getIsMobileVerticalDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const isPortrait = window.matchMedia('(orientation: portrait)').matches;
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  return isPortrait && hasCoarsePointer;
};

function App() {
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [isMobileVerticalDevice, setIsMobileVerticalDevice] = useState(() => getIsMobileVerticalDevice());
  const [isBackgroundRotationReady, setIsBackgroundRotationReady] = useState(false);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [isCharacterSwitching, setIsCharacterSwitching] = useState(false);
  const [renderMode, setRenderMode] = useState<'stable' | 'glitch'>(() => getStoredGlitchMode());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [glitchOverlayVars, setGlitchOverlayVars] = useState<CSSProperties>(() => createGlitchOverlayVars());
  const [touchDraggedSound, setTouchDraggedSound] = useState<string | null>(null);
  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const defaultCharacter = CHARACTERS[0];
  const [visibleSounds, setVisibleSounds] = useState<SoundOption[]>(() =>
    getRandomSounds(defaultCharacter.sounds, VISIBLE_SOUND_COUNT),
  );

  const activeCharacter = CHARACTERS[characterIndex] ?? defaultCharacter;
  const characterSounds = activeCharacter.sounds;
  const activeBackgroundSuffix = isMobileVerticalDevice ? BG_MOBILE_SUFFIX : BG_DESKTOP_SUFFIX;
  const activeBackgroundImage = useMemo(() => {
    const activeBackgroundKey = BACKGROUND_IMAGE_KEYS[backgroundIndex] ?? BACKGROUND_IMAGE_KEYS[0];
    return buildBackgroundImagePath(activeBackgroundKey, activeBackgroundSuffix);
  }, [activeBackgroundSuffix, backgroundIndex]);

  const soundById = useMemo(() => new Map(visibleSounds.map((sound) => [sound.id, sound] as const)), [visibleSounds]);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const characterSwitchRunIdRef = useRef(0);
  const characterSwitchAudioRef = useRef<HTMLAudioElement | null>(null);

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

      setActiveSoundIds((previous) => (previous.includes(soundId) ? previous : [...previous, soundId]));
    },
    [soundById],
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
  }, [characterSounds, stopAllAudio]);

  const toggleRenderMode = useCallback(() => {
    if (renderMode === 'glitch') {
      setRenderMode('stable');
      return;
    }

    setGlitchOverlayVars(createGlitchOverlayVars());
    setRenderMode('glitch');
  }, [renderMode]);

  useEffect(() => {
    if (!isBackgroundRotationReady || BACKGROUND_IMAGE_KEYS.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setBackgroundIndex((previous) => (previous + 1) % BACKGROUND_IMAGE_KEYS.length);
    }, 9000);

    return () => window.clearInterval(interval);
  }, [isBackgroundRotationReady]);

  useEffect(() => {
    const updateViewportType = () => {
      setIsMobileVerticalDevice(getIsMobileVerticalDevice());
    };

    updateViewportType();

    const orientationQuery = window.matchMedia('(orientation: portrait)');
    const pointerQuery = window.matchMedia('(pointer: coarse)');

    orientationQuery.addEventListener('change', updateViewportType);
    pointerQuery.addEventListener('change', updateViewportType);
    window.addEventListener('resize', updateViewportType);

    return () => {
      orientationQuery.removeEventListener('change', updateViewportType);
      pointerQuery.removeEventListener('change', updateViewportType);
      window.removeEventListener('resize', updateViewportType);
    };
  }, []);

  useEffect(() => {
    void Promise.all([
      preloadImage('/bg1-1920.jpg'),
      preloadImage('/bg1-mob.jpg'),
      preloadImage('/gumi-1.png'),
      preloadImage('/hanako-1.png'),
      preloadImage('/rb-storm.png'),
    ]);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const preloadRemainingBackgrounds = async () => {
      const suffix = getIsMobileVerticalDevice() ? BG_MOBILE_SUFFIX : BG_DESKTOP_SUFFIX;
      const remainingBackgrounds = BACKGROUND_IMAGE_KEYS.slice(1).map((backgroundKey) =>
        buildBackgroundImagePath(backgroundKey, suffix),
      );
      await Promise.all(remainingBackgrounds.map((src) => preloadImage(src)));
      if (!isCancelled) {
        setIsBackgroundRotationReady(true);
      }
    };

    void preloadRemainingBackgrounds();

    return () => {
      isCancelled = true;
    };
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

  useEffect(() => {
    try {
      window.localStorage.setItem(GLITCH_PREF_KEY, renderMode);
    } catch {
      // Ignore localStorage failures and keep current runtime mode.
    }
  }, [renderMode]);

  const handleGlitchMenuAction = () => {
    toggleRenderMode();
    setIsMenuOpen(false);
  };

  return (
    <div className={`${styles.page} ${renderMode === 'glitch' ? styles.pageGlitch : ''}`} style={glitchOverlayVars}>
      <div className={styles.background} style={{ backgroundImage: `url(${activeBackgroundImage})` }} />
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
                  onClick={resetBoard}
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

        <div className={styles.hamburgerWrap}>
          <button
            type="button"
            className={styles.hamburgerButton}
            onClick={() => setIsMenuOpen((previous) => !previous)}
            aria-expanded={isMenuOpen}
            aria-controls="main-menu"
            aria-label="Open menu"
          >
            ☰
          </button>
          {isMenuOpen && (
            <div id="main-menu" className={styles.hamburgerMenu} role="menu" aria-label="Main menu">
              <button type="button" className={styles.hamburgerItem} onClick={handleGlitchMenuAction} role="menuitem">
                Glitch: {renderMode === 'glitch' ? 'Turn off' : 'Turn on'}
              </button>
            </div>
          )}
        </div>
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
