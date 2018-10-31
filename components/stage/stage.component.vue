<template lang="pug">
  .stage-anchor
    .stage(ref="stage")
      key-handler(:player="true")
      .top-container
        bouncing-ball.whole(v-bind="bouncingBallProps")
        .controls.whole
          loop-button(ref="loop", @click="$store.dispatch('progress/auto')",
              :show="showLoop", :off="!autoLoop", :repeat="autoRepeat",
              :assist="!!weenie.auto && scene === 'goal' && loopCount > 2 * weenie.auto")
          power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
          goal-button(ref="goal", @click="onAction('goal')",
              :penalty="!preGoal", :weenie="stageWeenie === 'goal'")
            penalty-fx(ref="goalPenalty", top="50%", left="10%")
          play-button(ref="play", @click="onAction('playback')", :wrong="noteCount !== goalNoteCount")
            penalty-fx(ref="wrongPenalty", top="0", left="80%")
      .grids
        svg-grid(v-for="(surface, i) in layout", :key="i", v-bind="gridProps",
            :grid="surface", :showFx="goalKeys")
        bouncing-points(:show="scene === 'victory'", :points="basePoints")
      faces(v-bind="facesProps")
      .footer: transition(name="footer")
        .contents(v-show="stageWeenie !== 'goal' && scene !== 'victory'")
          note-counter(:scene="scene")
      transport(v-bind="transportProps")
    penalty-fx(ref="backingPenalty", top="70px", left="20px")
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
  import PowerAuto from '~/components/power/power-auto.component';
  import BouncingBall from '~/components/stage/bouncing-ball.component';
  import BouncingPoints from '~/components/stage/bouncing-points.component';
  import Faces from '~/components/stage/faces.component';
  import GoalButton from '~/components/stage/goal-button.component';
  import LoopButton from '~/components/stage/loop-button.component';
  import NoteCounter from '~/components/stage/note-counter.component';
  import PlayButton from '~/components/stage/play-button.component';
  import Transport from '~/components/stage/transport.component';

  const MAX_POINTS = 100;

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
        preGoal: false,
        changed: false,
        showGoal: false,
        goalCount: 0,
        loopCount: 0,
        points: MAX_POINTS,
        beatWrong: null,
        goalKeys: [],
        stageWeenie: this.autoGoal ? undefined : 'goal',
        lastBeat: false,
        lastPoints: 0,
        consecutiveMaxPoints: false,
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
        GameAnalytics.start(this.lessonName, this.level.backing, this.tempo,
            this.stageIndex, this.autoLevel);
      },
      onVisiblityChange() {
        if (document.hidden) {
          this.onAction('standby');
        }
      },
      topHandler({first}) {
        if (!first && this.playing) {
          this.showGoal = false;
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
            } else if (this.autoLoop && ++this.loopCount % (this.autoRepeat ? 4 : 2) === 0) {
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
            this.$store.dispatch('transport/start', this.tempo >= 120 ? '+2n' : '+1s');
          } else if (scene === 'playback') {
            this.$store.commit('phrase/clear', { name: 'playback' });
          } else if (scene === 'victory') {
            this.$store.dispatch('phrase/setVictory', _.floor(this.basePoints / 10));
            this.consecutiveMaxPoints = this.lastPoints === MAX_POINTS && this.basePoints === MAX_POINTS;
            this.lastPoints = this.basePoints;
            GameAnalytics.complete(this.basePoints);
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
            this.goalKeys = this.showGoal ? goalNotes : undefined;
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
          if (this.paused) {
            this.toScene('victory');
            this.$refs.goal.animate('disappear');
            this.$nextTick(() => {
              this.$store.dispatch('transport/start');
            });
          } else {
            this.nextScene = 'victory';
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
      onPowerUp() {
        this.$store.dispatch('progress/next', 'auto');
      },
      setWeenie(weenie) {
        this.stageWeenie = this.autoGoal ? undefined : weenie;
      }
    },
    computed: {
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
        return this.pointsOverride || this.points;
      },
      bouncingBallProps() {
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
          beatWrong: this.beatWrong,
          disable: !this.autoGoal && !this.goalCount
        };
      },
      transportProps() {
        return {
          beatsPerMeasure: this.beatsPerMeasure,
          tempo: this.tempo,
          metronome: this.lastBeat ? this.nextScene === 'count' : this.scene === 'count'
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
        getPlayerNotes: 'player/getNotes',
        notes: 'player/notes',
        noteCount: 'player/noteCount',
        power: 'progress/power',
        level: 'progress/level',
        next: 'progress/next',
        weenie: 'progress/weenie',
        penalty: 'progress/penalty',
        autoLevel: 'progress/autoLevel',
        showLoop: 'progress/showLoop',
        stageIndex: 'progress/stageIndex',
        lessonName: 'progress/lessonName',
        lessonDone: 'progress/lessonDone',
        totalPoints: 'progress/totalPoints',
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
      stageIndex() {
        this.start();
        this.animate('next');
      },
      paused(paused) {
        if (paused) {
          this.lastBeat = false;
          this.beatWrong = null;
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
        if (this.goalCount && this.showNextAuto && this.next.auto) {
          if ((scene === 'standby' || scene === 'count' && this.nextScene === 'goal') &&
            this.consecutiveMaxPoints) {
            this.$refs.auto.appear(this.next.auto, { duration: 2 + this.totalPoints / 1000 });
            this.consecutiveMaxPoints = false;
          } else if (!this.autoLoop) {
            this.$refs.auto.disappear();
          }
        }
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
          if (this.goalCount && this.showNextAuto && this.next.auto) {
            this.$refs.auto.disappear();
          }
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
      'power.auto'() {
        if (this.paused && this.autoGoal) {
          this.onAction('count');
        }
      },
      'level.auto'() {
        if (this.nextScene !== 'playback') {
          this.nextScene = this.getNext(this.scene);
        }
        this.lastPoints = 0;
        this.consecutiveMaxPoints = false;
      },
      'penalty.backing'(level, oldLevel) {
        if (level < oldLevel) {
          this.addPenalty('backingPenalty', 30);
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
