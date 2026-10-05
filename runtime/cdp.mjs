export class CDP {
  constructor(url) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'ws:' || parsed.hostname !== '127.0.0.1') throw new Error('CDP must use loopback.');
    this.pending = new Map(); this.sequence = 0;
    this.ws = new WebSocket(url);
    this.ready = new Promise((resolve,reject) => {
      this.ws.addEventListener('open',resolve,{once:true});
      this.ws.addEventListener('error',()=>reject(new Error('CDP connection failed.')),{once:true});
    });
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      const request = this.pending.get(message.id);
      if (!request) return;
      clearTimeout(request.timer); this.pending.delete(message.id);
      message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
    });
    this.ws.addEventListener('close', () => {
      for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(new Error('CDP closed.')); }
      this.pending.clear(); this.closed = true;
    });
  }
  async call(method,params={}) {
    await this.ready;
    if (this.closed) throw new Error('CDP is closed.');
    const id = ++this.sequence;
    return new Promise((resolve,reject) => {
      const timer = setTimeout(()=>{this.pending.delete(id);reject(new Error(`${method} timed out.`));},12000);
      this.pending.set(id,{resolve,reject,timer}); this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  close() { this.ws.close(); }
}
