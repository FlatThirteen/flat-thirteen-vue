<template lang="pug">
  .lesson(ref="lesson", :style="{backgroundColor: intensity}",
      :class="{transition, touched, done, fail, button: playable, flip: verticalFlip}",
      @transitionend="unflip($event)", @touchend="onTouch($event)", @mousedown="emit($event)",
      @mouseenter="$emit('mouseenter')", @mouseleave="$emit('mouseleave')", @click="emit($event)")
    .score(ref="score", v-show="done")
      .score-contents(:class="{flip: horizontalFlip}")
        star(v-for="(star, i) in display.stars", :color="star", :key="i", :class="{dim: display.points}")
        .points(v-if="display.points", :style="{color: display.intensity}") {{ display.points }}
    .pulse-beat(ref="pulse", :class="{blank: !playable}")
      .backing(v-if="backing")
      .beat(v-for="pulses in pulsesByBeat")
        .pulse(v-for="pulse in pulses", :class="'pulse' + pulse", v-if="playable")
</template>

<script>
  import Star from '~/components/star.component';

  export default {
    components: {
      'star': Star
    },
    props: {
      pulseBeat: String,
      backing: Boolean,
      transition: Boolean,
      intensity: String,
      intensityChange: Boolean,
      tempoChange: Boolean,
      score: Object, // { intensity, stars, points, dim, heavy, light }]
    },
    data() {
      return {
        move: '',
        touched: false,
        horizontalFlip: false,
        verticalFlip: false,
        playable: false,
        display: {}
      }
    },
    methods: {
      onTouch(event) {
        if (this.playable) {
          this.touched = !this.touched;
        }
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
          this.horizontalFlip = false;
          this.verticalFlip = false;
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
        this.playable = !!this.score;
        this.display = this.score || {};
      }
    },
    computed: {
      pulsesByBeat() {
        return _.map(_.split(this.pulseBeat, ''), pulses => _.times(pulses, () => pulses));
      },
      done() {
        return !!(this.display.stars || this.display.points);
      },
      fail() {
        return this.done && !this.display.passing;
      }
    },
    watch: {
      score: {
        deep: true,
        immediate: true,
        handler(score, oldScore) {
          if (this.intensityChange) {
            if (oldScore && score.intensity !== oldScore.intensity) {
              this.horizontalFlip = true;
            }
          } else if (!this.tempoChange) {
            this.updateScore();
          }
        }
      },
      tempoChange(tempoChange) {
        if (tempoChange) {
          this.verticalFlip = true;
        }
      }
    }
  }
</script>


<style scoped lang="stylus" type="text/stylus">
  .lesson
    display: inline-block;
    margin: .5vh .5vw;
    font-size: 40px;
    line-height: 60px;
    overflow: hidden;
    position: relative;
    transition: transform 250ms ease-in-out;

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
    border: solid 5px primary-blue;

    .backing
      posit(absolute)
      transform: rotate(-20deg) translate(-180px, -15px);
      transition: transform 400ms ease-out;

      &:after
        posit(absolute, 0, -40px);
        content: '';
        animation: bass 750ms linear infinite;
        background-color: bass-color;
        background: linear-gradient(-25deg, alpha(bass-color, 0.7) 13px, transparent 18px) repeat-x;
        background-size: 30px 20px;

  .blank
    border: dashed 5px primary-blue;
    height: 60px;
    opacity: 0.2;
    transform-origin: bottom;

  .transition
    .pulse, .pulse-beat, .score, .score-contents
      transition: all 250ms ease-in-out;

  .score
    posit(absolute);
    background-color: primary-blue;
    border: solid 5px primary-blue;

  .score-contents.flip
    transform: scaleX(0.04);

  .points
    posit(absolute);

  .dim
    opacity: .4;

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

  @keyframes bass
    0%
      transform: translateX(0);

    100%
      transform: translateX(-30px);
</style>
