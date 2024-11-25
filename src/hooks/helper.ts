export type Geo = {
  x: number
  y: number
  width: number
  height: number
}

export type Point = {
  x: number
  y: number
}

/**
 * 转换坐标
 */
export const transformPoint = (
  point: Point,
  radian: number,
  center: Point = { x: 0, y: 0 },
): Point => {
  // 根据旋转角度计算旋转后的坐标
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)

  const x1 = center.x + (point.x - center.x) * cos - (point.y - center.y) * sin
  const y1 = center.y + (point.x - center.x) * sin + (point.y - center.y) * cos

  return { x: x1, y: y1 }
}

/**
 * 批量转换坐标
 */
export const transformPoints = (
  points: Point[],
  radian: number,
  center: Point = { x: 0, y: 0 },
): Point[] => {
  // 根据旋转角度计算旋转后的坐标
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)

  return points.map((point) => {
    const x1 = center.x + (point.x - center.x) * cos - (point.y - center.y) * sin
    const y1 = center.y + (point.x - center.x) * sin + (point.y - center.y) * cos

    return { x: x1, y: y1 }
  })
}

/**
 *  获取旋转后的坐标，左上、右上、右下、左下、中心点
 */
export const getTransformPoints = (geo: Geo, radian: number) => {
  const { x, y, width, height } = geo

  const center = { x: x + width / 2, y: y + height / 2 }

  return [
    ...transformPoints(
      [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ],
      radian,
      center,
    ),
    center,
  ]
}

/**
 * 获取两个点与中心点的弧度差值
 */
export const getRadianDiff = (point1: Point, point2: Point, center: Point = { x: 0, y: 0 }) => {
  const radian1 = Math.atan2(point1.y - center.y, point1.x - center.x)
  const radian2 = Math.atan2(point2.y - center.y, point2.x - center.x)

  return radian2 - radian1
}

export type Aux = {
  x: number
  y: number
  distance: number
}

/**
 * 判断点是否在辅助线吸附范围内
 */
export const inAuxRange = (point: Point, aux: Aux, axis: 'x' | 'y') => {
  return Math.abs(point[axis] - aux[axis]) <= aux.distance
}

/**
 * 判断点的上一个坐标和当前坐标是否逐渐靠近辅助线
 */
export const isApproachingAux = (
  lastPoint: Point,
  currentPoint: Point,
  aux: Aux,
  axis: 'x' | 'y',
) => {
  return (
    (lastPoint[axis] >= currentPoint[axis] && currentPoint[axis] >= aux[axis]) ||
    (lastPoint[axis] <= currentPoint[axis] && currentPoint[axis] <= aux[axis])
  )
}

/**
 * 获取辅助线吸附数值
 */
export const getAuxRange = (lastPoints: Point[], currentPoints: Point[], aux: Aux): Point => {
  let moveX = 0
  let moveY = 0
  lastPoints.forEach((lastPoint, index) => {
    const currentPoint = currentPoints[index]
    // 判断是否靠近 aux x轴
    if (isApproachingAux(lastPoint, currentPoint, aux, 'x') && inAuxRange(currentPoint, aux, 'x')) {
      const mx = aux.x - currentPoint.x
      if (Math.abs(mx) < Math.abs(moveX) || moveX === 0) moveX = mx
    }
    // 判断是否靠近 aux y轴
    if (isApproachingAux(lastPoint, currentPoint, aux, 'y') && inAuxRange(currentPoint, aux, 'y')) {
      const my = aux.y - currentPoint.y
      if (Math.abs(my) < Math.abs(moveY) || moveY === 0) moveY = my
    }
  })

  return { x: moveX, y: moveY }
}

export type GeoWithImg = Geo & {
  imageX: number
  imageY: number
  imageWidth: number
  imageHeight: number
}

export type ResizeKey =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

export type ResizeValue = (geo: GeoWithImg, moveX: number, moveY: number) => GeoWithImg

/**
 * 根据位移获取新的几何信息
 */
export const getResizeGeo: Record<ResizeKey, ResizeValue> = {
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
