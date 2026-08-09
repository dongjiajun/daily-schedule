/**
 * 橘猫 SVG 插画 — 程序化几何图形组合。
 * 支持 8 种情绪状态的表情/姿态变化 + Action 驱动的 CSS 动画层
 * （idle 呼吸/眨眼、walk 步伐、rest 尾巴慢摆、sleep 蜷缩+Zzz、jump 离地、
 * eat 低头咀嚼、小动作 stretch/yawn/scratch/look 播放一次）。
 */
import type { EmotionState, PetAction } from '../../store/petStore'
import { ANIMATION_CSS } from './animations'

interface Props {
  emotion: EmotionState
  size?: number
  className?: string
  /** 动作维度（与情绪正交） */
  action?: PetAction
  /** 情绪切换眨眼过渡（data-blink 驱动 50ms 闭眼换脸） */
  blinkNow?: boolean
}

export function OrangeCat({ emotion, size = 100, className, action = 'idle', blinkNow = false }: Props) {
  const scale = size / 100
  // sleep 动作覆盖为 sleepy 表情参数（闭眼/蜷嘴/尾巴低垂），无需外部 setEmotion
  const displayEmotion = action === 'sleep' ? 'sleepy' : emotion

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
  }[displayEmotion] ?? 'M42 55 Q50 62 58 55'

  const eyeStyle = {
    idle: { rx: 4, ry: 5 },
    idle_variant: { rx: 4, ry: 5 },
    happy: { rx: 3, ry: 5 },
    sad: { rx: 4, ry: 4 },
    hungry: { rx: 5, ry: 5 },
    sleepy: { rx: 5, ry: 2 },
    excited: { rx: 4, ry: 6 },
    surprised: { rx: 6, ry: 6 },
  }[displayEmotion] ?? { rx: 4, ry: 5 }

  const leftEarRotate = displayEmotion === 'sad' ? '-15deg' : displayEmotion === 'excited' ? '5deg' : '0deg'
  const rightEarRotate = displayEmotion === 'sad' ? '15deg' : displayEmotion === 'excited' ? '-5deg' : '0deg'

  const tailAngle = {
    idle: 20,
    happy: 45,
    sad: -10,
    hungry: 10,
    sleepy: 5,
    excited: 60,
    surprised: 40,
    idle_variant: 30,
  }[displayEmotion] ?? 20

  // ── 瞳孔可见性（sleepy 半闭眼） ───────────────
  const pupilOpacity = displayEmotion === 'sleepy' ? 0.4 : 1
  // 睡眠表现：emotion=sleepy 或 action=sleep 都显示 Zzz 气泡（由动画驱动循环）
  const showSleepBubble = displayEmotion === 'sleepy' || action === 'sleep'

  return (
    <>
      <style>{ANIMATION_CSS}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        data-action={action}
        data-blink={blinkNow ? '1' : '0'}
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        aria-label={`橘猫 — ${emotion}`}
      >
        {/* 跳跃位移层（jump 时整体离地） */}
        <g className="pet-jumpable">
          {/* ── 呼吸层（身体 + 肚皮 + 前爪 + 头） ── */}
          <g className="pet-body">
            {/* ── 身体 ── */}
            <ellipse cx="50" cy="58" rx="28" ry="25" fill="#F59E0B" />

            {/* ── 肚皮 ── */}
            <ellipse cx="50" cy="65" rx="18" ry="14" fill="#FDE68A" />

            {/* ── 前爪（walk 步伐交替） ── */}
            <ellipse className="pet-leg-l" cx="38" cy="80" rx="8" ry="5" fill="#F59E0B" />
            <ellipse className="pet-leg-r" cx="62" cy="80" rx="8" ry="5" fill="#F59E0B" />

            {/* ── 爪垫 ── */}
            <ellipse className="pet-leg-l" cx="35" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
            <ellipse className="pet-leg-l" cx="38" cy="82" rx="1.5" ry="1" fill="#FCA5A5" />
            <ellipse className="pet-leg-l" cx="41" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
            <ellipse className="pet-leg-r" cx="59" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />
            <ellipse className="pet-leg-r" cx="62" cy="82" rx="1.5" ry="1" fill="#FCA5A5" />
            <ellipse className="pet-leg-r" cx="65" cy="81" rx="1.5" ry="1" fill="#FCA5A5" />

            {/* ── 头 ── */}
            <ellipse cx="50" cy="38" rx="22" ry="20" fill="#F59E0B" />

            {/* ── 左耳（eat 时微动） ── */}
            <g className="pet-ear-l" transform={`rotate(${parseFloat(leftEarRotate)} 33 22)`}>
              <polygon points="30,25 28,10 38,22" fill="#F59E0B" />
              <polygon points="31,23 30,14 36,22" fill="#FCA5A5" />
            </g>

            {/* ── 右耳（eat 时微动） ── */}
            <g className="pet-ear-r" transform={`rotate(${parseFloat(rightEarRotate)} 67 22)`}>
              <polygon points="70,25 72,10 62,22" fill="#F59E0B" />
              <polygon points="69,23 70,14 64,22" fill="#FCA5A5" />
            </g>

            {/* ── 脸部条纹 ── */}
            <path d="M44 28 L44 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 27 L50 35" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M56 28 L56 36" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

            {/* ── 左眼（眨眼动画层） ── */}
            <g className="pet-eyes">
              <ellipse cx="41" cy="36" {...eyeStyle} fill="white" />
              {displayEmotion !== 'sleepy' && <ellipse cx="41" cy="36" rx="2.5" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}
            </g>

            {/* ── 右眼 ── */}
            <g className="pet-eyes">
              <ellipse cx="59" cy="36" {...eyeStyle} fill="white" />
              {displayEmotion !== 'sleepy' && <ellipse cx="59" cy="36" rx="2.5" ry="2.5" fill="#1C1917" opacity={pupilOpacity} />}
            </g>

            {/* ── 鼻子 ── */}
            <ellipse cx="50" cy="44" rx="2.5" ry="2" fill="#FCA5A5" />

            {/* ── 嘴巴（eat 咀嚼 / yawn 张嘴） ── */}
            <path className="pet-mouth" d={mouthPath} stroke="#1C1917" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* ── 胡须 ── */}
            <line x1="28" y1="42" x2="18" y2="40" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="28" y1="45" x2="18" y2="46" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="72" y1="42" x2="82" y2="40" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="72" y1="45" x2="82" y2="46" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" />
          </g>

          {/* ── 尾巴（外层 CSS 慢摆 + 内层 emotion 角度） ── */}
          <g className="pet-tail">
            <g transform={`rotate(${tailAngle} 72 68)`}>
              <path d="M72 68 Q82 58 78 48 Q76 42 72 44" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" fill="none" />
              <ellipse cx="72" cy="44" rx="3" ry="2.5" fill="#D97706" />
            </g>
          </g>

          {/* ── Zzz 睡眠气泡（action=sleep 时循环上飘） ── */}
          {showSleepBubble && (
            <>
              <text className="pet-sleep-bubble" x="68" y="30" fontSize="9" fill="#9CA3AF">Z</text>
              <text className="pet-sleep-bubble" x="74" y="22" fontSize="7" fill="#D1D5DB">z</text>
              <text className="pet-sleep-bubble" x="79" y="15" fontSize="5" fill="#E5E7EB">z</text>
            </>
          )}
        </g>

        {/* ── Emotion Effects ── */}
        {emotion === 'happy' && (
          <text x="58" y="18" fontSize="10" fill="#FBBF24">✦</text>
        )}
        {displayEmotion === 'excited' && (
          <>
            <text x="55" y="14" fontSize="12" fill="#F59E0B">✦</text>
            <text x="70" y="22" fontSize="8" fill="#FCD34D">✦</text>
          </>
        )}
        {emotion === 'surprised' && (
          <text x="60" y="12" fontSize="10" fill="#F87171">!</text>
        )}
      </svg>
    </>
  )
}
