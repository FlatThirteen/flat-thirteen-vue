export default {
  data() {
    return {
      build: '...',
      ready: false
    }
  },
  mounted() {
    this.axios.get('/BUILD').then((response) => {
      this.build = response.data.trim();
      this.ready = true;
    }).catch((error) => {
      console.warn('BUILD error', error);
      this.build = 'BUILD ' + error.message;
      this.ready = true;
    });
  }
}
