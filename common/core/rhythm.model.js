import * as _ from 'lodash';

import { ticks, beatTickFrom } from './beat-tick.model';

export class Rhythm {

  constructor(timings) {
    this.map = _.reduce(timings, (result, probabilities, beat) => {
    if (_.isNumber(probabilities)) {
      result[beatTickFrom(beat, 0)] = probabilities;
    } else {
      let pulses = probabilities.length;
      _.each(probabilities, (probability, pulse) => {
        result[beatTickFrom(beat, ticks(pulse, pulses))] = probability;
      });
    }
    return result;
  }, {});
    this.pulseProbabilities = _.orderBy(_.toPairs(this.map), 1, 'desc');
    this.pulsesByBeat = _.map(timings, (timing) => _.isArray(timing) ? timing.length : 1);
    this.supportedPulses = _.sortBy(_.uniq(this.pulsesByBeat));
    this.length = _.flatten(timings).length;
  }

  isSimple() {
    return this.supportedPulses.length === 1 && this.supportedPulses[0] === 1;
  }

  static fromParam(param) {
    let pulses = _.map(param, _.parseInt).map(_.partial(_.clamp, _, 1, 4));
    return Rhythm.fromPulses(pulses);
  }

  static fromPulses(pulses) {
    let timing = _.map(pulses, (pulse) => _.times(pulse, _.constant(0)));
    timing[0][0] = 1;
    return new Rhythm(timing);
  }
}
