<template lang="pug">
  .composer
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'

  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  export default {
    constants: {
      fourBars: _.repeat('|', 16)
    },
    data() {
      return {
        pulseBeat: null,
        layout: 0,
        intensity: 0,
        stars: []
      };
    },
    methods: {
      set({pulseBeat, layout, intensity, stars, finale} = {}) {
        let start = Tone.rightNow();
        if (intensity && intensity > 1) {
          Sound.autoFilter.start();
        } else if (intensity && intensity < 2) {
          Sound.autoFilter.stop();
        }
        this.pulseBeat = _.isUndefined(pulseBeat) ? this.pulseBeat : pulseBeat;
        this.layout = _.isUndefined(layout) ? this.layout : layout;
        this.intensity = _.isUndefined(intensity) ? this.intensity : intensity;
        this.stars = _.isUndefined(stars) ? this.stars : stars;

        let tracks = [{
          type: 'drums',
          notes: this.drumNotes
        }, {
          type: 'cowbell',
          notes: this.fourBars + 'A5,,A5,A5| E5,A5,E5,E5| A5,,,E6|A6'
        }];
        if (this.intensity) {
          let metronomeTracks = [{
            type: 'cowbell',
            notes: this.metronomeNotes
          }];

         tracks.push({
            name: 'chords',
            notes: this.chordNotes,
            velocity: .3
          });
          if (this.bass) {
            metronomeTracks.push({
              name: 'bass',
              notes: this.bassMetronomeNotes
            });
            tracks.push({
              name: 'bass',
              notes: finale ? this.bassFinaleNotes : this.bassNotes
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
        let elapsedTime = _.floor(1000 * (Tone.rightNow() - start));
        //console.log('composer', pulseBeat, layout, intensity, this.level,
        //    finale ? 'finale ' : '', 'took', elapsedTime);
      },
      setFinale(stagePoints) {
        let tracks = [
          { type: 'drums', notes: this.fourBars +
              ['K,|K,K|, K|K', 'K,|K,S|, K|S', 'K,|K,K.S|, K|K.S'][this.layout]},
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
              ][this.level[1]],
            velocity: .2
          });
          if (this.bass) {
            tracks.push({
              name: 'bass',
              notes: _.join(_.map(['D2', 'E2', 'F2', 'G2'], (rootNote, part) => {
                let rhythm = '%1,%2|%3,%1|,%2|' + (part < 3 ? '%3,%1' : '%4,%5,%1,');
                return applyRhythm(rhythm, applyIntervals(rootNote, [0, -5, -2, 3, 4]));
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
      ...mapActions({
        phraseClear: 'phrase/clear',
        setTracks: 'phrase/setTracks'
      })
    },
    computed: {
      level() {
        return _.times(5, intensity => Math.min(2, _.filter(this.stars, level => level >= intensity).length));
      },
      bass() {
        return this.intensity > 2;
      },
      metronomeNotes() {
        return 'C5:' + [
          '7|5|4|5|7|5|4|7|7|5|4|5|7|5|5|4',
          '7|5|4|5|7|5|4|5|7|5|3|5|7|5|5|3',
          '7|5|4|5|7|5|3|7|7|3|5|3|7|5|5|3'
        ][this.level[0]];
      },
      bassMetronomeNotes() {
        return _.join(_.map(this.bassRootNotes, (rootNote, part) =>
            _.join(applyIntervals(rootNote, part ? [12, 10, 7, 3] : [0, -5, -2, -1]), '|')), '|');
      },
      drumNotes() {
        return this.fourBars + [
          'K,,,K|K,,,K|K,,K,K|K',
          'K,,S,K|K,,S,K|K,K,S,K|K',
          'K,,K.S,K|S.K,,K.S,K|S.K,S,K.S,K|K.S'
        ][this.layout];
      },
      chordNotes() {
        let progression = _.take(_.chunk(['I^3', 'IV', 'V', 'bVII', 'v','bIII', 'ii', 'bII',
            'bVI', 'iv', 'bVIIsus4', 'bVII'], this.level[1] + 1), 4);
        let changes = buildChanges(8, [null, [4], [3, 6]][this.level[1]]);
        let strum = ['%-------', '%---%---', '%--%--%-', '%-%%% %-', '%%-%%-%-', '%% %% %-'][
            this.level[1] + this.level[2] + (this.intensity > 1)];
        let rhythm = chunkRhythm(2, _.map(strum, (action, i) =>
            action + (action === '%' ? changes[i] : '')));
        return 'C5:' + _.join(_.map(progression, chords =>
            applyRhythm(rhythm, chords)), '|') + '|IV|V|VI|';
      },
      bassRootNotes() {
        return this.intensity > 3 ? ['C2', 'F1', 'G1', 'Bb1'] :_.times(4, () => 'C2');
      },
      bassNotes() {
        let octaves = [[0, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 1, 0, 1], [1, 0, 0, 1]];
        let variations = ['%-', '%%', '% ', '%+', '+%', ' %'];
        let variationIndex = this.level[3] ? 2 : 0;
        let notesByPulse = _.flatMap(this.bassRootNotes, (rootNote, part) => {
          let pattern = octaves[part % 4 + !!this.level[3]];
          return _.flatMap(this.pulseBeat, (pulses, beat) => {
            let notes = applyIntervals(rootNote, [0, 12]);
            let variation = variations[variationIndex];
            if (pulses === '1' && this.level[3] < 2) {
              variation = variations[this.level[3]];
            } else {
              variationIndex += !!this.level[3];
              if (this.level[3] === 2 && beat && variationIndex === 5) {
                variation = '-%';
              }
            }
            if (this.level[3] === 2 && pulses === '2') {
              variationIndex = _.random(5);
            } else if (variationIndex >= variations.length) {
              variationIndex = this.level[3] === 1 && this.pulseBeat != '2222' ? 2 : 1;
            }
            return _.map(variation, pulse => (pulse !== '%' && pulse !== '+' ? pulse :
                notes[pattern[beat] ^ pulse === '+']));
          });
        });
        return chunkRhythm(2, notesByPulse);
      },
      bassFinaleNotes() {
        let rootNotes = ['C2', 'F2', 'G2', 'Bb2'];
        let intervals = [0, -5, -2];
        let rhythm = ['%1|%2|%3|%1', '%1,%1|%2,%2|%3,%3|%1,%1',
          '%1,%2|%3,%1|%2,%3|%1,%2'][this.level[3]];
        return _.join(_.map(rootNotes, rootNote =>
            applyRhythm(rhythm, applyIntervals(rootNote, intervals))), '|') +
            '|F2,F1|G2,G1|A2,E2,G2,A2|A1,';
      },
      ...mapGetters({
        numBeats: 'player/numBeats'
      })
    }
  }

  function buildChanges(total, steps) {
    return _.times(total, i => 1 + _.sumBy(steps, step => i >= step));
  }

  function applyIntervals(rootNote, intervals) {
    return _.map(intervals, interval => Tone.pitch(rootNote, interval));
  }

  function applyRhythm(rhythm, values) {
    return _.reduceRight(values, (template, value, index) =>
      _.replace(template, new RegExp('%' + (index + 1), 'g'), value), rhythm);
  }

  function chunkRhythm(pulses, values) {
    return _.join(_.map(_.chunk(values, pulses), beat => _.join(beat, ',')), '|');
  }
</script>
