import AnimatedMixin from '~/mixins/animated.mixin';

import GameAnalytics from '~/common/game-analytics';
import Sound from '~/common/sound/sound';

export default {
  mixins: [AnimatedMixin],
  data() {
    return {
      show: 0,
      active: false
    }
  },
  methods: {
    appear(level) {
      if (!this.show) {
        this.show = level;
        // Wait for nextTick so that power-up button shows up
        this.$nextTick(() => {
          this.animate('appear', { duration: 3 });
          GameAnalytics.power('Show', this.animationTarget, level);
        });
        this.active = true;
      }
    },
    onClick() {
      Sound.playSequence('cowbell', ['A6', 'E7', 'A7'], '16t');
      this.active = false;
      this.animate('click', {
        duration: .5,
        onComplete: () => {
          this.show = 0;
          this.$emit('click')
        }
      });
    },
    onMouseEnter() {
      if (this.active && this.animated) {
        this.animated.pause();
      }
    },
    onMouseLeave() {
      if (this.active && this.animated) {
        this.animated.play();
      }
    }
  }
}
