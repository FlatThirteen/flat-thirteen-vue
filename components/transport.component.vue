<template lang="pug">
  .transport(v-if="show")
    .started(v-if="started") {{ measure }} : {{ count }} / {{ countBeats }}
    .starting(v-else-if="starting") ...
    .paused(v-else) {{ beats }} beats
</template>

<script>
  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';
  import Tone from '~/common/tone';

  let loaded = false;

  export default {
    props: {
      tempo: {
        type: Number,
        default: 120
      },
      beatsPerMeasure: {
        type: Array,
        default() { return [4]; }
      },
      supportedPulses: {
        type: Array,
        default() { return [3, 4]; }
      },
      livePlayWithin: {
        type: Number,
        default: 0.3
      },
      metronome: {
        type: Boolean,
        default: true
      },
      show: {
        type: Boolean,
        default: false
      }
    },
    data: function() {
      return {
        onTopId: null,
        quarterLoop: null,
        pulsesPart: null,
        paused: true,
        started: false,
        measure: 0,
        beat: 0,
        beatIndex: 0
      };
    },
    mounted() {
      if (loaded) {
        throw new Error('Only one transport should be mounted at a time');
      }
      loaded = true;
    },
    destroyed() {
      this.disposeLoops();
      if (this.onTopId !== undefined) {
        Tone.Transport.clear(this.onTopId);
        this.onTopId = undefined;
      }
      loaded = false;
    },
    methods: {
      start(time = '+4n') {
        this.paused = false;
//        this.paused$.next(false);
//        this.lastBeat$.next(false);
        if (!this.started) {
          Tone.Transport.start(time);
        }
      },
      stop() {
        this.paused = true;
//        this.paused$.next(true);
        this.measure = 0;
        this.beat = -1;
        Tone.Transport.stop();
        this.started = Tone.Transport.started === 'started';
      },
      disposeLoops() {
        if (this.quarterLoop) {
          this.quarterLoop.dispose();
          this.quarterLoop = null;
        }
        if (this.pulsesPart) {
          this.pulsesPart.dispose();
          this.pulsesPart = null;
        }
      },
      bpm() {
        return Tone.Transport && _.round(Tone.Transport.bpm.value);
      },
      setBpm(bpm) {
        if (bpm !== this.bpm() && this.isValidBpm(bpm)) {
          Tone.Transport.bpm.value = bpm;
          Tone.Transport.setLoopPoints(0, this.loopTime());
        }
      },
      isValidBpm(bpm) {
        return bpm >= 40 && bpm <= 300;
      },
      loopTime() {
        return Tone.Time('4n').toSeconds() * this.beats;
      },
      progress() {
        return Tone.Transport && Tone.Transport.progress;
      },
      position() {
        return Tone.Transport && Tone.Transport.position.replace(/\:[.\d]+$/, '');
      }
    },
    computed: {
      starting() {
        return !this.paused && !this.started;
      },
      beats() {
        return _.sum(this.beatsPerMeasure);
      },
      count() {
        return this.beat + 1;
      },
      countBeats() {
        return this.beatsPerMeasure[this.measure];
      },
      measures() {
        return this.beatsPerMeasure.length;
      },
      nextBeat() {
        return this.beatIndex === this.beats - 1 ? 0 : this.beatIndex + 1;
      },
      lastBeat() {
        return this.beatIndex === this.beats - 1;
      }
    },
    watch: {
      tempo(bpm) {
        if (this.paused) {
          this.setBpm(bpm);
        }
      },
      beatsPerMeasure: {
        deep: true,
        immediate: true,
        handler(beatsPerMeasure, oldBeatsPerMeasure) {
          if (!process.browser || _.isEqual(beatsPerMeasure, oldBeatsPerMeasure)) {
            return;
          }
          let restart = !this.paused;
          this.stop();

          this.beatIndex = -1;

          Tone.Transport.loop = true;
          Tone.Transport.setLoopPoints(0, this.loopTime());

          this.disposeLoops();

          console.log('Setup new quarterLoop');
          this.quarterLoop = new Tone.Loop((time) => {
            if (this.paused) {
              return;
            }
            this.started = true;
            this.beatIndex++;
            this.beat++;
            if (this.beat >= this.countBeats) {
              this.beat = 0;
              this.measure++;
            }

            if (this.metronome) {
              Sound.click.play(time, { variation: this.beat ? 'normal' : 'heavy' });
            }

            this.$bus.$emit(BeatTick.EVENT, {
              time: time,
              beat: this.beatIndex,
              beatTick: BeatTick.from(this.beatIndex, 0)
            });
//          this.lastBeat$.next(this.lastBeat());
          }, '4n');
          this.quarterLoop.start(0);

          let tickEvents = _.transform(this.supportedPulses, (result, pulses) => {
            let ticks = BeatTick.PER / pulses;
            _.times(pulses - 1, (i) => {
              let time = ticks * (i + 1) + 'i';
              result[time] = ticks * (i + 1);
            });
          }, {});
//          this.supportedTicks = _.sortBy(_.values(tickEvents));
          this.pulsesPart = new Tone.Part((time, tick) => {
            this.$bus.$emit(BeatTick.EVENT, {
              time: time,
              beat: this.beatIndex,
              beatTick: BeatTick.from(this.beatIndex, tick)
            });
          }, _.toPairs(tickEvents));
          this.pulsesPart.loop = true;
          this.pulsesPart.loopEnd = '4n';
          this.pulsesPart.start(0);

          if (!this.onTopId) {
            this.onTopId = Tone.Transport.schedule((time) => {
              this.measure = 0;
              this.beatIndex = -1;
              this.beat = -1;
              this.setBpm(this.tempo);
            }, 0);
          }
          if (restart) {
            this.start();
          }
        }
      }
    }
  }


</script>
<style scoped lang="stylus" type="text/stylus">
  .transport
    background-color: faint-grey;
    padding: 5px;
    position: fixed;
    bottom: 0;
    right: 0;

</style>
