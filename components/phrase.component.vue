<template lang="pug">
  svg.phrase(:viewBox="viewBox")
    rect.background(:width="width", :height="height", :class="backgroundClass")
    rect.required(v-for="beatTick in requiredBeatTicks", v-bind="beatTick")
    circle.note(v-for="note in notes", ref="note", v-bind="note")
</template>

<script>
  import Parser from '~/common/composer/parser';

  export default {
    props: {
      pulsesByBeat: Array,
      phrase: Object,
      phraseProperties: Object
    },
    constants: {
      beatUnit: 100
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
          return cx && cy && { cx, cy,
            r: this.beatUnit / 2 / pulses - 10 / pulses,
            transformOrigin: cx + ' ' + cy
          };
        })));
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
</style>
