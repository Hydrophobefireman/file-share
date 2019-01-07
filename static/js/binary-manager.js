import webpackWorker from "worker-loader!./worker.js";
import { _random, noop } from "./router/utils";

const worker = new webpackWorker();
const Handler = (() => {
  const $this = { _handlers: {}, worker: null };
  return new class WorkerMessageHandler {
    setHandler(type, func) {
      $this._handlers[type] = func;
    }
    get handlers() {
      return $this._handlers;
    }
    onmessage({ data: $data }) {
      const { type, data } = $data;
      const handlerFn = $this._handlers[type];
      if (handlerFn) {
        return handlerFn(data);
      }
      console.log("Worker Said:", data);
    }
    /**
     *
     * @param {Worker} worker
     */
    constructor(worker) {
      $this.worker = worker;
      this.onmessage = this.onmessage.bind(this);
      $this.worker.onmessage = this.onmessage;
    }
  }(worker);
})();
const blobToArrayBuffer = async a => await new Response(a).arrayBuffer();

// const sendAndReceiveMessage = async (...message) => {
//   worker.postMessage(message[0], message[1]);
//   const { data } = await nextEvent(worker, "message");
//   return data;
// };

export class FileChunker {
  /**
   *
   * @param {{type: string, fileChunk: ArrayBuffer, size: Number, name: string,  id: string,  over: boolean}} chunk
   */
  chunkBuffer(chunk) {
    this._buffer.push(chunk.fileChunk);
    if (chunk.over) {
      this._fn({ bufferChunk: this._buffer, data: this._meta });
    }
  }
  /**
   *
   * @param {File} $file
   * @param {Function} fn
   */
  async chunk($file, fn) {
    this._buffer = [];
    this._fn = fn;
    const file = await blobToArrayBuffer($file);
    this._meta = {
      type: $file.type,
      name: $file.name,
      size: $file.size,
      id: _random(15)
    };
    worker.postMessage(
      {
        data: { file, ...this._meta },
        type: "file-chunk"
      },
      [file]
    );
    Handler.setHandler("chunked-file", this.chunkBuffer);
  }
  constructor() {
    this.chunkBuffer = this.chunkBuffer.bind(this);
    this._buffer = [];
  }
}
export class FileMerger {
  mergeBuffer(chunk) {
    console.log("final File:");
    Promise.resolve(this._onFullFile(chunk)).then(
      () => ((this._buffer = []), (this._currentBufferByteSize = 0))
    );
  }
  async merge({ file, data }, progressCallBack, onCompleteCallBack) {
    this._onFullFile = onCompleteCallBack;
    this._meta = data;
    Promise.resolve(this._currentBufferByteSize).then(progressCallBack || noop);
    worker.postMessage({ data: file, type: "file-merge" }, [file]);
  }
  complete() {
    worker.postMessage({ type: "complete", data: this._meta });
  }
  constructor() {
    this.mergeBuffer = this.mergeBuffer.bind(this);
    this._buffer = [];
    this._currentBufferByteSize = 0;
    Handler.setHandler("merged-file", this.mergeBuffer);
    Handler.setHandler(
      "merge-progress",
      ({ done }) => (this._currentBufferByteSize = done)
    );
  }
}
