import { getSocket } from "../socket.js";
import { Events, _random } from "../router/utils.js";
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};
export default class RTCConn {
  _initSocketConn() {
    this._socket.send({ type: "init", data: { sess_id: this._sessionID } });
  }

  _updateUI() {
    this._content.attrs.textContent = "Found a Peer. Establishing a connection";
    this._content.children = this._content.children || [];
    this._content.children.push({ element: "div", textContent: this._peer });
    this._content.attrs.hasConn = true;
    this._content.reRender();
  }
  _onIceCandidate({ candidate }) {
    if (candidate && this._pc) {
      return this._socket.send({
        type: "rtc_data",
        data: { icecandidate: candidate, sess_id: this._sessionID }
      });
    }
  }
  async _iceStateChange() {
    try {
      if (this.__unrendering__) {
        return;
      }
      const state = this._pc.iceConnectionState;
      if (["closed", "disconnected", "failed"].includes(state)) {
        console.log("Connection is Dead..");
        this._isOfferer = null;
        this._pc = null;
        this._dc = null;
        this.__USEWEBSOCKETFALLBACK__ = true; //dont lose a second
        setTimeout(async () => {
          await this._startConn();
        }, 2);
        const data = await getChatData(this._chat_id);
        this._is_online = data["is_online"];
        if (this.updateUI) {
          this.updateUI();
        }
      }
    } catch (e) {}
  }
  _startRTCPings() {
    setTimeout(
      () =>
        this._socket.send({
          type: "get_role",
          data: { is_offerer: !!this._isOfferer, sess_id: this._sessionID }
        }),
      500
    );
    this._pc = new RTCPeerConnection(peerConnectionConfig);
    this._pc.onicecandidate = e => this._onIceCandidate(e);
    this._pc.oniceconnectionstatechange = e => this._iceStateChange(e);
  }
  _onDataChannel(e) {
    console.log(e);
  }
  async _parseRTCData({ rtc = {}, js, candidate }) {
    if (rtc === "offer") {
      if (!this._isOfferer) {
        this._pc.ondatachannel = e => this._onDataChannel.call(this, e.channel);
        await this._pc.setRemoteDescription(js);
        const answer = await this._pc.createAnswer();
        await this._pc.setLocalDescription(answer);
        return this._socket.send({
          type: "rtc_data",
          data: { rtc: "answer", js: answer }
        });
      }
    }
    if (rtc === "answer") {
      await this._pc.setRemoteDescription(js);
      this._onDataChannel(this._dc);
    }
  }
  async _startRTCHandshake() {
    // console.log(this);
    if (this._isOfferer) {
      this._dc = this._pc.createDataChannel(_random());
      const offer = await this._pc.createOffer();
      await this._pc.setLocalDescription(offer);
      this._socket.send({
        type: "rtc_data",
        data: { rtc: "offer", js: offer, sess_id: this._sessionID }
      });
    } else {
      return console.log("Waiting for RTC Offer");
    }
  }
  _wsOnMessage(e) {
    console.log("[ws] Received:", e);
    const { type, data } = e;
    if (type === "conn_data") {
      this._peer = data.peer_device;
      if (data.peer && data.peer_device) {
        this._updateUI(this._peer);
        this._startRTCPings();
      } else {
        return (this._content.attrs.hasConn = false);
      }
    }
    if (type === "set_role") {
      if (typeof this._isOfferer !== "boolean") {
        this._isOfferer = data.is_offerer;
        this._startRTCHandshake();
      }
    }
    if (type === "rtc_data") {
      this._parseRTCData(data);
    }
  }
  constructor(id, device_id, el, _socket = getSocket()) {
    this._sessionID = id;
    this._deviceID = device_id;
    this._socket = _socket;
    this._content = el;
    this._peer;
    this.__unrendering__ = false;
    this._isOfferer = undefined;
    this._pc = this._dc = undefined;
    Events.listen("unmount-route", e => {
      Events.destroyAll();
      this.__unrendering__ = true;
      if (this._pc) {
        this._socket.close();
        this.__unrendering__ = true;
        this._pc.close();
        this._pc = this._dc = this._peer = this._isOfferer = null;
      }
    });
    this._socket
      .startConn("socket-conn/")
      .then(
        () => (
          (this._socket.onmessage = e => this._wsOnMessage.call(this, e)),
          this._initSocketConn()
        )
      )
      .catch(() =>
        this._content
          .getRouter()
          .pushStatus(500, "Could not connect to the server")
      );
  }
}
