<template lang="pug">
  h1.title DRUM#[br]BLOX
  <!--svg.title(height="250", width="450", viewBox="-225 -125 450 250")-->
    <!--path(v-for="(path, letter) in letters", :d="path", :class="letter")-->
    <!--circle.note(v-for="note in notes", :cx="note.cx", :cy="note.cy", :r="note.r")-->
</template>

<script>

  const quarter = 30;
  const eighth = 12;

  export default {
    constants: {
      letters: {
        d: 'M-200,-100 h50 a50,50 0 0,1 0,100 h-50 Z',
        r: 'M-100,-100 h70 a30,30 0 0,1 0,60 a30,40 0 0,1 30,40 h-100 Z',
        u: 'M0,-100 m0,15 h100 v35 a50,50 0 0,1 -100,0 Z',
        m: 'M100,-100 m0,40 a25,25 0 0,1 50,0 a25,25 0 0,1 50,0 v50 h-100 Z',
        b: 'M-200,0 h75 a25,25 0 0,1 0,50 a25,25 0 0,1 0,50 h-75 Z',
        l: 'M-100,0 h40 v40 a60,30 0 0,0 60,30 v25 h-100 Z',
        o: 'M0,0 m0,50 a50,50 0 0,1 100,0 a50,50 0 0,1 -100,0',
        x: 'M100,0 m20,0 l30,30 l30,-30 l20,20 l-30,30 l30,30 l-20,20 l-30,-30 l-30,30 l-20,-20 l30,-30 l-30,-30 Z'
      },
      notes: {
        '00:000': { note: 'kick', cx: -150, cy: -50, r: quarter },
        '01:096': { note: 'snare', cx: -30, cy: -60, r: eighth },
        '02:000': { note: 'kick', cx: 50, cy: -50, r: quarter },
        '03:000': { note: 'snare', cx: 130, cy: -60, r: eighth },
        '03:096': { note: 'snare', cx: 170, cy: -60, r: eighth },
        '04:000': { note: 'snare', cx: -170, cy: 25, r: eighth },
        '04:096': { note: 'kick', cx: -130, cy: 75, r: eighth },
        '06:000': { note: 'kick', cx: 50, cy: 50, r: quarter }
      }
    }
  }
</script>

<style scoped lang="stylus" type="text/stylus">
  .title
    background-color: primary-blue;
    border: solid 2vh back-blue;
    color: white;
    font-size: 8vw;
    line-height: 7vw;
    padding: 2vh 4vh;
    text-shadow: 3px 3px 3px dark-grey;

  // future game color palette?
  drumblox-background-color = #00486b;
  drumblox-color1 = #308887;
  drumblox-color2 = #76bf9d;
  drumblox-color3 = #a6daaa;
  drumblox-color4 = #cff1a4;
</style>
