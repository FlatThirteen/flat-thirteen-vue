<template lang="pug">
  .page
    main-frame
      .reset.button(slot="curriculum",
          @click="$store.dispatch('progress/initialize')") Reset
      .auto(slot="help")
        .icon o
        | :{{ power.auto }}
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
    mounted() {
      this.$store.dispatch('progress/initialize', { max: true });
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

  .reset
    posit(absolute, x, x, x, 20px);
    background-color: white;
    border: solid 1px #EEE;
    padding: 5px;

  .auto
    font-size: 40px;
    font-weight: 600;

    .icon
      display: inline-block;
      color: primary-blue;
</style>
