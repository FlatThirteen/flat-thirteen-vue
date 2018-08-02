import Combinatorics from 'js-combinatorics';

function perm(from, number, seed = _.random(0, Combinatorics.P(from.length, number) - 1)) {
  let permutations = Combinatorics.permutation(from, number);
  return permutations.find(() => --seed < 0);
}

function chooser(from, number, seed = _.random(0, Combinatorics.C(from.length, number) - 1)) {
  let choices = Combinatorics.combination(from, number);
  return choices.find(() => --seed < 0);
}

function shape(primaryIntervals, primaryNumber, secondaryIntervals, secondaryNumber) {
  let chosen = perm(primaryIntervals, primaryNumber);
  function pushIfNew(array, value) {
    if (value && !_.includes(chosen, value)) {
      array.push(value);
    }
  }
  _.times(secondaryNumber, () => {
    let index = _.random(chosen.length);
    let next = index < chosen.length ? chosen[index] : 0;
    let choices = _.reduce(secondaryIntervals, (result, interval) => {
      pushIfNew(result, next + interval);
      return result;
    }, []);
    chosen.splice(index, 0, _.sample(choices));
  });
  chosen.unshift(0);
  return chosen;
}

export default {
  shape
}
