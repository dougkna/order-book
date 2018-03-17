import React, { Component } from 'react';
import { getOrderBook } from './api/api';
import PriorityQueue from 'js-priority-queue';
import './App.css';
const clone = require('clone');
const initialState = {
  orderBook: [],
  maxHeap: new PriorityQueue({comparator: (a, b) => b[1] - a[1]}),
  minHeap: new PriorityQueue({comparator: (a, b) => a[1] - b[1]}),
  bidItems: [],
  offerItems: [],
  current: [],
  marketPrice: ['None', null],
  switch: true,
};
let takeOrder;

class App extends Component {
  static defaultProps = {
    getOrderBook,
  };

  state = {
    ...initialState
  };

  reset() {
    this.state.maxHeap.clear();
    this.state.minHeap.clear();
    this.setState(initialState);
  }

  componentWillUnmount() {
    clearInterval(takeOrder);
  }

  getAllOrders = async () => {
    this.reset();
    const data = await this.props.getOrderBook();
    if (data) {
      this.setState({
        orderBook: JSON.parse(data),
        switch: false,
      });
      takeOrder = setInterval(() => this.processOrder(), 1000);
    }
  };

  processOrder = () => {
    // order : Array [bid/offer type, price, amount]
    let order = this.state.orderBook.shift();
    if (!order) {
      //order book is empty
      this.setState({switch: !this.state.switch});
      clearInterval(takeOrder);
      return;
    }

    let orderCopy = order.slice();
    let mktPrice = ['None', null];
    let minHeap = this.state.minHeap;
    let maxHeap = this.state.maxHeap;

    if (order[0] === 'S') {
      //check if the order's offer price is lower than current highest bid
      let highestBid = maxHeap.priv.data[0]; //peek
      while (highestBid && highestBid[1] >= order[1] && order[2] > 0) {
        highestBid = maxHeap.dequeue();
        mktPrice = [highestBid[1], 'bid'];
        let diff = highestBid[2] - order[2];
        if (diff >= 0) { //the entire order amount is consumed, transaction is complete
          order[2] = 0;
          if (diff) maxHeap.queue(['B', highestBid[1], diff]); //enqueue the remaining bid (unless 0 amount)
        } else { //there is remaining order after transaction, compare with next highest bid
          order[2] = -diff;
          highestBid = maxHeap.priv.data[0]; //peek first before while loop
        }
      }
      //enqueue any (remaining) order to minHeap
      if (order[2]) minHeap.queue(order);
    } 
    else if (order[0] === 'B') {
      let lowestOffer = minHeap.priv.data[0];
      while (lowestOffer && lowestOffer[1] <= order[1] && order[2] > 0) {
        lowestOffer = minHeap.dequeue();
        mktPrice = [lowestOffer[1], 'offer'];
        let diff = lowestOffer[2] - order[2];
        if (diff >= 0) {
          order[2] = 0;
          if (diff) minHeap.queue(['S', lowestOffer[1], diff]);
        } else {
          order[2] = -diff;
          lowestOffer = minHeap.priv.data[0];
        }
      }
      if (order[2]) maxHeap.queue(order);
    }

    this.setState({
      orderBook: this.state.orderBook,
      current: orderCopy,
      marketPrice: mktPrice,
      minHeap: minHeap,
      maxHeap: maxHeap,
      bidItems: this.getCurrentOrders(maxHeap, 'bid').bids,
      offerItems: this.getCurrentOrders(minHeap, 'offer').offers,
    })
  };

  getCurrentOrders = (q, type) => {
    //retrieve current pending orders and insert in array in order
    let copy = clone(q);
    let orders = {
      bids: [],
      offers: []
    };
    while (copy.priv.data.length) {
      let item = copy.dequeue();
      type === 'bid' ? orders.bids.push(item) : orders.offers.push(item);
    }
    return orders;
  };

  render() {
    const {bidItems, offerItems, current, marketPrice} = this.state;

    function getColor(type) {
      if (!type) return;
      return type === 'offer' ? 'blue' : 'red';
    }

    return (
      <div className='App'>
        <button 
          className='ob-button'
          onClick={() => this.getAllOrders()}
          disabled={!this.state.switch}
        >
          Launch Trades
        </button>

        {!!current.length && 
          <div className='announcement'>
            <div className='current-order'>
              {`Order: ${(current[0] === 'B') ? 'Buy' : 'Sell'} ${current[2]} shares at ${current[1]}`}
            </div>
            <div className='notification'>
              Last Market Price: &ensp;
              <span className={`${getColor(marketPrice[1])}`}>
                {marketPrice[0]}
              </span>
            </div>
          </div>
        }

        <table className='trade-table'>
          <tbody>
            <tr className='trade-title'>
              <th>Amount</th>
              <th>Bid Price</th> {/* from user's perspective this is Ask/Sell price */}
              <th>Ask Price</th> {/* from user's perspective this is Bid/Buy price */}
              <th>Amount</th>
            </tr>

            {offerItems.reverse().map((offer, i) => 
              <tr key={i} className='offer-table'>
                <td className='detail'>{offer[2]}</td>
                <td className='detail'>{offer[1]}</td>
              </tr>
            )}
            
            {bidItems.map((bid, i) => 
              <tr key={i} className='bid-table'>
                <td></td>
                <td></td>
                <td className='detail'>{bid[1]}</td>
                <td className='detail'>{bid[2]}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
