<template lang="pug">
  .container
    backing(:fixed="fixed", :show="showFx", :skip="showFx === undefined", :showCounts="true")
    .left
      transport-controls(:playTime="'+0.1'", :beatsPerMeasure="bpm")
        .beats-input
          input.beats(type="text", v-model="bpm", placeholder="# beats", @keydown.stop="")
    .content(:class="{solo: anySolo}")
      .track(v-for="(track, i) in tracks", :class="{solo: track.solo, mute: track.mute}")
        input(type="checkbox", v-model="track.solo")
        input(type="checkbox", v-model="track.mute")
        input.type(type="text", v-model="track.type")
        input.notes(type="text", v-model="track.notes")
        .close.mini-button(@click="onRemove(i)") x
      .add.mini-button(@click="onAdd()") +
    .footer
      .line(v-for="beat of debugPhrase")
        .debug(:class="{selected: selected === beat, now: isNow(beat)}",
            @click="onBeat(beat)") {{ beat }}
    .right
      h3 More
      div(v-for="(phrases, sound) of more")
        h3 {{ sound }}
        .mini-button(v-for="phrase of phrases", @click="onAdd($event, sound.toLowerCase())") {{ phrase }}
    .fx-controls
      .enable(@click="showFx = !showFx", :class="showFx ? 'on' : showFx === false ? 'off' : ''")
</template>

<script>
  import { mapActions, mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';

  import Backing from '~/components/backing.component';
  import TransportControls from '~/components/transport-controls.component';

  export default {
    components: {
      'backing': Backing,
      'transport-controls': TransportControls
    },
    head: {
      title: 'Flat Thirteen | Backing'
    },
    layout: 'debug',
    data() {
      return {
        bpm: '4,4',
        now: '',
        enableBacking: true,
        selected: null,
        anySolo: false,
        debugPhrase: [],
        fixed: [],
        fixedBeat: '',
        showFx: true,
        tracks: [
          { type: 'sawtooth6', notes: 'C2:0,0|-5,-5|-2,-2|-1,-1|0,12|-5,7|-2,10|-1,11' },
          { type: 'square2', notes: 'C5:i^3,| ,i| |isus4| i,| ,i| | IV' },
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
        },
        parseTracks: _.debounce(this._parseTracks, 500)
      }
    },
    mounted() {
      window.addEventListener('keydown', this.onKeyDown);
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      window.removeEventListener('keydown', this.onKeyDown);
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      onKeyDown(event) {
        if (event.key === ' ') {
          this.showFx = this.showFx !== undefined ? undefined : true;
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
      beatTickHandler({beatTick}) {
        this.now = beatTick;
      },
      isNow(beatDebug) {
        return _.startsWith(beatDebug, this.now);
      },
      _getFixed(beatDebug) {
        return _.split(_.split(beatDebug, ': ')[1], ',')
      },
      _parseTracks(tracks) {
        let activeTracks = _.filter(tracks, track => track.solo && !track.mute);
        this.anySolo = !!activeTracks.length;
        if (!activeTracks.length) {
          activeTracks = _.filter(tracks, track => !track.mute);
        }

        this.setTracks({ name: 'backing', tracks: activeTracks });
        this.debugPhrase = this.asArray('backing');
        if (this.selected) {
          let selectedBeatTick = _.split(this.selected, ': ')[0];
          this.selected = _.find(this.debugPhrase, debugPhrase =>
              _.startsWith(debugPhrase, selectedBeatTick));
          this.fixed = this.selected ? this._getFixed(this.selected) : [];
        }
      },
      ...mapActions({
        setTracks: 'phrase/setTracks'
      })
    },
    computed: {
      ...mapGetters({
        asArray: 'phrase/asArray'
      })
    },
    watch: {
      tracks: {
        deep: true,
        immediate: true,
        handler(tracks) {
          if (process.browser) {
            this.parseTracks(tracks);
          }
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
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
      width: 12vw;

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
