<template lang="pug">
  .lesson(:class="{done, button: playable}", @mousedown="emit($event)", @click="emit($event)")
    .pulse-beat
      .beat(v-for="pulses in pulsesByBeat")
        .pulse(v-for="pulse in pulses", :class="'pulse' + pulse", v-if="playable")
    .points(v-show="basePoints && !maxPoints", :class="backing[0]") {{ basePoints }}
    .stars(v-show="maxPoints")
      star(v-for="(star, i) in stars", :backing="backing[i]", :key="i")
</template>

<script>

  import Star from '~/components/star.component';

  export default {
    components: {
      'star': Star
    },
    props: {
      pulseBeat: String,
      playable: Boolean,
      points: Array, // [{ base, heavy, light, backing }]
    },
    methods: {
      emit(event) {
        if (!event.button && this.playable) {
          this.$emit(event.type);
        }
      }
    },
    computed: {
      pulsesByBeat() {
        return _.map(_.split(this.pulseBeat, ''), pulses => _.times(pulses, () => pulses));
      },
      done() {
        return this.points && this.points.length;
      },
      basePoints() {
        return this.points && this.points[0] && this.points[0].base;
      },
      maxPoints() {
        return this.basePoints === 400;
      },
      stars() {
        return _.take(this.points, 3);
      },
      backing() {
        return _.map(this.points, 'backing');
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .lesson
    display: inline-block;
    background-color: white;
    border: dashed 5px primary-blue;
    margin: 0 10px;
    font-size: 40px;
    line-height: 60px;
    position: relative;
    opacity: 0.2;

    &.button
      border: solid 5px primary-blue;
      color: primary-blue;
      opacity: 1;

      &:hover
        .pulse-beat
          background-color: primary-blue;

        .pulse
          background-color: black;
          opacity: 0.3;

    &.done
      background-color: primary-blue;
      color: white;

      .pulse-beat
        transform: scaleY(0);
        transform-origin: top;

      &:hover:not(:active)
        .pulse-beat
          transform: scaleY(1);

        .points, .stars
          border-top: solid 1px white;
          transform: scaleY(0);

  .pulse-beat, .pulse, .points, .stars
    transition: all 250ms;

  .points, .stars
    posit(absolute);
    transform-origin: bottom;

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

  .bass
    color: primary-green;
</style>
