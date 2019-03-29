<template lang="pug">
  .lesson(ref="lesson", :style="{backgroundColor: intensity}",
      :class="{transition, touched, passing, button: playable, flip: verticalFlip}",
      @transitionend="unflip($event)", @touchend="onTouch($event)", @mousedown="emit($event)",
      @mouseenter="onMouse($event)", @mouseleave="onMouse($event)", @click="emit($event)")
    .stars(v-if="starColors.length")
      transition-group.star-container(name="star")
        star(v-for="(color, i) in starColors", :color="color", :key="i + color",
            :class="{star: color, hollow: !color, dim: display.points}")
    .points(ref="score", v-if="display.stars", :style="{color: display.intensity}",
        :class="{hide: !display.points, flip: horizontalFlip, transparent}",
        @transitionend="unflip($event)") {{ display.points }}
    .pulse-beat(ref="pulse", :class="{blank: !playable, played: display.points, transparent}")
      .beat(v-for="pulses in pulsesByBeat")
        .pulse(v-for="pulse in pulses", :class="'pulse' + pulse", v-if="playable")
</template>

<script>
  import { fgIntensity } from '~/common/colors';

  import Star from '~/components/star.component';

  export default {
    components: {
      'star': Star
    },
    props: {
      pulseBeat: String,
      transition: Boolean,
      intensity: String,
      intensityChange: Boolean,
      tempoChange: Boolean,
      score: Object, // { intensity, stars, points, dim, heavy, light }]
      showHollowStars: Boolean
    },
    data() {
      return {
        move: '',
        hovered: false,
        touched: false,
        horizontalFlip: false,
        verticalFlip: false,
        playable: false,
        display: {}
      }
    },
    methods: {
      onMouse(event) {
        this.hovered = event.type === 'mouseenter';
        this.$emit(event.type);
      },
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
      transparent() {
        return this.display.stars && this.display.stars.length;
      },
      passing() {
        return this.display.passing;
      },
      starColors() {
        let stars = _.map(this.display.stars, star => fgIntensity(star));
        if (stars.length && this.showHollowStars && !this.display.points &&
            !this.hovered && !this.touched) {
          while(stars.length < 3) {
            stars.push(null);
          }
        }
        return stars;
      }
    },
    watch: {
      score: {
        deep: true,
        immediate: true,
        handler(score, oldScore) {
          if (this.intensityChange || this.tempoChange) {
            if (oldScore) {
              if (oldScore.points) {
                this.horizontalFlip = true;
              } else {
                setTimeout(this.updateScore, 250);
              }
            }
          } else {
            this.updateScore();
          }
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
    position: relative;
    transition: transform 250ms ease-in-out;

    &.button
      border: solid 5px primary-blue;

      &.touched
        transform: scale(1.2);
        outline: solid 3px primary-blue;
        box-shadow: 0 0 15px 5px white;
        z-index: 1;

      &:hover, &.touched
        .star-container
          transform: scale(1.5)

        .star
          animation: star 1.5s ease-in-out infinite;

        .dim
          opacity: 1;

        .pulse-beat, /.pulse-beat.played
          background-color: alpha(primary-blue, .4);

          .backing
            transform: rotate(-20deg) translate(-5px, -10px);

        .pulse
          background-color: black;
          opacity: 0.5;

    &.passing
      .pulse-beat
        background-color: alpha(primary-blue, .6);
        transform: scaleY(0);
        transform-origin: bottom;

      .points
        background-color: alpha(primary-blue, .6);
        opacity: 1;

      &:hover:not(:active), &.touched
        .pulse-beat
          transform: scaleY(1);

    &:hover:not(:active), &.touched
      .points
        transform: scaleY(0);

    &.flip
      transform: scaleY(0.04);

  .backing
    posit(absolute)
    transform: rotate(-20deg) translate(-180px, -15px);
    transition: transform 400ms ease-out;

    .lesson:hover &:after
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
    .pulse, .pulse-beat, .points
      transition: all 250ms ease-in-out;

    .star-enter-active, .star-leave-active
      transition: all 175ms ease-in-out;

    .star-enter-active
      transition-delay: 75ms;

  .stars
    posit(absolute);
    background-color: primary-blue;

  .star, .hollow
    margin: 0 2px;

    &:nth-child(2):last-child
      margin-left: 15px;

    &-container
      posit(absolute);
      transform-origin: center 200%;
      transition: transform 250ms ease-in-out;
      pointer-events: none;

    &-enter, &-leave-to
      margin: 0;
      width: 0;

  .points
    posit(absolute);
    transform-origin: top;

    &.flip
      transform: scaleX(0.04);

    &.hide
      transform: scaleX(0);

  .transparent
    background-color: transparent !important;

  .dim
    opacity: .5;

  .pulse-beat, .beat, .stars
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

  @keyframes star
    0%, 100%
      opacity: 1;
      transform: scale(1);
      shadow(white, 2px);

    50%
      opacity: .9;
      transform: scale(1.2);
      shadow(white, 5px);
</style>
