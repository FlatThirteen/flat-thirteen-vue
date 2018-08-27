<template lang="pug">
  .content
    h3
      nuxt-link.button(to="/a1") A1
      | Under development.
</template>

<script>
  export default {
    layout: 'public'
  }
</script>

<style scoped lang="Stylus" type="text/stylus">
  .content
    margin: 3vw content-side-margin;
    font-family: primary-font;
    position: relative;

    .button
      background-color: main-blue;
      border-radius: 50%;
      color: main-blue;
      font-size: 1em;
      text-decoration: none;
      margin: -1vw -5vw;
      padding: 1vw;
      position: absolute;
      height: 2vw;
      width: 2vw;
      text-align: center;

      &:hover
        color: white;
</style>
