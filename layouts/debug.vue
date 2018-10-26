<template lang="pug">
  .page-frame
    nuxt.page
    .menu
      .build {{ $build }}
      nuxt-link(v-for="(link, label) in views", :to="link", :key="link") {{ label }}
</template>

<script>
  export default {
    data() {
      return {
        views: {
          Sound: '/sound',
          Backing: '/backing',
          Grid: '/grid',
          Stage: '/stage',
          Progress: '/progress',
          Lesson: '/lesson'
        }
      };
    },
    mounted() {
      console.log('BUILD', this.$build);
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    posit(absolute)
    margin-top: 50px;

  .menu
    posit(absolute, 0, 0, x, 0);
    background-color: main-blue;
    padding: 0 1vw 0 content-side-margin;
    overflow-x: scroll;
    white-space: nowrap;

    a
      color: white;
      font-size: 16px;
      line-height: 48px;
      margin-right: 50px;
      text-decoration: none;

      &.nuxt-link-active
        font-weight: 800;

  .build
    posit(fixed, 2px, 2px, x, x);
    color: white;
    font-size: 14px;
</style>
