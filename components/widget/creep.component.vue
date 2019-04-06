<template lang="pug">
  .creep
    svg(v-bind="properties")
      filter(:id="filterId")
        feTurbulence(v-bind="turbulence", result="turbulence")
        feDisplacementMap(v-bind="displacement", in2="turbulence", in="SourceGraphic")
      slot(:filterStyle="filterStyle")
    slot(name="html", :filterStyle="filterStyle")
</template>

<script>
  export default {
    props: {
      id: String,
      height: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      margin: { type: Number, default: 0 },
      unit: { type: String, default: 'px' },
      turbulence: {
        type: Object,
        default: () => ({
          type: 'turbulence',
          seed: 0,
          baseFrequency: 0.03,
          numOctaves: 6
        })
      },
      displacement: {
        type: Object,
        default: () => ({
          scale: 12,
          xChannelSelector:'R',
          yChannelSelector: 'G',
        })
      },
    },
    computed: {
      filterId() {
        return this.id || 'seed' + this.turbulence.seed;
      },
      filterUrl() {
        return 'url(#' + this.filterId + ')';
      },
      filterStyle() {
        return 'filter:' + this.filterUrl;
      },
      properties() {
        let offset = -this.margin;
        let height = this.height + 2 * this.margin;
        let width = this.width + 2 * this.margin;
        return {
          viewBox: offset + ' ' + offset +  ' ' + width + ' ' + height,
          height: height + this.unit,
          width: width+ this.unit
        };
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .creep
    posit(absolute);
    transform-origin: center;
    pointer-events: none;
</style>
