import { TimelineMax, TweenMax } from 'gsap';
import { mapGetters } from 'vuex';

const DEBUG = '';

export default {
  data() {
    return {
      animatedLast: ''
    }
  },
  methods: {
    animate(name, options = {}) {
      let element = this.$refs[this.animationTarget];
      if (element && (options.when ? options.when === this.animatedLast :
          (!options.unless || options.unless !== this.animatedLast))) {
        if (this.animationTarget === DEBUG) {
          console.info('Animation', name, '{--');
          options.onComplete = options.onComplete || (() => {
            console.info('Animation', name, ' --}');
          });
        }
        this.animatedLast = name;
        return _.reduce(this.animationDefinitions[name], (timeline, [time, style]) => {
          if (time) {
            return timeline.to(element, time, style);
          } else {
            return timeline.from(element, time, style);
          }
        }, new TimelineMax(options)).duration(this.animationDuration).play(0);
      } else if (this.animationTarget === DEBUG) {
        if (options.unless) {
          console.info('Prevented', name, 'because', options.unless);
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
