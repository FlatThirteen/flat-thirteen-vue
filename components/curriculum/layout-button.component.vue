<template lang="pug">
  .layout(:class="{selected}")
    .button(@click="$emit('click')", :class="{disabled: selected}")
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
      selected: Boolean
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

  .block:hover .note
    opacity: 0.2;

    &.on
      opacity: 0.4;
</style>
