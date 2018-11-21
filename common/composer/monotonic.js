function combos(notes = [], count) {
  if (count < 1) {
    throw new Error('Need positive count', count);
  } else if (!notes.length) {
    throw new Error('Need some notes to work with');
  }
  return Math.pow(notes.length, count);
}

function build(notes = [], count, seed) {
  let n = notes.length;
  return _.times(count, (i) => {
    let chosen = notes[seed % n];
    seed = Math.floor(seed / n);
    return chosen;
  });
}

export default {
  combos,
  build
}
