<template lang="pug">
  .play.button(ref="play", :class="playClass")
    svg(height="60", width="60", viewBox="0 0 60 60")
      defs(v-if="!noGoal")
        linearGradient(id="playGradient" x1="0" y1="0" x2="0" y2="100%")
          stop(:offset="stopLevel + '%'", stop-color="white")
          stop(:offset="(stopLevel ? stopLevel + 15 : 0) + '%'", :stop-color="color")
      path.play-icon(:d="playPath",
          :fill="noGoal ? color: 'url(#playGradient)'",
          :stroke="color" stroke-width="6px")
    .counter(v-if="showCount") {{ count }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import { primaryGreen } from '~/common/colors'

  import BeatTick from '~/common/core/beat-tick.model';

  export default {
    mixins: [AnimatedMixin],
    props: {
      noGoal: {
        type: Boolean,
        default: false
      }
    },
    constants: {
      color: '#50ffa0',
      playPath: 'M5,5L50,30L5,55Z',
      animationTarget: 'play',
      animationDefinitions: {
        bounce: [[.1, {
          transform: 'translateY(-1vh)',
          transformOrigin: 'center center'
        }], [.6, {
          transform: 'translateY(.6vh)'
        }], [.3, {
          transform: 'translateY(0)'
        }]],
        enter: [[0, {
          opacity: 0,
          transform: 'rotate(90deg) scale(0)',
          transformOrigin: 'center center'
        }], [.5, {
          opacity: 1,
          transform: 'rotate(45deg) scale(0.3)'
        }], [.3, {
          transform: 'rotate(-10deg) scale(1.2)'
        }], [.2, {
          transform: 'rotate(0) scale(1)'
        }]],
        twitch: [[0, {
          transform: 'scale(1)',
        }], [.2, {
          transform: 'scale(0.8, 1.1)',
          transformOrigin: 'center center'
        }], [.4, {
          transform: 'scale(1.2, 0.8)'
        }], [.4, {
          transform: 'scale(1)'
        }]],
        drop: [[0, {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        }], [.2, {
          transform: 'translateY(-1vh) scale(1.1, .8)',
          transformOrigin: 'top left'
        }], [.3, {
          transform: 'translateY(-1vh) scale(1.2, .6)'
        }], [.4, {
          opacity: 0.5,
          transform: 'translateY(2vh) scale(.1, 1.5)'
        }], [.1, {
          opacity: 0,
          transform: 'translateY(2vh) scale(0, 1.5)'
        }]],
        toast: [[0, {
          opacity: 0,
          transform: 'translateY(2vh) scale(0, 1.5)'
        }], [.1, {
          opacity: 0.5,
          transform: 'translateY(2vh) scale(.1, 1.5)',
          transformOrigin: 'top left'
        }], [.5, {
          opacity: 1,
          transform: 'translateY(-1vh) scale(1.2, .6)'
        }], [.2, {
          transform: 'translateY(-1vh) scale(1.1, .8)'
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        leave: [[.1, {
          transform: 'rotate(0) scale(1.2)',
          transformOrigin: 'center center'
        }], [.4, {
          transform: 'rotate(-10deg) scale(1.2)'
        }], [.5, {
          transform: 'rotate(90deg) scale(0)'
        }]]
      }
    },
    data() {
      return {
        count: 0,
        stopLevel: 0
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
      if (!this.noGoal && this.preGoal) {
        this.set({ opacity: 0 });
      }
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler({count}) {
        this.count = count;
        if (!this.noGoal && this.showCount) {
          this.animate('bounce');
        }
      }
    },
    computed: {
      ready() {
        return this.playNotes === this.goalNotes;
      },
      playClass() {
        return {
          wrong: !this.noGoal && !this.ready
        };
      },
      showCount() {
        return this.playing && (this.noGoal || this.nextScene === 'playback');
      },
      ...mapGetters({
        playing: 'transport/playing',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        preGoal: 'stage/preGoal',
        showLoop: 'stage/showLoop',
        playNotes: 'player/noteCount',
        goalNotes: 'phrase/goalNoteCount'
      })
    },
    watch: {
      playNotes: {
        immediate: true,
        handler() {
          if (this.noGoal) {
            return;
          }
          let highest = this.goalNotes > 4 ? 15 : 45 - this.goalNotes * 6;
          let notch = (75 - highest) / (this.goalNotes - 1);
          let stopLevel = this.ready ? 0 : 75 - notch * this.playNotes;
          TweenMax.to(this.$data, this.animationDuration, { stopLevel });
          if (!this.preGoal) {
            this.animate('twitch');
          }
        }
      },
      scene(scene, oldScene) {
        if (this.noGoal || this.preGoal) {
          return;
        }
        if (scene === 'playback') {
          this.animate('drop');
        } else if (scene === 'standby' && oldScene === 'playback') {
          this.animate('toast');
        } else if (scene === 'goal' && !this.showLoop) {
          this.animate('leave');
        } else if (this.showLoop ?
            scene !== 'victory' && oldScene === 'playback' || oldScene === 'victory' :
            scene === 'standby' || scene === 'count' && oldScene !== 'standby') {
          this.animate('enter');
        }
      },
      nextScene(nextScene) {
        if (!this.noGoal && nextScene === 'playback' && this.scene !== 'count') {
          this.animate('enter');
        }
      },
      preGoal(preGoal) {
        if (!this.noGoal) {
          this.set({ opacity: preGoal ? 0 : 1 });
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .play
    position: relative;

    &.wrong.button:hover:not(.disabled)
      shadow(primary-red)

  .counter
    posit(absolute, 0, x, x);
    font-size: 40px;
    padding: 10px 5px;

</style>
