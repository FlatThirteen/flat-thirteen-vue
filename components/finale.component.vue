<template lang="pug">
  .finale-container
    .stages
      .lesson(v-for="(stage, i) in stages", :class="{button: ready}", @click="play(i)")
        phrase.lesson__phrase(ref="phrase", :class="{lesson__phrase__off: state + 4 < i}",
            v-bind="{phrase: stage.phrase, play: String(i), pulsesByBeat, phraseProperties}")
        bouncing-points(:show="state >= i", :points="stage.points", :class="{fade: ready}")
        transition(name="play")
          .lesson__play(v-show="ready"): play-button.play-button
    .meter
      .meter__container(:class="backing")
        .meter__level(:style="{height: (ready ? totalPoints : highScores[0].base) / 5 + '%'}")
        star.meter__star
        .meter__bar
    .high
      .high__ranking
        transition-group(name="high__score")
          .high__score(v-for="(score, i) in highScores", :key="score.newScore ? 'new' : i",
              ref="highScore", :style="{transitionDelay: (flash || score.newScore ? 0 : 100 * i) + 'ms'}",
              :class="[score.backing, {new: score.newScore, flash: score.newScore && flash, dim: score.tempo < tempo}]") {{ score.base }}
            .high__tempo(:class="{hide: score.newScore ? !score.tempo || !power.tempo : score.tempo === tempo}")
              metronome(:mini="true")
              | {{ score.tempo }}
    .footer
      key-handler
      transition(name="finish")
        .finish.weenie.button(v-if="state >= stages.length", @click="finish()")
          play-button.play-button(:disable="true")
      arrangement.arrangement(:phrases="phrases", :tempo="tempo", :count="!ready", :play="arrangement",
          @position="onPosition($event)")
</template>

