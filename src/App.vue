<script setup lang="ts">
import { computed, useTemplateRef, type StyleValue } from 'vue'
import { useEditor, type Aux, type GeoWithImg } from '@/hooks/editor'

const containerSize = 600
const wrapperSize = 200

const geoInfo: GeoWithImg = {
  x: (containerSize - wrapperSize) / 2,
  y: (containerSize - wrapperSize) / 2,
  width: wrapperSize,
  height: wrapperSize,
  imageX: 0,
  imageY: 0,
  imageWidth: wrapperSize,
  imageHeight: wrapperSize,
}

const aux: Aux = { x: containerSize / 2, y: containerSize / 2, distance: 30 }

const {
  x,
  y,
  width,
  height,
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  action,
  isActive,
  rotationRadian,
  activate,
  activateMove,
  activateResize,
  activateRotate,
} = useEditor(geoInfo, aux)

const rotationAngle = computed(() => {
  const angle = rotationRadian.value * (180 / Math.PI)
  return angle > 0 ? angle : angle + 360
})

const wrapperStyle = computed<StyleValue>(() => {
  return {
    width: `${width.value}px`,
    height: `${height.value}px`,
    left: `${x.value}px`,
    top: `${y.value}px`,
    transform: `rotate(${rotationAngle.value}deg)`,
  }
})

const imageStyle = computed<StyleValue>(() => {
  return {
    width: `${imageWidth.value}px`,
    height: `${imageHeight.value}px`,
    left: `${imageX.value}px`,
    top: `${imageY.value}px`,
  }
})

const borderSize = 6
const borderStyles = computed<Record<string, StyleValue>>(() => {
  return {
    top: {
      width: '100%',
      height: `${borderSize}px`,
      left: 0,
      top: `-${borderSize}px`,
    },
    bottom: {
      width: '100%',
      height: `${borderSize}px`,
      left: 0,
      bottom: `-${borderSize}px`,
    },
    left: {
      width: `${borderSize}px`,
      height: '100%',
      top: 0,
      left: `-${borderSize}px`,
    },
    right: {
      width: `${borderSize}px`,
      height: '100%',
      top: 0,
      right: `-${borderSize}px`,
    },
  }
})

const sliderSize = 12
const overSize = 2
const shortSliderSize = borderSize + overSize * 2
const cornerSliderSize = borderSize + overSize * 2
const sliderStyles = computed<Record<string, StyleValue>>(() => {
  const shortMargin = shortSliderSize - overSize
  const horizontalMargin = (width.value - sliderSize) / 2
  const verticalMargin = (height.value - sliderSize) / 2
  const cornerMargin = cornerSliderSize - overSize
  return {
    top: {
      width: `${sliderSize}px`,
      height: `${shortSliderSize}px`,
      left: `${horizontalMargin}px`,
      top: `-${shortMargin}px`,
    },
    bottom: {
      width: `${sliderSize}px`,
      height: `${shortSliderSize}px`,
      left: `${horizontalMargin}px`,
      bottom: `-${shortMargin}px`,
    },
    left: {
      width: `${shortSliderSize}px`,
      height: `${sliderSize}px`,
      top: `${verticalMargin}px`,
      left: `-${shortMargin}px`,
    },
    right: {
      width: `${shortSliderSize}px`,
      height: `${sliderSize}px`,
      top: `${verticalMargin}px`,
      right: `-${shortMargin}px`,
    },
    topLeft: {
      width: `${cornerSliderSize}px`,
      height: `${cornerSliderSize}px`,
      top: `-${cornerMargin}px`,
      left: `-${cornerMargin}px`,
    },
    topRight: {
      width: `${cornerSliderSize}px`,
      height: `${cornerSliderSize}px`,
      top: `-${cornerMargin}px`,
      right: `-${cornerMargin}px`,
    },
    bottomLeft: {
      width: `${cornerSliderSize}px`,
      height: `${cornerSliderSize}px`,
      bottom: `-${cornerMargin}px`,
      left: `-${cornerMargin}px`,
    },
    bottomRight: {
      width: `${cornerSliderSize}px`,
      height: `${cornerSliderSize}px`,
      bottom: `-${cornerMargin}px`,
      right: `-${cornerMargin}px`,
    },
  }
})

