import { ref, watchEffect } from 'vue'

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

export type Point = { x: number; y: number }

export type Aux = { x: number; y: number; distance: number }

export function useEditor(geo: GeoInfo, aux: Aux) {
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

  // 最后一次操作结束时间
  const lastActionTime = ref(Date.now())

  // 旋转角度
  const rotationRadian = ref(0)

  watchEffect(() => {
    if (action.value === 'none') {
      lastActionTime.value = Date.now()
    }
  })

  // 获取旋转后的坐标，左上、右上、右下、左下、中心点
  const getTransformPoints = (
    geo: { x: number; y: number; width: number; height: number },
    radian: number,
  ) => {
    const { x, y, width, height } = geo

    const center = { x: x + width / 2, y: y + height / 2 }

    const transform = (point: { x: number; y: number }) => {
      const x1 = center.x + (point.x - center.x) * cos - (point.y - center.y) * sin
      const y1 = center.y + (point.x - center.x) * sin + (point.y - center.y) * cos
      return { x: x1, y: y1 }
    }

    // 根据旋转角度计算旋转后的坐标
    const cos = Math.cos(radian)
    const sin = Math.sin(radian)

    return [
      transform({ x, y }),
      transform({ x: x + width, y }),
      transform({ x: x + width, y: y + height }),
      transform({ x, y: y + height }),
      center,
    ]
  }

  // 判断点是否在辅助线吸附范围内
  const inAuxRange = (point: Point, aux: Aux, axis: 'x' | 'y') => {
    return Math.abs(point[axis] - aux[axis]) <= aux.distance
  }

  // 判断点的上一个坐标和当前坐标是否逐渐靠近辅助线
  const isApproachingAux = (lastPoint: Point, currentPoint: Point, aux: Aux, axis: 'x' | 'y') => {
    return (
      (lastPoint[axis] >= currentPoint[axis] && currentPoint[axis] >= aux[axis]) ||
      (lastPoint[axis] <= currentPoint[axis] && currentPoint[axis] <= aux[axis])
    )
  }

  // 获取辅助线吸附数值
  const getAuxRange = (lastPoints: Point[], currentPoints: Point[], aux: Aux) => {
    let moveX = 0,
      moveY = 0
    lastPoints.forEach((lastPoint, index) => {
      const currentPoint = currentPoints[index]
      // 判断是否靠近 aux x轴
      if (
        isApproachingAux(lastPoint, currentPoint, aux, 'x') &&
        inAuxRange(currentPoint, aux, 'x')
      ) {
        const mx = aux.x - currentPoint.x
        if (Math.abs(mx) < Math.abs(moveX) || moveX === 0) moveX = mx
      }
      // 判断是否靠近 aux y轴
      if (
        isApproachingAux(lastPoint, currentPoint, aux, 'y') &&
        inAuxRange(currentPoint, aux, 'y')
      ) {
        const my = aux.y - currentPoint.y
        if (Math.abs(my) < Math.abs(moveY) || moveY === 0) moveY = my
      }
    })

    return { x: moveX, y: moveY }
  }

  // 激活编辑器
  const activate = () => {
    if (isActive.value) return

    isActive.value = true
    console.log('编辑器', 'activate')

    const inactivate = () => {
      if (action.value !== 'none' || Date.now() - lastActionTime.value < 300) return

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

    let lastPoints = getTransformPoints(geo, rotationRadian.value)
    let currGeo = geo

    let auxMove: { x: number; y: number } = { x: 0, y: 0 }

    const handleMove = (e: MouseEvent) => {
      const moveX = e.clientX - startX
      const moveY = e.clientY - startY

      console.log('移动距离', moveX, moveY)

      x.value = geo.x + moveX
      y.value = geo.y + moveY

      // 辅助线吸附判断
      currGeo = { x: x.value, y: y.value, width: width.value, height: height.value }
      const currentPoints = getTransformPoints(currGeo, rotationRadian.value)

      auxMove = getAuxRange(lastPoints, currentPoints, aux)

      lastPoints = currentPoints
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener(
      'mouseup',
      () => {
        console.log('结束')
        console.groupEnd()
        action.value = 'none'
        window.removeEventListener('mousemove', handleMove)

        // 结束后进行辅助线吸附
        x.value += auxMove.x
        y.value += auxMove.y
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

    let lastPoints = getTransformPoints(geo, rotationRadian.value)
    let currGeo = geo

    let auxMove: { x: number; y: number } = { x: 0, y: 0 }

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

      // 辅助线吸附判断
      currGeo = {
        x: x.value,
        y: y.value,
        width: width.value,
        height: height.value,
        imageX: imageX.value,
        imageY: imageY.value,
        imageWidth: imageWidth.value,
        imageHeight: imageHeight.value,
      }
      const currentPoints = getTransformPoints(currGeo, rotationRadian.value)

      auxMove = getAuxRange(lastPoints, currentPoints, aux)

      lastPoints = currentPoints
    }

    window.addEventListener('mousemove', handleResize)
    window.addEventListener(
      'mouseup',
      () => {
        console.log('结束')
        console.groupEnd()
        action.value = 'none'
        window.removeEventListener('mousemove', handleResize)

        // 结束后进行辅助线吸附
        const newGeo = resizeFuns[type](currGeo, auxMove.x, auxMove.y)
        x.value = newGeo.x
        y.value = newGeo.y
        width.value = newGeo.width
        height.value = newGeo.height
        imageX.value = newGeo.imageX
        imageY.value = newGeo.imageY
        imageWidth.value = newGeo.imageWidth
        imageHeight.value = newGeo.imageHeight
      },
      { once: true },
    )
  }

  // 激活旋转操作
  const activateRotate = (
    startX: number,
    startY: number,
    getCenterPoint: () => { x: number; y: number },
  ) => {
    if (!isActive.value || action.value !== 'none') return

    action.value = 'rotate'

    const centerPoint = getCenterPoint()
    const currentRotate = rotationRadian.value

    const startCoord = { y: startY - centerPoint.y, x: startX - centerPoint.x }
    const startRadian = Math.atan2(startCoord.y, startCoord.x)

    const handleRotate = (e: MouseEvent) => {
      const clientX = e.clientX
      const clientY = e.clientY

      const endCoord = { y: clientY - centerPoint.y, x: clientX - centerPoint.x }
      const endRadian = Math.atan2(endCoord.y, endCoord.x)

      const radian = endRadian - startRadian
      rotationRadian.value = currentRotate + radian
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
    rotationRadian,
    activate,
    activateMove,
    activateResize,
    activateRotate,
  }
}
