import { TimelineMax, TweenMax } from 'gsap';
import { mapGetters } from 'vuex';

export default {
  methods: {
    animate(name, options) {
      let element = this.$refs[this.animationTarget];
      if (element) {
        return _.reduce(this.animationDefinitions[name], (timeline, [time, style]) => {
          if (time) {
            return timeline.to(element, time, style);
          } else {
            return timeline.from(element, time, style);
          }
        }, new TimelineMax(options)).duration(this.animationDuration).play(0);
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
