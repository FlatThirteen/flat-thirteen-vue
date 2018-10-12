<template lang="pug">
  .faces(:class="facesClass")
    particle-fx(:type="particleType", :count="particleCount")
    .face(v-for="(pulses, beat) in pulsesByBeat", :class="faceClass[beat]")
      .eyes(:class="eyesClass[beat]")
</template>

<script>
  import { mapGetters } from 'vuex';

  import BeatTick from '~/common/core/beat-tick.model';

  import ParticleFx from '~/components/particle-fx.component';

  export default {
    components: {
      'particle-fx': ParticleFx
    },
    props: {
      scene: String,
      nextScene: String,
      basePoints: Number,
      beatWrong: Number,
      disable: Boolean
    },
    data() {
      return {
        activeBeat: -1
      };
    },
    mounted() {
      this.$bus.$on(BeatTick.EVENT, this.beatTickHandler);
    },
    destroyed() {
      this.$bus.$off(BeatTick.EVENT, this.beatTickHandler);
    },
    methods: {
      beatTickHandler({beat}) {
        if (!this.paused) {
          this.activeBeat = beat;
        }
      },
    },
    computed: {
      facesClass() {
        return [this.scene, this.disable ? 'disable' : {
          selected: this.selected || this.keyMode
        }];
      },
      faceClass() {
        return _.times(this.numBeats, beat => ({
          active: this.activeBeat === beat,
          cursor: this.cursorBeat === beat,
          wrong: this.beatWrong === beat && this.basePoints < 90,
          very: this.basePoints < 70
        }));
      },
      eyesClass() {
        return _.times(this.numBeats, beat => {
          let mad = this.goalNoteCount && this.noteCount > this.goalNoteCount &&
              (!this.selected || this.cursorBeat !== beat);
          return {
            mad,
            closed: this.scene === 'goal' || this.nextScene === 'goal',
            ready: this.scene === 'playback' || this.nextScene === 'playback',
            up: this.cursorBeat === beat,
            left: mad ? beat >= this.numBeats / 2 : this.cursorBeat + 1 === beat,
            right: mad ? beat < this.numBeats / 2 : this.cursorBeat - 1 === beat,
            very: mad && (!beat || beat === this.numBeats - 1)
          };
        });
      },
      cursorBeat() {
        return this.scene === 'victory' ? -1 : this.beatPulse[0];
      },
      particleType() {
        return this.scene === 'victory' ? 'confetti' : null;
      },
      particleCount() {
        return this.scene === 'victory' ? this.basePoints : null;
      },
      ...mapGetters({
        keyMode: 'keyMode',
        paused: 'transport/paused',
        goalNoteCount: 'phrase/goalNoteCount',
        numBeats: 'player/numBeats',
        noteCount: 'player/noteCount',
        pulsesByBeat: 'player/pulsesByBeat',
        selected: 'player/selected',
        beatPulse: 'player/beatPulse'
      })
    },
    watch: {
      paused(paused) {
        if (paused) {
          this.activeBeat = -1;
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  faces-height = 5vh;

  particle-fx
    posit(absolute);
    margin: - faces-height 0 0;

  .faces
    display: flex;
    margin: auto;
    background-color: back-blue;
    position: relative;
    max-width: 80vh;
    width: 100%;
    transition: background-color 150ms ease-in-out;

    &.disable
      opacity: 0.6;

  &.victory
      background-color: back-green;

  .face
    flex: 1 1 0;
    height: faces-height;
    min-height: 25px;
    margin: 5px;
    background-color: main-blue;
    transition: background-color 150ms ease-in-out;

    .faces:not(.disable) &.cursor
      background-color: active-blue;

    .victory &
      background-color: active-green;

  eyes-path(tl, bl = 100% - tl, tr = tl, br = bl, tl2 = tl, bl2 = bl, tr2 = tr, br2 = br)
    polygon(0% tl, 50% tl2, 50% tr2, 100% tr, 100% br, 50% br2, 50% bl2, 0% bl);

  clip-path(param)
    clip-path param;
    -webkit-clip-path param;

  .eyes
    posit(relative, 25%, x, x, 0);
    margin: 0 auto;
    height: 17px;
    width: 4vw;
    min-width: 30px;
    max-width: 40px;
    padding: 1px;
    transition: all 100ms ease-in-out;
    display: flex;
    justify-content: space-between;
    clip-path(eyes-path(0%));

    &.closed
      clip-path(eyes-path(60%, 70%));

    &.ready
      clip-path(eyes-path(10%, 80%));

    .goal .wrong &
      clip-path(eyes-path(50%, 70%, 35%, 60%, 65%, 70%, 55%));
      animation-duration: 50ms;

    .very.wrong &
      clip-path(eyes-path(50%, 70%, 15%, 80%, 65%, 70%, 55%));
      animation-duration: 350ms;

    .victory &
      clip-path: none;

    .active &
      animation: blink;
      animation-duration: 250ms;

    .selected.faces:not(:hover) &
      &.up
        top: 0;

      &.left:not(.mad), &.right:not(.mad)
        margin-top: -2px;

      &.left
        left: -.5vw;

      &.right
        left: .5vw;

    &.mad
      clip-path(eyes-path(0, 100%, 15%, 100%, 60%, 100%, 50%));

      .faces:hover &
        clip-path(eyes-path(0, 100%, 15%, 90%, 60%, 100%, 50%, 50%));

    .faces &.mad
      animation-duration: 350ms;
      top: 50%;

      &.left
        left: -.5vw;

        &.very
          left: -1.5vw;

      &.right
        left: .5vw;

        &.very
          left: 1.5vw;

    &:before, &:after
      background-color: eye-color = #000;
      content: '';
      border: solid 0 eye-color;
      border-radius: 50%;
      height: 17px;
      width: 12px;
      transition: all 150ms ease-in-out;

      .victory &
        animation: bounce 500ms ease infinite;
        background-color: transparent;
        border-radius: 50% 50% 0 0;
        border-width: 3px 0 0 0;

    &:before
      left: 0;

    &:after
      right: 0;

    &:not(.mad):hover
      margin-top: 8px;

      &:before, &:after
        height: 2px;

  .eyes:hover:active
    animation: shake 500ms ease infinite;

  @keyframes blink
    0%, 100%
      transform: translateY(0) scaleY(1);
    20%
      transform: translateY(1vh) scaleY(.3)
    40%
      transform: translateY(1.4vh) scaleY(.2);
    80%
      transform: translateY(1vh) scaleY(.5)

  @keyframes bounce
    0%, 95%
      transform: translateY(0)
    25%
      transform: translateY(.7vh)
    50%
      transform: translateY(-.8vh)
    65%
      transform: translateY(.5vh)
    80%
      transform: translateY(-.3vh)

  @keyframes shake
    0%, 100%
      transform: translate3d(0, 0, 0)
    25%
      transform: translate3D(.7vw, -.1vh, 0)
    50%
      transform: translate3D(-.8vw, -.2vh, 0)
    65%
      transform: translate3D(.5vw, -.2vh, 0)
    80%
      transform: translate3D(-.3vw, -.1vh, 0)
</style>
