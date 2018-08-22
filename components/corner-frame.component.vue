<template lang="pug">
  .frame
    slot
    .top
      backing-button.left.button(:level="backingLevel", v-if="power.backing",
          @click.native="$emit('update:backingLevel', backingLevel ? 0 : 1)")
      power-backing(ref="backing", @click="$store.commit('progress/nextPower', 'backing')")
      tempo-control.right(:tempo="tempo", :min="minTempo", :max="maxTempo",
          v-on="$listeners")
    .bottom
      .left: slot(name="bottom-left")
      .right
        .stars(v-if="totalStars")
          star
          span {{ totalStars }}
        .points {{ showPoints | floor }}
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import BackingButton from '~/components/backing-button.component';
  import PowerBacking from '~/components/power/power-backing.component';
  import Star from '~/components/star.component';
  import TempoControl from '~/components/tempo-control.component';

  export default {
    components: {
      'backing-button': BackingButton,
      'power-backing': PowerBacking,
      'star': Star,
      'tempo-control': TempoControl
    },
    props: {
      backingLevel: Number,
      tempo: Number,
      totalPoints: Number,
      totalStars: Number,
      showNextBacking: Boolean
    },
    data() {
      return {
        showPoints: 0
      }
    },
    computed: {
      ...mapGetters({
        power: 'progress/power',
        minTempo: 'progress/minTempo',
        maxTempo: 'progress/maxTempo',
      })
    },
    watch: {
      showNextBacking(showNextBacking) {
        if (showNextBacking) {
          this.$refs.backing.appear();
        }
      },
      totalPoints(totalPoints) {
        TweenMax.to(this.$data, .5, { showPoints: totalPoints });
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .frame
    posit(absolute);

  .top
    posit(absolute, 0, 0, x, 0);
    height: 0;

    .left, .right
      top: 0;
      margin: 20px;

  .bottom
    posit(fixed, x, 0, 0, 0);
    height: 0;

    .left, .right
      bottom: 0;
      background-color: white;
      box-shadow: 0 0 25px 15px white;
      margin: 5px 10px;

  .left
    posit(absolute, x, x, x, 0);

  .right
    posit(absolute, x, 0, x, x);
    text-align: right;

  .points, .stars
    color: active-blue;
    font-size: 40px;
    font-weight: 600;

</style>
