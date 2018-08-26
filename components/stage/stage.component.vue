<template lang="pug">
  .stage(ref="stage", v-if="layout.length")
    key-handler(:player="true")
    .top-container
      bouncing-ball.whole(:showBall="showBall", :showCounter="showCounter")
      .controls.whole
        loop-button(ref="loop", @click.native="showLoop && adjustAuto()",
            :show="showLoop", :off="!autoLoop", :repeat="autoRepeat")
        power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
        goal-button(ref="goal", @click.native="onAction('goal')",
            :penalty="!preGoal", :class="{weenie: weenie === 'goal'}")
          penalty-fx(ref="goalPenalty", top="50%", left="10%")
        play-button(ref="play", @click.native="onAction('playback')", :wrong="wrong")
          penalty-fx(ref="wrongPenalty", top="0", left="80%")
    .grids
      svg-grid(v-for="(surface, i) in layout", :key="i", :grid="surface",
          :scene="scene", :showPosition="showPosition", :weenie="weenie === 'grid'")
      bouncing-points(:show="scene === 'victory'", :points="basePoints")
    faces(:scene="scene", :nextScene="nextScene", :basePoints="basePoints",
        :beatWrong="beatWrong", :goalCount="counts.goal", :playCount="counts.play")
    transition(name="footer")
      .footer(v-show="weenie !== 'goal' && scene !== 'victory'")
        note-counter(:scene="scene")
    transport(v-bind="transportProps")
