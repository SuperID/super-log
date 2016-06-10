/**
 * SuperLog
 *
 * @author 老雷 <leizongmin@gmail.com>
 */

var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rd = require('rd');
var utils = require('./utils');
var debug = require('debug')('super-log');


function noopCallback () { }


/**
 * SuperLog
 *
 * @param {Object} options
 *   - {Number} interval
 *   - {String} path
 *   - {Function} getFileName
 *   - {Function} formatInput
 *   - {Function} formatOutput
 *   - {Function} dataStringify
 *   - {Function} dataParse
 *   - {Function} sort
 *   - {Object} query
 */
function SuperLog (options) {
  this.options = options = options || {};

  if (!options.path) throw new Error('missing parameter `path`');
  if (!options.getFileName) throw new Error('missing parameter `getFileName`');

  options.interval = options.interval || 2000;
  options.formatInput = options.formatInput || function (data) {
    return data;
  };
  options.formatOutput = options.formatOutput || function (data) {
    return data;
  };
  options.sort = options.sort || function (a, b) {
    return a.timestamp - b.timestamp;
  };
  options.dataStringify = options.dataStringify || function (data) {
    return JSON.stringify(data);
  };
  options.dataParse = options.dataParse || function (data) {
    return JSON.parse(data);
  };
  options.query = options.query || {};

  var me = this;
  me._getFileName = options.getFileName;
  me._sort = options.sort;
  me._formatInput = options.formatInput;
  me._formatOutput = options.formatOutput;
  me._dataStringify = options.dataStringify;
  me._dataParse = options.dataParse;
  me._sort = options.parse;
  me._tid = setInterval(function () {
    me.flush();
  }, options.interval);

  Object.keys(options.query).forEach(function (name) {
    me['queryBy' + name[0].toUpperCase() + name.slice(1)] = options.query[name].bind(me);
  });

  this._buffers = [];

  SuperLog.instances.push(this);
}

utils.inheritsEventEmitter(SuperLog);


SuperLog.NEWLINE = '\r\n';
SuperLog.autoFlush = true;
SuperLog.dumpError = function (err) {
  console.error(err);
};
SuperLog.instances = [];

/**
 * Log
 *
 * @param {Mixed} data
 */
SuperLog.prototype.log = function (data) {
  data = this._formatInput(data);
  this._buffers.push(this._dataStringify(data));
  this.emit('log', data);
};

/**
 * Flush
 *
 * @param {Function} callback
 */
SuperLog.prototype.flush = function (callback) {
  var me = this;
  callback = callback || noopCallback;

  if (me._buffers.length < 1) return callback();

  this.emit('flush', me._buffers);

  var filename = me._getFileName();
  filename = path.resolve(me.options.path, filename);

  debug('flush: total %s record(s)', me._buffers.length);
  mkdirp(path.dirname(filename), function (err) {
    if (err) return SuperLog.dumpError(err);

    var lines = me._buffers.join(SuperLog.NEWLINE);
    me._buffers = [];
    fs.createWriteStream(filename, {
      flags:    'a+',
      encoding: 'utf-8',
      mode:     420 // 0644
    }).end(lines + SuperLog.NEWLINE, callback);
  });
};

/**
 * Flush Sync
 */
SuperLog.prototype.flushSync = function () {
  var me = this;

  if (me._buffers.length < 1) return;

  this.emit('flush', me._buffers);

  var filename = me._getFileName();
  filename = path.resolve(me.options.path, filename);

  debug('flushSync: total %s record(s)', me._buffers.length);
  mkdirp.sync(path.dirname(filename));

  var lines = me._buffers.join(SuperLog.NEWLINE);
  me._buffers = [];
  fs.appendFileSync(filename, lines + SuperLog.NEWLINE);
};

SuperLog.prototype._readLogFile = function (filename, callback) {
  var me = this;
  debug('read log file: %s', filename);
  fs.readFile(filename, function (err, ret) {
    if (err) return callback(err);
    try {
      var list = ret.toString().split(SuperLog.NEWLINE).map(function (line) {
        return line.trim();
      }).filter(function (line) {
        return line;
      }).map(function (line) {
        return me._formatOutput(me._dataParse(line));
      });
    } catch (err) {
      return callback(err);
    }
    debug('read log file: %s, total=%s', filename, list.length);
    callback(null, list);
  });
};

SuperLog.prototype._sortList = function (list) {
  return list.sort(this._sort);
};

/**
 * Query Path
 *
 * @param {String} dir
 * @param {Function} callback
 */
SuperLog.prototype.queryPath = function (dir, callback) {
  var me = this;
  debug('query path: %s', dir);
  dir = path.resolve(me.options.path, dir);
  var list = [];
  rd.eachFile(dir, function (f, s, next) {
    me._readLogFile(f, function (err, ret) {
      if (list) list = list.concat(ret);
      next(err);
    });
  }, function (err) {
    if (err) {
      if (err.code === 'ENOENT') return callback(null, []);
      return callback(err);
    }
    debug('query path: dir=%s, total=%s', dir, list.length);
    callback(null, me._sortList(list));
  });
};

/**
 * Destroy
 */
SuperLog.prototype.destroy = function () {
  var me = this;
  clearInterval(this._tid);
  if (SuperLog.autoFlush) this.flushSync();
  SuperLog.instances = SuperLog.instances.filter(function (item) {
    return me !== item;
  });
  debug('destroy');
  this.emit('destroy');
};


/**
 * Create SuperLog
 *
 * @param {Object} options
 */
SuperLog.create = function (options) {
  return new SuperLog(options);
};


// 当进程退出时自动flush所有实例
process.on('exit', function () {
  debug('process exit');
  if (SuperLog.autoFlush) {
    SuperLog.instances.forEach(function (item) {
      item.flushSync();
    });
  }
});


module.exports = exports = SuperLog;