const rotateBtnSize = 24
const rotateBtnStyle = computed<StyleValue>(() => {
  const w = rotateBtnSize * 2
  return {
    width: `${w}px`,
    height: `${rotateBtnSize}px`,
    left: `${(width.value - w) / 2}px`,
    bottom: `-${rotateBtnSize + 20}px`,
    borderRadius: `${rotateBtnSize / 2}px`,
    transform: `rotate(${-rotationAngle.value}deg)`,
  }
})

const wrapper = useTemplateRef('wrapperRef')

const getCenterPoint = () => {
  const rect = wrapper.value!.getBoundingClientRect()
  const x = rect.x + rect.width / 2
  const y = rect.y + rect.height / 2
  return { x, y }
}
</script>

<template>
  <div class="container" :style="{ width: `${containerSize}px`, height: `${containerSize}px` }">
    <div ref="wrapperRef" class="wrapper" :style="wrapperStyle" @click.stop="activate">
      <div class="img-wrapper">
        <img src="@/assets/logo.svg" alt="" :style="imageStyle" />
      </div>
      <div class="mask" @mousedown.stop="activateMove($event.clientX, $event.clientY)"></div>
      <!-- 四条边框 -->
      <div v-if="isActive" class="border border-top" :style="borderStyles.top"></div>
      <div v-if="isActive" class="border border-bottom" :style="borderStyles.bottom"></div>
      <div v-if="isActive" class="border border-left" :style="borderStyles.left"></div>
      <div v-if="isActive" class="border border-right" :style="borderStyles.right"></div>
      <!-- 四个中线滑块 -->
      <div
        v-if="isActive"
        class="slider slider-top"
        :style="sliderStyles.top"
        @mousedown="activateResize('top', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-bottom"
        :style="sliderStyles.bottom"
        @mousedown="activateResize('bottom', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-left"
        :style="sliderStyles.left"
        @mousedown="activateResize('left', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-right"
        :style="sliderStyles.right"
        @mousedown="activateResize('right', $event.clientX, $event.clientY)"
      ></div>
      <!-- 四个角滑块 -->
      <div
        v-if="isActive"
        class="slider slider-top-left"
        :style="sliderStyles.topLeft"
        @mousedown="activateResize('topLeft', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-top-right"
        :style="sliderStyles.topRight"
        @mousedown="activateResize('topRight', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-bottom-left"
        :style="sliderStyles.bottomLeft"
        @mousedown="activateResize('bottomLeft', $event.clientX, $event.clientY)"
      ></div>
      <div
        v-if="isActive"
        class="slider slider-bottom-right"
        :style="sliderStyles.bottomRight"
        @mousedown="activateResize('bottomRight', $event.clientX, $event.clientY)"
      ></div>
      <!-- 旋转按钮 -->
      <button
        v-if="isActive"
        class="rotate-btn"
        :style="rotateBtnStyle"
        @mousedown="activateRotate($event.clientX, $event.clientY, getCenterPoint)"
      >
        {{ action === 'rotate' ? `${Math.round(rotationAngle)}°` : '转' }}
      </button>
    </div>
    <div
      class="aux-line aux-line-x"
      :style="{ width: '100%', height: '1px', top: `${aux.x}px`, left: 0 }"
    ></div>
    <div
      class="aux-line aux-line-y"
      :style="{ width: '1px', height: '100%', top: 0, left: `${aux.y}px` }"
    ></div>
  </div>
</template>

<style scoped>
.container {
  margin: 40px auto 0;
  background-color: white;
  position: relative;
}
.wrapper {
  position: absolute;
  transform-origin: center center;
}
.img-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.img-wrapper img {
  position: absolute;
  user-select: none;
  -webkit-user-drag: none;
}
.mask {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}
.border {
  position: absolute;
  background-color: rgba(233, 233, 233, 0.3);
  border: 1px solid #ccc;
}
.slider {
  position: absolute;
  background-color: #ccc;
}
.slider-top {
  cursor: n-resize;
}
.slider-bottom {
  cursor: s-resize;
}
.slider-left {
  cursor: w-resize;
}
.slider-right {
  cursor: e-resize;
}
.slider-top-left {
  cursor: nw-resize;
}
.slider-top-right {
  cursor: ne-resize;
}
.slider-bottom-left {
  cursor: sw-resize;
}
.slider-bottom-right {
  cursor: se-resize;
}
.rotate-btn {
  position: absolute;
  margin: 0;
  padding: 0;
  border: none;
  cursor: pointer;
}
.aux-line {
  position: absolute;
  background-color: rgba(14, 0, 209, 0.3);
  pointer-events: none;
}
</style>
