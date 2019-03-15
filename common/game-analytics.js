import Tone from './tone';

const START_TIME = Tone.rightNow();

let GameAnalytics = {
  isInitialized() {
    return this.GA && this.GA.state.GAState.isInitialized();
  },
  init(build) {
    this.GA = require('gameanalytics');
    this.STATUS = this.GA.EGAProgressionStatus;
    if (!this.isInitialized()) {
      this.GA.GameAnalytics.setEnabledInfoLog(build === 'local');
      this.GA.GameAnalytics.setEnabledVerboseLog(build === 'local');
      this.GA.GameAnalytics.configureBuild(build);
      this.GA.GameAnalytics.initialize('70e722d79c31e00cefa6ddbd6b76c083',
          _.join(_.map([2486484157, 3889590087, 3576893628, 1290759513, 553095923], n => n.toString(16)), ''));
    }
  },
  start(lessonName, intensity, tempo, stage) {
    this._lessonName = lessonName;
    this._p2 = intensity + '-' + tempo;
    this._p3 = stage;
    this.progress('Start');
  },
  complete(points) {
    this.progress('Complete', points);
    this._lessonName = null;
  },
  fail(points) {
    this.progress('Fail', points);
    this._lessonName = null;
  },
  progress(event, points) {
    if (this.isInitialized() && this._lessonName && this.STATUS[event]) {
      this.GA.GameAnalytics.addProgressionEvent(this.STATUS[event], this._lessonName, this._p2, this._p3, points);
    } else {
      console.info('Progress event', event, this._lessonName, this._p2, this._p3, points);
    }
  },
  power(eventType, power, level) {
    let time = _.round((Tone.rightNow() - START_TIME) / 60, 2);
    let event = 'Time:' + eventType + ':' + power + ':' + _.padStart(level, 2, '0');
    this.design(event, time);
  },
  design(event, value) {
    if (this.isInitialized()) {
      this.GA.GameAnalytics.addDesignEvent(event, value);
    } else {
      console.info('Design event', event, value);
    }
  }
};

export default GameAnalytics;
