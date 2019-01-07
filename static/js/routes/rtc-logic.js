import { getSocket } from "../socket.js";
import {
  Events,
  $,
  _random,
  isKeyValObj,
  safeDefine
} from "../router/utils.js";
import {
  textInputFactory,
  textReceivedFactory
} from "../custom-elements/text-input.js";
import { nextEvent } from "../ext.js";
import { FileChunker, FileMerger } from "../binary-manager.js";
import ProgressElement, {
  registerElements,
  FileDownloadElement
} from "../custom-elements/progress-element.js";
const Chunker = new FileChunker();
const Merger = new FileMerger();
registerElements();
safeDefine("text-input", textInputFactory());
safeDefine("text-received", textReceivedFactory());
function report(...args) {
  try {
    const loggerel = document.getElementById("logger-area");
    for (const i of args) {
      loggerel.appendChild(
        document.createTextNode(isKeyValObj(i) ? JSON.stringify(i) : i)
      );
    }
    loggerel.innerHTML += "&#13;&#10;";
    return console.log.apply(this, args);
  } catch (e) {}
}
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};
function showMessage(message, tme) {
  const el = $.create("div", { notification: "", textContent: message });
  document.body.appendChild(el);
  return setTimeout(
    () => (
      (el.style.transform = "translate(0px,0px)"),
      setTimeout(() => el.remove(), tme || 2000)
    ),
    300
  );
}
export default class RTCConn {
  _closeRTCConn() {
    try {
      return this._pc.close();
    } catch (_) {}
    this._pc = this._dc = null;
  }
  _onIceCandidate(candidate) {
    if (candidate && this._pc) {
      return this._socket.send({
        type: "rtc_data",
        data: { icecandidate: candidate, sess_id: this._sess_id }
      });
    }
  }
  async _iceStateChange() {
    const state = this._pc.iceConnectionState;
    if (["closed", "disconnected", "failed"].includes(state)) {
      report("Connection is Dead..");
      const _ = document.querySelector("file-progress");
      _ ? _.remove() : void 0;
      const __ = document.querySelector("file-download");
      __ ? __.remove() : void 0;
      const file = document.getElementById("file-send");
      const message = document.getElementById("message-send");
      if (file) {
        message.style.display = "none";
        file.style.display = "none";
      }
      this.__updateReport__("Connection is dead");
      showMessage("connection lost.retrying");
      this._pc = this._isOfferer = null;
    }
  }
  async _wsOnMessage(e) {
    report("[WS]", e);
    const { type, data = {} } = e;
    if (type === "conn_data") {
      if (this._pc) {
        report("[DEBUG]Removing previous connection");
        this.__updateReport__("removing previous connection");
      }
      this._closeRTCConn();
      this._pc = this._dc = this._isOfferer = null;
      if (data.peer && data.peer_device && !this._pc) {
        this._pc = new RTCPeerConnection(peerConnectionConfig);
        this._pc.onicecandidate = ({ candidate: e }) => (
          report("[RTC]Ice Candidate"),
          this.__updateReport__("received ice candidate"),
          this._onIceCandidate(e)
        );
        this._pc.oniceconnectionstatechange = e => this._iceStateChange(e);
        this._isOfferer = data.is_offerer;
        if (this._isOfferer) {
          report("[RTC]creating offer");
          this.__updateReport__("creating offer");
          this._dc = this._pc.createDataChannel(_random());
          this._dc.onmessage = ({ data }) => {
            if (data === "init") {
              report("[RTC]Data Channel Ready", this._dc);
              this.__updateReport__("data channel ready!");
              return this._startMainSess();
            }
          };
          const offer = await this._pc.createOffer();
          await this._pc.setLocalDescription(offer);
          return this._socket.send({
            type: "rtc_data",
            data: { rtc: "offer", js: offer, sess_id: this._sess_id }
          });
        } else {
          report("[RTC]awaiting offer");
          this.__updateReport__("Waiting offer");
          return (this._pc.ondatachannel = ({ channel }) =>
            this._ondatachannel(channel));
        }
      }
    } else if (type === "rtc_data") {
      const { rtc, js, icecandidate } = data;
      if (icecandidate && this._pc) {
        try {
          report("[RTC]Recieved Candidate");
          this.__updateReport__("received candidate");
          return await this._pc.addIceCandidate(icecandidate);
        } catch (e) {
          report("[RTC]Could not add ice candidate");
          this.__updateReport__("could not add ice candidate");
        }
      }

      if (rtc === "offer" && !this._isOfferer) {
        report("[RTC]Recieved offer");
        this.__updateReport__("recieved offer");
        await this._pc.setRemoteDescription(js);
        report("[RTC]Creating Answer");
        this.__updateReport__("creating answer");
        await this._pc.setLocalDescription(await this._pc.createAnswer());
        return this._socket.send({
          type: "rtc_data",
          data: {
            rtc: "answer",
            js: this._pc.localDescription,
            sess_id: this._sess_id
          }
        });
      } else if (rtc === "answer") {
        report("[RTC]Received Answer");
        this.__updateReport__("Received answer");
        await this._pc.setRemoteDescription(js);
      }
    }
  }
  /**
   *
   * @param {RTCDataChannel} channel
   */
  _ondatachannel(channel) {
    this._dc = channel;
    this._sendRaw("init");
    report("[RTC] Recieved Data Channel", channel);
    this.__updateReport__("data channel ready!");
    return this._startMainSess();
  }
  _sendRaw(data) {
    if (this._dc) {
      return this._dc.send(data);
    }
  }
  _sendJSON(data) {
    return this._sendRaw(JSON.stringify(data));
  }
  __reportProgress(sender, done, total) {
    const str = `${sender ? "sending" : "receiving"} File`;
    this._progressElement =
      this._progressElement || new ProgressElement(0, 0, str);
    if (!this._progressElement.isConnected) {
      this._content.$$element.appendChild(this._progressElement);
    }
    this._progressElement.setValues(done, total);
  }
  _startMainSess() {
    this._reportHook.textContent = `Connected to ${this._peer}`;
    this._dc.onmessage = this._dcOnMessage;
    this._messageHooks["file-chunk"] = data => {
      this._fileMeta = data;
      this._sendJSON({ type: "chunk-ready", data });
    };
    this._messageHooks["complete"] = Merger.complete.bind(Merger);
    {
      const file = document.getElementById("file-send");
      const message = document.getElementById("message-send");
      file.style.display = "block";
      message.style.display = "block";
      message.onclick = () =>
        getTextData(e => this._sendJSON({ type: "text-message", data: e }));
      file.onclick = () => {
        const $$Files = Object.assign(document.createElement("input"), {
          multiple: "true",
          type: "file"
        });
        $$Files.oninput = () =>
          new Promise(resolve => resolve(this._ChunkAndSendEachFile($$Files)));
        return $$Files.click();
      };
    }
    this._messageHooks["text-message"] = data => {
      console.log("[RTC]Received message->", data);
      const el = document.createElement("text-received");
      el.data = data;
      return document.body.appendChild(el);
    };
  }
  _sendPartialFile({ bufferChunk, data }) {
    const ln = bufferChunk.length;
    let sentAmount = 0;
    bufferChunk.forEach(async (buf, i) => {
      this._sendJSON({ type: "file-chunk", data });
      const { detail: message } = await nextEvent(window, "chunk-ready");
      if (message.id === data.id) {
        this._sendRaw(buf);
        sentAmount += buf.byteLength;
        this.__reportProgress(true, sentAmount, data.size);
        if (i === ln - 1) {
          const el = document.querySelector("file-progress");
          el ? el.remove() : void 0;
          return this._sendJSON({ type: "complete" });
        }
      }
    });
  }
  async _ChunkAndSendEachFile({ files }) {
    for (const file of files) {
      Chunker.chunk(file, this._sendPartialFile);
    }
  }

