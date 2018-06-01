<template lang="pug">
  .container
    .left
      transport-controls(:metronome="true", :beatsPerMeasure="'4'")

    .content
      bouncing-ball.ball-container(:showBall="showBall", :showCounter="showCounter")
      .grid
        transport-position.transport-container(:show="showPosition")

    .right
      .toggle.ball(:class="{active: showBall}",
          @click="showBall = !showBall") Bounce
      .toggle.counter(:class="{active: showCounter}",
          @click="showCounter = !showCounter") Counter
      .toggle.position(:class="{active: showPosition}",
          @click="showPosition = !showPosition") Position
</template>

<script>
  import BouncingBall from '~/components/bouncing-ball.component';
  import TransportControls from '~/components/transport-controls.component';
  import TransportPosition from '~/components/transport-position.component';

  export default {
    components: {
      'bouncing-ball': BouncingBall,
      'transport-controls': TransportControls,
      'transport-position': TransportPosition
    },
    head: {
      title: 'Flat Thirteen | Grid'
    },
    layout: 'debug',
    data: function() {
      return {
        showBall: true,
        showCounter: true,
        showPosition: true
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: relative;

  .left
    position: absolute;
    left: 0;
    width: content-side-margin;
    text-align: center;

  .content, .footer
    margin: 10vh content-side-margin;
    position: relative;

  .content
    height: 80vh;

    .ball-container
      height: 10vh;

    .grid
      background-color: back-blue;
      height: 40vh;
      position: relative;

    .transport-container
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;

  .right
    position: absolute;
    right: 0;
    top: 0;
    padding-top: 10vh;
    width: content-side-margin;

    .toggle
      background-color: white;
      border: solid 1px;
      padding: 5px;
      margin: 5px;

      &.active
        color: white;

    ball-color = primary-blue;
    .ball
      color: ball-color;
      border-color: ball-color;

      &.active
        background-color: ball-color;

    counter-color = black;
    .counter
      color: counter-color;
      border-color: counter-color;

      &.active
        background-color: counter-color;

    position-color = primary-green;
    .position
      color: position-color;
      border-color: position-color;

      &.active
        background-color: position-color;
</style>
