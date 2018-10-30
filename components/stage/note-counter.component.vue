<template lang="pug">
  .note-count(v-if="goalNoteCount")
    .note
    .info(ref="count", :class="noteCountClass") {{ noteCount }}
    .info(:class="goalCountClass") /
    .info(:class="goalCountClass") {{ goalNoteCount }}

</template>

<script>
  import { mapGetters } from 'vuex';

  import AnimatedMixin from '~/mixins/animated.mixin';

  import Sound from '~/common/sound/sound';

  export default {
    mixins: [AnimatedMixin],
    props: {
      scene: String
    },
    constants: {
      animationTarget: 'count',
      animationDefinitions: {
        boing: [[.4, {
          transform: 'scale(.8, 1.2)'
        }], [.2, {
          transform: 'scale(1.2, .8)'
        }], [.3, {
          transform: 'scale(.9, 1.1)'
        }], [.3, {
          transform: 'scale(1, 1)'
        }]]
      }
    },
    computed: {
      noteCountClass() {
        let red = this.scene === 'playback' ? this.wrong : this.noteCount > this.goalNoteCount;
        return { red,
          pulse: !this.starting && red
        }
      },
      goalCountClass() {
        let red = this.wrong && this.scene === 'playback';
        return { red,
          pulse: !this.starting && red
        }
      },
      wrong() {
        return this.noteCount !== this.goalNoteCount;
      },
      ...mapGetters({
        starting: 'transport/starting',
        goalNoteCount: 'phrase/goalNoteCount',
        noteCount: 'player/noteCount'
      })
    },
    watch: {
      noteCount(noteCount, oldNoteCount) {
        this.animate('boing');
        if (oldNoteCount === this.goalNoteCount && noteCount > this.goalNoteCount) {
          Sound.playSequence('cowbell', ['F0', 'E5', 'F4'], '32n');
        }
      },
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

    .red
      color: red;

    .pulse
        animation: pulse 1s linear infinite;

    .wrong, .goalWrong
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
