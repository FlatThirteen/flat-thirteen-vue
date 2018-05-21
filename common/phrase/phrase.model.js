import { beatTickFrom } from '~/common/core/beat-tick.model';
import { Note } from '~/common/core/note.model';

export class Phrase {
  constructor(noteString) {
    this.notes = {};
    this.noteCount = 0;
    if (noteString) {
      _.forEach(noteString.split(';'), (trackString) => {
        let [soundString, beatTickString] = trackString.split('@', 2);
        let note = Note.from(soundString);
        if (note) {
          _.forEach(beatTickString.split(','), (beatTick) => {
            this.add(note, beatTick);
          });
        } else {
          console.error('Invalid sound: ' + soundString);
        }
      });
    }
  }

  add(note, beatTick, tick) {
    if (_.isNumber(beatTick)) {
      beatTick = beatTickFrom(beatTick, tick);
    }
    if (this.notes[beatTick]) {
      this.notes[beatTick].push(note);
    } else {
      this.notes[beatTick] = [note];
    }
    this.noteCount++;
    return this;
  }

  getNotes(beat, tick = 0) {
    return _.isString(beat) ? this.notes[beat] :
        this.notes[beatTickFrom(beat, tick)] || [];
  }

  numNotes(beatTick) {
    if (beatTick === undefined) {
      return this.noteCount;
    } else {
      return this.notes[beatTick] ? this.notes[beatTick].length : 0;
    }
  }

  builder() {
    return new ConstantPhraseBuilder(this);
  }

  toArray() {
    return _.chain(this.notes).toPairs().sortBy([0]).
    map((pair) => _.replace(_.toString(pair), ',', ': ')).value();
  }

  toString() {
    return _.toString(_.toPairs(this.notes));
  }
}

export class ConstantPhraseBuilder {
  constructor(phrase) {
    this.phrase = phrase;
  }

  build() {
    return this.phrase;
  }
}

/**
 * Builds a phrase that never allows more than one note per pulse.
 * For now, the timing parameter only guarantees a note if the value is 1.
 * Other values are ignored.
 * Always makes sure all possible sounds are chosen before any duplicates.
 */
export class MonophonicMonotonePhraseBuilder {
  constructor(soundNames, rhythm, minNotes = 2, maxNotes = 4) {
    if (minNotes > maxNotes) {
      throw new Error('minNotes should not be bigger than maxNotes');
    } else if (minNotes > rhythm.length) {
      throw new Error('minNotes should not be bigger than length of rhythm');
    }
    this.soundNames = soundNames;
    this.rhythm = rhythm;
    this.minNotes = minNotes;
    this.maxNotes = maxNotes;
  }

  build() {
    let phrase = new Phrase();
    let neededSounds = _.clone(this.soundNames);
    let randomNeededSound = () => {
      return neededSounds.splice(_.random(neededSounds.length - 1), 1)[0];
    };
    let randomSound = () => this.soundNames[_.random(this.soundNames.length - 1)];
    let generate = (generationStrategy) => {
      for (let [beatTick, probability] of this.rhythm.pulseProbabilities) {
        if (generationStrategy(beatTick, probability)) {
          let sound = neededSounds.length ? randomNeededSound() : randomSound();
          phrase.add(new Note(sound), beatTick);
        }
        if (phrase.numNotes() === this.maxNotes) {
          break;
        }
      }
    };
    // Always place a note if the timing parameter is 1 for the current pulse.
    generate((beatTick, priority) => priority === 1 ? 1 : _.random(1));
    // If we didn't place enough notes, do it again until we do, this time ignoring
    // the timing parameter and only avoiding pulses that already have notes.
    while (phrase.numNotes() < this.minNotes) {
      generate((beatTick) => phrase.numNotes(beatTick) ? 0 : _.random(1));
    }
    return phrase;
  }
}

export default Phrase;
