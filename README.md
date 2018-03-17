# Order Book
> This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).

A bid/ask spread trading simulation that consumes trade orders (limit order type) - built in React and Node

## Setup

1. Install [nodemon](https://github.com/remy/nodemon) globally

```
npm i nodemon -g
```

2. Install server and client dependencies

```
npm i --save
cd client
npm i --save
cd ../
```

3. Start server and client concurrently

```
npm start
```

## Process

Node server will stream order book's limit orders to client, which will process one order at a time (default set at 1 second) and display order detail in bid/ask screen. If an order can be filled partially or entirely, it will be filled at the order's price or better (limit order). Last Market Price indicates the most recent price filled.

## View

![order-book](https://user-images.githubusercontent.com/22410733/37554493-1fbed2d2-2a1d-11e8-966d-2c23b4885f61.gif)
