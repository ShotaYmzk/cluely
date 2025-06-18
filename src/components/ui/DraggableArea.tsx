import React, { useRef, useEffect } from 'react'

interface DraggableAreaProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const DraggableArea: React.FC<DraggableAreaProps> = ({ 
  children, 
  className = "", 
  style = {} 
}) => {
  const areaRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const area = areaRef.current
    if (!area) return

    const handleMouseDown = (e: MouseEvent) => {
      // 左クリックのみでドラッグ開始
      if (e.button !== 0) return
      
      isDragging.current = true
      startPos.current = { x: e.clientX, y: e.clientY }
      
      // カーソルを変更
      area.style.cursor = 'grabbing'
      
      // イベントの伝播を停止
      e.preventDefault()
      e.stopPropagation()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      
      // Electronのウィンドウ移動APIを呼び出す
      if (window.electronAPI?.moveWindow) {
        const deltaX = e.clientX - startPos.current.x
        const deltaY = e.clientY - startPos.current.y
        
        window.electronAPI.moveWindow(deltaX, deltaY)
        
        // 新しい開始位置を更新
        startPos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        area.style.cursor = 'grab'
      }
    }

    // マウスイベントリスナーを追加
    area.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // クリーンアップ
    return () => {
      area.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div
      ref={areaRef}
      className={`cursor-grab select-none ${className}`}
      style={{
        ...style,
        cursor: 'grab'
      }}
    >
      {children}
    </div>
  )
}

export default DraggableArea 