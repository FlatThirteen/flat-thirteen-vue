<template lang="pug">
  .container(ref="stage", v-if="surfaces.length")
    key-handler(:player="true")
    .top-container
      bouncing-ball.whole(:showBall="showBall", :showCounter="showCounter")
      .controls.whole(v-if="goalNoteCount")
        loop-button(@click.native="onLoop()")
        power-auto(ref="auto", @click="onPowerUp()")
        goal-button(@click.native="onGoal()", :class="{weenie: weenie === 'goal'}")
        play-button(@click.native="onPlayback()")

    svg-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface",
        :scene="scene", :showPosition="showPosition", :weenie="weenie === 'grid'")
    faces
    bouncing-points(:show="scene === 'victory'", :points="basePoints")
    transition(name="notes")
      note-counter.notes(v-show="weenie !== 'goal' && scene !== 'victory'")
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
      showNextPower: false
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
    },
    destroyed() {
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      topHandler({first}) {
        if (!first && this.goalNoteCount && this.active) {
          this.$store.dispatch('stage/toNext');
        }
        this.lastBeat = false;
      },
      beatTickHandler({time, beat, beatTick, lastBeat}) {
        this.$store.dispatch('stage/onBeatTick', {time, beat, beatTick});
        if (this.lastBeat !== lastBeat) {
          Tone.Draw.schedule(() => {
            this.lastBeat = lastBeat;
          }, time);
        }
      },
      onGoal() {
        this.$store.dispatch('stage/onAction', { scene: 'goal' });
      },
      onPlayback() {
        this.$store.dispatch('stage/onAction', { scene: 'playback' });
      },
      onLoop() {
        this.$store.dispatch('stage/onLoop');
      },
      onPowerUp() {
        this.$store.dispatch('stage/onPowerUp');
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
        return this.scene === 'playback'
      },
      wrong() {
        return this.scene === 'playback' ? this.noteCount !== this.goalNoteCount :
          this.noteCount > this.goalNoteCount;
      },
      goalWrong() {
        return this.scene === 'playback' && this.noteCount !== this.goalNoteCount;
      },
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: 120,
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
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        basePoints: 'stage/basePoints',
        autoNext: 'stage/autoNext',
        autoGoal: 'stage/autoGoal',
        autoLoop: 'stage/autoLoop',
        autoRepeat: 'stage/autoRepeat',
        stage: 'lesson/stage',
        active: 'transport/active'
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
        if (this.showNextPower && this.autoNext && cursor === this.powerTrigger) {
          this.powerTrigger = this.randomTrigger();
          this.$refs.auto.appear(this.autoNext);
        }
      },
      active(active) {
        if (!active) {
          this.lastBeat = false;
        }
      },
      scene(scene, oldScene) {
        if (oldScene === 'victory') {
          this.setWeenie('goal');
        } else if (scene === 'goal' && this.weenie === 'goal') {
          this.setWeenie('grid');
        } else if (scene === 'victory') {
          this.$refs.auto.fade();
        }
      },
      notes() {
        if (this.weenie === 'grid') {
          this.setWeenie();
        }
        if (this.goalNoteCount && this.weenie !== 'goal') {
          this.$store.dispatch('stage/autoPlay');
        }
      },
      stage() {
        this.animate('next');
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;
    margin-top: 10vh;
    text-align: center;

  .top-container
    height: 10vh;
    width: 100%;
    max-width: 80vh;
    margin: auto;
    position: relative;

  .whole
    posit(absolute, x, 0, 0);

  .controls
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 10px;

  .notes
    margin: 5vh;
    transform-origin: top;

  .notes-enter-active, .notes-leave-active
    transition: transform 250ms;

  .notes-enter, .notes-leave-to
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
