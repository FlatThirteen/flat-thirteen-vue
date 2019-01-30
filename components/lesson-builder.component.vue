<template lang="pug">
  .builder(v-if="debug")
    arrangement.arrangement(:phrases="phrases", :tempo="tempo", :show="true")
    .notes
      .note.toggle(:class="{active: !notes}", @click="build(finished)") Default
      .note.toggle(v-for="numNotes in notesRange", :class="{active: numNotes === notes}",
          @click="setNotes(numNotes)") {{ numNotes }}
      .finished.toggle(:class="{active: finished}",
          @click="finished = !finished; notes ? setNotes(notes) : build(finished)") Finished
    .pages(v-if="pages.length > 1")
      .page.toggle(v-for="p in pages.length", :class="{active: page === p - 1}",
          @click="page = p - 1") {{ p }}
    .stages
      .stage.button(v-for="(stage, i) in pages[page]", @click="onPhrase(i)")
        phrase.phrase(ref="phrase", :class="{forbidden: stage.forbidden}",
            v-bind="{phrase: stage, phraseKey: String(i), pulsesByBeat, phraseProperties}")
        .debug(v-if="stage.rhythmSeed !== undefined || stage.noteSeed !== undefined",
            :class="{top: oneNote}")
          .overlay
            span(v-if="stage.minNotes") {{ stage.notes }} ({{ stage.minNotes }} {{ stage.maxNotes }})
            span  {{ stage.rhythmSeed }}
            span(v-if="!oneNote") :{{ stage.noteSeed }}
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
        page: 0,
        notes: null,
        finished: false
      };
    },
    methods: {
      isForbidden(noteSequence) {
        let sequence = _.map(noteSequence, chosen => _.join(chosen, '+'));
        if (this.level.layout === 1) {
          return _.uniq(sequence).length < 2;
        } else if (this.level.layout === 2) {
          return _.indexOf(sequence, 'snare+kick') === -1;
        } else {
          return false;
        }
      },
      build(finished) {
        this.page = 0;
        this.notes = null;
        if (this.oneNote && this.noteCombinations[0][0] === 'kick' &&
            this.pulseBeat === '1111' && !finished) {
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
              maxNotes: this.beatTicks.length - (this.oneNote && !!(finished || stage))
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
                  this.pulseBeat !== '1111' || !this.oneNote || !finished,
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
                if (this.oneNote) {
                  noteSequence = _.times(debug.notes, () => this.noteCombos[0]);
                  _.set(avoidBeatTicks, [debug.notes, _.join(beatTicks)], true);
                } else {
                  let combos = Monotonic.combos(this.noteCombos, beatTicks.length) -
                    _.size(avoidSequences[beatTicks]);
                  if (combos) {
                    let noteSeed = _.random(0, combos);
                    if (!avoidSequences[beatTicks]) {
                      avoidSequences[beatTicks] = {};
                    }
                    debug.noteSeed = _.defaultTo(avoidSequences[beatTicks][noteSeed], noteSeed);
                    if (debug.noteSeed !== noteSeed) {
                      avoidSequences[beatTicks][debug.noteSeed] = true;
                    }
                    noteSequence = Monotonic.build(this.noteCombos, beatTicks.length, debug.noteSeed);
                    if (this.isForbidden(noteSequence)) {
                      noteSequence = undefined;
                    }
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
        this.page = 0;
        this.notes = notes;
        let requiredBeatTicks = this.requiredBeatTicks(
            this.pulseBeat !== '1111' || !this.oneNote || !this.finished, !this.finished);
        let rhythmCombinations = Rhythm.combinations(this.beatTicks, requiredBeatTicks, notes);
        this.stages = _.flatMap(rhythmCombinations, (beatTicks, rhythmSeed) => {
          let seedRange = this.oneNote ? [0] : _.range(0, Monotonic.combos(this.noteCombos, beatTicks.length));
          return _.map(seedRange, noteSeed => {
            let noteSequence = Monotonic.build(this.noteCombos, beatTicks.length, noteSeed);
            return _.assign(_.zipObject(beatTicks, noteSequence), { requiredBeatTicks,
              rhythmSeed, noteSeed, forbidden: this.isForbidden(noteSequence) });
          })
        });
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
        for (let start = requireInitial ? 1 : 0; start + 2 <= this.pulsesByBeat.length; start++) {
          let inRange = beat => beat >= start && beat < start + 2;
          requiredBeatTicks.push(_.filter(this.beatTicks,
              beatTick => inRange(Parser.beatFromBeatTick(beatTick))));
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
      pages() {
        return _.chunk(this.stages, 100);
      },
      notesRange() {
        return _.range(3, this.beatTicks.length + !this.oneNote);
      },
      oneNote() {
        return this.noteCombinations.length === 1;
      },
      noteCombos() {
        return _.map(this.noteCombinations, notes => _.map(notes, note => Note.from(note)))
      },
      ...mapGetters({
        pulseBeat: 'player/pulseBeat',
        pulsesByBeat: 'player/pulsesByBeat',
        beatTicks: 'player/beatTicks',
        phraseProperties: 'player/phraseProperties',
        layout: 'player/layout',
        noteCombinations: 'player/noteCombinations',
        level: 'progress/level',
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

  .notes, .pages
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

  .page
    display: inline-block;
    margin: 5px;
    font-size: 2vw;
    border-radius: 5px;

  toggle-color('.page', black);

  .stages
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: center;
    margin-bottom: 80px;

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

  .forbidden
    filter: grayscale(1);
</style>
