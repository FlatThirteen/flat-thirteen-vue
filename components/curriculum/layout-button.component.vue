<template lang="pug">
  .layout(:class="{selected}")
    .button(@click="$emit('click')", :class="{disabled: selected}")
      .group(v-for="surface in layout")
        .block(v-for="sound in surface.soundByKey", :class="{selected}")
</template>

<script>

  export default {
    props: {
      layout: Array,
      selected: Boolean
    },
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

    &.selected
      background-color: white;

      &:before, &:after
        content: '';
        position: absolute;
        background-color: white;
        height: 20px;
        width: 100%;

      &:before
        bottom: 100%;

      &:after
        top: 100%;


  .group
    margin-top: 3px;

  .block
    background-color: #ddd;
    border: solid 3px #bbb;
    height: 22px;
    width: 22px;

    &.selected
      background-color: primary-blue;
      border-color: back-blue;
</style>
