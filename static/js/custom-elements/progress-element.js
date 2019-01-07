import { safeDefine, aptSize } from "../router/utils.js";
const css =
  "<style>div[area],span{border-radius:8px}div[full]{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;position:absolute;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,.61);z-index:10;padding:16px}div[area]{-webkit-box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.4);box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.4);z-index:3;background:#fff;width:100%;padding:16px;max-width:500px}div[header]{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;font-weight:700;user-select:none}div[progress]{margin:auto;transition:0.2s;height:20px;background-color:var(--primary-color);border-radius:20px;}span{display:inline-block;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;min-width:60px;text-align:center;padding:6px;cursor:pointer;color:var(--primary-color)}</style>";
class ProgressElement extends HTMLElement {
  connectedCallback() {
    this._render();
  }
  _render() {
    this._header.textContent = this._str;
    const per = ((this._done / this._total) * 100).toFixed(2);
    const perc = `${Math.min(per, 100)}%`;
    this._progressDiv.style.width = perc;
    this._progressText.textContent = `${perc} ${aptSize(
      this._done
    )} of ${aptSize(this._total)}`;
  }
  setValues(done, total, str) {
    this._total = total;
    this._done = done;
    this._str = str;
    this._render();
  }
  constructor(done, total, str) {
    super();
    this._done = done || 0;
    this._total = total || 100;
    this._str = str || "";
    const innerHTML = `${css}<div full><div area><div header></div><div progress></div><div><span progress-text></span></div></div></div>`;
    const template = document.createElement("template");
    template.innerHTML = innerHTML;
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(!0));
    this._header = shadowRoot.querySelector("div[header]");
    this._progressDiv = shadowRoot.querySelector("div[progress]");
    this._progressText = shadowRoot.querySelector("span[progress-text]");
  }
}
export default ProgressElement;
export class FileDownloadElement extends HTMLElement {
  connectedCallback() {
    this._header.textContent = "Download Ready";
    this._download.textContent = `Filename:${this._meta.name}`;
    this.__size.textContent = `Size:${aptSize(this._meta.size)}`;
    this.cancelBTN.onclick = () => this.remove();
    this.dlButton.onclick = () => {
      const a = document.createElement("a");
      a.href = this._url;
      a.download = this._meta.name;
      a.click();
      this.remove();
    };
  }
  constructor(url, metaData) {
    super();
    const innerHTML = `${css}<div full><div area><div header></div><div download></div><div size></div><span cancel>Cancel</span><span download>Download</span></div></div>`;
    this._url = url;
    const template = document.createElement("template");
    template.innerHTML = innerHTML;
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(template.content.cloneNode(!0));
    this._header = shadowRoot.querySelector("div[header]");
    this._download = shadowRoot.querySelector("div[download]");
    this.__size = shadowRoot.querySelector("div[size]");
    this.dlButton = shadowRoot.querySelector("span[download]");
    this.cancelBTN = shadowRoot.querySelector("span[cancel]");
    shadowRoot.querySelector("div[area]").onclick = e => e.stopPropagation();
    this._meta = metaData || {};
  }
}
export function registerElements() {
  safeDefine("file-download", FileDownloadElement);
  return safeDefine("file-progress", ProgressElement);
}
