import { useMemo } from 'react'
import Particles from '@tsparticles/react'

/**
 * 烟花特效 — tsParticles 粒子系统。
 * 粒子爆炸 + 上升 + 闪烁，模拟烟花效果。
 */
export function FireworkEffect({ intensity }: { intensity: 'low' | 'full' }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = useMemo(() => ({
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: {
        value: intensity === 'full' ? 60 : 15,
        density: { enable: true },
      },
      color: {
        value: ['#FFD700', '#FF6B00', '#E63946', '#FF3D00', '#FFFFFF'],
      },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.8 },
        animation: { enable: true, speed: 1, sync: false },
      },
      size: {
        value: { min: 2, max: 6 },
        animation: { enable: true, speed: 2, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 2, max: 8 },
        direction: 'none' as const,
        random: true,
        straight: false,
        outModes: { default: 'destroy' as const },
        trail: {
          enable: true,
          length: 3,
          fill: { color: '#1A0A0A' },
        },
      },
      life: {
        duration: { sync: false, value: 2 },
        count: 1,
      },
    },
    emitters: [
      {
        direction: 'top',
        position: { x: 20, y: 90 },
        rate: { delay: 1.5, quantity: intensity === 'full' ? 5 : 2 },
        size: { width: 80, height: 10 },
      },
      {
        direction: 'top',
        position: { x: 60, y: 90 },
        rate: { delay: 2, quantity: intensity === 'full' ? 5 : 2 },
        size: { width: 80, height: 10 },
      },
      {
        direction: 'top',
        position: { x: 80, y: 85 },
        rate: { delay: 1.2, quantity: intensity === 'full' ? 4 : 1 },
        size: { width: 80, height: 10 },
      },
    ],
    detectRetina: true,
  }), [intensity])

  return (
    <Particles
      id="firework-particles"
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
