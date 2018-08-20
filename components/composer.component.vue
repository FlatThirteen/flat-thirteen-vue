<template lang="pug">
  .composer(v-if="show")
    .beat(v-for="(beat, index) in notes.split('|')")
      span(v-if="index") |
      span(v-else) =
      span(@click="updateRhythm(index)") {{ beat }}
</template>

<script>
  import { mapGetters } from 'vuex'

  import Shaper from '~/common/composer/shaper';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  export default {
    props: {
      name: {
        type: String,
        default: 'backing'
      },
      type: {
        type: String,
        default: 'synth'
      },
      rootNote: {
        type: String,
        default: 'C2'
      },
      defaultRhythm: {
        type: String,
        default: '%1|%2|%3|%4'
      },
      show: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        pitches: [],
        shape: [],
        rhythm: this.defaultRhythm
      };
    },
    mounted() {
      this.clear();
    },
    methods: {
      toggle() {
        if (this.hasBacking) {
          this.playIfPaused(['E7', 'A6']);
          this.clear();
        } else {
          this.playIfPaused(['E7', 'A7']);
          this.reset();
        }
      },
      clear() {
        this.$store.commit('phrase/clear', { name: this.name });
      },
      reset(shape) {
        this.shape = shape || Shaper.shape([-7, -5, -2], 2, [-2, -1, 1, 2, 3], 1);
        this.rhythm = this.defaultRhythm;
      },
      playIfPaused(notes) {
        if (this.paused) {
          Sound.playSequence('cowbell', notes, '16n');
        }
      },
      updateRhythm(beat = _.random(0, this.numBeats - 1)) {
        let rhythm = _.split(this.rhythm, '|');
        if (!_.includes(rhythm[beat], ',')) {
          rhythm[beat] = rhythm[beat] + ',' + rhythm[beat];
        } else {
          let pulses = _.split(rhythm[beat], ',');
          if (pulses[0] && pulses[1]) {
            rhythm[beat] = pulses[0] + ',';
          } else if (pulses[0]) {
            rhythm[beat] = ',' + pulses[0];
          } else {
            rhythm[beat] = pulses[1];
          }
        }
        this.rhythm = rhythm.join('|');
      }
    },
    computed: {
      notes() {
        return _.reduceRight(this.pitches, (template, pitch, index) =>
            _.replace(template, new RegExp('%' + (index + 1), 'g'), pitch),
            this.rhythm);
      },
      tracks() {
        return [{ type: this.type, notes: this.notes }];
      },
      ...mapGetters({
        paused: 'transport/paused',
        hasBacking: 'phrase/hasBacking',
        numBeats: 'transport/numBeats'
      })
    },
    watch: {
      shape: {
        deep: true,
        handler(shape) {
          this.pitches = _.map(shape, interval =>
              new Tone.Frequency(this.rootNote).transpose(interval).toNote());
        }
      },
      tracks: {
        deep: true,
        handler(tracks) {
          this.$store.dispatch('phrase/setTracks', { name: this.name, tracks });
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">

  .composer
    display: inline-block;

  .beat
    display: inline;
    color: lightgray;

</style>
