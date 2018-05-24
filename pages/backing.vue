<template lang="pug">
  .container
    backing(:phrase="backingPhrase", :fixed="fixed", :show="showFx")
    .left
      .controls
        play-icon(@click.native="onPlay()")
          .counter(v-if="transport.started") {{ transport.count }}
        .beats-input
          input.beats(type="text", v-model="beatsPerMeasure", placeholder="# beats")
        .beats-input(:class="{dim: tempo !== transport.bpm(), invalid: !transport.isValidBpm(tempo)}")
          input(type="number", v-model.number="tempo", placeholder="tempo")
      .performance(:class="{invalid: !transport.isValidLatencyHint(latencyHint)," +
          "dim: transport.isValidLatencyHint(latencyHint) && latencyHint !== transport.latencyHint}")
        input(type="text", v-model="latencyHint", placeholder="latency hint",
            @focus="showSuggestions = true", @blur="hideSuggestions()")

        .suggestions(v-if="showSuggestions")
          .suggestion(@click="onLatencyHint('0.2')") 0.2
          .suggestion(@click="onLatencyHint('fastest')") fastest
          .suggestion(@click="onLatencyHint('interactive')") interactive
          .suggestion(@click="onLatencyHint('balanced')") balanced
          .suggestion(@click="onLatencyHint('playback')") playback

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
        .debug(:class="{selected: selected === beat, now: isNow(beat)}") {{ beat }}

    .right
      h3 More
      div(v-for="(phrases, sound) of more")
        h3 {{ sound }}
        .mini-button(v-for="phrase of phrases", @click="onAdd($event, sound.toLowerCase())") {{ phrase }}

    transport(ref="transport", v-bind="transportProps", :metronome="false")

    .fx-controls
      .enable(@click="showFx = !showFx", :class="showFx ? 'on' : showFx === false ? 'off' : ''")

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
        transport: { bpm: () => 120, isValidBpm: _.stubTrue, isValidLatencyHint: _.stubTrue },
        beatsPerMeasure: '4,4',
        tempo: 120,
        latencyHint: 'balanced',
        enableBacking: true,
        selected: null,
        anySolo: false,
        backingPhrase: {},
        debugPhrase: [],
        fixed: [],
        fixedBeat: '',
        showSuggestions: false,
        showFx: true,
        tracks: [
          { type: 'synth', notes: 'C2,C2| G1,G1| Bb1,Bb1| B1,B1| C2,C3| G1,G2| Bb1,Bb2| B1,B2' },
          { type: 'synth', notes: 'G4.C5.Eb5,| ,G4.C5.Eb5| | G4.C5.F5| G4.C5.Eb5,| ,G4.C5.Eb5| | A4.C5.F5' },
          { type: 'drums', notes: 'K| ,K| S,K| ,K| K| ,K| S,K| S,S,K,S' }
        ],
        more: {
          Cowbell: [
            'A5,,A5,A5| E5,A5,E5,E5| A5,,A5,E5| | A5,,A5,A5| E5,A5,E5,E5| A5,,,E5',
            'C1,C2,C3,C4| C2,C3,C4,C5| C3,C4,C5,C6| C4,C5,C6,C7',
            'C1,C2,C3,C4| C5,C6,C7,C8| F#8,F#7,F#6,F#5| F#4,F#3,F#2,F#1'
          ],
          Synth: [
            'C2,B1,Bb1,A1| G#1,G1,F#1,F1| E1,Eb1,D1,C#1| C1,E1,G1,B1',
            'C1.C2.C3.C4.C5.C6.C7.C8.C9| C4.E4.G4.Bb4| Db6.F6.Ab6.Cb7| D8.F#8.A8.C9'
          ]
        }
      }
    },
    mounted() {
      this.transport = this.$refs.transport;
      window.addEventListener('keydown', this.onKeyDown);
    },
    destroyed: function() {
      window.removeEventListener('keydown', this.onKeyDown);
    },

    methods: {
      onKeyDown(event) {
        if (event.key === 'Enter') {
          this.onPlay();
        } else if (event.key === ' ') {
          this.showFx = this.showFx !== undefined ? undefined : true;
        }
      },
      onPlay() {
        if (this.transport.started) {
          console.log('Stop');
          this.transport.stop();
        } else {
          Sound.resume();
          console.log('Start');
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
        if (this.selected !== beatDebug) {
          this.selected = beatDebug;
          this.fixed = this._getFixed(beatDebug);
        } else {
          this.selected = null;
          this.fixed = [];
        }
      },
      hideSuggestions() {
        // Need to do this after timeout so that suggestion click handler has a chance
        setTimeout(() => {
          this.showSuggestions = false;
        }, 200);
      },
      onLatencyHint(latencyHint) {
        this.latencyHint = latencyHint;
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
          latencyHint: this.latencyHint,
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
          let solo = true;
          let activeTracks = _.filter(tracks, (track) => {
            return track.solo && !track.mute;
          });
          if (!activeTracks.length) {
            solo = false;
            activeTracks = _.filter(tracks, (track) => {
              return !track.mute;
            });
          }

          this.backingPhrase = Phrase.from(activeTracks);
          this.debugPhrase = this.backingPhrase.toArray();
          this.anySolo = solo;
          if (this.selected) {
            let selectedBeatTick = _.split(this.selected, ': ')[0];
            this.selected = _.find(this.debugPhrase, (debugPhrase) => {
              return _.startsWith(debugPhrase, selectedBeatTick);
            });
            this.fixed = this.selected ? this._getFixed(this.selected) : [];
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
    margin: 10vh content-side-margin;
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

    .beats-input, .performance
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

        &[type="text"]
          margin-right: 14%;
          width: 86%;

        &:focus
          outline: none;

    .performance
      position: relative;

      input
        font-size: 14px;
        opacity: 0.3;

        &:hover, &:focus
          opacity: 1;

      .suggestions
        position: absolute;
        left: 20%;
        border: solid darkgray 1px;
        padding: 1px 5px;

        .suggestion
          color: darkgray;
          cursor: pointer;

          &:hover
            color: black;
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

  .fx-controls
    cursor: pointer;
    position: fixed;
    bottom: 0;
    left: 0;
    opacity: 0;
    transition: opacity 250ms;

    &:hover
      opacity: 1;

    .enable
      background-color: primary-blue;
      height: 40px;
      width: 40px;
      transition: background-color 250ms;

      &.on
        background-color: primary-green;

      &.off
        background-color: primary-red;
</style>
