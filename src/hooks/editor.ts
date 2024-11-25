import { ref, watchEffect } from 'vue'
import {
  getTransformPoints,
  getAuxRange,
  getResizeGeo,
  type GeoWithImg,
  type Aux,
  type ResizeKey,
} from './helper'

export type { GeoWithImg, Aux } from './helper'

export type ActionType = 'move' | 'resize' | 'rotate' | 'none'

export function useEditor(geo: GeoWithImg, aux: Aux) {
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

  // 激活调整大小操作
  const activateResize = (type: ResizeKey, startX: number, startY: number) => {
    if (!isActive.value || action.value !== 'none') return

    action.value = 'resize'

    const geo: GeoWithImg = {
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

      const newGeo = getResizeGeo[type](geo, moveX, moveY)
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
        const newGeo = getResizeGeo[type](currGeo, auxMove.x, auxMove.y)
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
