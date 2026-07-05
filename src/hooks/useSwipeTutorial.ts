import {useCallback, useEffect, useRef, useState} from 'react';
import {InteractionManager} from 'react-native';
import type {SwipeableMethods} from 'react-native-gesture-handler/ReanimatedSwipeable';
import StorageService from '../utils/asyncStorageService';

const SWIPE_TUTORIAL_KEY_PREFIX = 'swipe_tutorial_seen_';

type TutorialScreen = 'home' | 'category' | 'debt';

interface UseSwipeTutorialOptions {
  screen: TutorialScreen;
  itemCount: number;
}

interface UseSwipeTutorialReturn {
  shouldShowTutorial: boolean;
  tutorialRef: React.RefObject<SwipeableMethods | null>;
  dismissTutorial: () => void;
}

const useSwipeTutorial = ({screen, itemCount}: UseSwipeTutorialOptions): UseSwipeTutorialReturn => {
  const storageKey = SWIPE_TUTORIAL_KEY_PREFIX + screen;
  const alreadySeen = StorageService.getBoolean(storageKey);
  const [active, setActive] = useState(false);
  const tutorialRef = useRef<SwipeableMethods | null>(null);
  const hasTriggeredRef = useRef(false);

  const dismissTutorial = useCallback(() => {
    setActive(false);
    StorageService.setBoolean(storageKey, true);
    tutorialRef.current?.close();
  }, [storageKey]);

  useEffect(() => {
    if (alreadySeen || hasTriggeredRef.current || itemCount < 1) {
      return;
    }

    hasTriggeredRef.current = true;
    setActive(true);

    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        const ref = tutorialRef.current;
        if (!ref) {
          setActive(false);
          StorageService.setBoolean(storageKey, true);
          return;
        }

        ref.openLeft();
        setTimeout(() => {
          ref.close();
          setTimeout(() => {
            ref.openRight();
            setTimeout(() => {
              ref.close();
            }, 800);
          }, 400);
        }, 800);
      }, 600);
    });

    return () => task.cancel();
  }, [alreadySeen, itemCount, storageKey]);

  return {
    shouldShowTutorial: active && !alreadySeen,
    tutorialRef,
    dismissTutorial,
  };
};

export default useSwipeTutorial;
