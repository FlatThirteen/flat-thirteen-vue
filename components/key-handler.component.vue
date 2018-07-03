<template lang="pug">
  .key-handler(v-if="show") {{ keysHeld }}
</template>

<script>
  import { mapGetters } from 'vuex';

  export default {
    props: {
      show: false,
      player: false
    },
    mounted() {
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);
      window.addEventListener('mousemove', this.onMouseMove);
    },
    destroyed() {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);
      window.removeEventListener('mousemove', this.onMouseMove);
    },
    methods: {
      onKeyDown(event) {
        let updatePlayer = !this.keysHeld[event.key] && this.player;
        this.$store.commit('keyDown', event);
        if (updatePlayer) {
          if (event.key === 'Escape') {
            this.$store.commit('keyMode');
            this.$store.commit('player/unselect');
          } else if (event.key === 'Backspace') {
            if (this.oneKeyHeld) {
              this.$store.dispatch('player/move', -1);
            }
          } else if (event.key === 'ArrowLeft') {
            this.$store.dispatch('player/move', -1);
          } else if (event.key === 'ArrowRight') { // Right: Select next
            this.$store.dispatch('player/move', 1);
          }
        }
      },
      onKeyUp(event) {
        this.$store.commit('keyUp', event);
        if (this.player && this.noKeysHeld && (event.key === ' ')) {
          this.$store.dispatch('player/move', 1);
        }
      },
      onMouseMove() {
        this.$store.dispatch('disableKeyMode');
      }
    },
    computed: {
      ...mapGetters(['keysHeld', 'noKeysHeld', 'oneKeyHeld'])
    }
  }
</script>
