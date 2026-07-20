import { create } from 'zustand';

export interface ModalSlice<T = null> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
}

type ModalStoreShape<T extends Record<string, unknown>> = {
  [K in keyof T]: ModalSlice<T[K]>;
};

export function createModalStore<T extends Record<string, unknown>>(
  keys: (keyof T & string)[]
) {
  return create<ModalStoreShape<T>>((set) =>
    Object.fromEntries(
      keys.map((key) => [
        key,
        {
          isOpen: false,
          data: null,
          open: (data?: unknown) =>
            set((s) => ({ ...s, [key]: { ...s[key as keyof T], isOpen: true, data: data ?? null } })),
          close: () =>
            set((s) => ({ ...s, [key]: { ...s[key as keyof T], isOpen: false, data: null } })),
        } satisfies ModalSlice<unknown>,
      ])
    ) as ModalStoreShape<T>
  );
}
