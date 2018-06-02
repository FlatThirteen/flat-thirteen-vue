<template lang="pug">
  .transport(v-if="show")
    .latency(v-if="latencyHistogram.length") {{ latencyHistogram.join(',') }}
    .playing(v-if="playing") {{ measure }} : {{ count }} / {{ countBeats }}
    .starting(v-else-if="starting") ...
    .paused(v-else) {{ beats }} beats
    .elapsed(v-if="startTime") ({{ elapsedTime() }}s)
</template>

<script>
  import { mapGetters } from 'vuex'

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
      },
      latencyHint: {
        type: String,
        default: 'balanced'
      }
    },
    data: function() {
      return {
        onTopId: null,
        quarterLoop: null,
        pulsesPart: null,
        latencyHistogram: [],
        measure: 0,
        beat: -1,
        beatIndex: -1,
      };
    },
    mounted() {
      if (loaded) {
        throw new Error('Only one transport should be mounted at a time');
      }
      loaded = true;
      Tone.context.latencyHint = this.latencyHint;
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
      latency() {
        return Tone.context.latencyHint;
      },
      isValidLatencyHint(latencyHint) {
        return latencyHint === 'fastest' || latencyHint ===  'interactive' ||
            latencyHint === 'balanced' || latencyHint === 'playback' ||
            _.inRange(_.toNumber(latencyHint), 0, 0.51);
      },
      bpm() {
        return Tone.Transport && _.round(Tone.Transport.bpm.value);
      },
      setBpm(bpm) {
        if (bpm !== this.bpm() && this.isValidBpm(bpm)) {
          Tone.Transport.bpm.rampTo(bpm, 1);
          Tone.Transport.setLoopPoints(0, this.loopTime());
          this.$store.commit('transport/setup', {tempo: bpm});
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
      },
      emitBeatTick(time, tick = 0) {
        this.$bus.$emit(BeatTick.EVENT, {
          time: time,
          beat: this.beatIndex,
          count: this.count,
          nextBeat: this.nextBeat,
          beatTick: BeatTick.from(this.beatIndex, tick)
        });
      },
      logIfLate(time) {
        let start = Tone.rightNow();
        if (start <= time) {
          return;
        }
        let bucket = _.floor(10 * (start - time));
        this.latencyHistogram[bucket] = (this.latencyHistogram[bucket] || 0) + 1;
        console.log('@' + this.elapsedTime() + 's Late: ', _.round(start - time, 5),
            _.toArray(this.latencyHistogram), time, this.latency());
      },
      elapsedTime() {
        if (this.startTime) {
          return _.round((this.endTime || Tone.rightNow()) - this.startTime);
        }
      }
    },
    computed: {
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
      },
      measureTops() {
        return _.reduce(this.beatsPerMeasure, (result, beats) => {
          return _.concat(result, true, ..._.times(beats - 1, false));
        }, []);
      },
      ...mapGetters({
        starting: 'transport/starting',
        playing: 'transport/playing',
        paused: 'transport/paused',
        startTime: 'transport/startTime',
        endTime: 'transport/endTime'
      })
    },
    watch: {
      starting(starting) {
        if (starting) {
          this.latencyHistogram = [];
        }
      },
      paused(paused) {
        if (paused) {
          this.measure = 0;
          this.beat = -1;
        }
      },
      tempo(bpm) {
        this.setBpm(bpm);
      },
      latencyHint(latencyHint) {
        if (latencyHint === 'fastest' || latencyHint === 'interactive' ||
          latencyHint === 'balanced' || latencyHint === 'playback') {
          Tone.context.latencyHint = latencyHint;
        } else if (_.inRange(_.toNumber(latencyHint), 0, 0.51)) {
          Tone.context.latencyHint = _.toNumber(latencyHint);
        }
      },
      beatsPerMeasure: {
        deep: true,
        immediate: true,
        handler(beatsPerMeasure, oldBeatsPerMeasure) {
          if (!process.browser || _.isEqual(beatsPerMeasure, oldBeatsPerMeasure)) {
            return;
          }
          let restart = this.starting || this.playing;
          if (restart) {
            this.$store.dispatch('transport/stop');
          }
          if (!this.beats) {
            this.$store.commit('transport/setup', {numBeats: 0});
            return;
          }

          Tone.Transport.loop = true;
          Tone.Transport.setLoopPoints(0, this.loopTime());

          this.disposeLoops();

          this.quarterLoop = new Tone.Loop((time) => {
            if (this.paused) {
              return;
            }
            this.logIfLate(time);
            this.beatIndex++;
            this.beat++;
            if (this.beat >= this.countBeats) {
              this.beat = 0;
              this.measure++;
            }

            if (this.metronome) {
              Sound.click.play(time, { variation: this.beat ? 'normal' : 'heavy' });
            }

            this.emitBeatTick(time);
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
            this.logIfLate(time);
            this.emitBeatTick(time, tick);
          }, _.toPairs(tickEvents));
          this.pulsesPart.loop = true;
          this.pulsesPart.loopEnd = '4n';
          this.pulsesPart.start(0);

          if (!this.onTopId) {
            this.onTopId = Tone.Transport.schedule((time) => {
              if (this.starting) {
                this.$store.commit('transport/play');
              }
              this.measure = 0;
              this.beatIndex = -1;
              this.beat = -1;
            }, 0);
          }
          this.$store.commit('transport/setup', {
            tempo: this.bpm(),
            numBeats: this.beats,
            measureTops: this.measureTops
          });
          if (restart) {
            // nextTick needed so listeners have a chance to react before restart
            this.$nextTick(function () {
              this.$store.dispatch('transport/start');
            });

          }
        }
      }
    }
  }


</script>
<style scoped lang="stylus" type="text/stylus">
  .transport
    position: fixed;
    bottom: 0;
    right: 0;
    background-color: faint-grey;
    padding: 5px;
    text-align: left;

    .latency
      color: primary-red;

    .playing, .starting, .paused, .elapsed
      display: inline-block;

    .elapsed
      margin-left: 10px;
</style>
