import Requests, { decodeID } from "../ext";
import RTCConn from "./rtc-logic.js";
import { Events } from "../router/utils";
const loggerButton = {
  element: "button",
  attrs: {
    ripple: "",
    class: "actionbtn",
    style:
      "position:absolute;bottom:10px;padding:6px;left:5px; text-transform: unset;"
  },
  events: {
    click() {
      const el = document.getElementById("logger-area");
      if (el.style.display !== "block") {
        el.style.display = "block";
        return (this.attrs.textContent = "hide Logs");
      } else {
        el.style.display = "none";
        return (this.attrs.textContent = "click to see logs");
      }
    }
  },
  children: ["Click to see Logs"]
};
const loggerArea = {
  element: "textarea",
  attrs: {
    readonly: true,
    id: "logger-area",
    style:
      "resize:none;text-align:justify;display:none;overflow:scroll;height:20%;width:55%;position:absolute;background:#fff;bottom:80px;left:5px"
  }
};
export default {
  route: "/session",
  element: "div",
  idx: "$session",
  children: [
    { element: "div", attrs: { id: "reporthooks" } },
    {
      element: "button",
      attrs: {
        ripple: "",
        id: "file-send",
        class: "actionbtn",
        textContent: "send file",
        style: "display:none;margin:auto;margin-top:20px"
      }
    },
    {
      element: "button",
      attrs: {
        ripple: "",
        id: "message-send",
        class: "actionbtn",
        textContent: "Send Message",
        style: "display:none;margin:auto;margin-top:20px"
      }
    },
    loggerButton,
    loggerArea,
    { element: "div", attrs: { id: "file-area" } }
  ],
  onrender(args) {
    if (!this.attrs.hasConn) {
      return validateArgs(args, this);
    }
  },
  onUnmount() {
    Events.emit("unmount-route");
  }
};

async function validateArgs({ qs }, $this) {
  const __data = decodeID(qs);
  if (!__data) {
    return $this.getRouter().pushStatus(500, "Invalid data provided");
  }
  console.log(__data);
  const { id, device_id } = __data;
  const data = await Requests.post(
    "/api/verify/",
    true,
    JSON.stringify({ sess_id: id }),
    { "content-type": "application/json" }
  );
  const resp = await data.json();
  if (resp.success) {
    return new RTCConn(id, device_id, $this);
  } else if (resp.error) {
    return $this.getRouter().pushStatus(500, "No session exists.");
  }
}
