<template lang="pug">
  .lesson(ref="lesson", :style="{backgroundColor: intensity}",
      :class="{transition, touched, passing, frozen, button: playable, flip: verticalFlip}",
      @transitionend="unflip($event)", @touchend="onTouch($event)", @mousedown="emit($event)",
      @mouseenter="onMouse($event)", @mouseleave="onMouse($event)", @click="emit($event)")
    creep.creep(:style="creepStyle", v-bind="creep")
      template(slot-scope="{filterStyle}")
        rect(:height="60", :width="112", fill="rgba(100,100,100,.3)", :style="filterStyle")
    .stars(v-if="starColors.length")
      transition-group.star-container(name="star")
        star(v-for="(color, i) in starColors", :color="color", :key="i + color",
            :class="{star: color, hollow: !color, dim: display.points}")
    .points(ref="score", v-if="display.stars", :style="{color: intensityColor}",
        :class="{hide: !display.points, flip: horizontalFlip, transparent}",
        @transitionend="unflip($event)") {{ display.points }}
    .pulse-beat(ref="pulse", :class="{blank: !score, played: display.points, transparent}")
      .beat(v-for="pulses in pulsesByBeat")
        .pulse(v-for="pulse in pulses", :class="'pulse' + pulse", v-if="score")
</template>

<script>
  import { TweenMax } from 'gsap'

  import { fgIntensity } from '~/common/colors';

  import Star from '~/components/star.component';
  import Creep from '~/components/widget/creep.component';

  export default {
    components: {
      'star': Star,
      'creep': Creep
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
        display: {},
        creep: {
          height: 60,
          width: 112,
          margin: 10,
          turbulence: {
            type: 'turbulence',
            seed: 0,
            baseFrequency: 0.06,
            numOctaves: 4
          },
          displacement: {
            scale: 14
          }
        }
      }
    },
    methods: {
      onMouse(event) {
        this.hovered = event.type === 'mouseenter';
        this.$emit(event.type);
        this.updateCreep();
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
        this.updateCreep();
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
        this.playable = !!this.score && !this.score.frozen;
        let shouldDelay = !this.display.creep;
        this.display = this.score || {};
        this.updateCreep(shouldDelay);
      },
      updateCreep(shouldDelay = false) {
        let creep = this.display.creep || 0;
        let hovered = !this.frozen && (this.hovered || this.touched);
        let duration = hovered ? .25 : 1;
        let seedFactor = creep + hovered + (this.display.intensity || 0);
        TweenMax.to(this.creep.turbulence, duration * .5, {
          seed: _.toNumber(this.pulseBeat) + 10 * seedFactor,
          numOctaves: 4 -  hovered,
          roundProps:'seed,numOctaves',
          delay: shouldDelay * duration * .5
        });
        TweenMax.to(this.creep.displacement, duration, { scale: 14 + 3 * (creep - 2 * hovered)});
      }
    },
    computed: {
      pulsesByBeat() {
        return _.map(_.split(this.pulseBeat, ''), pulses => _.times(pulses, () => pulses));
      },
      intensityColor() {
        return fgIntensity(this.display.intensity);
      },
      transparent() {
        return this.display.stars && this.display.stars.length;
      },
      passing() {
        return this.display.passing;
      },
      frozen() {
        return this.display.frozen
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
      },
      creepStyle() {
        let hovered = !this.frozen && (this.hovered || this.touched);
        let scale = !this.display.creep ? 0 : 1.2 + (hovered ? .1 : .2) * this.display.creep;
        return {
          transform: 'scale(' + scale + ' )',
          opacity: !this.display.creep ? 0 : hovered ? .3 : 1
        }
      }
    },
    watch: {
      score: {
        deep: true,
        immediate: true,
        handler(score, oldScore) {
          if (this.intensityChange || this.tempoChange) {
            if (oldScore && (oldScore.intensity !== score.intensity ||
                oldScore.tempo !== score.tempo || oldScore.creep !== score.creep ||
                oldScore.frozen !== score.frozen)) {
              if (oldScore.points && oldScore.points !== score.points) {
                this.horizontalFlip = true;
              } else {
                setTimeout(this.updateScore, 250);
              }
            }
          } else {
            this.updateScore();
          }
        }
      },
      touched() {
        this.updateCreep();
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
    transition: all 250ms ease-in-out, filter 3s ease-out;
    vertical-align: top;

    &.frozen
      border: solid 5px primary-blue;
      filter: grayscale(100%);
      opacity: 0.5;

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

        .points
          transform: scaleY(0);

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

        &.passing .pulse-beat
          transform: scaleY(1);

    &.passing
      .pulse-beat
        background-color: alpha(primary-blue, .6);
        transform: scaleY(0);
        transform-origin: bottom;

      .points
        background-color: alpha(primary-blue, .6);
        opacity: 1;

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
    .pulse, .pulse-beat, .points, &.lesson:hover .creep
      transition: all 250ms ease-in-out;

    .creep
      transition: transform 1s cubic-bezier(0.5, -0.5, 0.5, 1.5), opacity 750ms ease-in-out;

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

  .creep
    z-index: 1;
    margin: -5px -10px;

  .transparent
    background-color: transparent !important;

  .dim
    opacity: .5;

  .pulse-beat, .beat, .stars, .creep
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
