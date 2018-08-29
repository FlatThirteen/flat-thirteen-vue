<template lang="pug">
  corner-frame(:totalPoints="totalPoints", :totalStars="totalStars")
    curriculum(@mousedown="onLesson($event)")
    .points(slot="bottom-left")
      span(@mouseover="showNextAuto()", @click="max()") +
      input(type="number", v-model.number="addPoints", :class="{invalid: invalidPoints}")
      .power
        power-auto(ref="auto", @click="$store.dispatch('progress/next', 'auto')")
</template>

<script>
  import { mapGetters } from 'vuex';

  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import PowerAuto from '~/components/power/power-auto.component';

  import { MAX_POINTS } from '~/store/progress';

  export default {
    components: {
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'power-auto': PowerAuto
    },
    head: {
      title: 'Flat Thirteen | Progress'
    },
    layout: 'debug',
    data() {
      return {
        addPoints: MAX_POINTS
      };
    },
    methods: {
      max() {
        this.$store.dispatch('progress/initialize', { max: !this.power.notes});
        this.$refs.auto.fade();
      },
      onLesson(pulseBeat) {
        if (this.invalidPoints) {
          return;
        }
        this.$store.dispatch('progress/addPoints', { pulseBeat,
          amount: { base: this.addPoints }
        });
      },
      showNextAuto() {
        if (this.next.auto) {
          this.$refs.auto.appear(this.next.auto);
        }
      }
    },
    computed: {
      invalidPoints() {
        return this.addPoints <= 0 || this.addPoints > MAX_POINTS;
      },
      ...mapGetters({
        power: 'progress/power',
        next: 'progress/next',
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

  .power
    posit(absolute, x, x, 0, 160px)
    height: 100%;
</style>
