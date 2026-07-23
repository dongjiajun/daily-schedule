/**
 * 橘猫 SVG 插画 — 程序化几何图形组合。
 * 支持 7 种情绪状态的表情/姿态变化。
 */
import type { EmotionState } from '../../store/petStore'

interface Props {
  emotion: EmotionState
  size?: number
  className?: string
}

export function OrangeCat({ emotion, size = 100, className }: Props) {
  const scale = size / 100

  // ── 表情参数 ───────────────────────────────────
  const mouthPath = {
    idle: 'M42 55 Q50 62 58 55',
    idle_variant: 'M44 56 Q50 58 56 56',
    happy: 'M40 52 Q50 66 60 52',
    sad: 'M42 58 Q50 52 58 58',
    hungry: 'M40 53 Q50 68 60 53',
    sleepy: 'M44 56 Q50 59 56 56',
    excited: 'M38 50 Q50 68 62 50',
    surprised: 'M42 53 Q50 68 58 53',
  }[emotion] ?? 'M42 55 Q50 62 58 55'

  const eyeStyle = {
    idle: { rx: 4, ry: 5 },
    idle_variant: { rx: 4, ry: 5 },
    happy: { rx: 3, ry: 5 },
    sad: { rx: 4, ry: 4 },
    hungry: { rx: 5, ry: 5 },
    sleepy: { rx: 5, ry: 2 },
    excited: { rx: 4, ry: 6 },
    surprised: { rx: 6, ry: 6 },
  }[emotion] ?? { rx: 4, ry: 5 }

  const leftEarRotate = emotion === 'sad' ? '-15deg' : emotion === 'excited' ? '5deg' : '0deg'
  const rightEarRotate = emotion === 'sad' ? '15deg' : emotion === 'excited' ? '-5deg' : '0deg'

  const tailAngle = {
    idle: 20,
    happy: 45,
    sad: -10,
    hungry: 10,
    sleepy: 5,
    excited: 60,
    surprised: 40,
    idle_variant: 30,
  }[emotion] ?? 20

  // ── 瞳孔可见性（sleepy 半闭眼） ───────────────
  const pupilOpacity = emotion === 'sleepy' ? 0.4 : 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      aria-label={`橘猫 — ${emotion}`}
    >
      {/* ── 身体 ── */}
      <ellipse cx="50" cy="58" rx="28" ry="25" fill="#F59E0B" />

      {/* ── 肚皮 ── */}
      <ellipse cx="50" cy="65" rx="18" ry="14" fill="#FDE68A" />

      {/* ── 尾巴 ── */}
      <g transform={`rotate(${tailAngle}, 72, 68)`}>
        <path d="M72 68 Q82 58 78 48 Q76 42 72 44" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="72" cy="44" rx="3" ry="2.5" fill="#D97706" />
      </g>

      {/* ── 头 ── */}
      <ellipse cx="50" cy="38" rx="22" ry="20" fill="#F59E0B" />

      {/* ── 左耳 ── */}
      <g transform={`rotate(${leftEarRotate}, 33, 22)`}>
        <polygon points="30,25 28,10 38,22" fill="#F59E0B" />
        <polygon points="31,23 30,14 36,22" fill="#FCA5A5" />
      </g>

      {/* ── 右耳 ── */}
      <g transform={`rotate(${rightEarRotate}, 67, 22)`}>
        <polygon points="70,25 72,10 62,22" fill="#F59E0B" />
        <polygon points="69,23 70,14 64,22" fill="#FCA5A5" />
      </g>

      {/* ── 脸部条纹 ── */}
      <path d="M44 28 L44 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 27 L50 35" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M56 28 L56 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── 左眼 ── */}
      <ellipse cx="41" cy="36" {...eyeStyle} fill="white" />
      {emotion !== 'sleepy' && <ellipse cx="41" cy="36" rx="2.5" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}

      {/* ── 右眼 ── */}
      <ellipse cx="59" cy="36" {...eyeStyle} fill="white" />
      {emotion !== 'sleepy' && <ellipse cx="59" cy="36" rx="2.5" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}

      {/* ── 鼻子 ── */}
      <ellipse cx="50" cy="44" rx="2.5" ry="2" fill="#FCA5A5" />

      {/* ── 嘴巴 ── */}
      <path d={mouthPath} stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* ── 胡须 ── */}
      <line x1="28" y1="42" x2="18" y2="40" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="28" y1="45" x2="18" y2="46" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="72" y1="42" x2="82" y2="40" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="72" y1="45" x2="82" y2="46" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />

      {/* ── 前爪 ── */}
      <ellipse cx="38" cy="80" rx="8" ry="5" fill="#F59E0B" />
      <ellipse cx="62" cy="80" rx="8" ry="5" fill="#F59E0B" />

      {/* ── 爪垫 ── */}
      <ellipse cx="35" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
      <ellipse cx="38" cy="82" rx="1.5" ry="1" fill="#FCA5A5" />
      <ellipse cx="41" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
      <ellipse cx="59" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
      <ellipse cx="62" cy="82" rx="1.5" ry="1" fill="#FCA5A5" />
      <ellipse cx="65" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />

      {/* ── Emotion Effects ── */}
      {emotion === 'happy' && (
        <>
          <text x="58" y="18" fontSize="10" fill="#FBBF24">✦</text>
        </>
      )}
      {emotion === 'excited' && (
        <>
          <text x="55" y="14" fontSize="12" fill="#F59E0B">✦</text>
          <text x="70" y="22" fontSize="8" fill="#FCD34D">✦</text>
        </>
      )}
      {emotion === 'surprised' && (
        <>
          <text x="60" y="12" fontSize="10" fill="#F87171">!</text>
        </>
      )}
      {emotion === 'sleepy' && (
        <>
          <text x="65" y="32" fontSize="8" fill="#9CA3AF">Z</text>
          <text x="72" y="24" fontSize="6" fill="#D1D5DB">z</text>
        </>
      )}
    </svg>
  )
}
