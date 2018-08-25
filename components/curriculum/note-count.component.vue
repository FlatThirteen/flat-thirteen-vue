<template lang="pug">
  .note-count
    .note
    .count(ref="count") {{ notes }}
      slot
</template>

<script>

  import AnimatedMixin from '~/mixins/animated.mixin';

  export default {
    mixins: [AnimatedMixin],
    props: {
      notes: Number
    },
    constants: {
      animationTarget: 'count',
      animationDefinitions: {
        boing: [[.2, {
          transform: 'scale(.8)'
        }], [.6, {
          transform: 'scale(1.2)'
        }], [.2, {
          transform: 'scale(1)'
        }]]
      }
    },
    watch: {
      notes(notes) {
        this.animate('boing', { duration: .2 });
      }
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

  .count
    display: inline-block;
    position: relative;
</style>
