import { useEffect } from 'react'
import { useRive } from '@rive-app/react-canvas'
import { usePetStore } from '../store/petStore'

interface PetAvatarProps {
  size?: number
}

export function PetAvatar({ size = 100 }: PetAvatarProps) {
  const animationState = usePetStore((s) => s.animationState)

  const { RiveComponent, rive } = useRive({
    src: '', // M1.2 暂无实际 .riv 文件，展示 fallback emoji
    stateMachines: 'PetStateMachine',
    autoplay: true,
  })

  // Sync petStore animationState → Rive state machine (number trigger)
  useEffect(() => {
    if (!rive) return
    const stateIndex = { idle: 0, happy: 1, sad: 2, hungry: 3 }[animationState]
    const inputs = rive.stateMachineInputs('PetStateMachine')
    for (const input of inputs) {
      if (input.name === 'animationState') {
        input.value = stateIndex
      }
    }
  }, [animationState, rive])

  if (!rive) {
    // Fallback: 静态 emoji
    const emoji = animationState === 'happy' ? '😸'
      : animationState === 'sad' ? '😿'
      : animationState === 'hungry' ? '😾'
      : '🐱'

    return (
      <div
        style={{ width: size, height: size, fontSize: size * 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label={`宠物状态: ${animationState}`}
      >
        {emoji}
      </div>
    )
  }

  return (
    <div style={{ width: size, height: size }} aria-label={`宠物状态: ${animationState}`}>
      <RiveComponent />
    </div>
  )
}
