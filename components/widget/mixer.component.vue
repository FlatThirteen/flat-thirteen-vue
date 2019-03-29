<template lang="pug">
  .mixer-container
    canvas(ref="renderCanvas", v-show="show")
    .fps(v-if="showFps")
      span(:class="{warn: fps < 30}") {{ fps }}
      span fps
</template>

<script>
  import { primaryGreen, primaryRed } from '~/common/colors'
  import Sound from '~/common/sound/sound';

  export default {
    props: {
      show: Boolean,
      showFps: Boolean,
    },
    data() {
      return {
        pixiApp: null,
        mainMeter: null,
        peakMeter: null,
        masterLevel: 0,
        holdPeak: 0,
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

        this.mainMeter = new PIXI.Graphics();
        this.mainMeter.lineStyle(0);
        this.mainMeter.beginFill(primaryGreen, 0.8);
        this.mainMeter.drawRect(0, 0, 5, this.height / 2);
        this.mainMeter.endFill();
        this.peakMeter = new PIXI.Graphics();
        this.peakMeter.lineStyle(0);
        this.peakMeter.beginFill(primaryRed, 0.8);
        this.peakMeter.drawRect(0, 0, 5, this.height / 2);
        this.peakMeter.endFill();

        this.pixiApp.stage.addChild(this.mainMeter);
        this.pixiApp.stage.addChild(this.peakMeter);
        this.enableUpdate();
      },
      resize() {
        const parent = this.pixiApp.view.parentNode;
        this.height = parent.clientHeight;
        this.pixiApp.renderer.resize(parent.clientWidth, this.height);
      },
      update(delta) {
        this.fps = _.round(this.pixiApp.ticker.FPS, 1);
        this.masterLevel = _.floor(_.clamp(Sound.meter.getLevel(), -100, 10));
        this.mainMeter.height = (this.masterLevel < 0 ? this.masterLevel + 100 : 100) * this.height / 200;
        this.mainMeter.y = this.height - this.mainMeter.height;
        let peakHeight = (this.masterLevel > 0 ? this.masterLevel : 0) * this.height / 200;
        if (this.holdPeak > 0) {
          this.holdPeak -= delta;
        }
        if (this.holdPeak < 1 || peakHeight > this.peakMeter.height) {
          this.peakMeter.height = peakHeight;
          this.peakMeter.y = this.height / 2 - this.peakMeter.height;
          if (peakHeight > 0) {
            this.holdPeak = 60;
          }
        }
      },
      enableUpdate() {
        if (this.show) {
          this.pixiApp.ticker.add(this.update);
        } else {
          this.pixiApp.ticker.remove(this.update);
        }
      }
    },
    watch: {
      show() {
        this.enableUpdate();
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">
  .mixer-container
    posit(fixed);
    user-select: none;

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
