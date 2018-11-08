<template lang="pug">
  corner-frame(:totalPoints="points", :totalStars="totalStars", @hint="hint = $event")
    composer(ref="composer")
    transition(name="lesson-container")
      curriculum(v-if="!stageGoal", key="choose", :scrollTop="scrollTop", :hint="hint",
          @click="onLesson($event)")
        slot(name="curriculum")
      .lesson-container(v-else, key="stage", :style="transformOrigin")
        backing
        stage(:goal="stageGoal", :tempo="tempo", :showNextAuto="showNextAuto",
            @basePoints="stagePoints = $event", @complete="nextStage($event)")
        .quit.button(@click="clearLesson()") X
    slot(name="help", slot="bottom-left")
      .help
</template>

<script>
  import { TweenMax } from 'gsap';
  import { mapGetters } from 'vuex';

  import Monotonic from '~/common/composer/monotonic';
  import Note from '~/common/core/note.model';
  import GameAnalytics from '~/common/game-analytics';

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
        lessonPoints: 0,
        stagePoints: 0,
        hint: null,
        scrollTop: 0,
        transformOrigin: {}
      };
    },
    destroyed() {
      this.$store.dispatch('progress/setStages');
    },
    methods: {
      onLesson({pulseBeat, x, y, scrollTop}) {
        this.scrollTop = scrollTop;
        this.transformOrigin = {
          transformOrigin: x + 'px ' + (y - scrollTop) + 'px'
        };
        this.$store.dispatch('player/update', { pulseBeat,
          layout: this.layout,
          clear: true
        });

        let finished = this.pointsByPulseBeat[pulseBeat].length;
        let stages = !this.level.layout && pulseBeat === '1111' && !finished ? [
          [{ type: 'drums', notes: 'K|K|K|K' }],
          [{ type: 'drums', notes: 'K|K|K' }],
          [{ type: 'drums', notes: 'K||K|K' }],
          [{ type: 'drums', notes: 'K|K||K' }]
        ] : _.times(4, (stage) => {
          let notes = finished || this.level.layout || stage ? 0 : this.beatTicks.length;
          let requiredBeatTicks = stage < 3 && !finished && {
              '1111': ['00:000'],
              '2111': ['00:096'],
              '1211': ['01:096'],
              '1121': ['02:096'],
              '1112': ['03:096']
            }[pulseBeat] || [];
          if (!notes) {
            if (pulseBeat !== '1111' && (this.level.layout || !finished)) {
              requiredBeatTicks.push('00:000'); // TODO: Do only when metronome off
            }
            let maxNotes = this.beatTicks.length - (this.level.layout ? 0 : 1);
            let minNotes = Math.max(3, maxNotes - finished - stage);
            notes = minNotes < maxNotes ? _.random(minNotes, maxNotes) : maxNotes;
            // console.log(finished, this.level.layout, i, minNotes, maxNotes, notes, requiredBeatTicks);
          }
          return Monotonic.build(_.map(this.availableNotes, (note) => [Note.from(note)]),
            _.difference(this.beatTicks, requiredBeatTicks), requiredBeatTicks,
            notes - requiredBeatTicks.length)
        });

        this.$store.dispatch('progress/setStages', { stages,
          name: this.level.layout + '-' + pulseBeat
        });
        if (this.level.backing) {
          this.$refs.composer.reset();
        }
        this.pulseBeat = pulseBeat;
      },
      nextStage(points) {
        this.lessonPoints += points;
        this.$store.dispatch('progress/nextStage');
        if (this.level.backing) {
          this.$refs.composer.updateRhythm();
        }
      },
      clearLesson(points) {
        console.assert(this.pulseBeat);
        console.assert(this.stagePoints);
        if (!points) {
          GameAnalytics.fail(this.stagePoints);
        }
        this.$store.dispatch('progress/addPoints', {
          pulseBeat: this.pulseBeat,
          amount: { base: points }
        });
        this.lessonPoints = 0;
        this.$refs.composer.clear();
        this.$store.dispatch('progress/setStages');
      }
    },
    computed: {
      points() {
        return this.totalPoints + this.lessonPoints;
      },
      showNextAuto() {
        return this.points >= Math.pow(2, this.next.auto) * 150 && this.points >= this.nextPoints;
      },
      ...mapGetters({
        stageGoal: 'progress/stageGoal',
        lessonDone: 'progress/lessonDone',
        beatTicks: 'player/beatTicks',
        availableNotes: 'player/availableNotes',
        level: 'progress/level',
        next: 'progress/next',
        layout: 'progress/layout',
        tempo: 'progress/tempo',
        pointsByPulseBeat: 'progress/pointsByPulseBeat',
        nextPoints: 'progress/nextPoints',
        totalPoints: 'progress/totalPoints',
        totalStars: 'progress/totalStars'
      })
    },
    watch: {
      lessonDone(lessonDone) {
        if (lessonDone) {
          this.clearLesson(this.lessonPoints);
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .lesson-container
    posit(absolute);

  .lesson-container-enter-active, .lesson-container-leave-active
    transition: all 500ms;

  .lesson-container-enter, .lesson-container-leave-to
    opacity: 0;

    &.lesson-container
      transform: scale(.1);
      opacity: 0.5;

  .quit
    posit(fixed, 0, x, x, 0)
    background-color: white;
    border: solid 1px @color;
    border-radius: 5px;
    color: #AAA;
    font-size: 23px;
    padding: 5px;
    margin: 5px;
    z-index: 1;

    &:hover
      color: #888;
      border-color: #888;
</style>
