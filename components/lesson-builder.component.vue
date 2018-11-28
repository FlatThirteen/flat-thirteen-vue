<template lang="pug">
  .builder(v-if="debug")
    arrangement.arrangement(:phrases="phrases", :tempo="tempo")
    .notes
      .note.toggle(:class="{active: !notes}", @click="build(finished)") Default
      .note.toggle(v-for="numNotes in notesRange", :class="{active: numNotes === notes}",
          @click="setNotes(numNotes)") {{ numNotes }}
      .finished.toggle(:class="{active: finished}",
          @click="finished = !finished; notes ? setNotes(notes) : build(finished)") Finished
    .stages
      .stage.button(v-for="(stage, i) in stages", @click="onPhrase(i)")
        .debug(v-if="stage.rhythmSeed !== undefined || stage.noteSeed !== undefined", :class="{top: firstLayout}")
          .overlay
            span(v-if="stage.minNotes") {{ stage.notes }} ({{ stage.minNotes }} {{ stage.maxNotes }})
            span  {{ stage.rhythmSeed }}:{{ stage.noteSeed }}
        phrase.phrase(ref="phrase", v-bind="{phrase: stage, phraseKey: String(i), pulsesByBeat, phraseProperties}")
</template>

<script>
  import { mapActions, mapGetters } from 'vuex'

  import Monotonic from '~/common/composer/monotonic';
  import Parser from '~/common/composer/parser';
  import Rhythm from '~/common/composer/rhythm';
  import BeatTick from '~/common/core/beat-tick.model';
  import Note from '~/common/core/note.model';

  import Arrangement from '~/components/arrangement.component';
  import Phrase from '~/components/phrase.component';

  export default {
    components: {
      arrangement: Arrangement,
      phrase: Phrase
    },
    props: {
      debug: Boolean
    },
    data() {
      return {
        phrases: [],
        stages: [],
        notes: null,
        finished: false
      };
    },
    methods: {
      build(finished) {
        this.notes = null;
        if (this.firstLayout && this.pulseBeat === '1111' && !finished) {
          this.stages = _.map([
            [{ type: 'drums', notes: 'K|K|K|K' }],
            [{ type: 'drums', notes: 'K|K|K' }],
            [{ type: 'drums', notes: 'K||K|K' }],
            [{ type: 'drums', notes: 'K|K||K' }]
          ], Parser.parseTracks);
        } else {
          let numStages = this.debug ? 24 : 4;
          let pickedPhrases = {};
          let avoidBeatTicks = {}; // avoidBeatTicks[count][beatTicksString] = true
          let avoidSequences = {}; // avoidSequences[beatTick] = [replacementForSeedIndex]
          let lastNotes = null;
          this.stages = _.times(numStages, (stage) => {
            let debug = {
              minNotes: Math.max(3, this.beatTicks.length - finished - stage),
              maxNotes: this.beatTicks.length - (this.firstLayout && !!(finished || stage))
            };
            let beatTicks;
            let noteSequence;
            while (!noteSequence) {
              let possibleNotes = _.filter(_.range(debug.minNotes, debug.maxNotes + 1),
                  notes => avoidBeatTicks[notes] !== true);
              if (!possibleNotes.length) {
                possibleNotes = _.without(_.range(debug.minNotes, debug.maxNotes + 1), lastNotes);
                avoidBeatTicks = {};
                avoidSequences = {}
              }
              debug.notes = possibleNotes[_.random(possibleNotes.length - 1)];
              beatTicks = debug.notes === this.beatTicks.length ? this.beatTicks : null;
              if (!beatTicks) {
                debug.requiredBeatTicks = this.requiredBeatTicks(
                  this.pulseBeat !== '1111' && !this.firstLayout || !finished,
                  stage < numStages - 1 && !finished);
                let combinations = Rhythm.combinations(this.beatTicks, debug.requiredBeatTicks, debug.notes,
                  _.get(avoidBeatTicks, debug.notes, {}));
                if (combinations.length) {
                  debug.rhythmSeed = _.random(combinations.length - 1);
                  beatTicks = combinations[debug.rhythmSeed];
                  if (debug.minNotes < debug.maxNotes) {
                    lastNotes = debug.notes;
                  }
                } else {
                  avoidBeatTicks[debug.notes] = true;
                }
              }
              if (beatTicks) {
                if (this.availableNotes.length === 1) {
                  noteSequence = _.times(debug.notes, () => [Note.from(this.availableNotes[0])]);
                  _.set(avoidBeatTicks, [debug.notes, _.join(beatTicks)], true);
                } else {
                  let combos = Monotonic.combos(this.availableNotes, beatTicks.length) - 2 -
                    _.size(avoidSequences[beatTicks]);
                  if (combos) {
                    let noteSeed = _.random(1, combos);
                    if (!avoidSequences[beatTicks]) {
                      avoidSequences[beatTicks] = {};
                    }
                    debug.noteSeed = _.defaultTo(avoidSequences[beatTicks][noteSeed], noteSeed);
                    if (debug.noteSeed !== noteSeed) {
                      avoidSequences[beatTicks][debug.noteSeed] = true;
                    }
                    noteSequence = Monotonic.build(_.map(this.availableNotes, (note) => [Note.from(note)]),
                        beatTicks.length, debug.noteSeed);
                    avoidSequences[beatTicks][noteSeed] = _.defaultTo(avoidSequences[beatTicks][combos], combos);
                  } else {
                    _.set(avoidBeatTicks, [debug.notes, _.join(beatTicks)], true);
                  }
                }
              }
            }

            let phrase = _.zipObject(beatTicks, noteSequence);
            let key = beatTicks + noteSequence;
            debug.duplicate = pickedPhrases[key];
            pickedPhrases[key] = _.defaultTo(pickedPhrases[key], 0) + 1;
            if (this.debug) {
              _.assign(phrase, debug);
            }
            return phrase;
          });
        }
        return this.stages;
      },
      setNotes(notes) {
        this.notes = notes;
        let requiredBeatTicks = this.requiredBeatTicks(
            this.pulseBeat !== '1111' && !this.firstLayout || !this.finished, !this.finished);
        let rhythmCombinations = Rhythm.combinations(this.beatTicks, requiredBeatTicks, notes);
        this.stages = _.flatMap(rhythmCombinations, (beatTicks, rhythmSeed) => _.map(
            this.availableNotes.length === 1 ? [0] :
            _.range(1, Monotonic.combos(this.availableNotes, beatTicks.length) - 1), noteSeed =>
            _.assign(_.zipObject(beatTicks, Monotonic.build(_.map(this.availableNotes,
                (note) => [Note.from(note)]), beatTicks.length, noteSeed)), { requiredBeatTicks, rhythmSeed, noteSeed })));
      },
      requiredBeatTicks(requireInitial, requireOffbeats) {
        let requiredBeatTicks = [];
        if (requireInitial) {
          requiredBeatTicks.push(['00:000']); // TODO: Do only when metronome off
        }
        if (requireOffbeats) {
          let requiredOffbeats = _.compact(_.flatMap(this.pulsesByBeat, (pulses, beat) =>
            pulses > 1 && _.times(pulses - 1, pulse => BeatTick.from(beat, pulse + 1, pulses))
          ));
          if (requiredOffbeats.length) {
            requiredBeatTicks.push(requiredOffbeats);
          }
        }
        let halfwayBeat = this.pulsesByBeat.length / 2;
        requiredBeatTicks.push(_.filter(this.beatTicks,
          beatTick => Parser.beatFromBeatTick(beatTick) >= halfwayBeat));
        if (!requireInitial) {
          requiredBeatTicks.push(_.filter(this.beatTicks,
            beatTick => Parser.beatFromBeatTick(beatTick) < halfwayBeat));
        }
        return requiredBeatTicks;
      },
      onPhrase(stage) {
        this.phrases.push(this.$refs.phrase[stage]);
        if (this.paused) {
          this.start();
        }
      },
      ...mapActions({
        start: 'transport/start'
      })
    },
    computed: {
      notesRange() {
        return _.range(3, this.beatTicks.length + !this.firstLayout);
      },
      firstLayout() {
        return this.availableNotes.length === 1 && this.availableNotes[0] === 'kick';
      },
      ...mapGetters({
        pulseBeat: 'player/pulseBeat',
        pulsesByBeat: 'player/pulsesByBeat',
        beatTicks: 'player/beatTicks',
        phraseProperties: 'player/phraseProperties',
        layout: 'player/layout',
        availableNotes: 'player/availableNotes',
        tempo: 'progress/tempo',
        paused: 'transport/paused'
      })
    },
    watch: {
      paused(paused) {
        if (paused) {
          this.phrases = [];
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">

  .builder
    margin: 90px 10px 10px;
    position: relative;

  .arrangement
    posit(absolute, x, 0, 100%);

  .notes
    text-align: center;

  .note
    display: inline-block;
    margin: 10px;
    padding: 10px;
    font-size: 3vw;
    border-radius: 5px;
    vertical-align: baseline;

  .finished
    display: inline-block;
    border-radius: 5px;
    font-size: 3vw;
    padding: 7px;

  toggle-color('.note', primary-blue);
  toggle-color('.finished', primary-blue);

  .stages
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;

  .stage
    position: relative;

  .debug
    posit(absolute);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    color: white;

    &.top .overlay
      posit(absolute, 0, x, x, x);
      align-items: center;
      background-color: rgba(255,255,255,.7);
      border-radius: 5px;
      color: black;
      padding: 1px 2px;

  .phrase
    height: calc((98vw - 30px) / 8 - 2vw);
    max-width: calc((100vw - 30px) / 4 - 2vw);
    min-width: calc((100vw - 30px) / 8 - 2vw);
    min-height: 40px;
    max-height: calc((100vh - 180px) / 6 - 2vh - 4px);
    margin: 1vh 1vw;
</style>