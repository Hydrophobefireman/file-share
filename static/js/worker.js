const FILE_CHUNK_SIZE = 65e3;
const a = "file-chunk";
const buffer = [];
const Handler = new class MessageHandler {
  setHandler(type, func) {
    this._handlers[type] = func;
  }
  get handlers() {
    return this._handlers;
  }
  onmessage({ data: $data }) {
    const { type, data } = $data;
    const handlerFn = this._handlers[type];
    if (handlerFn) {
      return handlerFn(data);
    }
    console.log("Window Said:", data);
  }
  /**
   *
   * @param {Worker} worker
   */
  constructor(worker) {
    this._handlers = {};
    this.worker = worker;
    this.onmessage = this.onmessage.bind(this);
    this.worker.addEventListener("message", this.onmessage, false);
  }
}(self);
/**
 *
 * @param {{type: string, file: ArrayBuffer, name: string, id: string}} param0
 */
const fileChunker = ({ type, file, name, id }) => {
  // buffer.length = 0;
  const len = file.byteLength;
  const n = parseInt(len / FILE_CHUNK_SIZE);
  const uint8 = new Uint8Array(file);
  for (let i = 0; i < n; i++) {
    const startByte = i * FILE_CHUNK_SIZE;
    const endByte = startByte + FILE_CHUNK_SIZE;
    const subarr = uint8.slice(startByte, endByte).buffer;
    self.postMessage(
      {
        type: "chunked-file",
        data: { type, fileChunk: subarr, name, id, over: endByte === len }
      },
      [subarr]
    );
  }
  if (len % FILE_CHUNK_SIZE) {
    const lastChunk = uint8.slice(n * FILE_CHUNK_SIZE).buffer;
    return self.postMessage(
      {
        type: "chunked-file",
        data: { type, fileChunk: lastChunk, name, id, over: true }
      },
      [lastChunk]
    );
  }
  return;
};
const fileMerger = () => {
  console.log("mergin");
  const buffers = _appendBuffers(buffer);
  return self.postMessage({ type: "merged-file", data: buffers }, [buffers]);
};
const fileMergeProgress = e => {
  buffer.push(e);
  return self.postMessage({
    type: "merge-progress",
    data: { done: getBufferSize(buffer) }
  });
};
const _appendBuffers = _buffers => {
  let byteLength = 0;
  const tmp = new Uint8Array(getBufferSize(_buffers));
  for (const buf of _buffers) {
    tmp.set(new Uint8Array(buf), byteLength);
    byteLength += buf.byteLength;
  }
  return tmp.buffer;
};

function getBufferSize(_buffers) {
  return _buffers.reduce((a, b) => {
    a += b.byteLength;
    return a;
  }, 0);
}

Handler.setHandler("file-chunk", fileChunker);
Handler.setHandler("file-merge", fileMergeProgress);
Handler.setHandler("complete", fileMerger);