</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';
  import Tone from '~/common/tone';

  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import PenaltyFx from '~/components/penalty-fx.component';
  import PowerAuto from '~/components/power/power-auto.component';
  import BouncingBall from '~/components/stage/bouncing-ball.component';
  import BouncingPoints from '~/components/stage/bouncing-points.component';
  import Faces from '~/components/stage/faces.component';
  import GoalButton from '~/components/stage/goal-button.component';
  import LoopButton from '~/components/stage/loop-button.component';
  import NoteCounter from '~/components/stage/note-counter.component';
  import PlayButton from '~/components/stage/play-button.component';
  import Transport from '~/components/stage/transport.component';

   export default {
    mixins: [AnimatedMixin],
    components: {
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'penalty-fx': PenaltyFx,
      'power-auto': PowerAuto,
      'bouncing-ball': BouncingBall,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-button': GoalButton,
      'loop-button': LoopButton,
      'note-counter': NoteCounter,
      'play-button': PlayButton,
      'transport': Transport
    },
    props: {
      goal: [Array, Object],
      showNextAuto: Boolean,
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
      },
      nextMap: [{}, {
        count: 'goal',
        victory: 'count'
      }, {
        goal: 'count',
        playback: 'count',
      }, {
        goal: 'goal',
      }],
      penaltyMax: { goal: 45, wrong: 50 }
    },
    data() {
      return {
        scene: 'standby',
        nextScene: 'standby',
        preGoal: false,
        changed: false,
        counts: { goal: 0, playback: 0 },
        loopCount: 0,
        penalty: { goal: 0, wrong: 0 },
        beatWrong: null,
        weenie: this.autoGoal ? undefined : 'goal',
        lastBeat: false,
        powerTrigger: -1,
        pointsOverride: 0
      }
    },
    mounted() {
      this.preGoal = !this.autoLoop;
      this.$bus.$on(BeatTick.TOP, this.topHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
      // Wait until children are mounted
      this.$nextTick(() => {
        this.$refs.play.toStopLevel(this.noteCount, this.goalNoteCount);
        if (this.preGoal) {
          this.$refs.play.set({ opacity: 0 })
        }
      });
    },
    destroyed() {
      this.$store.dispatch('transport/stop');
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      topHandler({first}) {
        if (!first && this.active) {
          let scene = this.nextScene;
          if (this.scene === 'victory') {
            this.loopCount = 0;
            this.$store.commit('player/reset');
            this.$emit('complete', this.basePoints);
            if (this.lessonDone) {
              scene = 'standby';
            }
          } else if (this.scene === 'goal') {
            if (this.noteCount === this.goalNoteCount && this.changed) {
              scene = 'playback';
            } else if (this.autoLoop) {
              this.loopCount++;
              if (this.loopCount % (this.autoRepeat ? 4 : 2) === 0) {
                this.addPenalty('goal', this.autoRepeat ? 2 : 5, { silent: this.autoRepeat });
              }
            }
          } else if (this.scene === 'playback') {
            this.loopCount = 0;
            if (this.correct) {
              scene = 'victory';
            } else {
              this.addPenalty('wrong', 10, { noisy: true });
            }
          }
          this.toScene(scene, this.getNext(scene));
          if (scene === 'standby') {
            this.$store.dispatch('transport/stop');
          } else if (scene === 'count') {
            this.$store.dispatch('transport/start', this.tempo >= 120 ? '+2n' : '+1s');
          } else if (scene === 'playback') {
            this.$store.commit('phrase/clear', { name: 'playback' });
          } else if (scene === 'victory') {
            this.$store.dispatch('phrase/setVictory', _.floor(this.basePoints / 10));
          }
        }
        this.lastBeat = false;
      },
      beatTickHandler({time, beat, tick, beatTick, lastBeat}) {
        let goalNotes = this.getNotes('goal', beatTick);
        let playedNotes = this.getPlayerNotes(beatTick);
        if (this.scene === 'playback' || this.scene === 'goal') {
          if (_.xor(_.invokeMap(goalNotes, 'toString'),
              _.invokeMap(playedNotes, 'toString')).length) {
            this.beatWrong = beat;
          } else if (this.beatWrong !== null && this.beatWrong !== beat) {
            this.beatWrong = null;
          }
        }
        switch(this.scene) {
          case 'victory':
            _.forEach(this.getNotes('victory', beatTick), note => {
              note.play(time);
            });
          // fall through
          case 'goal':
            _.forEach(goalNotes, note => {
              note.play(time);
            });
            break;
          case 'playback':
            _.forEach(playedNotes, note => {
              note.play(time);
              if (this.scene === 'playback') {
                this.$store.commit('phrase/add', { name: 'playback', beatTick, note });
              }
            });
        }
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
      reset() {
        this.preGoal = !this.autoLoop;
        _.forEach(this.counts, (count, scene) => this.counts[scene] = 0);
        _.forEach(this.penalty, (count, type) => this.penalty[type] = 0);
      },
      onAction(scene = this.scene !== 'standby' ? 'standby' : 'goal') {
        if (this.scene === scene || this.nextScene === scene) {
          scene = 'standby';
        }
        let nextScene;
        if (this.scene !== 'standby' && scene !== 'standby') {
          nextScene = scene;
          scene = this.scene;
        } else {
          nextScene = this.getNext(scene);
        }
        this.toScene(scene, nextScene);
        if (scene === 'standby') {
          this.$store.dispatch('transport/stop');
        } else {
          if (scene === 'goal') {
            this.loopCount = 0;
            if (this.counts.goal > 1) {
              this.addPenalty('goal', 10);
            }
          }

          this.$store.commit('phrase/clear', { name: 'playback' });
          this.$nextTick(() => {
            this.$store.dispatch('transport/start');
          });
        }
      },
      setVictory(level) {
        if (this.pointsOverride === level || !level) {
          this.pointsOverride = 0;
          this.onAction('standby');
        } else {
          this.pointsOverride = 10 * level;
          this.$store.dispatch('phrase/setVictory', level);
          this.toScene('victory');
          this.$refs.goal.animate('disappear');
          this.$nextTick(() => {
            this.$store.dispatch('transport/start');
          });
        }
      },
      adjustAuto(level) {
        this.$store.dispatch('progress/mode', {
          power: 'auto',
          level: level,
          min: 1
        });
      },
      toScene(scene, nextScene = scene === 'standby' ? 'standby' : this.nextScene) {
        if (this.scene === 'goal') {
          this.preGoal = false;
        }
        this.scene = scene;
        this.nextScene = nextScene;
        this.changed = false;
        if (this.counts[scene] !== undefined) {
          this.counts[scene]++;
        }
      },
      getNext(scene, autoLevel = this.autoLevel) {
        return autoLevel < 1 ? 'standby' :
            this.nextMap[autoLevel][scene] || this.getNext(scene, autoLevel - 1);
      },
      addPenalty(type, amount, options = {}) {
        if (amount && this.penaltyMax[type]) {
          let previous = this.penalty[type] || 0;
          let current = Math.min(this.penaltyMax[type], previous + amount);
          this.penalty[type] = current;
          ({
            goal: this.$refs.goalPenalty,
            wrong: this.$refs.wrongPenalty
          }[type]).appear(current - previous, options);
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
      autoGoal() {
        return this.autoLevel > 0;
      },
      autoLoop() {
        return this.autoLevel > 1;
      },
      autoRepeat() {
        return this.autoLevel > 2;
      },
      basePoints() {
        return this.pointsOverride || 100 - _.sum(_.values(this.penalty));
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
        correct: 'phrase/correct',
        getNotes: 'phrase/getNotes',
        goalNoteCount: 'phrase/goalNoteCount',
        beatsPerMeasure: 'player/beatsPerMeasure',
        layout: 'player/layout',
        cursor: 'player/cursor',
        getPlayerNotes: 'player/getNotes',
        notes: 'player/notes',
        noteCount: 'player/noteCount',
        numPulses: 'player/numPulses',
        power: 'progress/power',
        mode: 'progress/mode',
        next: 'progress/next',
        autoLevel: 'progress/autoLevel',
        showLoop: 'progress/showLoop',
        stage: 'lesson/stage',
        lessonDone: 'lesson/done',
        active: 'transport/active',
        playing: 'transport/playing',
        paused: 'transport/paused'
      })
    },
    watch: {
      keyDown(key) {
        if (key === 'Enter') {
          this.$store.commit('player/unselect');
          this.onAction();
        }
      },
      goal: {
        immediate: true,
        handler(goal) {
          if (goal) {
            this.$store.dispatch('phrase/initialize', { goal });
            this.$nextTick(() => {
              if (this.paused && this.autoGoal) {
                this.onAction('count');
              }
            });
          }
        }
      },
      stage() {
        this.reset();
        this.animate('next');
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
      basePoints: {
        immediate: true,
        handler(basePoints) {
          this.$emit('basePoints', basePoints);
        }
      },
      preGoal(preGoal) {
        this.$refs.play.set({ opacity: preGoal ? 0 : 1 });
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
      notes() {
        if (this.weenie === 'grid') {
          this.setWeenie();
        }
        if (this.weenie !== 'goal') {
          this.changed = true;
          if (this.noteCount === this.goalNoteCount) {
            if (this.scene === 'standby') {
              this.toScene('count', 'playback');
              this.$store.dispatch('transport/start', this.tempo >= 120 ? '+2n' : '+1s');
            } else if (this.scene !== 'playback' && this.nextScene !== 'playback') {
              this.nextScene = 'playback';
            }
          } else if (this.autoLoop) {
            if (this.nextScene === 'playback' || this.autoRepeat && this.scene !== 'playback') {
              this.nextScene = 'goal';
            } else if (this.scene !== 'count') {
              this.nextScene = 'count';
            }
          } else if (this.scene === 'playback' || this.nextScene === 'playback' || this.starting) {
            this.toScene('standby');
            this.$store.dispatch('transport/stop');
          }
        }
        this.$refs.play.toStopLevel(this.noteCount, this.goalNoteCount);
        if (!this.preGoal) {
          this.$refs.play.animate('twitch', { unless: 'drop' });
        }
      },
      'power.auto'() {
        if (this.paused && this.autoGoal) {
          this.onAction('count');
        }
      },
      'mode.auto'() {
        if (this.nextScene !== 'playback') {
          this.nextScene = this.getNext(this.scene);
        }
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

  .grids
    position: relative;

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
