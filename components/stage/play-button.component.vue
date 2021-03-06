<template lang="pug">
  .anchor
    slot
    .play(ref="play", :class="{penalty: wrong, button: !disable}",
        @click="!disable && $emit('click')")
      svg(viewBox="0 0 60 60")
        defs(v-if="wrong !== undefined")
          linearGradient(id="playGradient" x1="0" y1="0" x2="0" y2="100%")
            stop(:offset="stopLevel + '%'", :stop-color="backgroundColor")
            stop(:offset="(stopLevel ? stopLevel + 15 : 0) + '%'", :stop-color="color")
        path.play-icon(:d="playPath",
            :fill="wrong === undefined ? color : 'url(#playGradient)'",
            :stroke="color", stroke-width="6px")
      .counter(v-if="counter") {{ counter }}
</template>

<script>
  import { TweenMax } from 'gsap';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import { primaryGreen, hexString, alpha } from '~/common/colors'

  export default {
    mixins: [AnimatedMixin],
    props: {
      wrong: Boolean,
      disable: Boolean
    },
    constants: {
      playPath: 'M5,5L50,30L5,55Z',
      animationTarget: 'play',
      animationDefinitions: {
        bounce: [[.1, {
          opacity: 1,
          transform: 'translateY(-1vh)',
          transformOrigin: 'center center'
        }], [.6, {
          transform: 'translateY(.6vh)'
        }], [.3, {
          transform: 'translateY(0)'
        }]],
        enter: [[0, {
          opacity: 0,
          transform: 'rotate(90deg) scale(0)',
          transformOrigin: 'center center'
        }], [.5, {
          opacity: 1,
          transform: 'rotate(45deg) scale(0.3)'
        }], [.3, {
          transform: 'rotate(-10deg) scale(1.2)'
        }], [.2, {
          transform: 'rotate(0) scale(1)'
        }]],
        twitch: [[0, {
          transform: 'scale(1)',
        }], [.2, {
          transform: 'scale(0.8, 1.1)',
          transformOrigin: 'center center'
        }], [.4, {
          transform: 'scale(1.2, 0.8)'
        }], [.4, {
          transform: 'scale(1)'
        }]],
        drop: [[0, {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
        }], [.2, {
          transform: 'translateY(-1vh) scale(1.1, .8)',
          transformOrigin: 'top left'
        }], [.3, {
          transform: 'translateY(-1vh) scale(1.2, .6)'
        }], [.4, {
          opacity: 0.5,
          transform: 'translateY(2vh) scale(.1, 1.5)'
        }], [.1, {
          opacity: 0,
          transform: 'translateY(2vh) scale(0, 1.5)'
        }]],
        toast: [[0, {
          opacity: 0,
          transform: 'translateY(2vh) scale(0, 1.5)'
        }], [.1, {
          opacity: 0.5,
          transform: 'translateY(2vh) scale(.1, 1.5)',
          transformOrigin: 'top left'
        }], [.5, {
          opacity: 1,
          transform: 'translateY(-1vh) scale(1.2, .6)'
        }], [.2, {
          transform: 'translateY(-1vh) scale(1.1, .8)'
        }], [.2, {
          transform: 'translateY(0) scale(1)'
        }]],
        leave: [[.1, {
          transform: 'rotate(0) scale(1.2)',
          transformOrigin: 'center center'
        }], [.4, {
          transform: 'rotate(-10deg) scale(1.2)'
        }], [.5, {
          transform: 'rotate(90deg) scale(0)'
        }]]
      }
    },
    data() {
      return {
        counter: 0,
        stopLevel: 0
      };
    },
    methods: {
      count(count) {
        this.counter = count;
        if (count && this.wrong !== undefined) {
          this.animate('bounce');
        }
      },
      toStopLevel(playNotes, goalNotes) {
        let highest = goalNotes > 4 ? 15 : 45 - goalNotes * 6;
        let notch = (75 - highest) / (goalNotes - 1);
        let stopLevel = playNotes === goalNotes ? 0 : !playNotes ? 100 :
            80 - notch * playNotes;
        TweenMax.to(this.$data, this.animationDuration, { stopLevel });
      }
    },
    computed: {
      color() {
        return this.disable ? 'rgba(128,128,128,0.4)' : hexString(primaryGreen);
      },
      backgroundColor() {
        return this.disable ? 'rgba(0,0,0,0)' : alpha(primaryGreen, 0.1);
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .anchor
    position: relative;
    height: 60px;
    width: 60px;

  .play
    position: relative;
    height: 100%;

    & svg
      height: 100%;

  .counter
    posit(absolute, 0, x, x);
    font-size: 40px;
    padding: 10px 5px;

</style>
