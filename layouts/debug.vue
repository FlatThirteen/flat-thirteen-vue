<template lang="pug">
  .content
    nuxt.page
    .menu
      nuxt-link(v-for="(link, label) in views", :to="link", :key="link") {{ label }}

</template>

<script>
  export default {
    data: () => {
      return {
        views: {
          Home: "/",
          About: '/about',
          Sound: '/sound',
          Backing: '/backing'
        }
      };
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .page
    margin-top: 50px;

  .menu
    background-color: main-blue;
    display: block;
    height: 48px;
    padding: 0 1vw 0 content-side-margin;
    position: absolute;
    top: 0;
    width: 100%;

    a
      display: inline-block;
      color: white;
      font-size: 16px;
      line-height: 48px;
      margin-right: 50px;
      text-decoration: none;
      vertical-align: middle;
      cursor: pointer;

      &.nuxt-link-active
        font-weight: 800;

    .links
      padding-top: 15px;
</style>
