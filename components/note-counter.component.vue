<template lang="pug">
  .note-count(v-if="goalNoteCount")
    .note
    .info(:class="{wrong}") {{ noteCount }}
    span(:class="{wrong: goalWrong}") /
    .info(:class="{wrong: goalWrong}") {{ goalNoteCount }}

</template>

<script>
  import { mapGetters } from 'vuex';

  export default {
    computed: {
      wrong() {
        return this.goalNoteCount && (this.scene === 'playback' ?
            this.noteCount !== this.goalNoteCount : this.noteCount > this.goalNoteCount);
      },
      goalWrong() {
        return this.scene === 'playback' && this.noteCount !== this.goalNoteCount;
      },
      ...mapGetters({
        goalNoteCount: 'phrase/goalNoteCount',
        noteCount: 'player/noteCount',
        scene: 'stage/scene'
      })
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">

  .note-count
    font-size: 8vh;
    line-height: 7vh;

    .note
      background-color: black;
      border-radius: 50%;
      display: inline-block;
      height: 8vh;
      margin-right: 1vh;
      width: 8vh;
      vertical-align: bottom;

    .wrong
      color: red;
      animation: pulse 1s linear infinite;

  .info
    display: inline-block;

  @keyframes pulse
    0%, 100%
      transform: scale(1);
    20%, 25%
      transform: scale(1.2);
    75%
      transform: scale(0.8);

</style>
