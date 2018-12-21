import BeatTick from '~/common/core/beat-tick.model';
import Note from '~/common/core/note.model';
import Sound from '~/common/sound/sound';

function synthParser(type) {
  return (data, duration) => {
    let frequency = Note.pitch(data);
    if (frequency) {
      return new Note(type, {
        pitch: frequency.toNote(),
        duration: duration
      });
    }
  };
}

const parser = {
  synth: synthParser('synth'),
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

const parseTracks = function(tracks) {
  let notes = {};
  _.forEach(tracks, track => {
    if (!parser[track.type] && Sound.get(track.type)) {
      parser[track.type] = synthParser(track.type);
    }
    if (parser[track.type] && track.notes) {
      _.forEach(track.notes.split('|'), (beatNote, beatIndex) => {
        _.forEach(beatNote.split(','), (pulseNote, pulseIndex, array) => {
          if (pulseIndex > 3) {
            return;
          }
          let pulses = Math.min(array.length, 4);
          let beatTick = BeatTick.from(beatIndex, pulseIndex, pulses);
          _.forEach(pulseNote.split('.'), chordNote => {
            try {
              let note = parser[track.type](chordNote, BeatTick.duration(pulses));
              if (note) {
                (notes[beatTick] || (notes[beatTick] = [])).push(note);
              }
            } catch (error) {
              console.log('Parse error:', error);
            }
          });
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
