<template lang="pug">
  transition(name="page")
    .page(v-if="ready")
      main-frame
</template>

<script>
  import GameAnalytics from '~/common/game-analytics';

  import MainFrame from '~/components/main/main-frame.component';

  export default {
    components: {
      'main-frame': MainFrame
    },
    head: {
      title: 'Flat Thirteen | A1'
    },
    data() {
      return {
        ready: false
      }
    },
    mounted() {
      GameAnalytics.init(this.$build);
      this.ready = true;
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    posit(absolute);
    user-select: none;

  .page-enter-active
    transition: all 3s;

  .page-enter
    transform: translateY(-100%);
</style>