  /**
   *
   * @param {MessageEvent} evt
   */
  _dcOnMessage({ data: _data }) {
    const $data = (() => {
      if (typeof _data === "string") {
        return JSON.parse(_data);
      }
      return _data;
    })();
    if (isKeyValObj($data)) {
      const { type, data } = $data || {};
      if (type) {
        const val = this._messageHooks[type];
        if (val) {
          return val(data);
        }
      }
    } else {
      return Merger.merge(
        { file: $data, data: this._fileMeta },
        e => this.__reportProgress(false, e, this._fileMeta.size),
        showDownloadDialog.bind(this)
      );
    }
    return;
  }
  _onUnmount() {
    this._socket.close();
    this._closeRTCConn();
  }
  _startConn() {
    this._socket.send({ type: "init", data: { sess_id: this._sess_id } });
    this._socket.onmessage = this._wsOnMessage;
  }
  __updateReport__(data) {
    return (this._reportHook.textContent = data);
  }
  _socketError(msg) {
    return this._content
      .getRouter()
      .pushStatus(500, msg || "Could not Connect to the server");
  }
  constructor(id, device_id, el, _socket = getSocket()) {
    Events.listen("unmount-route", this._onUnmount);
    this._sess_id = id;
    this._peer = device_id;
    this._content = el;
    this._socket = _socket;
    this._isOfferer = undefined;
    this._reportHook = document.getElementById("reporthooks");

    this.__reportProgress = this.__reportProgress.bind(this);
    this._dcOnMessage = this._dcOnMessage.bind(this);
    this._ondatachannel = this._ondatachannel.bind(this);
    this._wsOnMessage = this._wsOnMessage.bind(this);
    this._onUnmount = this._onUnmount.bind(this);
    this._sendJSON = this._sendJSON.bind(this);
    this._startConn = this._startConn.bind(this);
    this._socketError = this._socketError.bind(this);
    this._sendPartialFile = this._sendPartialFile.bind(this);

    this._socket
      .startConn("socket-conn/")
      .then(this._startConn)
      .catch();
    this._messageHooks = {
      "chunk-ready": data => Events.emit("chunk-ready", data)
    };
  }
}
function getTextData(fn) {
  const input = $.create("text-input");
  document.body.appendChild(input);
  input.focus();
  input.onsend = e => {
    if (e.trim()) {
      input.value = "";
      input.remove();
      fn(e);
    }
  };
}
/**
 * @this {RTCConn}
 * @param {*} buffer
 */
function showDownloadDialog(buffer) {
  this._progressElement ? this._progressElement.remove() : void 0;
  const filedl = new FileDownloadElement(
    URL.createObjectURL(new Blob([buffer], { type: this._fileMeta.type })),
    this._fileMeta
  );
  document.body.append(filedl);
  this._fileMeta = null;
}
