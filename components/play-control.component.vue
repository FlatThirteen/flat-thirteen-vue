<template lang="pug">
  play-button(ref="play", @click="onPlay()")
</template>

<script>
  import { mapGetters } from 'vuex'

  import BeatTick from '~/common/core/beat-tick.model';
  import Sound from '~/common/sound/sound';
  import PlayButton from '~/components/stage/play-button.component';

  export default {
    components: {
      'play-button': PlayButton
    },
    props: {
      playTime: {
        type: String,
        default: undefined
      }
    },
    mounted() {
      window.addEventListener('keydown', this.onKeyDown);
      this.$bus.$on(BeatTick.BEAT, this.beatHandler);
    },
    destroyed: function() {
      window.removeEventListener('keydown', this.onKeyDown);
      this.$bus.$off(BeatTick.BEAT, this.beatHandler);
    },

    methods: {
      onKeyDown(event) {
        if (event.key === 'Enter') {
          this.onPlay();
        }
      },
      beatHandler({count}) {
        this.$refs.play.count(count);
      },
      onPlay() {
        Sound.resume().then(() => {
          this.$store.dispatch('transport/toggle', this.playTime);
        });
      }
    },
    computed: {
      ...mapGetters({
        playing: 'transport/playing'
      })
    },
    watch: {
      playing(playing) {
        if (!playing) {
          this.$refs.play.count(0);
        }
      }
    }
  }
</script>
