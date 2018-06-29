<template lang="pug">
  .container
    key-handler(:player="true")
    .top-container
      bouncing-ball.whole(:showBall="showBall", :showCounter="showCounter")
      .controls.whole(v-if="goalNoteCount")
        play-icon(@click.native="onPlayback()", :scene="scene", :nextScene="nextScene",
            :goalNotes="goalNoteCount", :playNotes="noteCount",
            :showCount="playing && nextScene === 'playback'")
        goal-button(@click.native="onGoal()")
        .stop-icon.button(@click="onStop()", :class="{active: autoLoop && scene !== 'standby'}")

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
  import PlayIcon from '~/components/play-icon.component';
  import Transport from '~/components/transport.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-button': GoalButton,
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'play-icon': PlayIcon,
      'transport': Transport
    },
    props: {
      pbb: {
        type: String,
        default: '1111'
      },
      surfaces: {
        type: Array,
        default() { return []; }
      }
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
        this.$store.dispatch('stage/onAction', { scene: 'standby' })
      }
    },
    computed: {
      pbbPerMeasure() {
        return _.map(_.split(this.pbb, ','), (pbb) => {
          return _.chain(_.split(pbb, '')).map(_.toNumber).filter(value => {
            return _.inRange(value, 1, 5);
          }).value();
        });
      },
      beatsPerMeasure() {
        return _.map(this.pbbPerMeasure, 'length');
      },
      pulsesByBeat() {
        return _.flatten(this.pbbPerMeasure);
      },
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
        notes: 'player/notes',
        noteCount: 'player/noteCount',
        scene: 'stage/scene',
        nextScene: 'stage/nextScene',
        basePoints: 'stage/basePoints',
        autoLoop: 'stage/autoLoop',
        playing: 'transport/playing',
        active: 'transport/active'
      })
    },
    watch: {
      keyDown(key) {
        if (key === 'Enter') {
          this.$store.commit('player/unselect');
          this.$store.dispatch('stage/onAction');
        } else if (_.includes('012', key)) {
          this.setAuto(_.toNumber(key));
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
      },
      pulsesByBeat: {
        deep: true,
        immediate: true,
        handler(pulsesByBeat) {
          this.$store.dispatch('player/update', pulsesByBeat);
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

  .stop-icon.active
    background-color: dark-grey;

</style>
