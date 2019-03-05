<template lang="pug">
  .content
    nuxt-link(to="/")
      img.logo(src="~/assets/logo.png")
    .header
      h1 Flat Thirteen
      h3 Teaching music through gaming
    .menu
      nuxt-link(to="/", key="/", exact).home Home
      nuxt-link(v-for="(link, label) in views", :to="link", :key="link") {{ label }}
    nuxt
</template>

<script>
  export default {
    data() {
      return {
        views: {
          About: '/about'
        }
      };
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  h1
    color: primary-blue;
    font-size: 4vw;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin-top: 1.4vw;
    margin-bottom: 1vw;

  h3
    font-size: 2vw;
    font-weight: 400;

  img.logo
    position: absolute;
    margin: 1vw 3vw;
    width: 7vw;
    height: 7vw;

  .header
    margin: 2vw content-side-margin;

  .menu
    background-color: main-blue;
    display: block;
    height: 48px;
    padding: 0 1vw;
    position: relative;

    a
      display: inline-block;
      color: white;
      font-size: 16px;
      line-height: 48px;
      margin-right: 50px;
      text-decoration: none;
      vertical-align: middle;
      transition: all 250ms;
      transform: scale(1);
      transform-origin: center left;

      &.nuxt-link-active
        font-weight: 800;
        transform: scale(2);

    .home
      margin-left: 2vw;
      margin-right: 2vw;
      min-width: 7vw;

      &.nuxt-link-active
        opacity: 0;
        transform: scale(1);

  .nuxt-link-exact-active
    cursor: default;
</style>
