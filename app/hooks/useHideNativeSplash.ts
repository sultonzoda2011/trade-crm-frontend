import { useEffect } from 'react';
import { hideNativeSplash } from '~/lib/native-splash';

/** Вызывается из layout, который появляется, когда экран готов к показу: прячет системный сплэш. */
export function useHideNativeSplash() {
  useEffect(() => {
    hideNativeSplash();
  }, []);
}
