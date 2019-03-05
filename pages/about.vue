<template lang="pug">
  div
    .content
      h2 Mission
      p.
        Flat Thirteen's mission is to make music education accessible to the widest
        possible audience by leveraging the principles of game design to attract
        and engage students on the most universal platform, the web.
        The goal is to develop a library of games that are playable by students of
        any musical background or training, building the understanding and skills
        needed by any musician, independent of any particular instrument.
      p.
        Most music teachers focus on teaching particular instruments, providing
        just enough music theory to get through their lessons and help their
        students play prepared pieces.  We want to complement that with development
        of ear training, composition, and arrangement, and the opportunity to
        create their own accompaniment.
      p.
        When music is offered in elementary schools, it is typically
        one-size-fits-all; unable to address the wide variety of musical
        backgrounds of the students, from those who have had zero musical exposure
        to those who have already been playing instruments for years. We want to
        make it possible to offer music in the classroom
        while allowing each student to engage at the right level for their needs,
        and create their own music that they can share with their friends and
        family, without requiring the administration of specialized music
        instructors. (Though if budgets allow for it, having special musical
        instructors would be even better!)
      h2 What makes us Different
      p.
        While there are plenty of music making apps out there trying to reach a
        broader audience by making it easy to make pleasing sounds without having
        to understand the musical theory, we believe it is better to be the guiding
        path towards learning music theory while making music.
      p.
        While most music making apps try to look pretty while doing as much as
        possible, we believe it is more important to start simple, only providing
        a handful of tools at a time until understanding is achieved before
        unlocking more and more powerful tools.
      p.
        The tools for making music are more accessible and powerful than ever
        before, yet there is a huge gap between those tools and musical education
        as it exists today.  We want to bridge that gap, and create more musicians
        making more music in the world.
      h2 Behind the Scenes
      p.
        Flat Thirteen is the brainchild of Stanley Chen, leveraging his background
        as both an experienced software engineer and a trained musician,
        songwriter, and multi-instrumentalist, while also pulling from past
        training and experience in UX, animation, and music education and studies
        in game design and sound design.
      p.
        Flat Thirteen is built on Vue/Nuxt, and uses
        <a target="_blank" href="https://tonejs.github.io/">Tone.js</a> for
        handling all WebAudio.  All sounds are synthesized on the client; no
        samples are used. The game is designed to work at any resolution and is
        touch screen friendly, though browser support of WebAudio is not
        universally  awesome. The source code is currently free to peruse on <a
        target="_blank" href="https://github.com/FlatThirteen/flat-thirteen-vue">GitHub</a>.
    feedback
</template>

<script>
  import Feedback from '~/components/feedback.component';

  export default {
    components: {
      'feedback': Feedback
    },
    head: {
      title: 'Flat Thirteen | About'
    },
    layout: 'public'
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  h2
    margin-bottom: 10px;

  p + h2
    margin-top: 40px;

  p
    font-family: sans-serif;
    font-size: 16px;
    margin: 10px 0;

  .content
    margin: 3vw content-side-margin;
    max-width: 700px;
</style>
