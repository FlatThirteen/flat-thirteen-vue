<template lang="pug">
  .content
    nuxt
    .menu
      nuxt-link.home(to="/")
        img.logo(src="../assets/logo.png")
        .text Home
</template>

<style scoped lang="stylus" type="text/stylus">
  .menu
    left: 0;
    position: fixed;
    top: 0;

    .home
      position: relative;

      .logo
        margin: 10px;
        opacity: 0.2;
        transition: all 150ms ease-in-out;
        height: 40px;
        width: 40px;

      .text
        bottom: 0;
        opacity: 0;
        font-weight: bold;
        padding: 0 10px;
        position: absolute;
        text-decoration: none;
        transition: all 150ms ease-in-out;

      &:hover
        .logo, .text
          opacity: 1;
</style>
