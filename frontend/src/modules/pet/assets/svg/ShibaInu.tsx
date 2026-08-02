/**
 * 柴犬 SVG 插画 — 程序化几何图形组合。
 * 支持 7 种情绪状态的表情/姿态变化。
 */
import type { EmotionState } from '../../store/petStore'

interface Props {
  emotion: EmotionState
  size?: number
  className?: string
}

export function ShibaInu({ emotion, size = 100, className }: Props) {
  const scale = size / 100

  // ── 表情参数 ───────────────────────────────────
  const mouthPath = {
    idle: 'M42 55 Q50 53 58 55',
    idle_variant: 'M44 57 Q50 55 56 57',
    happy: 'M40 52 Q50 62 60 52',
    sad: 'M42 58 Q50 51 58 58',
    hungry: 'M40 53 Q50 64 60 53',
    sleepy: 'M44 56 Q50 54 56 56',
    excited: 'M38 50 Q50 64 62 50',
    surprised: 'M42 53 Q50 64 58 53',
  }[emotion] ?? 'M42 55 Q50 53 58 55'

  const eyeStyle = {
    idle: { rx: 3.5, ry: 4.5 },
    idle_variant: { rx: 3.5, ry: 4.5 },
    happy: { rx: 2, ry: 5 },
    sad: { rx: 3.5, ry: 3.5 },
    hungry: { rx: 4.5, ry: 4.5 },
    sleepy: { rx: 4.5, ry: 2 },
    excited: { rx: 3.5, ry: 5.5 },
    surprised: { rx: 5.5, ry: 5.5 },
  }[emotion] ?? { rx: 3.5, ry: 4.5 }

  const leftEarRotate = emotion === 'sad' ? '-10deg' : emotion === 'excited' ? '10deg' : '0deg'
  const rightEarRotate = emotion === 'sad' ? '10deg' : emotion === 'excited' ? '-10deg' : '0deg'

  const tailAngle = {
    idle: 25,
    happy: 55,
    sad: -15,
    hungry: 15,
    sleepy: 8,
    excited: 70,
    surprised: 45,
    idle_variant: 35,
  }[emotion] ?? 25

  const pupilOpacity = emotion === 'sleepy' ? 0.3 : 1

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      aria-label={`柴犬 — ${emotion}`}
    >
      {/* ── 身体 ── */}
      <ellipse cx="50" cy="58" rx="26" ry="24" fill="#F4A261" />

      {/* ── 胸毛 ── */}
      <ellipse cx="50" cy="64" rx="16" ry="13" fill="#FFF7ED" />

      {/* ── 尾巴 (卷曲) ── */}
      <g transform={`rotate(${tailAngle} 74 60)`}>
        <path d="M74 60 Q84 52 78 40 Q74 34 68 38" stroke="#F4A261" strokeWidth="5" strokeLinecap="round" fill="none" />
        <ellipse cx="68" cy="38" rx="3.5" ry="3" fill="#E76F51" />
      </g>

      {/* ── 头 ── */}
      <ellipse cx="50" cy="38" rx="23" ry="21" fill="#F4A261" />

      {/* ── 脸部白色区域 ── */}
      <ellipse cx="50" cy="43" rx="16" ry="14" fill="#FFF7ED" />

      {/* ── 左耳 (三角立耳) ── */}
      {/* SVG transform 属性角度不允许带单位（'0deg' 非法），渲染时剥离 */}
      <g transform={`rotate(${parseFloat(leftEarRotate)} 30 20)`}>
        <polygon points="28,26 24,6 36,20" fill="#F4A261" />
        <polygon points="28,24 26,10 34,20" fill="#FCA5A5" />
      </g>

      {/* ── 右耳 ── */}
      <g transform={`rotate(${parseFloat(rightEarRotate)} 70 20)`}>
        <polygon points="72,26 76,6 64,20" fill="#F4A261" />
        <polygon points="72,24 74,10 66,20" fill="#FCA5A5" />
      </g>

      {/* ── 眉毛 ── */}
      <line x1="36" y1="30" x2="42" y2="29" stroke="#E76F51" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="64" y1="30" x2="58" y2="29" stroke="#E76F51" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── 左眼 ── */}
      <ellipse cx="41" cy="36" {...eyeStyle} fill="white" />
      {emotion !== 'sleepy' && <ellipse cx="41" cy="36" rx="2" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}

      {/* ── 右眼 ── */}
      <ellipse cx="59" cy="36" {...eyeStyle} fill="white" />
      {emotion !== 'sleepy' && <ellipse cx="59" cy="36" rx="2" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}

      {/* ── 鼻子 ── */}
      <ellipse cx="50" cy="44" rx="3" ry="2.5" fill="#1C1917" />

      {/* ── 嘴巴 ── */}
      <path d={mouthPath} stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* ── 腮红 ── */}
      <ellipse cx="34" cy="42" rx="5" ry="3" fill="#FCA5A5" opacity="0.3" />
      <ellipse cx="66" cy="42" rx="5" ry="3" fill="#FCA5A5" opacity="0.3" />

      {/* ── 前腿 ── */}
      <ellipse cx="38" cy="78" rx="7" ry="5" fill="#F4A261" />
      <ellipse cx="62" cy="78" rx="7" ry="5" fill="#F4A261" />

      {/* ── 爪垫 ── */}
      <ellipse cx="35" cy="79" rx="1.5" ry="1" fill="#FFF7ED" />
      <ellipse cx="38" cy="80" rx="1.5" ry="1" fill="#FFF7ED" />
      <ellipse cx="41" cy="79" rx="1.5" ry="1" fill="#FFF7ED" />
      <ellipse cx="59" cy="79" rx="1.5" ry="1" fill="#FFF7ED" />
      <ellipse cx="62" cy="80" rx="1.5" ry="1" fill="#FFF7ED" />
      <ellipse cx="65" cy="79" rx="1.5" ry="1" fill="#FFF7ED" />

      {/* ── Emotion Effects ── */}
      {emotion === 'happy' && (
        <text x="58" y="18" fontSize="10" fill="#F59E0B">✦</text>
      )}
      {emotion === 'excited' && (
        <>
          <text x="55" y="12" fontSize="14" fill="#E76F51">✦</text>
          <text x="72" y="20" fontSize="9" fill="#F4A261">✦</text>
        </>
      )}
      {emotion === 'surprised' && (
        <text x="62" y="12" fontSize="10" fill="#F87171">!</text>
      )}
      {emotion === 'sleepy' && (
        <>
          <text x="66" y="30" fontSize="8" fill="#9CA3AF">Z</text>
          <text x="74" y="22" fontSize="6" fill="#D1D5DB">z</text>
        </>
      )}
    </svg>
  )
}
