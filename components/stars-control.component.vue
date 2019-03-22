<template lang="pug">
  .toggle(:class="{active}", @click="onBackground()")
    star(v-for="i in 3", :key="i", :hollow="!starColors[i-1]", :color="starColors[i-1]",
        @click.native.stop="onStar(i)")
</template>

<script>
  import Vue from 'vue';
  import { intensityColors, fgIntensity } from '~/common/colors';

  import Star from '~/components/star.component';

  export default {
    components: {
      'star': Star
    },
    props: {
      stars: Array,
      default: Number
    },
    methods: {
      onBackground() {
        this.emit(!_.isArray(this.stars) || this.stars.length ? [] : null);
      },
      onStar(num) {
        let stars = this.stars || [];
        if (num < stars.length) {
          this.emit(_.take(stars, num));
        } else if (num > stars.length) {
          this.emit(stars.concat(_.times(num - stars.length, () => this.default)));
        } else {
          let intensity = (stars[num - 1] + 1) % intensityColors.length;
          _.times(num, i => {
            if (!intensity || stars[i] < intensity) {
              Vue.set(stars, i, intensity);
            }
          });
          this.emit(stars);
        }
      },
      emit(value) {
        this.$emit('stars', value);
      }
    },
    computed: {
      active() {
        return _.isArray(this.stars);
      },
      starColors() {
        return _.map(this.stars, star => fgIntensity(star));
      }
    }
  }
</script>
