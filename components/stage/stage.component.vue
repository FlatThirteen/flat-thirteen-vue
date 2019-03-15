<template lang="pug">
  .stage-anchor
    .stage(ref="stage")
      key-handler(:player="true")
      .top-container
        stage-ball.whole(v-bind="stageBallProps")
        .controls.whole
          loop-button(ref="loop", @click="onLoop()", :show="showLoop",
              :off="!autoLoop", :repeat="autoRepeat",
              :assist="!!weenie.intensity && loopCount > 2 * weenie.intensity")
          goal-button(ref="goal", @click="onAction('goal')",
              :penalty="!preGoal", :weenie="stageWeenie === 'goal'")
            penalty-fx(ref="goalPenalty", top="50%", left="10%")
          play-button(ref="play", @click="onAction('playback')",
              :wrong="noteCount !== goalNoteCount", :disable="!noteCount")
            penalty-fx(ref="wrongPenalty", top="0", left="80%")
      .grids
        svg-grid(v-for="(surface, i) in layout", :key="i", v-bind="gridProps",
            :grid="surface", :showFx="goalKeys")
        bouncing-points.bouncing-points(:show="scene === 'victory'", :points="basePoints")
      faces(v-bind="facesProps")
      .footer: transition(name="footer")
        .contents(v-show="stageWeenie !== 'goal' && scene !== 'victory'")
          note-counter(:scene="scene")
      transport(v-bind="transportProps")
    penalty-fx(ref="tempoPenalty", top="85px", right="130px")
