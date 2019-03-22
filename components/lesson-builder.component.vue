<template lang="pug">
  .builder(v-if="debug")
    key-handler
    arrangement.arrangement(:phrases="phrases", :tempo="tempo", :show="true", :loop="4")
    .notes
      .primary.toggle(:class="{active: !notes}", @click="build()") Default
      .primary.toggle(v-for="numNotes in notesRange", :class="{active: numNotes === notes}",
          @click="setNotes(numNotes)") {{ numNotes }}
      stars-control.primary(:stars="stars", @stars="onStar($event)", :default="level.intensity")
    .pages(v-if="pages.length > 1")
      .page.toggle(v-for="p in pages.length", :class="{active: page === p - 1}",
          @click="page = p - 1") {{ p }}
    .stages
      .stage.button(v-for="(stage, i) in pages[page]", @click="onPhrase(i)")
        phrase.phrase(ref="phrase", :class="{forbidden: !stage || stage.forbidden}",
            v-bind="{phrase: stage, phraseKey: keys[i], pulsesByBeat, phraseProperties}")
        .key {{ keys[i] }}
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
  import KeyHandler from '~/components/key-handler.component';
  import Phrase from '~/components/phrase.component';
  import StarsControl from '~/components/stars-control.component';

  export default {
    components: {
      'arrangement': Arrangement,
      'key-handler': KeyHandler,
      'phrase': Phrase,
      'stars-control': StarsControl
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
        stars: null
      };
    },
    methods: {
      isForbidden(noteSequence) {
        let sequence = _.map(noteSequence, chosen => _.join(chosen, '+'));
        if (this.oneNote) {
          return false;
        }
        if (this.layout.length > 1 && _.indexOf(_.join(sequence), '+') === -1) {
          return true;
        }
        return _.uniq(sequence).length < 2;
      },
      build({ stars } = this) {
        this.stars = stars;
        this.page = 0;
        this.notes = null;
        if (this.oneNote && this.noteCombinations[0][0] === 'kick' &&
            this.pulseBeat === '1111' && !stars) {
          this.stages = _.map([
            [{ type: 'drums', notes: 'K|K|K|K' }],
            [{ type: 'drums', notes: 'K|K|K' }],
            [{ type: 'drums', notes: 'K||K|K' }],
            [{ type: 'drums', notes: 'K|K||K' }]
          ], _.ary(Parser.parseTracks, 1));
        } else {
          let numStars = stars ? stars.length : 0;
          let numStages = this.debug ? 24 : 4;
          let pickedPhrases = {};
          let avoidBeatTicks = {}; // avoidBeatTicks[count][beatTicksString] = true
          let avoidSequences = {}; // avoidSequences[beatTick] = [replacementForSeedIndex]
          let lastNotes = null;
          this.stages = _.times(numStages, (stage) => {
            let startingRests = (this.oneNote && (!!stars || !!stage)) + numStars + (numStars && stage);
            let maxRests = startingRests + (stage > 1);
            let minRests = startingRests + (stage > 2) - !!numStars;
            let debug = { startingRests, maxRests, minRests,
              minNotes: numStars > 2 ? this.min : Math.max(this.min, this.beatTicks.length - maxRests),
              maxNotes: Math.max(this.min, this.beatTicks.length - (numStars > 2 ? this.oneNote : minRests))
            };
            let beatTicks;
            let noteSequence;
            if (debug.minNotes > debug.maxNotes) {
              console.warn('minNotes', debug.minNotes, '>', debug.maxNotes, 'maxNotes');
              return;
            }
            for (let i = 0; !noteSequence && i < 10; i++) {
              let possibleNotes = _.filter(_.range(debug.minNotes, debug.maxNotes + 1),
                  notes => avoidBeatTicks[notes] !== true);
              if (!possibleNotes.length) {
                avoidBeatTicks = {};
                avoidSequences = {};
                continue;
              }
              debug.notes = possibleNotes[_.random(possibleNotes.length - 1)];
              beatTicks = debug.notes === this.beatTicks.length ? this.beatTicks : null;
              if (!beatTicks) {
                debug.requiredBeatTicks = this.requiredBeatTicks(
                  !stage || numStars < 2 && (this.pulseBeat !== '1111' || !this.oneNote || !stars),
                  stage < 3 && !stars);
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
                    let maxSeed = combos - 1;
                    let noteSeed = _.random(0, maxSeed);
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
                    avoidSequences[beatTicks][noteSeed] = _.defaultTo(avoidSequences[beatTicks][maxSeed], maxSeed);
                  } else if (debug.notes === this.beatTicks.length) {
                    avoidBeatTicks[debug.notes] = true;
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
              if (!debug.notes) {
                phrase.forbidden = true;
              }
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
          this.stars ? this.stars.length < 2 : this.pulseBeat !== '1111' || !this.oneNote,
          !this.stars);
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
      onStar(stars) {
        this.stars = stars;
        this.$emit('stars', stars);
        if (this.notes) {
          this.setNotes(this.notes);
        } else {
          this.build();
        }
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
        let phrase = this.$refs.phrase[stage];
        if (phrase) {
          this.phrases.push(phrase);
          if (this.paused) {
            this.start();
          }
        }
      },
      ...mapActions({
        start: 'transport/start'
      })
    },
    computed: {
      keys() {
        return _.times(26, i => String.fromCharCode(_.toNumber('A'.charCodeAt(0)) + i));
      },
      pages() {
        return _.chunk(this.stages, 100);
      },
      min() {
        return this.beatTicks.length > 2 ? 3 : 1;
      },
      notesRange() {
        return _.range(Math.min(this.min, this.beatTicks.length), this.beatTicks.length + !this.oneNote);
      },
      oneNote() {
        return this.noteCombinations.length === 1;
      },
      noteCombos() {
        return _.map(this.noteCombinations, notes => _.map(notes, note => Note.from(note)))
      },
      ...mapGetters({
        keyDown: 'keyDown',
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
      keyDown(key) {
        let index = _.indexOf(this.keys, _.toUpper(key));
        if (this.$refs.phrase) {
          this.onPhrase(index);
        }
      },
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

  .primary
    display: inline-block;
    margin: 10px;
    padding: 10px;
    font-size: 34px;
    border-radius: 5px;

  toggle-color('.primary', primary-blue);

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

  .key
    posit(absolute);
    font-size: calc(35px + 2vh);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: .5;

  .forbidden
    filter: grayscale(1);
</style>
