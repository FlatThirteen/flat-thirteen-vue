<template lang="pug">
  .bouncing-ball(ref="ball")
</template>

<script>
  import { TweenMax, Circ } from 'gsap'

  import AnimatedMixin from '~/mixins/animated.mixin';

  const inactiveLeft = '50%';
  const inactiveBottom = '50vh';

  export default {
    mixins: [AnimatedMixin],
    constants: {
      animationTarget: 'ball',
      animationDefinitions: {
        bounce: [[.1, {
          bottom: 0,
          transform: 'translateY(0.2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0.2vh) scale(0.9, 1.2)'
        }], [.2, {
          transform: 'translateY(-7vh) scale(0.8, 1.1)'
        }], [.2, {
          transform: 'translateY(-10vh) scale(1, 0.9)'
        }], [.3, {
          transform: 'translateY(0.1vh) scale(0.8, 1.2)',
          ease: Circ.easeIn
        }]],
        enter: [[.2, {
          opacity: 1,
          bottom: inactiveBottom,
          transform: 'translateY(-5vh) scale(0.8, 1.2)'
        }], [.4, {
          bottom: 0,
          transform: 'translateY(0.1vh) scale(0.8, 1.2)',
        }], [.2, {
          transform: 'translateY(0.2vh) scale(1.2, 0.6)'
        }], [.2, {
          transform: 'translateY(0.2vh) scale(1, 1)'
        }]]
      },
    },
    data() {
      return {
        ballIn: false
      };
    },
    mounted() {
      TweenMax.set(this.$refs.ball, { bottom: inactiveBottom, opacity: 0 });
    },
    destroyed() {
      TweenMax.killTweensOf(this.$refs.ball);
    },
    methods: {
      to(left) {
        if (this.ballIn) {
          if (left) {
            TweenMax.to(this.$refs.ball, .7 * this.duration, {
              left,
              delay: .3 * this.duration
            });
            this.animate('bounce', { duration: this.duration });
          } else {
            this.ballIn = false;
            // Delay exit so that ball has a chance to bounce
            setTimeout(() => {
              TweenMax.killTweensOf(this.$refs.ball);
              TweenMax.fromTo(this.$refs.ball, .7 * this.duration, {
                transform: 'scale(.6, 1.2)'
              }, {
                bottom: inactiveBottom
              });
              TweenMax.to(this.$refs.ball, .5 * this.duration, {
                left: inactiveLeft,
                ease: Circ.easeInOut
              });
            }, 200 * this.duration);
          }
        } else if (left) {
          this.ballIn = true;
          TweenMax.fromTo(this.$refs.ball, this.duration, {
            left: inactiveLeft
          }, { left });
          this.animate('enter', { duration: 1.8 * this.duration });
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .bouncing-ball
    position: absolute;
    border-radius: 50%;
    height: 5vmin;
    width: @height;
    margin-left: -0.5 * @height;
    background-color: primary-blue;
    transform-origin: bottom;
</style>
