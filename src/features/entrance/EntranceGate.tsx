import { useEffect, useRef, useState, type CSSProperties } from 'react'
import './EntranceGate.css'

const targetModuleWidth = 88
const targetModuleHeight = 200
const scissorClusterCount = 3

function GateLattice({ side, moduleCount, rowCount, clusterIndex }: { side: 'left' | 'right'; moduleCount: number; rowCount: number; clusterIndex: number }) {
  const cellWidth = targetModuleWidth
  const cellHeight = targetModuleHeight
  const gradientId = `gate-metal-${side}-${clusterIndex}`
  const cells = Array.from({ length: rowCount * moduleCount }, (_, index) => ({
    column: index % moduleCount,
    row: Math.floor(index / moduleCount),
  }))

  return (
    <svg
      className="entrance-gate__lattice"
      viewBox={`0 0 ${moduleCount * cellWidth} ${rowCount * cellHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0" stopColor="#596260" />
          <stop offset="0.43" stopColor="#f2f5f2" />
          <stop offset="0.62" stopColor="#9ea8a5" />
          <stop offset="1" stopColor="#5c6563" />
        </linearGradient>
      </defs>
      {cells.map(({ column, row }) => {
        const left = column * cellWidth
        const top = row * cellHeight
        const centerX = left + cellWidth / 2
        const centerY = top + cellHeight / 2
        return (
          <g key={`${column}-${row}`}>
            <line className="entrance-gate__lattice-line" x1={left} y1={top} x2={left + cellWidth} y2={top + cellHeight} stroke={`url(#${gradientId})`} />
            <line className="entrance-gate__lattice-line" x1={left + cellWidth} y1={top} x2={left} y2={top + cellHeight} stroke={`url(#${gradientId})`} />
            <circle className="entrance-gate__lattice-rivet" cx={centerX} cy={centerY} r="7" />
          </g>
        )
      })}
    </svg>
  )
}

function GateLeaf({ side, moduleCount, rowsPerCluster }: { side: 'left' | 'right'; moduleCount: number; rowsPerCluster: number }) {
  const verticalRods = Array.from({ length: moduleCount + 1 })

  return (
    <span className={`entrance-gate__leaf entrance-gate__leaf--${side}`}>
      <span className="entrance-gate__panel">
        <span className="entrance-gate__rods">
          {verticalRods.map((_, index) => (
            <span
              className="entrance-gate__rod"
              key={index}
              style={{ '--rod-position': `${(index / moduleCount) * 100}%` } as CSSProperties}
            />
          ))}
        </span>
        <span className="entrance-gate__scissor-assembly">
          {Array.from({ length: scissorClusterCount }, (_, clusterIndex) => (
            <GateLattice
              key={clusterIndex}
              side={side}
              moduleCount={moduleCount}
              rowCount={rowsPerCluster}
              clusterIndex={clusterIndex}
            />
          ))}
        </span>
        <span className="entrance-gate__handle" />
      </span>
    </span>
  )
}

/** A physical entrance layer with a fixed surround and two moving leaves. */
type EntranceGateProps = {
  onOpenChange?: (isOpen: boolean) => void
}

export function EntranceGate({ onOpenChange }: EntranceGateProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [moduleLayout, setModuleLayout] = useState({ columns: 8, rowsPerCluster: 2 })
  const movingAreaRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const movingArea = movingAreaRef.current
    if (!movingArea) return undefined

    const updateModuleLayout = () => {
      const bounds = movingArea.getBoundingClientRect()
      const columns = Math.max(2, Math.ceil((bounds.width / 2) / targetModuleWidth))
      const rowsPerCluster = Math.max(2, Math.ceil((bounds.height * 0.207) / targetModuleHeight))
      setModuleLayout((current) => current.columns === columns && current.rowsPerCluster === rowsPerCluster ? current : { columns, rowsPerCluster })
    }

    const observer = new ResizeObserver(updateModuleLayout)
    observer.observe(movingArea)
    updateModuleLayout()
    return () => observer.disconnect()
  }, [])

  const toggleGate = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <section className={`entrance-gate${isOpen ? ' entrance-gate--open' : ''}`} aria-label="个人数字世界入口">
      <button
        className="entrance-gate__trigger"
        type="button"
        onClick={toggleGate}
        aria-pressed={isOpen}
        aria-label={isOpen ? '关闭金属栅栏门' : '打开金属栅栏门'}
      >
        <span className="sr-only" aria-live="polite">
          {isOpen ? '栅栏门已打开，个人数字世界已显示。' : '栅栏门已关闭。按 Enter 或空格键打开。'}
        </span>
        <span className="entrance-gate__moving-area" ref={movingAreaRef} aria-hidden="true">
          <GateLeaf side="left" moduleCount={moduleLayout.columns} rowsPerCluster={moduleLayout.rowsPerCluster} />
          <GateLeaf side="right" moduleCount={moduleLayout.columns} rowsPerCluster={moduleLayout.rowsPerCluster} />
        </span>
      </button>
      <span className="entrance-gate__frame" aria-hidden="true">
        <span className="entrance-gate__frame-top" />
        <span className="entrance-gate__frame-bottom" />
        <span className="entrance-gate__frame-side entrance-gate__frame-side--left" />
        <span className="entrance-gate__frame-side entrance-gate__frame-side--right" />
      </span>
    </section>
  )
}
