<template lang="pug">
  .composer(v-if="show")
    .beat(v-for="(beat, index) in notes.split('|')")
      span(v-if="index") |
      span(@click="updateRhythm(index)") {{ beat }}
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'

  import Parser from '~/common/composer/parser';
  import Shaper from '~/common/composer/shaper';
  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  export default {
    constants: {
      fourBars: _.repeat('|', 16)
    },
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
        layout: 0,
        intensity: 0,
        stars: [],
        rootNote: 'C2',
        shape: [],
        rhythm: this.defaultRhythm,
        notes: '',
      };
    },
    mounted() {
      // this.clear();
    },
    methods: {
      clear() {
        this.phraseClear(this.name);
      },
      setStage({layout, intensity, stars, finale} = {}) {
        if (intensity && intensity > 1) {
          Sound.autoFilter.start();
        } else if (intensity && intensity < 2) {
          Sound.autoFilter.stop();
        }
        this.layout = _.isUndefined(layout) ? this.layout : layout;
        this.intensity = _.isUndefined(intensity) ? this.intensity : intensity;
        this.stars = _.isUndefined(stars) ? this.stars : stars;
        let tracks = [{
          type: 'drums',
          notes: this.fourBars + [
            'K,,,K|K,,,K|K,,K,K|K',
            'K,,S,K|K,,S,K|K,K,S,K|K',
            'K,,K.S,K|S.K,,K.S,K|S.K,S,K.S,K|K.S'
          ][this.layout]
        }, {
          type: 'cowbell',
          notes: this.fourBars + 'A5,,A5,A5| E5,A5,E5,E5| A5,,,E6|A6'
        }];
        if (this.intensity) {
          let metronomeTracks = [{
            type: 'cowbell',
            notes: 'C5:' + [
              '7|5|4|5|7|5|4|7|7|5|4|5|7|5|5|4',
              '7|5|4|5|7|5|4|5|7|5|3|5|7|5|5|3',
              '7|5|4|5|7|5|3|7|7|3|5|3|7|5|5|3'
            ][this.progressionLevel]
          }];
          tracks.push({
            name: 'chords',
            notes: [
              'C5:I^3|-|-|-|IV|-|-|-|V|-|-|-|bVII|-|-|-',
              'C5:I^3|-|IV|-|V|-|bVII|-|v|-|bIII|-|ii|-|bII|-',
              'C5:I^3|-,IV|-|V|bVII|-,v|-|bIII|ii|-,bII|-|bVI|iv|-,bVIIsus4|-|bVII'
            ][this.progressionLevel] + '|IV|V|VI|',
            velocity: .2
          });
          if (this.bass) {
            let rootNotes = finale ? ['C2', 'F2', 'G2', 'Bb2'] :
                this.intensity > 3 ? ['C2', 'F1', 'G1', 'Bb1'] :_.times(4, () => 'C2');
            metronomeTracks.push({
              name: 'bass',
              notes: _.join(_.map(rootNotes, (rootNote, part) =>
                  _.join(Parser.applyIntervals(rootNote, part ? [12, 10, 7, 3] : [0, -5, -2, -1]), '|')), '|')
            });
            let intervals = finale ? [0, -5, -2] : [0, 12];
            let notes = _.join(_.map(rootNotes, (rootNote, part) => {
              let rhythm = finale ? '%1|%2|%3|%1' :
                  ['%1|%1|%1|%1', '%1|%1|%2|%1', '%1|%2|%1|%1', '%1|%2|%1|%2'][part];
              return Parser.applyRhythm(rhythm, Parser.applyIntervals(rootNote, intervals));
            }), '|');
            tracks.push({
              name: 'bass',
              notes: notes + '|F2,F1|G2,G1|A2,E2,G2,A2|A1,'
            });
          }
          this.setTracks({
            name: 'metronome',
            tracks: metronomeTracks,
            numBeats: 16
          });
        } else {
          this.phraseClear('metronome');
          this.phraseClear('progression');
        }
        this.setTracks({
          name: 'progression',
          tracks: tracks,
          numBeats: 20
        });
      },
      setFinale(stagePoints) {
        let tracks = [
          { type: 'drums', notes: this.fourBars + ['K,|K,K|, K|K', 'K,|K,S|, K|S', 'K,|K,K.S|, K|K.S'][this.layout]},
          { type: 'cowbell', notes: this.fourBars + 'A6,A7|A7,A6|A7,A7|A6,' }
        ];
        if (this.intensity) {
          this.setTracks({
            name: 'metronome',
            tracks: [{
              type: 'cowbell',
              notes: 'C5:7|6|4|7',
            }]
          });
          tracks.push({
            name: 'chords',
            notes: [
              'C5:II^3|-|-|-|III^3|-|-|-|IV^3|-|-|-|V^3|-|-|-|VI^3|-,V|-,bVI|VI',
              'C5:II^3|-|I^5|-|III|-|II^5|-|IV|-|bIII^5|-|V|-|IV^5|-|VI|-,V|-,bVI|VI',
              'C5:II^3|-,vii|-|I|III|-,bii|-|II|IV|-,ii|-|bIII|V|-,biv|-|IV|VI|-,V|-,bVI|VI',
              ][this.progressionLevel],
            velocity: .2
          });
          if (this.bass) {
            tracks.push({
              name: 'bass',
              notes: this.intensity < 3 ? null :_.join(_.map(['D2', 'E2', 'F2', 'G2'], (rootNote, part) => {
                let rhythm = '%1,%2|%3,%1|,%2|' + (part < 3 ? '%3,%1' : '%4,%5,%1,');
                return Parser.applyRhythm(rhythm, Parser.applyIntervals(rootNote, [0, -5, -2, 3, 4]));
              }), '|') + '|A2,G2|E2,G2|,G2|A2,'
            });
          }
        }
        this.setTracks({
          name: 'progression',
          tracks: tracks,
          numBeats: 20
        });
        let bonus = _.every(stagePoints, points => points === 100);
        _.map(['D6', 'E6', 'F6', 'G6'], (rootNote, part) => {
          let number = Math.floor(stagePoints[part] * .12 + 4);
          let order = _.take([0, 6, 8, 12, 10, 4, 2, 14, 11, 5, 13, 9, 3, 7, 1, 15], number);
          let sequence = [0, -5, 2, -5, 4, 0, 2, -5, 4, -5, 0, 2, 4, 0, 7, part < 3 || !bonus ? 0 : 9];
          _.forEach(order, index => {
            this.$store.commit('phrase/add', {
              name: 'progression',
              beatTick: BeatTick.from(this.numBeats * part + (index >> 2), index % 4, 4),
              note: new Note('cowbell', {
                pitch: Tone.pitch(rootNote, sequence[index])
              })
            });
          });
        });

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
        let pitches = _.map(this.shape, interval => Tone.pitch(this.rootNote, interval));
        this.notes = _.reduceRight(pitches, (template, pitch, index) =>
            _.replace(template, new RegExp('%' + (index + 1), 'g'), pitch),
            this.rhythm);
        let tracks = [{ type: this.type, notes: this.notes }];
        this.setTracks({ name: this.name, tracks });
      },
      ...mapActions({
        phraseClear: 'phrase/clear',
        setTracks: 'phrase/setTracks'
      })
    },
    computed: {
      progressionLevel() {
        return Math.min(2, _.filter(this.stars).length);
      },
      bass() {
        return this.intensity > 2;
      },
      ...mapGetters({
        numBeats: 'player/numBeats'
      })
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .composer, .stars
    display: inline-block;

  toggle-color('.stars', primary-blue);

  .beat
    display: inline;
    color: lightgray;
</style>
