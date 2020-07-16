import makeDraggable from "./swipeableCard";

const commonCss =
  "div[full]{display:-webkit-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-ms-flex-pack:center;justify-content:center;position:absolute;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,.61);z-index:10;padding:16px}div[header],input{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none}div[header]{font-weight:700;user-select:none}div[message],div[area]{-webkit-box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.4);box-shadow:0 4px 5px 0 rgba(0,0,0,.14),0 1px 10px 0 rgba(0,0,0,.12),0 2px 4px -1px rgba(0,0,0,.4);z-index:3;background:#fff;border-radius:8px;width:100%;padding:16px;max-width:500px}input,span{display:inline-block}input{user-select:none;background-color:#f5f5f5;padding:12px;margin-top:20px;margin-bottom:20px;width:95%;border:none;outline:0;border-radius:50px}span:hover{background-color:#d2d2d2}span{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;min-width:60px;text-align:center;padding:6px;cursor:pointer;border-radius:8px;color:var(--primary-color)}";
export function textInputFactory() {
  const $this = {
    onsend: null,
    innerHTML: `<style>${commonCss}</style><div full><div area><div header>Send a Message</div><input spellcheck="false" placeholder="Send a Message" type="text"><span send-button>Send</span><span cancel-button>Cancel</span></div></div>`
  };
  return class textInput extends HTMLElement {
    get value() {
      return $this.input.value;
    }
    set value(val) {
      return ($this.input.value = val);
    }
    set onsend(fn) {
      $this.onsend = fn;
      this.shadowRoot
        .querySelector("span[send-button]")
        .addEventListener("click", () => fn(this.value));
    }
    get onsend() {
      return $this.onsend;
    }
    constructor() {
      super();
      const template = document.createElement("template");
      template.innerHTML = $this.innerHTML;
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(!0));
      const area = shadowRoot.querySelector("div[area]");
      makeDraggable(area, null, true, { remove: this });
      area.onclick = e => e.stopPropagation();
      shadowRoot.querySelector("div[full]").onclick = () => this.remove();
      $this.input = shadowRoot.querySelector("input");
      this.focus = () => $this.input.focus();
      $this.input.addEventListener("keydown", e => {
        if (e.keyCode === 13) {
          if (this.onsend) {
            this.onsend(this.value);
          }
        }
      });
      shadowRoot.querySelector("span[cancel-button]").onclick = () =>
        this.remove();
    }
  };
}

export function textReceivedFactory() {
  const $this = {
    innerHTML: `<style>${commonCss}</style><div full><div message><div header>Received Message</div><input message-content readonly><span>Okay</span></div>`
  };
  class textReceivedElement extends HTMLElement {
    set data(val) {
      $this.message.value = val || this.data || "";
    }
    get data() {
      return $this.message.value;
    }
    constructor(data) {
      super();
      const template = document.createElement("template");
      template.innerHTML = $this.innerHTML;
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(!0));
      $this.message = shadowRoot.querySelector("input[message-content]");
      $this.message.value = data || "";
      const msg = shadowRoot.querySelector("div[message]");
      makeDraggable(msg, null, true, { remove: this });
      msg.onclick = e => e.stopPropagation();
      shadowRoot.querySelector("span").onclick = shadowRoot.querySelector(
        "div[full]"
      ).onclick = () => this.remove();
    }
  }
  return textReceivedElement;
}