</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import BeatTick from '~/common/core/beat-tick.model';
  import GameAnalytics from '~/common/game-analytics';
  import Tone from '~/common/tone';

  import SvgGrid from '~/components/grid/svg-grid.component';
  import KeyHandler from '~/components/key-handler.component';
  import PenaltyFx from '~/components/penalty-fx.component';
  import BouncingPoints from '~/components/stage/bouncing-points.component';
  import Faces from '~/components/stage/faces.component';
  import GoalButton from '~/components/stage/goal-button.component';
  import LoopButton from '~/components/stage/loop-button.component';
  import NoteCounter from '~/components/stage/note-counter.component';
  import PlayButton from '~/components/stage/play-button.component';
  import StageBall from '~/components/stage/stage-ball.component';
  import Transport from '~/components/stage/transport.component';

  const MAX_POINTS = 100;

  export default {
    mixins: [AnimatedMixin],
    components: {
      'svg-grid': SvgGrid,
      'key-handler': KeyHandler,
      'penalty-fx': PenaltyFx,
      'bouncing-points': BouncingPoints,
      'faces': Faces,
      'goal-button': GoalButton,
      'loop-button': LoopButton,
      'note-counter': NoteCounter,
      'play-button': PlayButton,
      'stage-ball': StageBall,
      'transport': Transport
    },
    props: {
      goal: [Array, Object],
      intensity: Number,
      tempo: Number
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
      }]
    },
    data() {
      return {
        scene: 'standby',
        nextScene: 'standby',
        autoLevel: 0,
        preGoal: false,
        changed: false,
        showGoal: false,
        goalCount: 0,
        loopCount: 0,
        measure: 0,
        points: MAX_POINTS,
        goalKeys: [],
        goalNotesByBeat: null,
        stageWeenie: this.autoGoal ? undefined : 'goal',
        lastBeat: false,
        pointsOverride: 0
      }
    },
    mounted() {
      window.addEventListener('visibilitychange', this.onVisiblityChange);
      this.$bus.$on(BeatTick.TOP, this.topHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
      this.start();
      // Wait until children are mounted
      this.$nextTick(() => {
        if (this.$refs.play) {
          this.$refs.play.toStopLevel(this.noteCount, this.goalNoteCount);
          if (this.preGoal) {
            this.$refs.play.set({ opacity: 0 })
          }
        }
      });
    },
    destroyed() {
      window.removeEventListener('visibilitychange', this.onVisiblityChange);
      this.$store.dispatch('transport/stop');
      this.$bus.$off(BeatTick.TOP, this.topHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      start() {
        this.preGoal = !this.autoLoop;
        this.points = MAX_POINTS;
        this.goalCount = 0;
        GameAnalytics.start(this.lessonName, this.level.intensity, this.tempo,
            this.stageIndex);
        this.$store.dispatch('phrase/setProgression', { enable: this.progression });
      },
      onVisiblityChange() {
        if (document.hidden) {
          console.log('Going hidden');
          //this.onAction('standby');
        }
      },
      topHandler({first}) {
        if (!first && this.playing) {
          this.showGoal = false;
          if (this.autoRepeat && this.scene !== 'count') {
            this.measure++;
          } else {
            this.measure = 0;
          }
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
            } else if (this.autoLoop && ++this.loopCount % (this.autoRepeat ? 4 : 3) === 0) {
              this.addPenalty('goalPenalty', this.autoRepeat ? 2 : 5, { silent: this.autoRepeat });
            }
          } else if (this.scene === 'playback') {
            this.loopCount = 0;
            if (this.correct) {
              scene = 'victory';
            } else {
              this.addPenalty('wrongPenalty', 10, { noisy: true });
            }
          }
          this.toScene(scene, this.getNext(scene));
          if (scene === 'standby') {
            this.$store.dispatch('transport/stop');
          } else if (scene === 'count') {
            this.measure = 0;
            this.$store.dispatch('transport/start', this.tempo >= 120 ? '+2n' : '+1s');
          } else if (scene === 'playback') {
            this.$store.commit('phrase/clear', { name: 'playback' });
          } else if (scene === 'victory') {
            this.$store.dispatch('phrase/setVictory', _.floor(this.basePoints / 10));
            GameAnalytics.complete(this.basePoints);
          }
        }
        this.lastBeat = false;
      },
      beatTickHandler({time, beat, tick, beatTick, lastBeat}) {
        let progression = this.scene === 'count' ? 'metronome' : 'progression';
        let measure = (Math.max(0, this.stageIndex) + this.measure) % 4 * this.beatsPerMeasure;
        let progressionBeatTick = BeatTick.from(measure + beat, tick);
        _.forEach(this.getNotes(progression, progressionBeatTick), note => {
          note.play(time);
        });
        switch(this.scene) {
          case 'victory':
            _.forEach(this.getNotes('victory', beatTick), note => {
              note.play(time);
            });
          // fall through
          case 'goal':
            let goalNotes = this.getNotes('goal', beatTick);
            this.goalKeys = this.showGoal ? goalNotes : undefined;
            _.forEach(goalNotes, note => {
              note.play(time);
            });
            break;
          case 'playback':
            _.forEach(this.getPlayerNotes(beatTick), note => {
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
      beatHandler({time, beat, lastBeat, count}) {
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
          this.$refs.loop.pulse(beat);
        }
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
        if (scene === 'goal') {
          this.showGoal = true;
        }
        this.toScene(scene, nextScene);
        this.loopCount = 0;
        if (scene === 'standby') {
          this.$store.dispatch('transport/stop');
        } else {
          if (scene === 'goal' && this.goalCount > 1) {
            this.addPenalty('goalPenalty', 10);
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
          if (this.playing) {
            this.nextScene = 'victory';
          } else {
            this.toScene('victory');
            this.$refs.goal.animate('disappear');
            this.$nextTick(() => {
              this.$store.dispatch('transport/start');
            });
          }
        }
      },
      toScene(scene, nextScene = scene === 'standby' ? 'standby' : this.nextScene) {
        if (this.scene === 'goal') {
          this.preGoal = false;
        }
        this.scene = scene;
        this.nextScene = nextScene;
        this.changed = false;
        if (scene === 'goal') {
          this.goalCount++;
        }
      },
      getNext(scene, autoLevel = this.autoLevel) {
        return autoLevel < 1 ? 'standby' :
            this.nextMap[autoLevel][scene] || this.getNext(scene, autoLevel - 1);
      },
      addPenalty(type, amount, options = {}) {
        if (amount) {
          let previous = this.points;
          this.points = Math.max(5, previous - amount);
          let penalty = this.$refs[type];
          if (penalty) {
            penalty.appear(this.points - previous, options);
          }
        }
      },
      onLoop() {
        this.autoLevel = this.autoLevel > 1 ? this.autoLevel - 1 : this.defaultAutoLevel;
        this.$store.dispatch('progress/weenie', { power: 'intensity' })
      },
      setWeenie(weenie) {
        this.stageWeenie = this.autoGoal ? undefined : weenie;
      }
    },
    computed: {
      defaultAutoLevel() {
        return [0, 1, 2, 2, 3][this.intensity];
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
      showLoop() {
        return this.intensity > 1;
      },
      progression() {
        return this.intensity > 0;
      },
      basePoints() {
        return this.pointsOverride || this.points;
      },
      beatsWrong() {
        return _.zipWith(this.notesByBeat, this.goalNotesByBeat, _.negate(_.eq));
      },
      stageBallProps() {
        return {
          showBall: this.lastBeat ? this.nextScene === 'goal' : this.scene === 'goal',
          showCounter: this.scene !== 'goal' && this.nextScene === 'goal'
        };
      },
      gridProps() {
        return {
          scene: this.scene,
          showPosition: this.scene === 'playback',
          weenie: this.stageWeenie === 'grid',
          disable: !this.autoGoal && !this.goalCount
        };
      },
      facesProps() {
        return {
          scene: this.scene,
          nextScene: this.nextScene,
          basePoints: this.basePoints,
          beatsWrong: this.beatsWrong,
          disable: !this.autoGoal && !this.goalCount
        };
      },
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: this.tempo,
          metronome: !this.progression &&
              (this.lastBeat ? this.nextScene === 'count' : this.scene === 'count')
        };
      },
      ...mapGetters({
        keyDown: 'keyDown',
        correct: 'phrase/correct',
        getNotes: 'phrase/getNotes',
        goalNoteCount: 'phrase/goalNoteCount',
        beatsPerMeasure: 'player/beatsPerMeasure',
        layout: 'player/layout',
        cursor: 'player/cursor',
        pulsesByBeat: 'player/pulsesByBeat',
        getPlayerNotes: 'player/getNotes',
        notesByBeat: 'player/notesByBeat',
        noteCount: 'player/noteCount',
        level: 'progress/level',
        weenie: 'progress/weenie',
        penalty: 'progress/penalty',
        stageIndex: 'progress/stageIndex',
        lessonName: 'progress/lessonName',
        lessonDone: 'progress/lessonDone',
        active: 'transport/active',
        playing: 'transport/playing'
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
            this.goalNotesByBeat = _.map(this.pulsesByBeat, (pulses, beat) => _.times(pulses,
                pulse => _.join(this.getNotes('goal', BeatTick.from(beat, pulse, pulses)), '.')).join(','));
          }
        }
      },
      stageIndex() {
        this.start();
        this.animate('next');
      },
      progression(progression) {
        this.$store.dispatch('phrase/setProgression', { enable: progression });
      },
      playing() {
        this.lastBeat = false;
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
          if (this.stageWeenie === 'goal') {
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
      notesByBeat() {
        if (this.stageWeenie === 'grid') {
          this.setWeenie();
        }
        if (this.stageWeenie !== 'goal') {
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
      intensity: {
        immediate: true,
        handler() {
          this.autoLevel = this.defaultAutoLevel;
          if (!this.active && this.autoGoal) {
            this.onAction('count');
          }
        }
      },
      autoLevel() {
        if (this.nextScene !== 'playback') {
          this.nextScene = this.getNext(this.scene);
        }
      },
      'penalty.tempo'(level, oldLevel) {
        if (level < oldLevel) {
          this.addPenalty('tempoPenalty', 10);
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .stage-anchor
    posit(absolute);
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    opacity: .8;

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

  .grids
    position: relative;

  .bouncing-points
    color: active-blue;
    font-size: 15vh;

  .footer
    height: 15vh;
    position: relative;

    .contents
      posit(absolute);
      margin: 5vh 11vw 0;
      display: flex;
      justify-content: space-evenly;
      align-items: flex-start;
      transform-origin: top;

  .footer-enter-active, .footer-leave-active
    transition: transform 250ms;

  .footer-enter, .footer-leave-to
    transform: scale(0)
</style>
