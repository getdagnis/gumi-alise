import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, TouchEvent } from 'react';
import styles from './App.module.scss';
import { BACKGROUND_IMAGES, CHARACTERS, SOUNDS, type SoundOption } from './config';

const VISIBLE_SOUND_COUNT = 20;

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

function App() {
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [touchDraggedSound, setTouchDraggedSound] = useState<string | null>(null);
  const [activeSoundIds, setActiveSoundIds] = useState<string[]>([]);
  const [isDropActive, setIsDropActive] = useState(false);
  const [visibleSounds, setVisibleSounds] = useState<SoundOption[]>(() => getRandomSounds(SOUNDS, VISIBLE_SOUND_COUNT));

  const soundById = useMemo(() => new Map(visibleSounds.map((sound) => [sound.id, sound] as const)), [visibleSounds]);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const stopAllAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current = {};
  }, []);

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
    const isCharacterTarget = Boolean(dropTarget?.closest('[data-drop-target="gumi"]'));
    setIsDropActive(isCharacterTarget);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!touchDraggedSound) {
      return;
    }

    const touch = event.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const isCharacterTarget = dropTarget?.closest('[data-drop-target="gumi"]');

    if (isCharacterTarget) {
      enableSound(touchDraggedSound);
    }

    setTouchDraggedSound(null);
    setIsDropActive(false);
  };

  const rotateCharacter = () => {
    setCharacterIndex((previous) => (previous + 1) % CHARACTERS.length);
  };

  const activeCharacter = CHARACTERS[characterIndex] ?? CHARACTERS[0];

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
    setVisibleSounds(getRandomSounds(SOUNDS, VISIBLE_SOUND_COUNT));
  }, [stopAllAudio]);

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

  return (
    <div className={styles.page}>
      <div className={styles.background} style={{ backgroundImage: `url(${BACKGROUND_IMAGES[backgroundIndex]})` }} />
      <div className={styles.backgroundOverlay} />

      <main className={styles.content} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <section className={styles.panel}>
          <header className={styles.titleBlock}>
            <h1 className={styles.titleJapanese}>おめでとう、</h1>
            <p className={styles.titleRomanized}>(OMEDETO)</p>
            <p className={styles.titleName}>ALISE!</p>
          </header>

          <section className={styles.characterStage}>
            <div
              className={`${styles.dropTarget} ${isDropActive ? styles.dropTargetActive : ''} ${dropTargetPulseClass}`}
              data-drop-target="gumi"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDropActive(true);
              }}
              onDragLeave={() => setIsDropActive(false)}
              onDrop={handleDrop}
            >
              <p className={styles.dropLabel}>Gumi's Mix!</p>
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
      </main>
    </div>
  );
}

export default App;
