<template lang="pug">
  .content
    .menu
      level-control(:level="intensity", :max="4", @level="intensity = $event")
        intensity-icon.intensity(:level="intensity", :color="fgIntensity")
      .list
        .item(v-for="name in menu", @click="selected = name",
            :class="{selected: selected === name}") {{ name }}
    .main(:style="{backgroundColor}")
      .controls
        .control(v-for="(type, key) in types")
          input(:type="type", :value="inputs[key]", :checked="inputs[key]",
              :step="steps[key]", :class="{error: inputs[key] !== getData(key)}",
              @input="setData(key, $event.target)")
          label {{ key }}:
          span.data(:class="{error: inputs[key] !== getData(key)}") {{ getData(key) }}
      .lesson-button(v-if="selected === 'lessonButton'")
        lesson-button(ref="lessonButton", :intensity="backgroundColor", v-bind="data")
      .creep(v-if="selected === 'creep'")
        creep(ref="creep", v-bind="data")
        .creep__score(:style="{margin: data.margin + 'px'}")
          .creep__creep(:style="{transform: 'scale(' + data.scale + ')', filter: data.filter}")
          .creep__value(:style="{color: fgIntensity}") 350
</template>

<script>
  import { bgIntensity, fgIntensity } from "~/common/colors";

  import LessonButton from '~/components/curriculum/lesson-button.component';
  import IntensityIcon from '~/components/icon/intensity-icon.component';
  import LevelControl from '~/components/level-control.component';
  import Creep from '~/components/widget/creep.component';

  export default {
    components: {
      'lesson-button': LessonButton,
      'intensity-icon': IntensityIcon,
      'level-control': LevelControl,
      'creep': Creep
    },
    head: {
      title: 'Flat Thirteen | Graphics'
    },
    layout: 'debug',
    constants: {
      defaults: {
        lessonButton: {
          pulseBeat: '1111',
          score: {
            intensity: 3,
            points: 350,
            stars: [0,0,0],
            passing: true,
            perfect: false
          },
          showHollowStars: false
        },
        creep: {
          height: 60,
          width: 120,
          margin: 10,
          scale: 1.2,
          turbulence: {
            type: 'turbulence',
            seed: 0,
            baseFrequency: 0.03,
            numOctaves: 6
          },
          displacement: {
            scale: 12,
            xChannelSelector:'R',
            yChannelSelector: 'G',
          },
          filter: null
        }
      },
      validator: {
        creep: {
          'turbulence.type'(v) {
            return ['turbulence', 'fractalNoise'].indexOf(v) !== -1;
          }
        }
      }
    },
    data() {
      return {
        intensity: 0,
        selected: _.keys(this.defaults)[0],
        data: {},
        types: {},
        inputs: {},
        steps: {}
      }
    },
    methods: {
      getData(key) {
        return _.get(this.data, key);
      },
      setData(key, target) {
        let properties = key.split('.');
        let root = properties.length > 1 ? _.get(this.data, _.initial(properties)) : this.data;
        let type = this.types[key];
        let value = type === 'checkbox' ? target.checked :
          type === 'number' ? _.toNumber(target.value) : target.value;
        this.inputs[key] = value;
        let validator = this.validator[this.selected];
        if (!validator || !validator[key] || validator[key](value)) {
          this.$set(root, _.last(properties), value);
        }
      }
    },
    computed: {
      menu() {
        return _.keys(this.defaults);
      },
      fgIntensity() {
        return fgIntensity(this.intensity);
      },
      backgroundColor() {
        return bgIntensity(this.intensity);
      }
    },
    watch: {
      selected: {
        immediate: true,
        handler(selected) {
          this.data = this.defaults[selected];
          function reduce(result, value, key) {
            if (_.isBoolean(value)) {
              result[key] = 'checkbox';
            } else if (_.isNumber(value)) {
              result[key] = 'number';
            } else if (_.isString(value)) {
              result[key] = 'text';
            } else if (_.isArray(value) || _.isObject(value)) {
              _.reduce(value, (r, v, k) => reduce(r, v, key + '.' + k), result);
            }
            return result;
          }
          this.types = _.reduce(this.data, reduce, {});
          if (this.selected === 'creep') {
            this.$nextTick(() => {
              this.data.filter = this.$refs.creep.filterUrl;
            });
          }
        }
      },
      types: {
        immediate: true,
        handler(types) {
          this.inputs = _.mapValues(types, (v, k) => _.get(this.data, k));
          this.steps = _.pickBy(_.mapValues(this.inputs, value => {
            let split = _.split(value, '.');
            let precision = split[1] && split[1].length;
            return _.round(Math.pow(.1, precision), precision);
          }));
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .content
    display: grid;
    grid: auto-flow / 1fr 3fr;

  .menu, .main
    padding: 20px;

  .intensity
    font-size: 40px;
    font-weight: bold;

  .list
    font-size: 20px;
    margin: 20px 10px;

    .item
      cursor: pointer;
      margin: 2px;

      &.selected
        position: relative;
        font-weight: bold;

        &:before
          content: '>';
          posit(absolute, x, 100%, x, x);
          margin-right: 5px;

  .controls
    background-color: white;
    margin-bottom: 20px;
    padding: 20px;

  input
    margin-right: 5px;
    width: 100px;

    &[type="number"]
      text-align: right;

    &.error
      background-color: lightness(primary-red, 95%);

  .data
    color: gray;

  .creep
    &__score
      display: inline-block;
      position: relative;
      width: 120px;
      height: 60px;

    &__creep
      posit(absolute);
      background-color: gray;

    &__value
      posit(absolute);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: primary-blue;
      font-weight: 600;
      font-size: calc(25px + 4vh);
</style>
