<script setup lang="ts">
import { computed, type StyleValue } from 'vue'
import { useEditor, type GeoInfo } from '@/hooks/editor'

const containerSize = 600
const wrapperSize = 200

const geoInfo: GeoInfo = {
  x: (containerSize - wrapperSize) / 2,
  y: (containerSize - wrapperSize) / 2,
  width: wrapperSize,
  height: wrapperSize,
}

const { x, y, width, height, isActive, activate, activateMove } = useEditor(geoInfo)

const wrapperStyle = computed<StyleValue>(() => {
  return {
    width: `${width.value}px`,
    height: `${height.value}px`,
    left: `${x.value}px`,
    top: `${y.value}px`,
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
const sliderStyles = computed<Record<string, StyleValue>>(() => {
  const shortMargin = shortSliderSize - overSize
  const horizontalMargin = (width.value - sliderSize) / 2
  const verticalMargin = (height.value - sliderSize) / 2
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
  }
})
</script>

<template>
  <div class="container" :style="{ width: `${containerSize}px`, height: `${containerSize}px` }">
    <div class="wrapper" :style="wrapperStyle" @click.stop="activate">
      <img src="@/assets/logo.svg" alt="" />
      <div class="mask" @mousedown.stop="activateMove($event.clientX, $event.clientY)"></div>
      <!-- 四条边框 -->
      <div v-if="isActive" class="border border-top" :style="borderStyles.top"></div>
      <div v-if="isActive" class="border border-bottom" :style="borderStyles.bottom"></div>
      <div v-if="isActive" class="border border-left" :style="borderStyles.left"></div>
      <div v-if="isActive" class="border border-right" :style="borderStyles.right"></div>
      <!-- 四个中线滑块 -->
      <div v-if="isActive" class="slider slider-top" :style="sliderStyles.top"></div>
      <div v-if="isActive" class="slider slider-bottom" :style="sliderStyles.bottom"></div>
      <div v-if="isActive" class="slider slider-left" :style="sliderStyles.left"></div>
      <div v-if="isActive" class="slider slider-right" :style="sliderStyles.right"></div>
      <!-- 四个角滑块 -->
      <div v-if="isActive" class="slider slider-top-left"></div>
      <div v-if="isActive" class="slider slider-top-right"></div>
      <div v-if="isActive" class="slider slider-bottom-left"></div>
      <div v-if="isActive" class="slider slider-bottom-right"></div>
    </div>
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
}
.wrapper img {
  width: 100%;
  height: 100%;
  user-select: none;
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
  cursor: e-resize;
}
.slider-top,
.slider-bottom {
  cursor: n-resize;
}
</style>
