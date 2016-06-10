/**
 * SuperLog Tests
 *
 * @author 老雷 <leizongmin@gmail.com>
 */

var assert = require('assert');
var utils = require('lei-utils');
var SuperLog = require('../');

describe('SuperLog', function () {

  it('normal', function (done) {
    var mylogger = SuperLog.create({
      path: __dirname + '/logs',
	    getFileName: function () {
        return utils.date('Ymd/Ymd-H') + '.log';
      },
      query: {
        day: function (day, callback) {
          this.queryPath(day, callback);
        }
      }
    });
    mylogger.log(process.argv);
    mylogger.log(mylogger.options);
    mylogger.flush();
    mylogger.queryByDay(utils.date('Ymd'), function (err, list) {
      assert.equal(err, null);
      assert.ok(Array.isArray(list));
      console.log(list);
      mylogger.destroy();
      done();
    });
  });

});
