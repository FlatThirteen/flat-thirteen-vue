<template lang="pug">
  .layout(:class="{selected}")
    .button(@click="$emit('click')", :class="{weenie, disabled: selected}")
      .group(v-for="(surface, index) in layout")
        .block(v-for="(soundName, key) in surface.soundByKey", :class="{selected}",
            @click="onBlock(index, key, soundName)")
          .note(:class="{on:selected && on[index] === key}")
</template>

<script>

  import Sound from '~/common/sound/sound';

  export default {
    props: {
      layout: Array,
      selected: Boolean,
      weenie: Boolean
    },
    data() {
      return {
        on: {}
      };
    },
    methods: {
      onBlock(index, key, soundName) {
        let on = this.on[index] === key ? '' : key;
        if (on) {
          Sound[soundName].play();
        }
        this.$set(this.on, index, on);
      }
    },
    watch: {
      selected(selected) {
        if (!selected) {
          this.on = {};
        }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  @import "~assets/stylus/note.styl"
  @import "~assets/stylus/weenie.styl"

  .layout
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    margin: 0 -5px;
    height: 60px;
    width: 100px;

  .group
    margin-top: 3px;

  .block
    cursor: pointer;
    background-color: #ddd;
    border: solid 3px #bbb;
    position: relative;
    height: 22px;
    width: 22px;

    &.selected
      background-color: primary-blue;
      border-color: back-blue;

  .note.on, .block:hover .note
    posit(absolute);
    background-color: black;
    border-radius: 50%;
    margin: 2px;

  .note.on
    animation: actual 250ms;

  .block:hover .note:not(.on)
    opacity: 0.2;

  .block .note:hover
    box-shadow: 0 1px 1px 0 rgba(0, 0, 0, 0.5);

    &.on
      opacity: 0.8;
</style>
