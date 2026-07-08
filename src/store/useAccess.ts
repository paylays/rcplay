import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccessLevel = 'free' | 'full';

interface AccessState {
  level: AccessLevel;
  hasSeenGate: boolean;
  donorName?: string;
  deviceId: string;
  setFullAccess: (name?: string) => void;
  setFreeAccess: () => void;
  markGateSeen: () => void;
  resetAccess: () => void;
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set) => ({
      level: 'free',
      hasSeenGate: false,
      donorName: '',
      deviceId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
      setFullAccess: (name) =>
        set({
          level: 'full',
          donorName: name || '',
          hasSeenGate: true,
        }),
      setFreeAccess: () =>
        set({
          level: 'free',
          hasSeenGate: true,
        }),
      markGateSeen: () =>
        set({
          hasSeenGate: true,
        }),
      resetAccess: () =>
        set((state) => ({
          level: 'free',
          hasSeenGate: false,
          donorName: '',
          // Keep deviceId when resetting access so they keep the same ID
          deviceId: state.deviceId,
        })),
    }),
    {
      name: 'toefl_access_store',
    }
  )
);

export const FREE_TEST_IDS = ['PT30', 'PT31', 'PT32'];

export function isTestUnlocked(testId: string, level: AccessLevel): boolean {
  if (level === 'full') return true;
  return FREE_TEST_IDS.includes(testId);
}
