<template lang="pug">
  .container
    canvas(ref="renderCanvas", :class="{active: show && (starting || playing)}")
    .fps(v-if="showFps && playing")
      span(:class="{warn: fps < 60}") {{ fps }}
      span fps
</template>

<script>
  import { mapGetters } from 'vuex'

  import { primaryGreen } from '~/common/colors'
  import Tone from '~/common/tone';

  const hidden = -10;

  export default {
    props: {
      show: {
        type: Boolean,
        default: true
      },
      showFps: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        pixiApp: null,
        line: null,
        width: 0,
        fps: 0
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
        this.width = renderCanvas.offsetWidth;
        const height = renderCanvas.offsetHeight;

        // Create a new PIXI app.
        this.pixiApp = new PIXI.Application(this.width, height, {
          view: renderCanvas,
          antialias: true,
          transparent: true
        });

        this.line = new PIXI.Graphics();
        this.line.lineStyle(0);
        this.line.beginFill(primaryGreen, 0.8);
        this.line.drawRect(hidden, 0, 10, height);
        this.line.endFill();

        this.pixiApp.stage.addChild(this.line);
      },
      resize() {
        const parent = this.pixiApp.view.parentNode;
        this.width = parent.clientWidth;
        this.pixiApp.renderer.resize(this.width, parent.clientHeight);
        this.line.height = parent.clientHeight;
      },
      update() {
        this.fps = _.round(this.pixiApp.ticker.FPS, 1);
        this.line.x = Tone.Transport.progress * this.width;
      },
      enableUpdate() {
        if (this.show && this.starting) {
          this.line.x = hidden;
          this.pixiApp.ticker.add(this.update);
        }
      }
    },
    computed: {
      ...mapGetters({
        starting: 'transport/starting',
        playing: 'transport/playing',
        paused: 'transport/paused'
      })
    },
    watch: {
      show() {
        this.enableUpdate();
      },
      starting() {
        this.enableUpdate();
      },
      paused(paused) {
        if (paused) {
          this.pixiApp.ticker.remove(this.update);
        }
      }
    }
  }

</script>
<style scoped lang="stylus" type="text/stylus">

  .container
    user-select: none;

  canvas
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: all 200ms ease-in;
    transform: translateX(-10px);

    &.active
      opacity: 1;
      transform: translateX(0);

  .fps
    posit(fixed, 50px, 2px, x, x);
    background-color: faint-grey;
    color: lightgray;
    padding: 5px;

    .warn
      color: primary-red;

</style>
