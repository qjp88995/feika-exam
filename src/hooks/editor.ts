import { ref } from 'vue'

export type ActionType = 'move' | 'resize' | 'rotate' | 'none'

export type ResizeType =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'

export type GeoInfo = {
  x: number
  y: number
  width: number
  height: number
}

export type ResizeFun = (geo: GeoInfo, moveX: number, moveY: number) => GeoInfo

export function useEditor(geo: GeoInfo) {
  // 图片坐标
  const x = ref(geo.x)
  const y = ref(geo.y)

  // 图片尺寸
  const width = ref(geo.width)
  const height = ref(geo.height)

  // 编辑器是否激活
  const isActive = ref(false)

  // 当前操作
  const action = ref<ActionType>('none')

  // 旋转角度
  const rotationAngle = ref(0)

  // 激活编辑器
  const activate = () => {
    if (isActive.value) return

    isActive.value = true
    console.log('编辑器', 'activate')

    const inactivate = () => {
      if (action.value !== 'none') return

      isActive.value = false
      console.log('编辑器', 'inactivate')

      window.removeEventListener('click', inactivate)
    }

    window.addEventListener('click', inactivate)
  }

  // 激活移动操作
  const activateMove = (startX: number, startY: number) => {
    if (!isActive.value) return

    console.groupCollapsed('移动操作')
    console.log('起始位置', startX, startY)

    action.value = 'move'

    const geo = { x: x.value, y: y.value, width: width.value, height: height.value }

    const handleMove = (e: MouseEvent) => {
      const moveX = e.clientX - startX
      const moveY = e.clientY - startY

      console.log('移动距离', moveX, moveY)

      x.value = geo.x + moveX
      y.value = geo.y + moveY
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener(
      'mouseup',
      () => {
        console.log('结束')
        console.groupEnd()
        action.value = 'none'
        window.removeEventListener('mousemove', handleMove)
      },
      { once: true },
    )
  }

  // 调整大小时各个方向的函数
  const resizeFuns: Record<ResizeType, ResizeFun> = {
    topLeft: (geo, moveX, moveY) => {
      const dis = Math.max(moveX, moveY)
      return {
        x: geo.x + dis,
        y: geo.y + dis,
        width: geo.width - dis,
        height: geo.height - dis,
      }
    },
    topRight: (geo, moveX, moveY) => {
      const dis = Math.max(moveX, moveY)
      return {
        x: geo.x,
        y: geo.y + dis,
        width: geo.width + dis,
        height: geo.height - dis,
      }
    },
    bottomLeft: (geo, moveX, moveY) => {
      const dis = Math.max(moveX, moveY)
      return {
        x: geo.x + dis,
        y: geo.y,
        width: geo.width - dis,
        height: geo.height + dis,
      }
    },
    bottomRight: (geo, moveX, moveY) => {
      return {
        x: geo.x,
        y: geo.y,
        width: geo.width + moveX,
        height: geo.height + moveY,
      }
    },
    top: (geo, _moveX, moveY) => {
      return {
        x: geo.x,
        y: geo.y + moveY,
        width: geo.width,
        height: geo.height - moveY,
      }
    },
    left: (geo, moveX) => {
      return {
        x: geo.x + moveX,
        y: geo.y,
        width: geo.width - moveX,
        height: geo.height,
      }
    },
    right: (geo, moveX) => {
      return {
        x: geo.x,
        y: geo.y,
        width: geo.width + moveX,
        height: geo.height,
      }
    },
    bottom: (geo, _moveX, moveY) => {
      return {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height + moveY,
      }
    },
  }

  // 激活调整大小操作
  const activateResize = (type: ResizeType, startX: number, startY: number) => {
    action.value = 'resize'

    const geo = { x: x.value, y: y.value, width: width.value, height: height.value }

    const handleResize = (e: MouseEvent) => {
      const moveX = e.clientX - startX
      const moveY = e.clientY - startY

      const newGeo = resizeFuns[type](geo, moveX, moveY)
      x.value = newGeo.x
      y.value = newGeo.y
      width.value = newGeo.width
      height.value = newGeo.height
    }

    window.addEventListener('mousemove', handleResize)
    window.addEventListener(
      'mouseup',
      () => {
        action.value = 'none'
        window.removeEventListener('mousemove', handleResize)
      },
      { once: true },
    )
  }

  // 激活旋转操作
  const activateRotate = (startX: number, startY: number) => {
    action.value = 'rotate'
    const currentRotate = rotationAngle.value

    const handleRotate = (e: MouseEvent) => {
      const moveX = e.clientX - startX
      const moveY = e.clientY - startY
      const angle = (Math.atan2(moveY, moveX) * 180) / Math.PI
      rotationAngle.value = currentRotate + angle
    }

    window.addEventListener('mousemove', handleRotate)
    window.addEventListener(
      'mouseup',
      () => {
        action.value = 'none'
        window.removeEventListener('mousemove', handleRotate)
      },
      { once: true },
    )
  }

  return {
    x,
    y,
    width,
    height,
    isActive,
    action,
    rotationAngle,
    activate,
    activateMove,
    activateResize,
    activateRotate,
  }
}
