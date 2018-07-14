import { TimelineMax, TweenMax } from 'gsap';
import { mapGetters } from 'vuex';

const DEBUG = '';

function matches(target, condition) {
  if (_.isArray(condition)) {
    return _.includes(condition, target);
  } else {
    return target === condition;
  }
}

export default {
  data() {
    return {
      animated: null,
      animatedLast: ''
    }
  },
  methods: {
    animate(name, options = {}) {
      let element = this.$refs[this.animationTarget];
      if (element &&
          (options.when ? !this.animatedLast || matches(this.animatedLast, options.when) :
          (!options.unless || !matches(this.animatedLast, options.unless)) &&
          (!options.skip || !matches(this.animatedLast, options.skip) || !this.animated))) {
        if (matches(this.animationTarget, DEBUG)) {
          console.info('Animation', this.animationTarget, name, '{--');
          let onRepeat = options.onRepeat || _.noop;
          options.onRepeat = () => {
            console.info('Animation', this.animationTarget, name, ' --');
            onRepeat();
          };
        }
        let onComplete = options.onComplete || _.noop;
        options.onComplete = () => {
          onComplete();
          this.animated = null;
          if (matches(this.animationTarget, DEBUG)) {
            console.info('Animation', this.animationTarget, name, ' --}');
          }
        };
        if (this.animated) {
          this.animated.pause();
        }
        this.animatedLast = name;
        this.animated = _.reduce(this.animationDefinitions[name], (timeline, [time, style]) => {
          if (time) {
            return timeline.to(element, time, style);
          } else {
            return timeline.from(element, time, style);
          }
        }, new TimelineMax(options)).duration(options.duration || this.animationDuration).play(0);
        return this.animated;
      } else if (matches(this.animatedLast, options.skip)) {
        this.animatedLast = name;
        if (matches(this.animationTarget, DEBUG)) {
          console.info('Skipped', name, 'because last', this.animatedLast, 'in', options.skip);
        }
      } else if (matches(this.animationTarget, DEBUG)) {
        if (options.when) {
          console.info('Prevented', name, 'because last', this.animatedLast, 'in', options.when);
        } else if (options.unless) {
          console.info('Prevented', name, 'because last', this.animatedLast, 'in', options.unless);
        } else {
          console.info('Could not animate', name, 'without element', this.animationTarget, this.$refs);
        }
      }
    },
    set(properties) {
      let element = this.$refs[this.animationTarget];
      if (element) {
        TweenMax.set(element, properties);
      }
    }
  },
  computed: {
    animationDuration() {
      return this.duration / 2;
    },
    ...mapGetters({
      duration: 'transport/duration'
    })
  }
}
