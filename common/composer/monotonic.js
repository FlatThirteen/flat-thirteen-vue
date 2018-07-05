import Combinatorics from 'js-combinatorics';

function combinations(notes = [], beatTicks = [], count) {
  if (count < 1) {
    throw new Error('Need positive count', count);
  } else if (!notes.length) {
    throw new Error('Need some notes to work with');
  } else if (beatTicks.length < count) {
    throw new Error('Need ' + count + ' notes but have only ' +
      beatTicks.length + ' beatTicks to work with');
  }
  return Math.pow(notes.length, count) * Combinatorics.C(beatTicks.length, count);
}

function build(notes = [], beatTicks = [], requiredBeatTicks = [], count = 3,
               seed = _.random(0, combinations(notes, beatTicks, count) - 1)) {
  let n = notes.length;
  let combos = combinations(notes, beatTicks, count);
  if (seed >= combos) {
    throw new Error('Seed ' + seed + ' not less than combinations', combos);
  }
  let chosenNotes = _.times(count + requiredBeatTicks.length, (i) => {
    let chosen = notes[seed % n];
    seed = Math.floor(seed / n);
    return chosen;
  });
  let chosenBeatTicks = Combinatorics.combination(beatTicks, count).find(() => {
    seed = seed - 1;
    return seed < 0;
  });
  return _.zipObject(_.sortBy(_.concat(requiredBeatTicks, chosenBeatTicks)), chosenNotes);
}

export default {
  combinations,
  build
}
