# super-log
Node.js程序的简单日志记录器

## 使用方法

```javascript
var SuperLog = require('super-log');

// 初始化
var mylogger = SuperLog.create({
  interval: 2000, // 自动保存时间间隔，ms，默认2000
  path: '/tmp/logs', // 文件存储根目录
  formatInput: function (data) {
    // 格式化输入的数据，并返回新的数据，默认直接返回
    return data;
  },
  formatOutput: function (data) {
    // 格式化输出的数据，并返回新的数据，默认直接返回
    return data;
  },
  dataStringify: function (data) {
    // 将数据转换成字符串，默认如下：
    return JSON.stringify(data);
  },
  dataParse: function (data) {
    // 将字符串还原回原始数据，默认如下：
    return JSON.parse(data);
  },
  getFileName: function () {
    // 返回当前文件名，比如：：
    return date('Ymd/Ymd-H') + '.log';
  },
  sort: function (a, b) {
    // 对两条记录进行排序，默认如下：
    return a.timestamp - b.timestamp;
  },
  query: {
    // 使用时执行 mylogger.queryByDay()
    day: function (day, callback) {
      // 调用 queryPath() 来查询某个目录下的所以文件
      this.queryPath(day, callback);
    }
  }
});

// 记录日志
mylogger.log('这里是logs');

// 马上把当前日志写到文件
mylogger.flush();

// 退出
mylogger.destroy();
```

## License

```
The MIT License (MIT)

Copyright (c) 2016 SuperID | 免费极速身份验证服务

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
