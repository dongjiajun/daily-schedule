import { useEffect, useRef, useState } from 'react'
import { OrangeCat } from '../assets/svg/OrangeCat'
import { ShibaInu } from '../assets/svg/ShibaInu'
import type { EmotionState, PetAction } from '../store/petStore'

interface SvgAvatarProps {
  species: 'ORANGE_CAT' | 'SHIBA_INU'
  emotion: EmotionState
  action?: PetAction
  size?: number
  className?: string
}

/**
 * SVG 插画渲染组件。
 * 根据 species + emotion + action 选择对应的 SVG 插画
 * （emotion 管表情参数，action 管 CSS 动画层，正交）。
 *
 * 情绪切换经一次眨眼过渡：emotion 变化 → 立即闭眼（data-blink 驱动 50ms 一次性动画）
 * → 两帧后切换表情参数 → 50ms 后睁开，用户看到"闭眼换脸再睁开"，消除瞬间换脸感。
 */
export function SvgAvatar({ species, emotion, action = 'idle', size = 100, className }: SvgAvatarProps) {
  const Component = species === 'SHIBA_INU' ? ShibaInu : OrangeCat
  const prevEmotionRef = useRef(emotion)
  const blinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displayEmotion, setDisplayEmotion] = useState(emotion)
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    if (prevEmotionRef.current === emotion) return
    prevEmotionRef.current = emotion
    let disposed = false
    setBlinking(true)
    // rAF 双层保证换脸在两帧后执行（闭眼动画已开始渲染）
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        if (disposed) return
        setDisplayEmotion(emotion)
        if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
        blinkTimerRef.current = setTimeout(() => {
          if (!disposed) setBlinking(false)
        }, 50)
      })
      if (disposed) cancelAnimationFrame(raf2)
    })
    return () => {
      disposed = true
      cancelAnimationFrame(raf1)
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current)
    }
  }, [emotion])

  return (
    <Component
      emotion={displayEmotion}
      action={action}
      size={size}
      className={className}
      blinkNow={blinking}
    />
  )
}
