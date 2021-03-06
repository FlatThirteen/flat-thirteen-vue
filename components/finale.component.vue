<template lang="pug">
  .finale-container
    backing
    .meter
      .meter__container(:class="{'meter--hide': bonus}", :style="hideTransition")
        .meter__level(:style="meterStyle")
        .meter__bar
      .meter__star(ref="star")
        star(color="black")
    .stages
      .lesson(v-for="(stage, i) in stages", :class="{button: playable}", @click="play(i)",
          @touchstart="play(i), $event.preventDefault()")
        phrase.lesson__phrase(ref="phrase", :class="{lesson__phrase__off: state + numBeats < i}",
            v-bind="{phrase: stage.phrase, phraseKey: keys[i], pulsesByBeat, phraseProperties, noAnimation}")
        transition(name="label")
          .lesson__key(v-if="ready", :class="{fade: playable}") {{ keys[i] }}
          bouncing-points(v-else, :show="state >= i", :points="stage.points")
        transition(name="play"): .lesson__play(v-show="playable"): play-button.play-button
    .bonus
      .bonus__controls(v-if="bonus")
        bouncing-ball.bonus__ball(ref="bouncingBall")
        goal-button.bonus__goal(ref="goal", v-if="bonus !== 'start'",
            @click="onGoal()", :weenie="bonus === 'ready'")
      .bonus__target-container
        .bonus__target(ref="target", v-for="(index, i) in target", :class="{cheer: bonusSuccess}")
          .bonus__target__progress(ref="progress")
          .bonus__target__contents(ref="contents", v-show="bonus === 'play'") {{ playKeys[i] }}
        bouncing-points(:show="bonusSuccess", :points="particleCount")
        particle-fx(:type="particleType", :count="particleCount")
      .bonus__footer
    .high(:class="{'high--hide': bonusActive}")
      .high__scores
        transition-group(name="high__score")
          .high__score(v-for="(score, i) in highScores", :key="score.isNew ? 'new' : i",
              ref="highScore", :style="highScoreStyles[i]", :class="{new: score.isNew}")
            .high__value(:style="highScoreValueStyles[i]",
                :class="{flash: score.isNew && final}") {{ score.base }}
              creep(v-if="!score.passing", v-bind="creepProperties[i]")
                template(slot="html", slot-scope="{filterStyle}")
                  .high__creep(:style="filterStyle")
            .high__tempo(:class="{hide: !score.tempo || !power.tempo}")
              metronome(:mini="true")
              | {{ score.tempo }}
    .stages-footer
      goal-button.stages-footer__goal(ref="fail", v-if="bonusFail", @click="onGoal()")
    .footer
      key-handler
      transition(name="finish")
        .finish.button(v-if="earlyExit || exitable", :class="{weenie: final && paused}", @click="finish()")
          play-button.play-button(:disable="true")
      arrangement.arrangement(:phrases="phrases", :tempo="tempo", :count="!ready",
          :loop="final ? 4 : undefined", :progression="progression",
          @position="onPosition($event)")
</template>

