import { localWebsocketURL } from "./ext.js";
class SocketConn {
  __defaultOnMessage(e) {
    if (["ping", "pong"].includes(e.data)) {
      return;
    }
    const data = JSON.parse(e.data);
    this._socketID = data.socket_id;
  }
  startConn(_ws_) {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(localWebsocketURL(_ws_));
      this.socket.onopen = () => {
        this.socket.onmessage = this.__defaultOnMessage;
        this._pingPongs();
        resolve(this.socket);
      };
      this.socket.onerror = e => reject(e);
    });
  }
  close() {
    try {
      this.socket.close();
    } catch (e) {
      console.warn(e);
    }
  }
  send(data) {
    return this.socket.send(JSON.stringify(data));
  }
  sendString(data) {
    return this.socket.send(data);
  }
  /**
   * @param {(MessageEvent) => void} func
   */
  set onmessage(func) {
    this.socket.onmessage = e => {
      const _data = JSON.parse(e.data || "{}");
      if (_data.type === "ping" || _data.type === "pong") {
        return;
      } else {
        return func(_data);
      }
    };
  }

  get readyState() {
    return this.socket.readyState;
  }
  get isUsable() {
    if (!this.socket) {
      return true;
    }
    return [WebSocket.OPEN, WebSocket.CONNECTING].includes(
      this.socket.readyState
    );
  }
  _pingPongs() {
    this.pingtimer = setTimeout(() => {
      if (this.socket.readyState === this.socket.OPEN) {
        this.send({ type: "ping" });
        this._pingPongs();
      } else {
        clearTimeout(this.pingtimer);
      }
    }, 20000);
  }
  constructor() {}
}
let socketConnection;
/**
 * @returns {SocketConn}
 *
 */
export const getSocket = () => {
  return !!(socketConnection || {}).isUsable
    ? socketConnection
    : ((socketConnection = new SocketConn()), socketConnection);
};
