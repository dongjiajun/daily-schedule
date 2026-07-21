import { useMemo } from 'react'
import Particles from '@tsparticles/react'

/**
 * 灯笼飘升特效 — tsParticles 粒子系统。
 * 暖色粒子从底部缓缓上升，模拟灯笼/孔明灯效果。
 */
export function LanternFallEffect({ intensity }: { intensity: 'low' | 'full' }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: {
        value: intensity === 'full' ? 30 : 10,
        density: { enable: true },
      },
      color: {
        value: ['#FFD700', '#FF6F00', '#E63946', '#FF9800'],
      },
      shape: {
        type: 'circle',
      },
      opacity: {
        value: { min: 0.3, max: 0.9 },
        animation: { enable: true, speed: 0.5, sync: false },
      },
      size: {
        value: { min: 4, max: 12 },
        animation: { enable: true, speed: 1, sync: false, startValue: 'random' as const },
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 1.5 },
        direction: 'top' as const,
        random: false,
        straight: false,
        outModes: { default: 'destroy' as const },
        trail: {
          enable: true,
          length: 5,
          fill: { color: '#1A0A0A' },
        },
      },
      life: {
        duration: { sync: false, value: { min: 5, max: 12 } },
        count: 1,
      },
      shadow: {
        enable: true,
        blur: 15,
        color: '#FFD700',
        offset: { x: 0, y: 0 },
      },
    },
    emitters: [
      {
        direction: 'top',
        position: { x: 15, y: 95 },
        rate: { delay: 2, quantity: intensity === 'full' ? 3 : 1 },
        size: { width: 40, height: 10 },
        life: { duration: 10, count: 0 },
      },
      {
        direction: 'top',
        position: { x: 50, y: 95 },
        rate: { delay: 2.5, quantity: intensity === 'full' ? 3 : 1 },
        size: { width: 40, height: 10 },
        life: { duration: 10, count: 0 },
      },
      {
        direction: 'top',
        position: { x: 85, y: 95 },
        rate: { delay: 2, quantity: intensity === 'full' ? 2 : 1 },
        size: { width: 40, height: 10 },
        life: { duration: 10, count: 0 },
      },
    ],
    detectRetina: true,
  }), [intensity])

  return (
    <Particles
      id="lantern-particles"
      options={options}
      className="absolute inset-0"
      particlesLoaded={async (container: unknown) => {
        if (container && typeof container === 'object' && 'refresh' in container) {
          await (container as { refresh: () => Promise<void> }).refresh()
        }
      }}
    />
  )
}
