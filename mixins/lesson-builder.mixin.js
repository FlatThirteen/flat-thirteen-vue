import { mapGetters } from 'vuex';

import Monotonic from '~/common/composer/monotonic';
import Note from '~/common/core/note.model';

export default {
  methods: {
    setupLesson({pulseBeat, surfaces, stages, autoLevel, buildParams}) {
      this.$store.dispatch('player/update', { pulseBeat, surfaces });

      if (_.isNumber(stages)) {
        stages = _.times(stages, (i, params = buildParams(i)) => {
          let requiredBeatTicks = params && params.requiredBeatTicks || [];
          return Monotonic.build(_.map(this.soundNames, (soundName) => [new Note(soundName)]),
            _.difference(this.beatTicks, requiredBeatTicks), requiredBeatTicks,
            _.random(3, this.beatTicks.length) - requiredBeatTicks.length)
        });
      }

      this.$store.dispatch('lesson/initialize', { stages, autoLevel });
    }
  },
  computed: {
    ...mapGetters({
      beatTicks: 'player/beatTicks',
      soundNames: 'player/soundNames'
    })
  }
}
