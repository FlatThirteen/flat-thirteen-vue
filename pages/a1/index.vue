<template lang="pug">
  .page
    transition(name="splash")
      .splash(v-if="!ready")
        img.logo(src="~/assets/logo.png")
    transition(name="main")
      main-frame(v-if="ready")
</template>

<script>
  import BuildMixin from '~/mixins/build.mixin';

  import GameAnalytics from '~/common/game-analytics';

  import MainFrame from '~/components/main/main-frame.component';

  export default {
    mixins: [BuildMixin],
    components: {
      'main-frame': MainFrame
    },
    head: {
      title: 'Flat Thirteen | A1'
    },
    watch: {
      ready(ready) {
        if (ready) {
          GameAnalytics.init(this.build);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    posit(absolute);
    user-select: none;

  .main-enter-active
    transition: all 4s;

  .main-enter
    transform: translateY(-100%);

  .splash
    posit(fixed);
    display: flex;
    justify-content: center;
    align-items: center;

  .splash-leave-active
    transition: opacity 1s 1s;

  .splash-leave-to
    opacity: 0;

  .logo
    animation: splash 500ms;
    animation-fill-mode: forwards;

  @keyframes splash
    from
      transform: scale(.1);
      opacity: 0;
    to
      transform: scale(.4);
      opacity: 1;
</style>
