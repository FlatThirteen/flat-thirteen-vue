<template lang="pug">
  .page
    main-frame(:bonus="true")
      .max(slot="help")
        .icon(@click="initialize(power.notes === 0)") o
</template>

<script>
  import { mapGetters } from 'vuex';

  import MainFrame from '~/components/main/main-frame.component';

  export default {
    components: {
      'main-frame': MainFrame
    },
    head: {
      title: 'Flat Thirteen | Lesson'
    },
    layout: 'debug',
    methods: {
      initialize(max) {
        this.$store.dispatch('progress/initialize', { max });
      }
    },
    computed: {
      ...mapGetters({
        power: 'progress/power'
      })
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    posit(absolute);
    user-select: none;

  .max
    font-size: 40px;
    font-weight: 600;

    .icon
      display: inline-block;
      color: primary-blue;
</style>
