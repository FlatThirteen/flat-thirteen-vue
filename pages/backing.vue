<template lang="pug">
  .container
    backing(:phrase="backingPhrase", :fixed="fixed", :allow-toggle="true")
    .left
      .controls
        play-icon(@click.native="onPlay()")
          .counter(v-if="transport.started") {{ transport.count }}
        .beats-input
          input(type="text", v-model="beatsPerMeasure", placeholder="# beats")
        .beats-input(:class="{dim: tempo !== transport.bpm(), invalid: !transport.isValidBpm(tempo)}")
          input(type="number", v-model.number="tempo", placeholder="tempo")


    .content(:class="{solo: anySolo}")
      .track(v-for="(track, i) in tracks", :class="{solo: track.solo, mute: track.mute}")
        input(type="checkbox", v-model="track.solo")
        input(type="checkbox", v-model="track.mute")
        input.type(type="text", v-model="track.type")
        input.notes(type="text", v-model="track.notes")
        .close.mini-button(@click="onRemove(i)") x
      .add.mini-button(@click="onAdd()") +

    .footer
      .line(v-for="beat of debugPhrase", @click="onBeat(beat)")
        .debug(:class="{selected: selectedBeat === beat, now: isNow(beat)}") {{ beat }}

    .right
      h3 More
      h3 Cowbell
      .mini-button(@click="onAdd($event, 'cowbell')") A5,,A5,A5 E5,A5,E5,E5 A5,,A5,E5
      .mini-button(@click="onAdd($event, 'cowbell')") C1,C2,C3,C4 C2,C3,C4,C5 C3,C4,C5,C6 C4,C5,C6,C7
      .mini-button(@click="onAdd($event, 'cowbell')") C1,C2,C3,C4 C5,C6,C7,C8 F#8,F#7,F#6,F#5 F#4,F#3,F#2,F#1
      h3 Synth
      .mini-button(@click="onAdd($event, 'synth')") C2,B1,Bb1,A1 G#1,G1,F#1,F1 E1,Eb1,D1,C#1 C1,E1,G1,B1
      .mini-button(@click="onAdd($event, 'synth')") C1.C2.C3.C4.C5.C6.C7.C8.C9 C4.E4.G4.Bb4 Db6.F6.Ab6.Cb7 D8.F#8.A8.C9

    transport(ref="transport", v-bind="transportProps")

</template>

