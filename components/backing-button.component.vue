<template lang="pug">
  svg(height="60", width="60", viewBox="0 0 60 60")
    path.backing-icon(:d="path", :fill="color", :stroke="color" stroke-width="5px")
</template>

<script>
  export default {
    props: {
      level: {
        type: Number,
        default: 0
      }
    },
    constants: {
      activeColor: '#50ffa0',
      path: 'M2,30 L12,20 L12,35 L27,20 L27,35 L42,20 L42,35 L57,20 L57,40 L0,40 Z'
    },
    computed: {
      color() {
        return this.level ? this.activeColor : '#ddd';
      }
    }
  }
</script>
