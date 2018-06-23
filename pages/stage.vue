<template lang="pug">
  .container
    key-handler(:player="true")
    .content
      bouncing-ball.ball-container(:showBall="showBall", :showCounter="showCounter")
      svg-grid(v-for="(surface, i) in surfaces", :key="i", :grid="surface",
          :scene="scene", :showPosition="showPosition")
      faces
      bouncing-points(:show="scene === 'victory'", :points="basePoints")
      transport(v-bind="transportProps")
    .left
      .goal-controls(v-if="goalNoteCount")
        goal-icon.goal-icon(@click="onGoal()", :scene="scene", :nextScene="nextScene")

        play-icon(@click.native="onPlayback()", :scene="scene", :nextScene="nextScene",
            :goalNotes="goalNoteCount", :playNotes="noteCount",
            :showCount="playing && nextScene === 'playback'")

      .bottom-controls
        .points(v-if="goalNoteCount") {{ basePoints }}
          .info ({{ goalCount }} {{ playCount }})
        note-counter
        .toggle.auto.button(v-for="i in autoLevels", @click="setAuto(i)",
            :class="{active: autoLevel >= i}") {{ i }}

</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import BouncingBall from '~/components/bouncing-ball.component';
  import BouncingPoints from '~/components/bouncing-points.component';
  import Faces from '~/components/faces.component';
  import GoalIcon from '~/components/goal-icon.component';
  import HtmlGrid from '~/components/grid/html-grid.component';
  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import NoteCounter from '~/components/note-counter.component';
  import PlayIcon from '~/components/play-icon.component';
  import Transport from '~/components/transport.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-icon': GoalIcon,
      'html-grid': HtmlGrid,
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'note-counter': NoteCounter,
      'play-icon': PlayIcon,
      'transport': Transport
    },
    head: {
      title: 'Flat Thirteen | Stage'
    },
    layout: 'debug',
    data: function() {
      return {
        pbb: 1111,
        surfaces: [
          { soundByKey: { q: 'snare', a: 'kick' } },
        ],
        lastBeat: false
      }
    },
    mounted() {
      this.$bus.$on(BeatTick.TOP, this.topHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      window.addEventListener('keydown', this.onKeyDown);
    },
    destroyed() {
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
      window.removeEventListener('keydown', this.onKeyDown);
    },
    methods: {
      onKeyDown(event) {
        if (event.key === 'Enter') {
          this.$store.commit('player/unselect');
          this.$store.dispatch('stage/onAction');
        }
      },
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
      setAuto(autoLevel) {
        if (this.autoLevel === autoLevel) {
          this.$store.dispatch('stage/clear');
        } else {
          let notes = _.join(_.fill(Array(this.numBeats), 'K'), '|');
          this.$store.dispatch('stage/initialize', { autoLevel,
            goal: [{ type: 'drums', notes }]
          });
        }
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
        return ':' + _.map(this.pbbPerMeasure, 'length').join(',');
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
          beatsPerMeasure: [4],
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
        autoLevel: 'stage/autoLevel',
        autoLevels: 'stage/autoLevels',
        goalCount: 'stage/goalCount',
        playCount: 'stage/playCount',
        basePoints: 'stage/basePoints',
        beatWrong: 'stage/beatWrong',
        playing: 'transport/playing',
        starting: 'transport/starting',
        active: 'transport/active',
        numBeats: 'transport/numBeats'
      })
    },
    watch: {
      pulsesByBeat: {
        deep: true,
        immediate: true,
        handler(pulsesByBeat) {
          this.$store.dispatch('player/update', pulsesByBeat);
        }
      },
      keyDown(key) {
        if (_.includes('012', key)) {
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
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .left
    posit(absolute, 0, x, x, 0);
    width: content-side-margin;
    text-align: center;

    .goal-icon
      margin: 20px;

    .goal-controls
      padding: 10px;

    .pulses-input
      margin: 10px 0;

      input
        background: transparent;
        border: none;
        margin: 0;
        text-align: center;
        width: 100%;

        &::placeholder {
          color: primary-red;
          font-size: 14px;
        }

        &[type="text"]
          margin-right: 14%;
          width: 86%;

        &:focus
          outline: none;

    toggle-color('.auto', primary-red);

  .bottom-controls
    posit(fixed, x, x, 0, 0)

    .points
      color: active-blue;
      font-size: 40px;
      font-weight: 600;

      .info
        color: gray;
        display: inline-block;

    .toggle
      display: inline-block;
      font-size: 40px;
      line-height: 60px;
      font-weight: bold;
      border-radius: 5px;
      border-width: 5px;

  .content, .footer
    margin: 10vh 0 0 content-side-margin;
    position: relative;

  .ball-container
    height: 10vh;
    width: 100%;
    max-width: 80vh;
    margin: auto;

  .transport-container
    posit(absolute);

</style>
