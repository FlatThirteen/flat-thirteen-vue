<template lang="pug">
  .lesson(ref="lesson", :class="{transition, touched, done, fail, button: playable, flip: tempoFlip}",
      @transitionend="unflip($event)", @touchstart="onTouchStart()", @touchend="onTouchEnd($event)",
      @mousedown="emit($event)", @mouseenter="$emit('mouseenter')", @mouseleave="$emit('mouseleave')",
      @click="emit($event)")
    .score(ref="score", v-show="done")
      .score-contents(:class="{flip: backingFlip}")
        star(v-for="(star, i) in stars", :backing="star", :key="i")
        div(v-if="amount", :class="amount.backing") {{ amount.base }}
    .pulse-beat(ref="pulse", :class="{blank: !playable}")
      .backing(:class="backing")
      .beat(v-for="pulses in pulsesByBeat")
        .pulse(v-for="pulse in pulses", :class="'pulse' + pulse", v-if="playable")
</template>

<script>
  import Star from '~/components/star.component';
  import { PASSING_LESSON } from "~/store/progress";

  export default {
    components: {
      'star': Star
    },
    props: {
      pulseBeat: String,
      backing: String,
      transition: Boolean,
      backingChange: Boolean,
      tempoChange: Boolean,
      points: Array, // [{ base, heavy, light, backing }]
    },
    data() {
      return {
        move: '',
        touched: false,
        backingFlip: false,
        tempoFlip: false,
        playable: false,
        amount: null,
        stars: []
      }
    },
    methods: {
      onTouchStart() {
        if (this.playable) {
          this.touched = !this.touched;
        }
      },
      onTouchEnd(event) {
        if (this.touched) {
          event.preventDefault();
          this.$emit('onTouch');
        }
      },
      touchOff() {
        this.touched = false;
      },
      unflip(event) {
        if (event.propertyName === 'transform' && _.includes(event.target.className, 'flip')) {
          this.updateScore();
          this.backingFlip = false;
          this.tempoFlip = false;
        }
      },
      emit(event) {
        this.touched = false;
        if (!event.button && this.playable) {
          let el = this.$refs.lesson;
          this.$emit(event.type, {
            x: el.offsetLeft + el.offsetWidth / 2,
            y: el.offsetTop + el.offsetHeight / 2
          });
        }
      },
      updateScore() {
        this.playable = !!this.points;
        this.stars = _.map(_.filter(_.take(this.points, 3), 'star'), 'backing');
        this.amount = !this.stars.length && this.points && this.points[0];
      }
    },
    computed: {
      pulsesByBeat() {
        return _.map(_.split(this.pulseBeat, ''), pulses => _.times(pulses, () => pulses));
      },
      done() {
        return !!(this.stars.length || this.amount);
      },
      fail() {
        return this.amount && this.amount.base < PASSING_LESSON;
      }
    },
    watch: {
      points: {
        immediate: true,
        handler(points, oldPoints) {
          if (this.backingChange) {
            if (points[0] && oldPoints[0] && points[0].backing !== oldPoints[0].backing) {
              this.backingFlip = true;
            }
          } else if (!this.tempoChange) {
            this.updateScore();
          }
        }
      },
      tempoChange(tempoChange) {
        if (tempoChange) {
          this.tempoFlip = true;
        }
      }
    }
  }
</script>


<style scoped lang="stylus" type="text/stylus">
  .lesson
    background-color: white;
    display: inline-block;
    margin: .5vh .5vw;
    font-size: 40px;
    line-height: 60px;
    overflow: hidden;
    position: relative;

    &.button
      color: primary-blue;

      &.touched
        transform: scale(1.2);
        background-color: back-blue;
        outline: solid 3px back-blue;
        box-shadow: 0 0 15px 5px white;
        z-index: 1;

      &:hover, &.touched
        .pulse-beat
          background-color: primary-blue;

          .backing
            transform: rotate(-20deg) translate(-5px, -10px);

        .pulse
          background-color: black;
          opacity: 0.5;

    &.done
      .pulse-beat
        background-color: primary-blue;
        transform: scaleY(0);
        transform-origin: bottom;

      &:hover:not(:active), &.touched
        .pulse-beat
          transform: scaleY(1);

        .score
          transform: scaleY(0);
          transform-origin: top;

      &.fail .score
        border: solid 5px primary-blue;

        .score-contents
          opacity: 0.7;
          shadow(black, 5px);

    &.flip
      transform: scaleY(0.04);

  .pulse-beat
    background-color: white;
    border: solid 5px primary-blue;

    .backing
      posit(absolute)
      transform: rotate(-20deg) translate(-180px, -15px);
      transition: transform 400ms ease-out;

      &.bass:after
        posit(absolute, 0, -40px);
        content: '';
        animation: bass 750ms linear infinite;
        background-color: bass-color;
        background: linear-gradient(-25deg, alpha(bass-color, 0.7) 13px, transparent 18px) repeat-x;
        background-size: 30px 20px;

  .blank
    background-color: white;
    border: dashed 5px primary-blue;
    height: 60px;
    opacity: 0.2;
    transform-origin: bottom;

  .transition
    .pulse, .pulse-beat, .score, .score-contents, /.lesson
      transition: all 250ms ease-in-out;

  .score
    posit(absolute);
    background-color: primary-blue;
    border: solid 5px primary-blue;

  .score-contents.flip
    transform: scaleX(0.04);

  .pulse-beat, .beat, .score-contents
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    height: 60px;

  .beat
    flex-wrap: wrap-reverse;
    align-content: center;
    width: 28px;

  .pulse-beat, .stars
    padding: 0 3px;

  .pulse
    background-color: primary-blue;
    border-radius: 50%;
    margin: 1px;

  .pulse1
    width: 24px;
    height: @width;

  .pulse2, .pulse3, .pulse4
    width: 12px;
    height: @width;

  .none
    color: white;

  .bass
    color: bass-color;

  @keyframes bass
    0%
      transform: translateX(0);

    100%
      transform: translateX(-30px);
</style>
