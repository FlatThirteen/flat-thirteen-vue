import BeatTick from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model';
import Sound from '~/common/sound/sound';
import Tone from '~/common/tone';

const major = [7, 4, 0, 11, 14];
const minor = [7, 3, 0, 10, 14];
const variants = {
  D: [7, 4, 0, 10, 14],
  o: [0, 3, 6, 9],
  '%': [0, 3, 6, 10],
  '+': [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  sus6: [0, 7, 9]
};
const inversions = {
  '^1': 0,
  '^2': 2,
  '^3': 4,
  '^4': 5,
  '^5': 7,
  '^6': 9,
  '^7': 11
};

const scale = ['I', , 'II', , 'III', 'IV', , 'V', , 'VI', , 'VII'];
const scaleLookup = _.omit(_.invert(scale), undefined);
var lastChord;

function numSort(arr) {
  return arr.sort((a, b) => a - b);
}

function parseChord(pulseNote) {
  let match = pulseNote.match(/^([b#]?)([iv]+|[IV]+)(D|o|\%|\+|sus[246])?([79]?)(\^[1234567])?$/);
  if (match) {
    let rootInterval = scaleLookup[_.toUpper(match[2])];
    if (rootInterval) {
      if (match[1] === 'b') {
        rootInterval -= 1;
      } else if (match[1] === '#') {
        rootInterval += 1;
      }
      let noteCount = match[4] === '9' ? 5 : match[4] === '7' ? 4 : 3;
      let intervals = _.take(variants[match[3]] || (scaleLookup[match[2]] ? major : minor), noteCount);
      if (match[5]) {
        let top = inversions[match[5]];
        intervals = _.map(intervals, interval => interval > top ? interval - 12 : interval);
      }
      let pitches = numSort(_.map(_.map(intervals, interval => interval + _.toNumber(rootInterval)),
          pitch => pitch > 14 ? pitch - 12 : pitch));
      if (!match[5] && lastChord) {
        let inversions = _.times(pitches.length + 1, inversion => numSort(_.map(pitches,
            (interval, index) => pitches.length - index > inversion ? interval : interval - 12)));
        pitches = _.minBy(inversions, inversion => {
          return Math.pow(_.head(inversion) - _.head(lastChord), 2) +
              Math.pow(_.last(inversion) - _.last(lastChord), 2);
          });
      }
      lastChord = pitches;
      return pitches;
    }
  }
  return pulseNote.split('.');
}

function drumsParser(data) {
  let sound = data.match(/[kK]/) ? 'kick' :
    data.match(/[sS]/) ? 'snare' : null;
  if (sound) {
    return new Note(sound);
  }
}

function cowbellParser(soundName = 'cowbell') {
  return (data) => {
    let frequency = Note.pitch(data);
    if (frequency) {
      return new Note(soundName, { type: 'cowbell', pitch: frequency.toNote() });
    }
  }
}

function synthParser(soundName, type) {
  return (data, duration) => {
    let frequency = Note.pitch(data);
    if (frequency) {
      return new Note(soundName, { type,
        pitch: frequency.toNote(),
        duration: duration
      });
    }
  };
}

const parseTracks = function(tracks) {
  let notes = {};
  _.forEach(tracks, track => {
    let soundName = track.name || track.type;
    let parser = track.type === 'drums' ? drumsParser : track.type === 'cowbell' ?
        Sound.get(soundName, true) && cowbellParser(soundName) :
        Sound.set(soundName, track.type) ?
            synthParser(soundName, track.type.match(/(fm|am|fat|)(\D+)(\d*)/)[2]) : null;
    if (parser && track.notes) {
      let lastNotes = [];
      let parts = track.notes.split(':');
      let repeat = !_.last(parts);
      let rootNote = parts.length - repeat === 2 ? parts[0] : null;
      lastChord = null;
      let trackNotes = rootNote ? parts[1] : parts[0];
      _.forEach(trackNotes.split('|'), (beatNote, beatIndex) => {
        _.forEach(beatNote.split(','), (pulseNotes, pulseIndex, array) => {
          if (pulseIndex > 3) {
            return;
          }
          let pulses = Math.min(array.length, 4);
          let beatTick = BeatTick.from(beatIndex, pulseIndex, pulses);
          if (_.trim(pulseNotes) === '-') {
            _.forEach(lastNotes, lastNote => {
              lastNote.extendDuration(BeatTick.duration(pulses));
            });
          } else {
            lastNotes = [];
            _.forEach(parseChord(_.trim(pulseNotes)), chordNote => {
              try {
                let noteValue = rootNote ? Tone.pitch(rootNote, chordNote) : chordNote;
                let note = parser(noteValue, BeatTick.duration(pulses));
                if (note) {
                  lastNotes.push(note);
                  (notes[beatTick] || (notes[beatTick] = [])).push(note);
                }
              } catch (error) {
                console.log('Parse error:', error);
              }
            });
          }
        });
      });
    }
  });
  return notes;
};

const beatFromBeatTick = function(beatTick) {
  return _.toNumber(_.split(beatTick, ':')[0]);
};

export default {
  parseTracks,
  beatFromBeatTick
}
