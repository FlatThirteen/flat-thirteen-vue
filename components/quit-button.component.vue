<template lang="pug">
  .quit.button(@click="$emit('click')") X
</template>

<style scoped lang="stylus" type="text/stylus">
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