<script>
  import { TweenMax, Linear } from 'gsap';
  import { mapActions, mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';
  import { MAX_POINTS } from '~/store/progress';

  import BeatTick from '~/common/core/beat-tick.model';

  import Arrangement from '~/components/arrangement.component';
  import KeyHandler from '~/components/key-handler.component';
  import Metronome from '~/components/metronome.component';
  import Phrase from '~/components/phrase.component';
  import BouncingPoints from '~/components/stage/bouncing-points.component';
  import PlayButton from '~/components/stage/play-button.component';
  import Star from '~/components/star.component';

  export default {
    mixins: [AnimatedMixin],
    components: {
      'arrangement': Arrangement,
      'key-handler': KeyHandler,
      'metronome': Metronome,
      'phrase': Phrase,
      'bouncing-points': BouncingPoints,
      'play-button': PlayButton,
      'star': Star
    },
    props: {
      stages: Array // [{ phrase, points }]
    },
    data() {
      return {
        phrases: [],
        show: [],
        state: -1 - this.stages.length,
        hi: true,
        highScores: [{ newScore: true, base: undefined }]
      };
    },
    mounted() {
      this.phrases = this.$refs.phrase;
      setTimeout(() => {
        this.highScores[0].base = 0;
        this.highScores[0].backing = this.backing;
        this.start('+0');
      }, 500);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },
    methods: {
      beatHandler() {
        if (this.state < -1) {
          this.state += 1;
        }
      },
      play(index) {
        if (this.ready) {
          this.phrases.push(this.$refs.phrase[index]);
          if (this.paused) {
            this.start('+0');
          }
        }
      },
      onPosition(position) {
        if (position >= 0 && this.state < position && !this.ready) {
          this.state = position;
          let total = _.sumBy(_.take(this.stages, position + 1), 'points');

          TweenMax.to(this.$data.highScores[0], 3.9 * this.duration, {
            base: total,
            ease: Linear.easeNone,
            roundProps: 'base'
          });
          let number = Math.floor(this.stages[position].points * .12 + 4);
          this.setFinale({ part: position, number,
            backing: this.backing,
            alternate: total === MAX_POINTS
          });
        }
      },
      finish() {
        this.$emit('finish', this.totalPoints);
      },
      ...mapActions({
        start: 'transport/start',
        setFinale: 'phrase/setFinale'
      })
    },
    computed: {
      ready() {
        return this.state >= this.stages.length;
      },
      flash() {
        return this.state > this.stages.length;
      },
      arrangement() {
        return this.ready ? undefined : 'finale';
      },
      totalPoints() {
        return _.sumBy(this.stages, 'points');
      },
      ...mapGetters({
        keyDown: 'keyDown',
        pulsesByBeat: 'player/pulsesByBeat',
        phraseProperties: 'player/phraseProperties',
        power: 'progress/power',
        backing: 'progress/backing',
        tempo: 'progress/tempo',
        lessonName: 'progress/lessonName',
        ranking: 'progress/ranking',
        rankingFiltered: 'progress/rankingFiltered',
        paused: 'transport/paused'
      }),
    },
    watch: {
      keyDown(key) {
        if (key === 'Enter') {
          this.finish();
        }
      },
      paused(paused) {
        if (paused) {
          this.phrases = [];
          if (this.state < this.stages.length) {
            this.state = this.stages.length;
          }
        }
      },
      ready(ready) {
        if (ready) {
          let [layout, pulseBeat] = _.split(this.lessonName, '-');
          this.highScores = this.ranking(layout, pulseBeat, this.totalPoints);
          setTimeout(() => {
            this.$refs.highScore[_.findIndex(this.highScores, 'newScore')].scrollIntoView({behavior: 'smooth'});
          }, 90 * this.highScores.length);
          setTimeout(() => {
            this.state++;
          }, 110 * this.highScores.length);
        }
      }
    }
  }
</script>

<style scoped lang="stylus", type="text/stylus">
  @import "~assets/stylus/weenie.styl"

  .finale-container
    posit(absolute);
    display: grid;
    grid-template: "stages meter high" auto "footer footer footer" auto / auto 50px auto;
    grid-gap: 10px 5px;
    margin: 10px;

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

    &:hover .lesson__play
      opacity: 1;

    &:active .lesson__play
      transition: opacity 50ms;
      opacity: 0.1

    &__phrase
      display: inline-block;
      width: 35vw;
      max-height: calc(19vh - 20px);
      transition: transform 150ms;

      &__off
        transform: translateX(-100vw);
        opacity: 0;

    &__play
      posit(absolute);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.3;
      transition: opacity 1.5s;

      & .play-button
        max-height: calc(1vh + 3vw);

    &:hover .fade
      opacity: 0.1;

  .fade
    transition: opacity 1.5s;
    opacity: 0.7;

  .play-enter-active
    transition: opacity 500ms;

  .play-enter
    opacity: 0;

  .meter
    position: relative;
    place-self: center;

    &__container
      height: 50vh;
      border: solid 5px primary-blue;
      width: 40px;
      text-align: center;

      &.bass
        border-color: bass-color;

        & .meter__level, & .meter__bar
          background-color: bass-color;

    &__level
      posit(absolute, x, 0, 0);
      background-color: primary-blue;


    &__star
      margin-top: calc(5vh - 17px);

    &__bar
      posit(absolute, calc(10vh - 3px), 0, x, 0);
      background-color: primary-blue;
      height: 5px;

  .high
    min-width: 40vw;
    place-self: stretch start;
    overflow-y: scroll;
    display: flex;
    align-items: center;

    &__ranking
      margin: auto 0;
      padding: 50px 0;

    &__score
      color: primary-blue;
      font-weight: 600;
      font-size: calc(25px + 4vh);
      line-height: 4vh;
      min-height: 25px;
      padding-right: 10px;
      text-align: right;

      &.new
        font-size: calc(30px + 5vh);
        padding: 10px;
        white-space: nowrap;

      &.flash
        animation: flash 1500ms 20;

      &.bass
        color: bass-color;

      &-enter
        transform: translateX(25vw);
        opacity: 0;

        &.dim
          transform: translateY(50vh);

      &-enter-active, &-move
        transition: all 500ms;

    &__tempo
      display: inline-block;
      color: black;
      font-size: 20px;
      opacity: .3;
      margin-left: 1vw;

      &.hide
        visibility: hidden;

  .dim
    opacity: .3;
    text-decoration: line-through;

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
</style>
