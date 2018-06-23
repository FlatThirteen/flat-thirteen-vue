<template lang="pug">
  .content
    img.logo(src="~/assets/logo.png")
    .header
      h1 Flat Thirteen
      h3 Teaching music through gaming
    .menu
      nuxt-link(v-for="(link, label) in views", :to="link", :key="link") {{ label }}
    nuxt
</template>

<script>
  export default {
    data: () => {
      return {
        views: {
          Home: "/",
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
    padding: 0 1vw 0 content-side-margin;

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
