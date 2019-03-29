<template lang="pug">
  .container(:style="{backgroundColor: bgIntensity}")
    mixer(:show="true")
    stage(ref="stage", :goal="stageGoals[stageIndex]", :stage="stageIndex",
        :intensity="intensity", :tempo="tempo",
        @basePoints="basePoints = $event", @complete="onComplete()")
    .top
      .intensity.left
        level-control.control(:level="intensity", :max="4", @level="setIntensity($event)")
          intensity-icon(:level="intensity")
        stars-control.stars.toggle(:stars="stars", @stars="setStars($event)" :default="intensity")
        lesson-builder(ref="lessonBuilder", @stages="stageGoals = $event")
        composer(ref="composer", :show="true")
      tempo-control.right(:tempo="tempo", @tempo="tempo = $event", :min="60", :max="240")
    .bottom
      .left
        .stage.toggle(v-for="i in 4", :class="{active: i-1 === stageIndex}",
            @click="stageIndex = i - 1") {{ i }}
      .middle
        .pulses-input
          input(type="text", v-model="pulseBeat", placeholder="# pulses", @keydown.stop="")
      .right
        .victory
          span(@click="onVictory()") V
          span(@click="setVictory()") {{ victoryLevel }}
        .points(@click="onVictory(true)") {{ basePoints }}
</template>

<script>
  import { mapGetters } from 'vuex';

  import { bgIntensity } from "~/common/colors";

  import Composer from '~/components/composer.component';
  import IntensityIcon from '~/components/icon/intensity-icon.component';
  import LessonBuilder from '~/components/lesson-builder.component';
  import LevelControl from '~/components/level-control.component';
  import Stage from '~/components/stage/stage.component';
  import StarsControl from '~/components/stars-control.component';
  import TempoControl from '~/components/tempo-control.component';
  import Mixer from '~/components/widget/mixer.component';

  export default {
    components: {
      'composer': Composer,
      'intensity-icon': IntensityIcon,
      'lesson-builder': LessonBuilder,
      'level-control': LevelControl,
      'stage': Stage,
      'stars-control': StarsControl,
      'tempo-control': TempoControl,
      'mixer': Mixer
    },
    head: {
      title: 'Flat Thirteen | Stage'
    },
    layout: 'debug',
    provide() {
      return { getComposer: () => this.$refs.composer }
    },
    data() {
      return {
        pulseBeat: '1111',
        stageGoals: [],
        stageIndex: 0,
        intensity: 0,
        layout: [
          { noteByKey: { q: 'snare', a: 'kick' } },
        ],
        tempo: 120,
        basePoints: 0,
        stars: [],
        victoryLevel: 10
      }
    },
    mounted() {
      this.updateIfPossible();
    },
    methods: {
      setIntensity(level) {
        this.intensity = level;
        this.updateIfPossible();
      },
      setStars(stars) {
        this.stars = stars;
        this.updateIfPossible();
      },
      setVictory(level = this.victoryLevel > 1 ? this.victoryLevel - 1 : 10) {
        this.victoryLevel = level;
      },
      onVictory(clear) {
        this.$refs.stage.setVictory(clear ? 0 : this.victoryLevel);
      },
      onComplete() {
        this.stageIndex = (this.stageIndex + 1) % 4;
        if (!this.stageIndex) {
          this.updateIfPossible();
        }
      },
      updateIfPossible() {
        if (this.numBeats > 1 && this.$refs.lessonBuilder) {
          this.stageGoals = this.$refs.lessonBuilder.build({stars: this.stars});
          this.$refs.composer.setStage(_.defaults({ layout: 1 }, this));
        }
      }
    },
    computed: {
      bgIntensity() {
        return bgIntensity(this.intensity);
      },
      ...mapGetters({
        numBeats: 'player/numBeats'
      })
    },
    watch: {
      pulseBeat: {
        immediate: true,
        handler(pulseBeat) {
          this.$store.dispatch('player/update', { pulseBeat, layout: this.layout });
          this.updateIfPossible();
        }
      }
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .container
    posit(absolute);
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;

  .top
    posit(absolute, 0, 0, x, 0)
    height: 0;

    .left, .right
      posit(absolute, 0, x, x, x);
      margin: 20px;

    .right
      posit(absolute, x, 0, x, x);

  .bottom
    posit(fixed, x, 0, 0, 0)
    display: flex;
    justify-content: space-between;
    align-items: flex-end;

    .left, .right
      margin: 5px 10px;
      min-width: 90px;

    input
      background: transparent;
      border: none;
      margin: 0;
      text-align: center;

      &::placeholder
        color: primary-red;
        font-size: 14px;

      &:focus
        outline: none;

  .right
    text-align: right;

  toggle-color('.toggle', primary-blue);

  .stars
    display: inline-block;

  .stage
    display: inline-block;
    border-radius: 5px;

  .stage, .intensity, .victory
    font-size: 40px;
    font-weight: bold;

  .control
    vertical-align: middle;

  .points
    color: active-blue;
    font-size: 40px;
    font-weight: 600;
</style>
