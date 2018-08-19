<template lang="pug">
  corner-frame(:backingLevel.sync="backingLevel", :tempo.sync="tempo",
      :totalPoints="totalPoints", :totalStars="totalStars")
    curriculum(:backingLevel.sync="backingLevel", :layoutIndex.sync="layoutIndex",
        v-bind:tempo.sync="tempo", v-on:mousedown="onLesson($event)")
    .points(slot="bottom-left") +
      input(type="number", v-model.number="addPoints", :class="{invalid: invalidPoints}")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';

  import { MAX_POINTS } from '~/store/progress';

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum
    },
    head: {
      title: 'Flat Thirteen | Lesson'
    },
    layout: 'debug',
    mounted() {
      this.$store.dispatch('progress/reset');
    },
    data() {
      return {
        backingLevel: 0,
        layoutIndex: 0,
        tempo: 120,
        addPoints: MAX_POINTS
      };
    },
    methods: {
      onLesson(pulseBeat) {
        if (this.invalidPoints) {
          return;
        }
        this.$store.commit('progress/addPoints', { pulseBeat,
          layoutIndex: this.layoutIndex,
          tempo: this.tempo,
          backingLevel: this.backingLevel,
          amount: {
            base: this.addPoints
          }
        });
      }
    },
    computed: {
      invalidPoints() {
        return this.addPoints <= 0 || this.addPoints > MAX_POINTS;
      },
      ...mapGetters({
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    position: absolute;
    user-select: none;

  .points input
    border: none;
    color: active-blue;
    font-size: 40px;
    font-weight: 600;
    width: 100px;

    &.invalid
      color: primary-red;

    &:focus
      outline: none;
</style>
