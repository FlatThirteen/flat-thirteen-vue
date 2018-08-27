<template lang="pug">
  corner-frame(:totalPoints="points", :totalStars="totalStars")
    composer(ref="composer")
    transition(name="lesson-container")
      curriculum(v-if="!stageGoal", key="choose", @click="onLesson($event)")
        slot(name="curriculum")
      .lesson-container(v-else, key="stage")
        backing
        stage(:goal="stageGoal", :tempo="tempo", :showNextAuto="showNextAuto",
            @complete="$store.dispatch('lesson/next', {points: $event})")
        .quit.button(@click="clearLesson()") X
    slot(name="help", slot="bottom-left")
      .help
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import Monotonic from '~/common/composer/monotonic';
  import Note from '~/common/core/note.model';

  import Backing from '~/components/backing.component';
  import Composer from '~/components/composer.component';
  import CornerFrame from '~/components/corner-frame.component';
  import Curriculum from '~/components/curriculum/curriculum.component';
  import Stage from '~/components/stage/stage.component';

  export default {
    components: {
      'backing': Backing,
      'composer': Composer,
      'corner-frame': CornerFrame,
      'curriculum': Curriculum,
      'stage': Stage,
    },
    data() {
      return {
        pulseBeat: null,
      };
    },
    destroyed() {
      this.$store.dispatch('lesson/clear');
    },
    methods: {
      onLesson(pulseBeat) {
        this.$store.dispatch('player/update', { pulseBeat,
          layout: this.layout,
          clear: true
        });

        let finished = this.pointsByPulseBeat[pulseBeat].length;
        let stages = !this.mode.layout && pulseBeat === '1111' && !finished ? [
          [{ type: 'drums', notes: 'K|K|K|K' }],
          [{ type: 'drums', notes: 'K|K|K' }],
          [{ type: 'drums', notes: 'K||K|K' }],
          [{ type: 'drums', notes: 'K|K||K' }]
        ] : _.times(4, (i) => {
          let requiredBeatTicks = i < 3 && !finished && {
            '1111': ['00:000'],
            '2111': ['00:096'],
            '1211': ['01:096'],
            '1121': ['02:096'],
            '1112': ['03:096']
          }[pulseBeat] || [];
          return Monotonic.build(_.map(this.soundNames, (soundName) => [new Note(soundName)]),
            _.difference(this.beatTicks, requiredBeatTicks), requiredBeatTicks,
            _.random(3, this.beatTicks.length) - requiredBeatTicks.length)
        });

        this.$store.dispatch('lesson/initialize', { stages });
        this.pulseBeat = pulseBeat;
      },
      clearLesson(points) {
        console.assert(this.pulseBeat);
        this.$store.dispatch('progress/addPoints', {
          pulseBeat: this.pulseBeat,
          amount: { base: points }
        });
        this.$store.dispatch('lesson/clear');
      }
    },
    computed: {
      points() {
        return this.totalPoints + this.lessonPoints;
      },
      showNextAuto() {
        return this.points >= Math.pow(2, this.next.auto) * 100;
      },
      ...mapGetters({
        stage: 'lesson/stage',
        stageGoal: 'lesson/stageGoal',
        done: 'lesson/done',
        lessonPoints: 'lesson/totalPoints',
        beatTicks: 'player/beatTicks',
        soundNames: 'player/soundNames',
        mode: 'progress/mode',
        next: 'progress/next',
        layout: 'progress/layout',
        tempo: 'progress/tempo',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    },
    watch: {
      'mode.backing'(backingLevel) {
        if (backingLevel) {
          this.$refs.composer.reset();
        } else {
          this.$refs.composer.clear();
        }
      },
      stage(stage) {
        if (this.mode.backing) {
          if (stage) {
            this.$refs.composer.updateRhythm();
          } else {
            this.$refs.composer.reset();
          }
        }
      },
      done(done) {
        if (done) {
          this.clearLesson(this.lessonPoints);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .lesson-container
    posit(absolute);
    display: flex;
    flex-direction: column;
    justify-content: center;


  .lesson-container-enter-active, .lesson-container-leave-active
    transition: transform 250ms;

  .lesson-container-enter, .lesson-container-leave-to
    transform: scale(0)

  .quit
    posit(fixed, 0, x, x, 0)
    background-color: white;
    border: solid 1px #DDD;
    border-radius: 5px;
    color: #DDD;
    font-size: 23px;
    padding: 5px;
    margin: 5px;
    z-index: 1;

    &:hover
      color: #888;
      border-color: #888;
</style>
