<template lang="pug">
  .stage(ref="stage", v-if="surfaces.length")
    key-handler(:player="true")
    .top-container
      bouncing-ball.whole(:showBall="showBall", :showCounter="showCounter")
      .controls.whole(v-if="goalNoteCount")
        loop-button(ref="loop", @click.native="onLoop()",
            :show="showLoop", :off="!autoLoop", :repeat="autoRepeat")
        power-auto(ref="auto", @click="onPowerUp()")
        goal-button(ref="goal", @click.native="onGoal()", :class="{weenie: weenie === 'goal'}")
        play-button(ref="play", @click.native="onPlayback()", :wrong="wrong")

    svg-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface",
        :scene="scene", :showPosition="showPosition", :weenie="weenie === 'grid'")
    faces
    bouncing-points(:show="scene === 'victory'", :points="basePoints")
    transition(name="footer")
      .footer(v-show="weenie !== 'goal' && scene !== 'victory'")
        note-counter
    transport(v-bind="transportProps")
</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import BouncingBall from '~/components/bouncing-ball.component';
  import BouncingPoints from '~/components/bouncing-points.component';
  import Faces from '~/components/faces.component';
  import GoalButton from '~/components/goal-button.component';
  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import LoopButton from '~/components/loop-button.component';
  import NoteCounter from '~/components/note-counter.component';
  import PlayButton from '~/components/play-button.component';
  import PowerAuto from '~/components/power-auto.component';
  import Transport from '~/components/transport.component';

  export default {
    mixins: [AnimatedMixin],
    components: {
      'bouncing-ball': BouncingBall,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-button': GoalButton,
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'loop-button': LoopButton,
      'note-counter': NoteCounter,
      'play-button': PlayButton,
      'power-auto': PowerAuto,
      'transport': Transport
    },
    props: {
      showNextAuto: {
        type: Boolean,
        default: false
      },
      tempo: {
        type: Number,
        default: 120
      }
    },
    constants: {
      animationTarget: 'stage',
      animationDefinitions: {
        next: [[.15, {
          transform: 'translateX(-30vw)',
          opacity: 0
        }], [.01, {
          transform: 'translateX(30vw)',
          opacity: 0
        }], [.3, {
          transform: 'translateX(0)',
          opacity: 1
        }]]
      }
    },
    data() {
      return {
        weenie: this.autoGoal ? undefined : 'goal',
        lastBeat: false,
        powerTrigger: -1
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.TOP, this.topHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
      // Wait until children are mounted
      this.$nextTick(() => {
        if (this.autoGoal) {
          this.$refs.goal.animate('count');
        }
        this.$refs.play.toStopLevel(this.noteCount, this.goalNoteCount);
        if (this.preGoal) {
          this.$refs.play.set({ opacity: 0 })
        }
      });
    },
    destroyed() {
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      topHandler({first}) {
        if (!first && this.goalNoteCount && this.active) {
          this.$store.dispatch('stage/toNext');
        }
        this.lastBeat = false;
      },
      beatTickHandler({time, beat, tick, beatTick, lastBeat}) {
        this.$store.dispatch('stage/onBeatTick', {time, beat, beatTick});
        if (lastBeat && tick === 64 && this.scene === 'goal' &&
            (this.nextScene === 'goal' || this.nextScene === 'count')) {
          this.$refs.loop.animate('bumper', { unless: 'drop' })
        }
      },
      beatHandler({time, lastBeat, count}) {
        if (this.lastBeat !== lastBeat) {
          Tone.Draw.schedule(() => {
            if (this.playing) {
              this.lastBeat = lastBeat;
            }
          }, time);
        }
        if (this.nextScene === 'playback') {
          this.$refs.play.count(count);
        } else if (this.autoLoop) {
          this.$refs.loop.pulse();
        }
      },
      onGoal() {
        this.$store.dispatch('stage/onAction', { scene: 'goal' });
      },
      onPlayback() {
        this.$store.dispatch('stage/onAction', { scene: 'playback' });
      },
      onLoop() {
        if (this.showLoop) {
          this.$store.commit('stage/autoAdjust', { max: this.power.auto });
        }
      },
      onPowerUp() {
        this.$store.dispatch('progress/next', 'auto');
      },
      setWeenie(weenie) {
        this.weenie = this.autoGoal ? undefined : weenie;
      },
      randomTrigger() {
        return _.random(this.numPulses - 1);
      }
    },
    computed: {
      showBall() {
        return this.lastBeat ? this.nextScene === 'goal' : this.scene === 'goal';
      },
      showCounter() {
        return this.scene !== 'goal' && this.nextScene === 'goal';
      },
      showPosition() {
        return this.scene === 'playback';
      },
      wrong() {
        return this.noteCount !== this.goalNoteCount;
      },
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: this.tempo,
          metronome: true
        }
      },
      ...mapGetters({
        keyDown: 'keyDown',
        goalNoteCount: 'phrase/goalNoteCount',
        beatsPerMeasure: 'player/beatsPerMeasure',
        surfaces: 'player/surfaces',
        cursor: 'player/cursor',
        notes: 'player/notes',
        noteCount: 'player/noteCount',
        numPulses: 'player/numPulses',
        power: 'progress/power',
        next: 'progress/next',
        showLoop: 'progress/showLoop',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        preGoal: 'stage/preGoal',
        basePoints: 'stage/basePoints',
        autoGoal: 'stage/autoGoal',
        autoLoop: 'stage/autoLoop',
        autoRepeat: 'stage/autoRepeat',
        stage: 'lesson/stage',
        active: 'transport/active',
        playing: 'transport/playing'
      })
    },
    watch: {
      keyDown(key) {
        if (key === 'Enter') {
          this.$store.commit('player/unselect');
          this.$store.dispatch('stage/onAction');
        }
      },
      numPulses: {
        immediate: true,
        handler(numPulses) {
          if (numPulses) {
            this.powerTrigger = this.randomTrigger();
          }
        }
      },
      cursor(cursor) {
        if (this.showNextAuto && this.next.auto && cursor === this.powerTrigger) {
          this.powerTrigger = this.randomTrigger();
          this.$refs.auto.appear(this.next.auto);
        }
      },
      active(active) {
        if (!active) {
          this.lastBeat = false;
        }
      },
      scene(scene, oldScene) {
        if (scene === 'standby') {
          this.$refs.goal.animate(oldScene === 'goal' ? 'land' : 'appear');
          if (!this.preGoal) {
            this.$refs.play.animate('toast', { when: 'drop' });
            this.$refs.play.animate('enter', { when: 'leave' });
          }
          if (oldScene === 'victory') {
            this.setWeenie('goal');
          }
        } else if (scene === 'count') {
          if (oldScene === 'standby') {
            this.$refs.goal.animate(this.nextScene === 'goal' ? 'count' : 'disappear');
          } else if (!this.preGoal) {
            this.$refs.play.animate('toast', { when: 'drop' });
            this.$refs.play.animate('enter', { when: 'leave'});
          }
        } else if (scene === 'goal') {
          if (this.weenie === 'goal') {
            this.setWeenie('grid');
          }
          if (!this.showLoop) {
            this.$refs.play.animate('leave');
          }
          if (oldScene === 'standby') {
            this.$refs.goal.animate('launch');
          }
        } else if (scene === 'playback') {
          this.$refs.play.animate('drop');
          if (oldScene === 'standby') {
            this.$refs.goal.animate('disappear');
          }
        } else if (scene === 'victory') {
          this.$refs.auto.fade();
        }
      },
      nextScene(nextScene) {
        if (nextScene === 'playback') {
          if (this.scene !== 'count') {
            this.$refs.play.animate('enter');
          }
          this.$refs.loop.animate('drop');
        } else {
          this.$refs.play.count(0);
          if (nextScene === 'goal') {
            this.$refs.loop.animate('toast', { when: 'drop' });
          }
        }
      },
      preGoal(preGoal) {
        if (this.$refs.play) {
          this.$refs.play.set({ opacity: preGoal ? 0 : 1 });
        }
      },
      notes() {
        if (this.weenie === 'grid') {
          this.setWeenie();
        }
        if (this.goalNoteCount && this.weenie !== 'goal') {
          this.$store.dispatch('stage/autoPlay');
        }
        this.$refs.play.toStopLevel(this.noteCount, this.goalNoteCount);
        if (!this.preGoal) {
          this.$refs.play.animate('twitch', { unless: 'drop' });
        }
      },
      stage() {
        this.animate('next');
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .stage
    position: relative;
    padding-top: 40px;
    text-align: center;

  .top-container
    height: 10vh;
    width: 100%;
    max-width: 80vh;
    margin: auto;
    padding-top: 40px;
    position: relative;

  .whole
    posit(absolute, x, 0, 0);

  .controls
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 10px;

  .footer
    margin: 5vh 11vw;
    display: flex;
    justify-content: space-evenly;
    align-items: flex-start;
    user-select: none;
    transform-origin: top;

  .footer-enter-active, .footer-leave-active
    transition: transform 250ms;

  .footer-enter, .footer-leave-to
    transform: scale(0)

  .weenie:not(:hover)
    animation: weenie 1s infinite 500ms;

  @keyframes weenie
    0%, 100%
      opacity: 1;
      shadow(#888, 0);
    50%
      opacity: 0.9;
      shadow(#888, 5px);

</style>
