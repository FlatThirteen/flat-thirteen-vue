<template lang="pug">
  .content
    .games
      nuxt-link.button(to="/a1")
        drum-blox
    svg.triangle(height="30", width="30", viewBox="0 0 40 40")
      path(d="M20,0 L40,40, L0,40 Z")
    .text
      p This game is a #[strong work in progress]
      p Make sure your #[strong sound is turned up!]
      p Works best with Chrome, mobile may be wonky
    feedback
</template>

<script>
  import Feedback from '~/components/feedback.component';
  import DrumBlox from '~/components/title/drum-blox.component';

  export default {
    components: {
      'feedback': Feedback,
      'drum-blox': DrumBlox
    },
    layout: 'public'
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .content
    font-family: primary-font;
    position: relative;
    text-align: center;

  .games
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;
    margin: 0 3vh;

    a
      margin: 2vh;
      text-decoration: none;

  .triangle
    fill: primary-green;
    margin: auto;

  .text
    margin: 10px;

    p
      font-size: 3vw;
</style>
