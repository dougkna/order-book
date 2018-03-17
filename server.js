const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3001;
const { Transform } = require('stream');

app.get('/api', (req, res) => {
  const stream = fs.createReadStream('./constants/orders.txt');

  const splitLines = new Transform({
    readableObjectMode: true,
    transform(chunk, encoding, cb) {
      this.push(chunk.toString().trim().split('\n'));
      cb();
    }
  });

  const splitOrder = new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(orders, encoding, cb) {
      let parsed = orders.map((order) => {
        let t = order.split('\t');
        t[1] = parseInt(t[1]);
        t[2] = parseInt(t[2]);
        return t;
      });
      this.push(JSON.stringify(parsed) + '\n');
      cb();
    }
  });

  stream
    .pipe(splitLines)
    .pipe(splitOrder)
    .pipe(res);
});

app.listen(port, () => console.log(`Listening on port ${port}...`));

