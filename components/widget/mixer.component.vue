<template lang="pug">
  .mixer-container
    canvas(ref="renderCanvas")
    .fps(v-if="showFps")
      span(:class="{warn: active && fps < 30}") {{ fps }}
      span fps
</template>

<script>
  import { primaryGreen, primaryRed } from '~/common/colors'
  import Sound from '~/common/sound/sound';

  export default {
    props: {
      active: Boolean,
      showWaveform: Boolean,
      showFps: Boolean,
    },
    data() {
      return {
        pixiApp: null,
        meter: null,
        holdPeakTime: 0,
        holdPeakValue: 0,
        waveform: null,
        fft: null,
        height: 0,
        fps: 0,
      };
    },
    mounted() {
      if (!process.browser) {
        return;
      }
      this.setup();
      window.addEventListener('resize', this.resize);
    },
    destroyed() {
      if (this.pixiApp) {
        this.pixiApp.destroy(true);
      }
      window.removeEventListener('resize', this.resize);
    },
    methods: {
      setup() {
        if (!this.$refs.renderCanvas) {
          return;
        }
        const renderCanvas = this.$refs.renderCanvas;
        const width = renderCanvas.offsetWidth;
        this.height = renderCanvas.offsetHeight;

        // Create a new PIXI app.
        this.pixiApp = new PIXI.Application(width, this.height, {
          view: renderCanvas,
          antialias: true,
          transparent: true
        });

        this.meter = new PIXI.Graphics();
        this.pixiApp.stage.addChild(this.meter);

        if (this.showWaveform) {
          this.waveform = new PIXI.Graphics();
          this.pixiApp.stage.addChild(this.waveform);
        }

        this.frequencyMeter = new PIXI.Graphics();
        this.pixiApp.stage.addChild(this.frequencyMeter);
        this.pixiApp.ticker.add(this.update);
      },
      resize() {
        const parent = this.pixiApp.view.parentNode;
        this.height = parent.clientHeight;
        this.pixiApp.renderer.resize(parent.clientWidth, this.height);
      },
      update(delta) {
        let width = 10;
        let opacity = .5;
        this.fps = _.round(this.pixiApp.ticker.FPS, 1);
        let masterLevel = _.clamp(Sound.meter.getLevel(), -100, 10);
        this.meter.clear();
        this.meter.lineStyle(width, primaryGreen, opacity);
        let x = width / 2;
        let meterLevel = (masterLevel < 0 ? masterLevel + 100 : 100) * this.height / 200;
        this.meter.moveTo(x, this.height);
        this.meter.lineTo(x, this.height - meterLevel);
        let peakValue = (masterLevel > 0 ? masterLevel : 0) * this.height / 200;
        if (this.holdPeakTime > 0) {
          this.holdPeakTime -= delta;
        }
        if (this.holdPeakTime < 1 || peakValue > this.holdPeakValue) {
          this.holdPeakValue = peakValue;
          if (peakValue > 0) {
            this.holdPeakTime = 60;
          }
        }
        if (this.holdPeakValue > 0) {
          this.meter.lineStyle(10, primaryRed, opacity);
          this.meter.moveTo(x, this.height / 2);
          this.meter.lineTo(x, this.height / 2 - this.holdPeakValue);
        }

        if (this.showWaveform) {
          let waveform = _.map(Sound.waveform.getValue(), value => _.round(value, 2));
          this.waveform.clear();
          this.waveform.lineStyle(5, 0xdddddd, .8);
          this.waveform.moveTo(100, this.height / 4 + 100 * waveform[0]);
          _.forEach(waveform, (value, i) => {
            this.waveform.lineTo(100 + 5 * i, this.height / 4 + 100 * value);
          });
        }

        this.frequencyMeter.clear();
        let fft = _.map(Sound.fft.getValue(), value => _.clamp(value + 100, 0, 100));
        _.forEach(fft, (value, i) => {
          let x = 100 + width * i;
          this.frequencyMeter.lineStyle(width, primaryGreen, opacity);
          this.frequencyMeter.moveTo(x, this.height);
          this.frequencyMeter.lineTo(x, this.height - value * this.height / 400);
        });
        if (!this.active && !meterLevel && !this.holdPeakValue && !_.some(fft)) {
          this.pixiApp.ticker.stop();
        }
      }
    },
    watch: {
      active(active) {
        if (active && !this.pixiApp.ticker.started) {
          this.pixiApp.ticker.start();
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  .mixer-container
    posit(fixed);
    user-select: none;
    pointer-events: none;

  canvas
    width: 100%;
    height: 100%;

  .fps
    posit(fixed, x, x, 2px, 2px);
    background-color: faint-grey;
    color: lightgray;
    padding: 5px;

    .warn
      color: primary-red;
</style>
