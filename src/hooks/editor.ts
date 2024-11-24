import { ref } from 'vue'

export type ActionType = 'move' | 'resize' | 'rotate' | 'none'

export type ResizePosType = 'top' | 'right' | 'bottom' | 'left'

export type ResizeOblType = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export type ResizeType = ResizePosType | ResizeOblType

export type GeoInfo = {
  x: number
  y: number
  width: number
  height: number
  imageX: number
  imageY: number
  imageWidth: number
  imageHeight: number
}

export type ResizeFun = (geo: GeoInfo, moveX: number, moveY: number) => GeoInfo

export function useEditor(geo: GeoInfo) {
  // 容器坐标
  const x = ref(geo.x)
  const y = ref(geo.y)

  // 容器尺寸
  const width = ref(geo.width)
  const height = ref(geo.height)

  // 图片坐标
  const imageX = ref(geo.imageX)
  const imageY = ref(geo.imageY)

  // 图片尺寸
  const imageWidth = ref(geo.imageWidth)
  const imageHeight = ref(geo.imageHeight)

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
    if (!isActive.value || action.value !== 'none') return

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
      const fixedPoint = { x: geo.x + geo.width, y: geo.y + geo.height }
      const movePoint = { x: geo.x + moveX, y: geo.y + moveY }
      const dW = Math.abs(movePoint.x - fixedPoint.x)
      const dH = Math.abs(movePoint.y - fixedPoint.y)
      const ratio = geo.width / geo.height
      const isX = dW / ratio > dH
      const width = isX ? dW : dH * ratio
      const height = isX ? dW / ratio : dH
      const scale = width / geo.width
      return {
        x: fixedPoint.x - width,
        y: fixedPoint.y - height,
        width,
        height,
        imageX: geo.imageX * scale,
        imageY: geo.imageY * scale,
        imageWidth: geo.imageWidth * scale,
        imageHeight: geo.imageHeight * scale,
      }
    },
    topRight: (geo, moveX, moveY) => {
      const fixedPoint = { x: geo.x, y: geo.y + geo.height }
      const movePoint = { x: geo.x + geo.width + moveX, y: geo.y + moveY }
      const dW = Math.abs(movePoint.x - fixedPoint.x)
      const dH = Math.abs(movePoint.y - fixedPoint.y)
      const ratio = geo.width / geo.height
      const isX = dW / ratio > dH
      const width = isX ? dW : dH * ratio
      const height = isX ? dW / ratio : dH
      const scale = width / geo.width
      return {
        x: fixedPoint.x,
        y: fixedPoint.y - height,
        width,
        height,
        imageX: geo.imageX * scale,
        imageY: geo.imageY * scale,
        imageWidth: geo.imageWidth * scale,
        imageHeight: geo.imageHeight * scale,
      }
    },
    bottomLeft: (geo, moveX, moveY) => {
      const fixedPoint = { x: geo.x + geo.width, y: geo.y }
      const movePoint = { x: geo.x + moveX, y: geo.y + geo.height + moveY }
      const dW = Math.abs(movePoint.x - fixedPoint.x)
      const dH = Math.abs(movePoint.y - fixedPoint.y)
      const ratio = geo.width / geo.height
      const isX = dW / ratio > dH
      const width = isX ? dW : dH * ratio
      const height = isX ? dW / ratio : dH
      const scale = width / geo.width
      return {
        x: fixedPoint.x - width,
        y: fixedPoint.y,
        width,
        height,
        imageX: geo.imageX * scale,
        imageY: geo.imageY * scale,
        imageWidth: geo.imageWidth * scale,
        imageHeight: geo.imageHeight * scale,
      }
    },
    bottomRight: (geo, moveX, moveY) => {
      const fixedPoint = { x: geo.x, y: geo.y }
      const movePoint = { x: geo.x + geo.width + moveX, y: geo.y + geo.height + moveY }
      const dW = Math.abs(movePoint.x - fixedPoint.x)
      const dH = Math.abs(movePoint.y - fixedPoint.y)
      const ratio = geo.width / geo.height
      const isX = dW / ratio > dH
      const width = isX ? dW : dH * ratio
      const height = isX ? dW / ratio : dH
      const scale = width / geo.width
      return {
        x: geo.x,
        y: geo.y,
        width,
        height,
        imageX: geo.imageX * scale,
        imageY: geo.imageY * scale,
        imageWidth: geo.imageWidth * scale,
        imageHeight: geo.imageHeight * scale,
      }
    },
    top: (geo, _moveX, moveY) => {
      return {
        x: geo.x,
        y: geo.y + moveY,
        width: geo.width,
        height: geo.height - moveY,
        imageX: geo.imageX,
        imageY: geo.imageY - moveY,
        imageWidth: geo.imageWidth,
        imageHeight: geo.imageHeight,
      }
    },
    left: (geo, moveX) => {
      return {
        x: geo.x + moveX,
        y: geo.y,
        width: geo.width - moveX,
        height: geo.height,
        imageX: geo.imageX - moveX,
        imageY: geo.imageY,
        imageWidth: geo.imageWidth,
        imageHeight: geo.imageHeight,
      }
    },
    right: (geo, moveX) => {
      return {
        x: geo.x,
        y: geo.y,
        width: geo.width + moveX,
        height: geo.height,
        imageX: geo.imageX,
        imageY: geo.imageY,
        imageWidth: geo.imageWidth,
        imageHeight: geo.imageHeight,
      }
    },
    bottom: (geo, _moveX, moveY) => {
      return {
        x: geo.x,
        y: geo.y,
        width: geo.width,
        height: geo.height + moveY,
        imageX: geo.imageX,
        imageY: geo.imageY,
        imageWidth: geo.imageWidth,
        imageHeight: geo.imageHeight,
      }
    },
  }

  // 激活调整大小操作
  const activateResize = (type: ResizeType, startX: number, startY: number) => {
    if (!isActive.value || action.value !== 'none') return

    action.value = 'resize'

    const geo = {
      x: x.value,
      y: y.value,
      width: width.value,
      height: height.value,
      imageX: imageX.value,
      imageY: imageY.value,
      imageWidth: imageWidth.value,
      imageHeight: imageHeight.value,
    }

    console.groupCollapsed('调整大小操作 -', type)
    console.log('起始位置', startX, startY)

    const handleResize = (e: MouseEvent) => {
      const clientX = e.clientX
      const clientY = e.clientY
      const moveX = clientX - startX
      const moveY = clientY - startY

      console.log('移动距离', moveX, moveY)
      console.log('本次移动距离', moveX, moveY)

      const newGeo = resizeFuns[type](geo, moveX, moveY)
      x.value = newGeo.x
      y.value = newGeo.y
      width.value = newGeo.width
      height.value = newGeo.height
      imageX.value = newGeo.imageX
      imageY.value = newGeo.imageY
      imageWidth.value = newGeo.imageWidth
      imageHeight.value = newGeo.imageHeight
    }

    window.addEventListener('mousemove', handleResize)
    window.addEventListener(
      'mouseup',
      () => {
        console.log('结束')
        console.groupEnd()
        action.value = 'none'
        window.removeEventListener('mousemove', handleResize)
      },
      { once: true },
    )
  }

  // 激活旋转操作
  const activateRotate = (startX: number, startY: number) => {
    if (!isActive.value || action.value !== 'none') return

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
    imageX,
    imageY,
    imageWidth,
    imageHeight,
    isActive,
    action,
    rotationAngle,
    activate,
    activateMove,
    activateResize,
    activateRotate,
  }
}
