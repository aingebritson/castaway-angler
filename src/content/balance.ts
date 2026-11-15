export const BALANCE = {
  waitMin: 5, waitMax: 20, hookWindow: 3, landingTime: 1.8,
  warningTime: 3, escapeMessageTime: 2, oversizedTime: 6,
  fixedStep: 1 / 60, checkpointSeconds: 2,
  castArea: { left: 0.12, right: 0.88, top: 0.43, bottom: 0.76 },
  profiles: [
    { id: 'small', name: 'Small test fish', nickname: 'A little silver lining', share: 70, min: 5, mode: 8, max: 12, color: '#e9bb68', gain: 0, pull: 0 },
    { id: 'medium', name: 'Medium test fish', nickname: 'A spirited little runner', share: 25, min: 15, mode: 22, max: 35, color: '#80b9ab', gain: 0.15, pull: 0.14 },
    { id: 'strong', name: 'Strong test fish', nickname: 'Some weight on the line', share: 5, min: 35, mode: 45, max: 70, color: '#c98b6b', gain: 0.085, pull: 0.17 },
  ],
} as const;
export type ProfileId = typeof BALANCE.profiles[number]['id'];
export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export const profile = (id: ProfileId) => BALANCE.profiles.find(p => p.id === id)!;

