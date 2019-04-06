<template lang="pug">
  .quit-container
    creep(v-bind="properties")
      template(slot-scope="{filterStyle}")
        circle(v-bind="circle", fill="rgba(100,100,100,.5)", :style="filterStyle")
    transition(name="quit")
      .quit.button(v-show="visible", @click="$emit('click')",
        @mouseenter="onMouse($event)", @mouseleave="onMouse($event)") X
</template>

<script>
  import Creep from '~/components/widget/creep.component';

  export default {
    components: {
      'creep': Creep
    },
    props: {
      creep: Boolean
    },
    data() {
      return {
        visible: false,
        properties: {
          id: 'quit',
          width: 80,
          height: 80,
          margin: 50,
          turbulence: {
            type: 'turbulence',
            baseFrequency: 0.07,
            numOctaves: 5
          },
          displacement: {
            scale: 15
          }
        },
        circle: {
          r: 0,
          cx: -50,
          cy: -50
        }
      };
    },
    mounted() {
      setTimeout(() => {
        this.visible = true;
      }, 1000);
    },
    methods: {
      onMouse(event) {
        if (!this.creep) {
          return;
        }
        let hovered = event.type === 'mouseenter';
        TweenMax.to(this.circle, .25, {
          r: hovered ? 70 : 0,
        });
        TweenMax.to(this.properties.turbulence, .25, {
          seed: 10 * hovered,
          numOctaves: 5 +  hovered,
          roundProps:'seed,numOctaves',
        });
        TweenMax.to(this.properties.displacement, .25, {
          scale: 5 + 30 * hovered
        });
      },
      onClick() {
        this.visible = false;
      }
    }
  }
</script>
<style scoped lang="stylus" type="text/stylus">
  .quit-container
    posit(fixed, 0, x, x, 0);
    z-index: 1;

  .quit-enter-active, quit-leave-active
    transition: opacity 150ms ease-in-out;

  .quit-enter, quit-leave-to
    opacity: 0;

  .quit
    background-color: white;
    border: solid 1px @color;
    border-radius: 5px;
    color: #AAA;
    font-size: 23px;
    padding: 5px;
    margin: 5px;

    &:hover
      color: #888;
      border-color: #888;
</style>
