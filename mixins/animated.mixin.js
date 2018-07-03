import { TimelineMax } from 'gsap';
import { mapGetters } from 'vuex';

export default {
  methods: {
    animate(id, data, options) {
      let element = this.$refs[id];
      if (element) {
        return _.reduce(data, (timeline, [time, style]) => {
          if (time) {
            return timeline.to(element, time, style);
          } else {
            return timeline.from(element, time, style);
          }
        }, new TimelineMax(options)).duration(this.animationDuration).play(0);
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
