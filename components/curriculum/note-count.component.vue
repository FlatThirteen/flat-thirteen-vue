<template lang="pug">
  .note-count
    .note
    .info {{ notes }}
      slot
</template>

<script>

  export default {
    props: {
      notes: Number
    }
  }

</script>

<style scoped lang="stylus" type="text/stylus">
  .note-count
    font-size: 40px;
    margin: 5px;

  .note
    background-color: black;
    border-radius: 50%;
    display: inline-block;
    height: 40px;
    width: @height;
    margin-right: 5px;
    vertical-align: top;

  .info
    display: inline-block;
    position: relative;
</style>
