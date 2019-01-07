import { $, safeDefine } from "../router/utils.js";
export default class MatSpinner extends HTMLElement {
  set size(val) {
    const spinner = this.svg();
    spinner.style.height = spinner.style.width = val;
  }
  get size() {
    return this.svg().style.height;
  }
  set color(val) {
    this.circle().style.stroke = val;
  }
  get color() {
    return this.circle().style.stroke;
  }
  set svgstyle(v) {
    return (this.svg().style = v);
  }
  set circlestyle(v) {
    return (this.circle().style = v);
  }
  static get observedAttributes() {
    return ["size", "color", "svgstyle", "circlestyle"];
  }
  attributeChangedCallback(a, _, c) {
    "size" === a
      ? (this.size = c)
      : "color" === a
      ? (this.color = c)
      : "svgstyle" === a
      ? (this.svgstyle = c)
      : "circlestyle" === a && (this.circlestyle = c);
  }
  createTemplate() {
    const a = `svg{display:inline-block;width: 65px;height: 65px;animation:rotator 1.4s linear infinite}@keyframes rotator{0%{transform:rotate(0)}100%{transform:rotate(270deg)}}circle{stroke:#6f70ee;stroke-dasharray:120;stroke-dashoffset:0;transform-origin:center;animation:dash 1.4s ease-in-out infinite}@keyframes dash{0%{stroke-dashoffset:120}50%{stroke-dasharray:200;stroke-dashoffset:190;transform:rotate(135deg)}100%{stroke-dashoffset:120;transform:rotate(450deg)}}`,
      b = $.create("svg", {
        viewbox: "0 0 66 66",
        xmlns: "http://www.w3.org/2000/svg"
      }),
      c = $.create("circle", {
        fill: "none",
        "stroke-width": 6,
        "stroke-linecap": "round",
        cx: 33,
        cy: 33,
        r: 30
      }),
      d = document.createElement("template");
    b.appendChild(c);
    const e = document.createElement("style");
    return (e.innerHTML = a), (d.innerHTML = e.outerHTML + b.outerHTML), d;
  }
  constructor(size, color, svgstyle, circlestyle) {
    super();
    const e = this.createTemplate(),
      f = this.attachShadow({ mode: "open" });
    f.appendChild(e.content.cloneNode(!0)),
      (this.svg = () => this.shadowRoot.querySelector("svg")),
      (this.circle = () => this.shadowRoot.querySelector("circle")),
      size && (this.size = size),
      color && (this.color = color),
      svgstyle && (this.svg().style = svgstyle),
      circlestyle && (this.circle().style = circlestyle);
  }
}
safeDefine("mat-spinner", MatSpinner);
