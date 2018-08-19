function mirror(coords, offsets) {
  let original = _.map(coords, coord => _.zipWith(coord, offsets, (a, b) => a + b));
  let mirrored = _.map(_.reverse(coords), coord => _.zipWith(coord, offsets, (a, b) => b ? b - a : a));
  return _.concat(original, mirrored);
}

function path(coords, options) {
  let instructions = _.map(coords, ([x,y], index) => (index ? 'L' : 'M') + x + ',' + y);
  if (options.z) {
    instructions.push('Z');
  }
  return _.join(instructions, ' ');
}

export default { mirror, path }
