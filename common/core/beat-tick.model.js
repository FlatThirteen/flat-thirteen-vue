import Tone from '../tone';

export const beatTickEvent = 'beattick';
export const ticksPerBeat = Tone.Transport ? Tone.Transport.PPQ : 192;

export function beatTickFrom(beat, tick = 0) {
  return _.padStart(beat, 2, '0') + ':' + _.padStart(tick.toString(), 3, '0');
}

export function ticks(pulse, pulses) {
  return pulse * ticksPerBeat / pulses;
}

export function pulseFrom(tick, pulses) {
  return tick * pulses / ticksPerBeat;
}

export function duration(pulses) {
  return {
    1: '4n',
    2: '8n',
    3: '8t',
    4: '16n'
  }[pulses];
}

export default {
  EVENT: beatTickEvent,
  PER: ticksPerBeat,
  from: beatTickFrom,
  ticks,
  pulseFrom,
  duration
}
