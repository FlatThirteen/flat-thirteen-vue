<template lang="pug">
  .page
    main-frame
</template>

<script>
  import MainFrame from '~/components/main/main-frame.component';

  export default {
    components: {
      'main-frame': MainFrame
    },
    head: {
      title: 'Flat Thirteen | A1'
    },
    mounted() {
      this.$store.dispatch('progress/reset');
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    posit(absolute);
    user-select: none;
</style>
