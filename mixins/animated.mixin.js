import { TimelineMax, TweenMax } from 'gsap';
import { mapGetters } from 'vuex';

const DEBUG = 'goal';

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
      animatedLast: '',
      animatedSkip: false
    }
  },
  methods: {
    animate(name, options = {}) {
      let element = options.element || this.$refs[this.animationTarget];
      if (!element) {
        this.animateDebug(name, 'failed without element', this.$refs);
      } else if (options.when && !matches(this.animatedLast, options.when)) { // animatedLast?
        this.animateDebug(name, 'prevented because last', this.animatedLast, 'not', options.when);
      } else if (options.unless && matches(this.animatedLast, options.unless)) {
        this.animateDebug(name, 'prevented because last', this.animatedLast, 'in', options.unless);
      } else if (options.skip && this.animatedSkip) {
        this.animatedLast = name;
        this.animateDebug(name, 'skipped because last', this.animatedLast);
      } else {
        this.animateDebug(name, '{-- ', options.element || 'was', this.animatedLast);
        let onRepeat = options.onRepeat || _.noop;
        options.onRepeat = () => {
          this.animateDebug(name, ' --');
          onRepeat();
        };
        let onComplete = options.onComplete || _.noop;
        options.onComplete = () => {
          onComplete();
          this.animatedSkip = false;
          this.animateDebug(name, ' --}', options.element);
          this.animated = null;
        };
        if (!options.element) {
          this.animatePause();
          this.animatedLast = name;
          this.animatedSkip = true;
        }
        this.$nextTick(() => {
          this.animated = _.reduce(this.animationDefinitions[name],
              (timeline, [time, style]) => timeline.to(element, time, style),
              new TimelineMax(options)).duration(options.duration || this.animationDuration).play(0);
        });
      }
    },
    animatePause() {
      if (this.animated) {
        this.animated.pause();
        this.animateDebug(name, ' ||');
      }
    },
    animateDebug(name, ...messages) {
      if (matches(this.animationTarget, DEBUG)) {
        console.info('Animation', this.animationTarget, name, ...messages);
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
