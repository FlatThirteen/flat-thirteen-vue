import Combinatorics from 'js-combinatorics';

function mandatory(requiredBeatTicks) {
  return _.flatten(_.filter(requiredBeatTicks, beatTicks => beatTicks.length === 1));
}

function combinations(beatTicks, requiredBeatTicks, count, avoidBeatTicks = {}) {
  let mandatoryBeatTicks = mandatory(requiredBeatTicks);
  beatTicks = _.difference(beatTicks, mandatoryBeatTicks);
  count = count - mandatoryBeatTicks.length;
  let requiredGroups = _.filter(requiredBeatTicks, beatTicks => beatTicks.length > 1 &&
      !_.intersection(beatTicks, mandatoryBeatTicks).length);
  let matchingBeatTicks = _.map(Combinatorics.combination(beatTicks, count).filter(beatTicks =>
      _.every(requiredGroups, requireGroup => _.intersection(requireGroup, beatTicks).length)),
      chosenBeatTicks => _.sortBy(_.concat(mandatoryBeatTicks, chosenBeatTicks)));
  return _.filter(matchingBeatTicks, chosen => !avoidBeatTicks[_.join(chosen)]);
}

export default {
  combinations
}