<script>
  import { TweenMax, Linear } from 'gsap';
  import { mapActions, mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import { bgIntensity, fgIntensity, primaryBlue, hexString } from '~/common/colors'
  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  import Arrangement from '~/components/arrangement.component';
  import Backing from '~/components/backing.component';
  import Composer from '~/components/composer.component';
  import KeyHandler from '~/components/key-handler.component';
  import Metronome from '~/components/metronome.component';
  import ParticleFx from '~/components/particle-fx.component';
  import Phrase from '~/components/phrase.component';
  import BouncingPoints from '~/components/stage/bouncing-points.component';
  import GoalButton from '~/components/stage/goal-button.component';
  import PlayButton from '~/components/stage/play-button.component';
  import Star from '~/components/star.component';
  import BouncingBall from '~/components/widget/bouncing-ball.component';
  import Creep from '~/components/widget/creep.component';

  export default {
    mixins: [AnimatedMixin],
    components: {
      'arrangement': Arrangement,
      'backing': Backing,
      'composer': Composer,
      'key-handler': KeyHandler,
      'metronome': Metronome,
      'particle-fx': ParticleFx,
      'phrase': Phrase,
      'bouncing-points': BouncingPoints,
      'goal-button': GoalButton,
      'play-button': PlayButton,
      'star': Star,
      'bouncing-ball': BouncingBall,
      'creep': Creep
    },
    inject: ['getComposer'],
    props: {
      stages: Array, // [{ phrase, points }]
      bonusStage: Boolean
    },
    constants: {
      keys: ['A', 'B', 'C', 'D'],
      animationDefinitions: {
        appear: [[.5, {
          transform: 'scale(1.1)'
        }], [.2, {
          transform: 'scale(1)'
        }]],
        queue: [[.3, {
          transform: 'scale(.85)'
        }], [.5, {
          transform: 'scale(1.05)'
        }], [.2, {
          transform: 'scale(1)'
        }]],
        squish: [[.2, {
          transform: 'scale(1.05, 0.95)'
        }], [.2, {
          transform: 'scale(0.95, 1.05)'
        }], [.2, {
          transform: 'scale(1, 1)'
        }]],
        cheer: [[.3, {
          transform: 'translateY(1vh) scale(1.05, 0.95)'
        }], [.2, {
          transform: 'translateY(-2vh) scale(0.95, 1.05)'
        }], [.1, {
          transform: 'translateY(0) scale(1, 1)'
        }]],
        disappear: [[.2, {
          transform: 'scale(1.1)'
        }], [.5, {
          transform: 'scale(0)'
        }]],
        fill: [[.3, {
          transform: 'scale(5)',
          opacity: .8
        }], [.7, {
          transform: 'scale(100)',
          opacity: 0
        }]],
        drop: [[.3, {
          transform: 'scale(1)',
          opacity: 1
        }], [.3, {
          transform: 'translateY(10vh) rotate(180deg)'
        }], [.3, {
          transform: 'translateY(100vh)',
          opacity: 0
        }], [.1, {
          transform: 'translateY(0)'
        }]],
        success: [[.3, {
          transform: 'scale(1)',
          opacity: .4
        }], [.1, {
          transform: 'scaleX(0)',
          opacity: 1
        }], [.1, {
          transform: 'scaleX(1)'
        }], [.1, {
          transform: 'scaleX(0)',
        }], [.1, {
          transform: 'scaleX(1)'
        }], [.3, {
          transform: 'translateY(-10vh) scale(2)',
          opacity: 0
        }]]
      }
    },
    data() {
      return {
        phrases: [],
        show: [],
        state: -1 - this.stages.length,
        bonus: '',
        target: _.times(4, () => _.random(0, 3)),
        position: null,
        star: false,
        highScores: [],
        timeouts: []
      };
    },
    mounted() {
      this.phrases = this.$refs.phrase;
      if (this.bonusStage && _.every(this.stages, stage => stage.points === 100)) {
        this.addEmptyPhrase();
      }
      setTimeout(() => {
        this.getComposer().setFinale(_.map(this.stages, 'points'));
        this.highScores = [{ isNew: true, base: 0, passing: true, intensity: this.level.intensity }];
        this.start('+0');
      }, 500);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatHandler({time, beat, lastBeat}) {
        if (this.state < -1) {
          this.state += 1;
        } else if (this.bonusSuccess) {
          _.forEach(this.$refs.target, element => {
            this.animate('cheer', { element });
          });
        } else if (this.bonus === 'goal' || this.bonus === 'play') {
          Tone.Draw.schedule(() => {
            this.animate('squish', { element: this.$refs.target[this.position] });
            if (this.bonus === 'goal') {
              this.$refs.bouncingBall.to(this.targetPositions[this.position + lastBeat]);
            }
          }, time);
        }
      },
      beatTickHandler({time, beatTick}) {
        if (this.bonus === 'start') {
          let index = _.indexOf(['01:096', '02:000', '02:096', '03:000'], beatTick);
          if (index >= 0) {
            Tone.Draw.schedule(() => {
              this.animate('appear', { element: this.$refs.target[index] });
            }, time);
          }
        }
      },
      addEmptyPhrase() {
        this.phrases.push({ onBeatTick: _.noop });
      },
      play(index) {
        if (this.playable) {
          if (this.bonus === 'ready') {
            this.bonus = 'play';
          }
          if (this.bonusFail && this.paused) {
            this.$refs.fail.animate('disappear');
          }
          if (this.bonus !== 'goal' && this.bonus !== 'failGoal') {
            this.animate('squish', { element: this.$refs.contents[this.phrases.length] });
            this.animate('queue', { element: this.$refs.phrase[index].$el });
            this.phrases.push(this.$refs.phrase[index]);
            if (this.paused) {
              if (this.bonusActive && this.$refs.goal) {
                this.$refs.goal.animate('disappear');
              }
              this.start('+0');
            } else if (this.bonus === 'play' && this.playKeys === this.targetKeys) {
              // Correct, so add empty phrase for success finale
              this.addEmptyPhrase();
            }
          }
        }
      },
      onPosition(position) {
        this.position = position;
        if (this.ready) {
          if (this.bonus === 'play' && this.$refs.progress[position]) {
            TweenMax.fromTo(this.$refs.progress[position], this.numBeats * this.duration, {
              opacity: .5,
              transform: 'scaleX(0)'
            }, {
              opacity: 1,
              transform: 'scaleX(1)',
              ease: Linear.easeNone
            });
          }
          if (this.bonusSuccess) {
            this.animate('success', { element: this.$refs.star, duration: 4 * this.duration });
          }
        } else if (position === this.stages.length) {
          this.bonus = 'start';
          this.animate('fill', { element: this.$refs.star, duration: 4 * this.duration });
        } else if (position >= 0 && this.state < position) {
          this.state = position;
          let total = _.sumBy(_.take(this.stages, position + 1), 'points');
          TweenMax.to(this.$data.highScores[0], 3.9 * this.duration, {
            base: total,
            ease: Linear.easeNone,
            roundProps: 'base',
            onUpdate: (self) => {
              if (total - this.highScores[0].base > 100) {
                console.warn('Update:', this.highScores[0].base, total, self);
              }
            },
            onUpdateParams: ['{self}'],
          });
        }
      },
      onGoal() {
        if (this.paused) {
          this.phrases = _.map(this.target, index => this.$refs.phrase[index]);
          if (this.bonusFail) {
            this.bonus = 'failGoal';
            this.$refs.fail.animate('disappear');
          } else {
            this.bonus = 'goal';
            this.$refs.goal.animate('launch');
            this.$refs.bouncingBall.to(this.targetPositions[0]);
          }
          this.start();
        }
      },
      showHighScores() {
        this.highScores = this.newHighScores(this.totalPoints);
        this.timeouts.push(setTimeout(() => {
          this.$refs.highScore[_.findIndex(this.highScores, 'isNew')].scrollIntoView({behavior: 'smooth'});
        }, 90 * this.highScores.length));
        this.timeouts.push(setTimeout(() => {
          this.state++;
        }, 110 * this.highScores.length));
      },
      finish() {
        this.stop();
        _.forEach(this.timeouts, timeout => {
          clearTimeout(timeout);
        });
        this.$emit('finish', this.totalPoints);
      },
      ...mapActions({
        start: 'transport/start',
        stop: 'transport/stop',
      })
    },
    computed: {
      progression() {
        return this.level.intensity > 0;
      },
      earlyExit() {
        return !this.bonus & this.phrases.length=== this.stages.length;
      },
      ready() {
        return this.state >= this.stages.length;
      },
      final() {
        return this.state > this.stages.length;
      },
      bonusActive() {
        return this.bonus && this.bonus !== 'done' && !this.bonusFail;
      },
      bonusSuccess() {
        return this.bonus === 'play' && this.position === this.playKeys.length;
      },
      bonusFail() {
        return this.bonus === 'fail' || this.bonus === 'failGoal';
      },
      playable() {
        return this.ready && (!this.bonus || this.bonus === 'done' || this.phrases.length < this.target.length);
      },
      exitable() {
        return this.ready && !this.bonusActive;
      },
      playKeys() {
        return _.join(_.map(this.phrases, 'phraseKey'), '');
      },
      targetKeys() {
        return _.join(_.map(this.target, index => this.keys[index]), '');
      },
      targetPositions() {
        return _.times(this.target.length, index => {
          return ((100 * index + 50) / this.target.length) + '%'
        });
      },
      totalPoints() {
        return _.sumBy(this.stages, 'points') + this.star * 100;
      },
      particleType() {
        return this.bonusSuccess || this.star ? 'confetti' : null;
      },
      particleCount() {
        return this.particleType ? 100 : null;
      },
      noAnimation() {
        return this.bonus === 'goal' && this.progression;
      },
      hideTransition() {
        return { 'transition-duration': 2 * this.duration + 's' };
      },
      meterStyle() {
        return { height: (this.ready ? this.totalPoints :
            this.highScores[0] && this.highScores[0].base) / 5 + '%'};
      },
      highScoreStyles() {
        return _.map(this.highScores, (score, i) => ({
          transitionDelay: (this.final || score.isNew ? 0 : 100 * i) + 'ms'
        }));
      },
      highScoreValueStyles() {
        return _.map(this.highScores, (score, i) => ({
          color: this.final ? fgIntensity(score.intensity) : hexString(primaryBlue),
          backgroundColor: this.final ? hexString(primaryBlue) : bgIntensity(score.intensity),
        }));
      },
      creepProperties() {
        return _.times(this.highScores.length, i => ({
          turbulence: {
            type: 'turbulence',
            seed: i,
            baseFrequency: 0.07,
            numOctaves: 3
          },
          displacement: {
            scale: 20
          }
        }));
      },
      ...mapGetters({
        keyDown: 'keyDown',
        numBeats: 'player/numBeats',
        pulsesByBeat: 'player/pulsesByBeat',
        phraseProperties: 'player/phraseProperties',
        level: 'progress/level',
        power: 'progress/power',
        backing: 'progress/backing',
        tempo: 'progress/tempo',
        newHighScores: 'progress/newHighScores',
        paused: 'transport/paused'
      }),
    },
    watch: {
      keyDown(key) {
        if (key === 'Enter') {
          if (this.exitable) {
            this.finish();
          } else if (this.bonus === 'ready') {
            this.onGoal();
          }
        } else {
          let index = _.indexOf(this.keys, _.toUpper(key));
          if (index !== -1) {
            this.play(index);
          }
        }
      },
      paused(paused) {
        if (paused) {
          if (this.bonusActive) {
            if (this.bonus === 'play' && this.playKeys.length === this.targetKeys.length) {
              if (this.playKeys === this.targetKeys) {
                this.bonus = 'done';
                this.star = true;
                TweenMax.to(this.$data.highScores[0], 2 * this.duration, {
                  base: this.totalPoints,
                  ease: Linear.easeNone,
                  roundProps: 'base'
                });
              } else {
                this.bonus = 'fail';
                Sound.effect('fail');
                this.animate('drop', {
                  element: this.$refs.star,
                  duration: 2 * this.duration
                });
              }
              _.forEach(this.$refs.target, element => {
                this.animate('disappear', { element });
              });
            } else {
              this.bonus = 'ready';
              if (this.$refs.goal) {
                this.$refs.goal.animate(this.bonus === 'goal' ? 'land' : 'appear');
              }
              _.forEach(this.$refs.progress, el => {
                TweenMax.to(el, this.duration, {
                  opacity: 0
                });
              });
            }
          } else if (this.bonusFail) {
            if (this.bonus === 'fail' && this.playKeys === this.targetKeys) {
              Sound.effect('done');
              this.bonus = 'done';
            } else {
              if (this.bonus === 'fail' && this.playKeys.length === this.targetKeys.length) {
                Sound.effect('wrong');
              }
              this.$refs.fail.animate('appear');
              this.bonus = 'fail';
            }
          }
          this.phrases = [];
          if (this.state < this.stages.length) {
            // End of finale
            this.state = this.stages.length;
            this.getComposer().set({ finale: true });
          }
        }
      },
      exitable(exitable) {
        if (exitable) {
          this.timeouts.push(setTimeout(() => {
            this.showHighScores();
          }, 1500));
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/weenie.styl"

  .finale-container
    posit(absolute);
    display: grid;
    grid-template: "stages meter high" auto "footer footer footer" auto / auto 50px auto;
    grid-gap: 10px 5px;
    margin: 10px;
    overflow: hidden;

  .stages
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;

  .lesson
    position: relative;
    color: white;
    display: block;
    font-size: calc(35px + 2vh);
    margin: 1vh 1vw;
    line-height: 0;
    text-align: center;

    @media (max-width: 650px)
      font-size: calc(19px + 6vw);

    &:hover .lesson__play
      opacity: 1;

    &:hover .fade
      opacity: .1;

    &:active .lesson__play
      transition: opacity 50ms;
      opacity: .1

    &:active .lesson__key.fade
      transition: opacity 50ms;
      opacity: 1;

    &__phrase
      display: inline-block;
      width: 35vw;
      max-height: calc(19vh - 20px);
      transition: transform 150ms;

      &__off
        transform: translateX(-100vw);
        opacity: 0;

    &__key
      posit(absolute);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 1.5s;

    &__play
      posit(absolute);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.5;
      transition: opacity 1.5s;

      & .play-button
        max-height: calc(1vh + 3vw);

  .fade
    transition: opacity 1.5s;
    opacity: 0.7;

  .label-enter-active, .label-leave-active
    transition: transform 500ms;

  .label-enter, .label-leave-to
    transform: scale(0);

  .play-enter-active
    transition: opacity 500ms;

  .play-leave-active
    transition: opacity 250ms;

  .play-enter, play-leave-to
    opacity: 0;

  .meter
    position: relative;
    grid-area: meter;
    place-self: center;

    &--hide
      opacity: 0;
      transform: scaleY(0.05);

    &__container
      height: 50vh;
      border: solid 5px primary-blue;
      width: 40px;
      text-align: center;
      transform-origin: top;

    &__level
      posit(absolute, x, 0, 0);
      background-color: primary-blue;

    &__star
      posit(absolute, calc(5vh - 18px), x, x, 10px);

    &__bar
      posit(absolute, calc(10vh - 3px), 0, x, 0);
      background-color: primary-blue;
      height: 5px;

  .high
    min-width: 40vw;
    grid-area: high;
    place-self: stretch start;
    overflow-y: scroll;
    display: flex;
    align-items: center;
    transform-origin: 20% center;
    transition-duration: 200ms;

    &--hide
      transform: scale(0);

    &__scores
      margin: auto 0;
      padding: 50px 0;

    &__score
      font-weight: 600;
      font-size: calc(25px + 4vmin);
      min-height: 25px;
      padding-right: 5vw;
      text-align: right;
      margin: 5px 0;

      &.new
        font-size: calc(30px + 5vmin);
        padding: 0 5vw;

      &-enter
        transform: translateX(25vw);
        opacity: 0;

      &-enter-active, &-move
        transition: all 500ms;

    &__value
      display: inline-block;
      position: relative;
      padding: 5px 20px;
      transition: all 500ms;

      &.flash
        animation: flash 1500ms 20;

    &__creep
      posit(absolute);
      background-color: gray;
      opacity: 0.4;
      transform: scale(1.1);
      transform-origin: center;

    &__tempo
      display: inline-block;
      color: black;
      font-size: 20px;
      opacity: .3;
      margin-left: 1vw;
      transform-origin: bottom left;
      transition: all 500ms;

      &.hide
        opacity: 0;
        transform: scale(0);

  .dim
    opacity: .3;
    text-decoration: line-through;

  .bonus
    grid-area: 1 / 2 / 2 / 4;
    place-self: stretch start;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &__controls
      position: relative;
      height: 20vh;
      display: flex;
      justify-content: center;
      align-items: flex-end;

    &__ball
      margin-bottom: -1vw;

    &__goal
      margin-bottom: 10px;

    &__target-container
      position: relative;
      color: primary-blue;
      font-size: 7vw;

    &__target
      background-color: primary-blue;
      display: inline-block;
      position: relative;
      width: 12vw;
      height: 6vw;
      font-size: 5vw;
      line-height: 6vw;
      margin: 1vw;
      text-align: center;
      transform: scale(0);
      vertical-align: top;

      &__progress
        posit(absolute);
        background-color: primary-green;
        opacity: 0.7;
        transform-origin: left;
        transform: scaleX(0);

      &__contents
        posit(absolute);
        color: white;

    &__footer
      height: 20vh;
      margin-top: 10px;

  .stages-footer
    grid-area: 2/1/3/2;
    margin: auto;

  .footer
    grid-area: footer;
    place-self: center;
    min-height: 10vh;

  .finish
    background-color: primary-green;
    border-radius: 5vmin;
    padding: 2vh 3vh 2vh 4vh;

    & .play-button
      max-height: 4vh;

  .finish-enter-active
    transition: all 500ms;

  .finish-enter
    transform: translateY(100px);
    opacity: 0;

  @keyframes flash
    0%, 100%
      opacity: 1;
      transform: scale(1);
    50%
      opacity: 0.8;
      transform: scale(1.1);
      shadow(#555, 5px);
</style>
