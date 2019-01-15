<template lang="pug">
  .composer(v-if="show")
    .beat(v-for="(beat, index) in notes.split('|')")
      span(v-if="index") |
      span(@click="updateRhythm(index)") {{ beat }}
</template>

<script>
  import { mapGetters } from 'vuex'

  import Shaper from '~/common/composer/shaper';
  import Tone from '~/common/tone';

  export default {
    props: {
      name: {
        type: String,
        default: 'backing'
      },
      type: {
        type: String,
        default: 'sawtooth6'
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
        rootNote: 'C2',
        shape: [],
        rhythm: this.defaultRhythm,
        notes: '',
      };
    },
    mounted() {
      this.clear();
    },
    methods: {
      clear() {
        this.$store.commit('phrase/clear', { name: this.name });
      },
      reset(shape) {
        this.shape = shape || Shaper.shape([-7, -5, -2], 2, [-2, -1, 1, 2, 3], 1);
        this.rhythm = this.defaultRhythm;
        this.updateTrack();
      },
      updateRootNote(rootNote) {
        this.rootNote = rootNote;
        this.updateTrack();
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
        this.updateTrack();
      },
      updateTrack() {
        let pitches = _.map(this.shape, interval =>
          new Tone.Frequency(this.rootNote).transpose(interval).toNote());
        this.notes = _.reduceRight(pitches, (template, pitch, index) =>
            _.replace(template, new RegExp('%' + (index + 1), 'g'), pitch),
          this.rhythm);
        let tracks = [{ type: this.type, notes: this.notes }];
        this.$store.dispatch('phrase/setTracks', { name: this.name, tracks });
      }
    },
    computed: {
      ...mapGetters({
        numBeats: 'player/numBeats'
      })
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
