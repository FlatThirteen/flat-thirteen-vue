<template lang="pug">
  svg.phrase(:viewBox="viewBox")
    rect.background(:width="width", :height="height", :class="backgroundClass")
    rect.required(v-for="beatTick in requiredBeatTicks", v-bind="beatTick")
    circle.fx(v-for="note in notes", ref="fx", v-bind="note.properties")
    circle.note(v-for="note in notes", ref="note", v-bind="note.properties")
</template>

<script>
  import AnimatedMixin from '~/mixins/animated.mixin';

  import Parser from '~/common/composer/parser';
  import Note from '~/common/core/note.model';
  import Tone from '~/common/tone';

  export default {
    mixins: [AnimatedMixin],
    props: {
      phraseKey: String,
      pulsesByBeat: Array,
      phrase: Object, // phrase[beatTick] = [Note]
      phraseProperties: Object // { unitHeight, xByBeatTick, yByNote }
    },
    constants: {
      beatUnit: 100,
      animationDefinitions: {
        note: [[0, {
          transform: 'scale(1)'
        }], [.4, {
          transform: 'scale(1.2)'
        }], [.3, {
          transform: 'scale(0.8)'
        }], [.3, {
          transform: 'scale(1)'
        }]],
        fx: [[0, {
          transform: 'scale(1)',
          opacity: 1
        }], [.4, {
          transform: 'scale(1.5)',
          opacity: 0.5
        }], [.6, {
          transform: 'scale(2)',
          opacity: 0
        }]]
      }
    },
    methods: {
      onBeatTick(beatTick, time) {
        let indices = this.indicesByBeatTick[beatTick];
        _.forEach(indices, index => {
          Note.from(this.notes[index].note.toString()).play(time);
          Tone.Draw.schedule(() => {
            this.animate('note', { element: this.$refs.note[index] });
            this.animate('fx', { element: this.$refs.fx[index] });
          }, time);
        });
      }
    },
    computed: {
      height() {
        return this.phraseProperties.unitHeight * this.beatUnit;
      },
      width() {
        return this.pulsesByBeat.length * this.beatUnit;
      },
      viewBox() {
        return '0 0 ' + this.width + ' ' + this.height;
      },
      notes() {
        return _.compact(_.flatMap(this.phrase, (notes, beatTick) => _.map(notes, note => {
          let cx = this.phraseProperties.xByBeatTick[beatTick] * this.beatUnit;
          let cy = this.phraseProperties.yByNote[note.toString()] * this.beatUnit;
          let pulses = this.pulsesByBeat[Parser.beatFromBeatTick(beatTick)];
          return cx && cy && { beatTick, note,
            properties: { cx, cy,
              r: this.beatUnit / 2 / pulses - 10 / pulses,
              'transform-origin': cx + ' ' + cy
            }
          };
        })));
      },
      indicesByBeatTick() {
        return _.invertBy(this.notes, note => note.beatTick);
      },
      requiredBeatTicks() {
        return _.compact(_.flatMap(this.phrase.requiredBeatTicks, (beatTicks, i) => _.map(beatTicks, beatTick => {
          let width = this.beatUnit / this.pulsesByBeat[Parser.beatFromBeatTick(beatTick)] - 3;
          return {
            x: this.phraseProperties.xByBeatTick[beatTick] * this.beatUnit - width / 2,
            y: 5 * i,
            width,
            height: this.height - 10 * i,
            opacity: .12 + .01 * beatTicks.length
          };
        })));
      },
      backgroundClass() {
        return {
          duplicate: this.phrase.duplicate === 1,
          triplicate: this.phrase.duplicate === 2,
          quadruplicate: this.phrase.duplicate > 2,
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .background
    fill: main-blue;

    &.duplicate
      fill: primary-red;

    &.triplicate
      fill: purple;

    &.quadruplicate
      fill: hotpink;

  .required
    fill: yellow;

  .fx
    fill: white;
</style>