<script>
  import { duration, ticks } from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';
  import Phrase from '~/common/phrase/phrase.model';
  import Sound from '~/common/sound/sound';

  import Backing from '~/components/backing.component';
  import PlayIcon from '~/components/play-icon.component';
  import Transport from '~/components/transport.component';

  export default {
    components: {
      'backing': Backing,
      'play-icon': PlayIcon,
      'transport': Transport
    },
    head: {
      title: 'Flat Thirteen | Backing'
    },
    layout: 'debug',
    data: function() {
      return {
        transport: { bpm: () => 120, isValidBpm: () => true },
        beatsPerMeasure: '4',
        tempo: 120,
        enableBacking: true,
        selectedBeat: null,
        anySolo: false,
        backingPhrase: {},
        debugPhrase: [],
        fixed: [],
        fixedBeat: '',
        tracks: [
          { type: 'synth', notes: 'C2,C2 G1,G1 Bb1,Bb1 B1,B1 C2,C3 G1,G2 Bb1,Bb2 B1,B2' },
          { type: 'synth', notes: 'G4.C5.Eb5, ,G4.C5.Eb5  G4.C5.F5 G4.C5.Eb5, ,G4.C5.Eb5  A4.C5.F5' },
          { type: 'drums', notes: 'K ,K S,K ,K K ,K S,K S,S,K,S' }
        ]
      }
    },
    mounted() {
      this.transport = this.$refs.transport;
    },
    methods: {
      onPlay() {
        if (this.transport.started) {
          this.transport.stop();
        } else {
          Sound.resume();
          this.transport.start('+0');
        }
      },
      onAdd($event, type) {
        if (type) {
          this.tracks.push({ type, notes: $event.target.innerText });
        } else {
          this.tracks.push({ type: 'synth', notes: ''});
        }
      },
      onRemove(index) {
        this.tracks.splice(index, 1);
      },
      onBeat(beatDebug) {
        Sound.resume();
        if (this.selectedBeat !== beatDebug) {
          this.selectedBeat = beatDebug;
          this.fixed = this._getFixed(beatDebug);
        } else {
          this.selectedBeat = null;
          this.fixed = [];
        }
      },
      isNow(beatDebug) {
        return _.startsWith(beatDebug, 'now!!!');
      },
      _getFixed(beatDebug) {
        return _.split(_.split(beatDebug, ': ')[1], ',')
      }
    },
    computed: {
      transportProps() {
        this.$nextTick(function () {
          // Needed because vue doesn't watch Tone.Transport.bpm
          this.$forceUpdate();
        });
        return {
          beatsPerMeasure: _.map(_.split(this.beatsPerMeasure, ','), Number),
          tempo: this.tempo,
          metronome: true,
          show: true
        }
      }
    },
    watch: {
      tracks: {
        deep: true,
        immediate: true,
        handler(tracks) {
          if (!process.browser) {
            // Can't parse frequencies on server without Tone
            return;
          }
          let phrase = new Phrase();
          let solo = false;
          _.forEach(tracks, (track) => {
            if (!solo && track.solo) {
              phrase = new Phrase();
              solo = true;
            }
            if (parser[track.type] && track.notes && !track.mute && (!solo || track.solo)) {
              _.forEach(track.notes.split(' '), (beatNote, beatIndex) => {
                _.forEach(beatNote.split(','), (pulseNote, pulseIndex, array) => {
                  if (pulseIndex > 3) {
                    return;
                  }
                  let pulses = Math.min(array.length, 4);
                  _.forEach(pulseNote.split('.'), (chordNote) => {
                    try {
                      let note = parser[track.type](chordNote, duration(pulses));
                      if (note) {
                        phrase.add(note, beatIndex, ticks(pulseIndex, pulses));
                      }
                    } catch (error) {
                      console.log('Parse error:', error);
                    }
                  });
                });
              });
            }
          });
          this.backingPhrase = phrase;
          this.debugPhrase = phrase.toArray();
          this.anySolo = solo;
          if (this.selectedBeat) {
            let selectedBeatTick = _.split(this.selectedBeat, ': ')[0];
            this.selectedBeat = _.find(this.debugPhrase, (debugPhrase) => {
              return _.startsWith(debugPhrase, selectedBeatTick);
            });
            this.fixed = this.selectedBeat ? this._getFixed(this.selectedBeat) : [];
          }
        }
      }
    }
  }

  const parser = {
    synth: (data, duration) => {
      let frequency = Note.pitch(data);
      if (frequency) {
        return new Note('synth', {
          pitch: frequency.toNote(),
          duration: duration
        });
      }
    },
    drums: (data) => {
      let sound = data.match(/[kK]/) ? 'kick' :
        data.match(/[sS]/) ? 'snare' : null;
      if (sound) {
        return new Note(sound);
      }
    },
    cowbell: (data) => {
      let frequency = Note.pitch(data);
      if (frequency) {
        return new Note('cowbell', { pitch: frequency.toNote() });
      }
    }
  };
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/button.styl"
  /*@import "~assets/stylus/note.styl"*/

  .container
    position: relative;

  .content, .footer
    margin: 3vw content-side-margin;
    position: relative;

  .left
    position: absolute;
    left: 0;
    width: content-side-margin;
    text-align: center;

    .controls
      padding: 10px;

    .play
      position: relative;

      .counter
        position: absolute;
        top: 0;
        font-size: 40px;
        padding: 10px 5px;

    .beats-input
      margin: 10px 0;

      &.dim
        opacity: 0.5;

      &.invalid input
        color: primary-red;

      input
        background: transparent;
        border: none;
        font-size: 30px;
        margin: 0;
        text-align: center;
        width: 100%;

        &:focus
          outline: none;

  .right
    position: absolute;
    right: 0;
    top: 0;
    width: content-side-margin;

    .mini-button
      margin: 5px;

  .track
    padding: 5px 0;

    &.mute
      opacity: 0.5;

    input
      border: solid 1px lightgray;
      background: transparent;
      margin: 0 2px;

      &:focus
        background-color: white;
        border: solid 1px back-grey;
        outline: none;

    input.type
      width: 6vw;

    input.notes
      width: 40vw;

    .close
      margin-left: 5px;

  .mini-button
    background-color: transparent;
    border: solid 1px lightgray;
    border-radius: 3px;
    color: lightgray;
    cursor: pointer;
    display: inline-block;
    font-weight: bold;
    height: inherit;
    padding: 2px 10px;

    &:hover
      background-color: white;
      border-color: dark-grey;
      color: dark-grey;

  .add
    padding: 5px 20px;

  .content.solo .track:not(.solo)
    opacity: 0.6;

  .line
    color: gray;

    .debug
      display: inline-block;

      &.selected
        background-color: faint-grey;

      &.now
        color: black;

</style>
