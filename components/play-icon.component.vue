<template lang="pug">
  .play.button
    svg(height="60", width="60", viewBox="0 0 60 60")
      defs(v-if="goalNotes")
        linearGradient(id="play" x1="0" y1="0" x2="0" y2="100%")
          stop(:offset="stopTop", stop-color="white")
          stop(:offset="stopBottom", stop-color="#50ffa0")
      path.play-icon(:d="playPath",
          :fill="goalNotes ? 'url(#play)' : color",
          :stroke="color" stroke-width="6px")
    slot
</template>

<script>
  export default {
    props: {
      playNotes: {
        type: Number,
        default: 0
      },
      goalNotes: {
        type: Number,
        default: 0
      }
    },
    data: function() {
      return {
        color: '#50ffa0',
        playPath: 'M5,5L50,30L5,55Z'
      };
    },
    computed: {
      stopCalculation() {
        let highest = this.goalNotes > 4 ? 15 : 45 - this.goalNotes * 6;
        let notch = (75 - highest) / (this.goalNotes - 1);
        return 75 - notch * this.playNotes;
      },
      stopTop() {
        return (this.playNotes === this.goalNotes ? 0 : this.stopCalculation) + '%';
      },
      stopBottom() {
        return (this.playNotes === this.goalNotes ? 0 : this.stopCalculation + 15) + '%';
      }
    }
  }


</script>
<style scoped lang="stylus" type="text/stylus">
  .content
    margin: 0;
</style>
