<template lang="pug">
  .container(v-if="surfaces.length")
    key-handler(:player="true")
    .top-container
      bouncing-ball.whole(:showBall="showBall", :showCounter="showCounter")
      .controls.whole(v-if="goalNoteCount")
        play-button(@click.native="onPlayback()")
        goal-button(@click.native="onGoal()")
        loop-button(@click.native="onStop()")

    svg-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface",
        :scene="scene", :showPosition="showPosition")
    faces
    bouncing-points(:show="scene === 'victory'", :points="basePoints")
    transport(v-bind="transportProps")
    slot
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import BouncingBall from '~/components/bouncing-ball.component';
  import BouncingPoints from '~/components/bouncing-points.component';
  import Faces from '~/components/faces.component';
  import GoalButton from '~/components/goal-button.component';
  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import LoopButton from '~/components/loop-button.component';
  import PlayButton from '~/components/play-button.component';
  import Transport from '~/components/transport.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-button': GoalButton,
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'loop-button': LoopButton,
      'play-button': PlayButton,
      'transport': Transport
    },
    data: function() {
      return {
        lastBeat: false
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
        if (!first && this.goalNoteCount) {
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
      onStop() {
        if (this.scene === 'count') {
          this.$store.dispatch('stage/onAction', { scene: 'standby' });
        } else {
          this.$store.commit('stage/next', { nextScene: 'standby' });
        }
      }
    },
    computed: {
      showBall() {
        return this.lastBeat ? this.nextScene === 'goal' : this.scene === 'goal';
      },
      showCounter() {
        return this.nextScene === 'goal';
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
        notes: 'player/notes',
        noteCount: 'player/noteCount',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        basePoints: 'stage/basePoints',
        autoLoop: 'stage/autoLoop',
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
      active(active) {
        if (!active) {
          this.lastBeat = false;
        }
      },
      notes() {
        if (this.goalNoteCount) {
          this.$store.dispatch('stage/autoPlay');
        }
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
    justify-content: space-between;
    align-items: flex-end;
    padding-bottom: 10px;
</style>
