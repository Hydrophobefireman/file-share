import { getElement } from "./router/utils";
const getMatInput = () => {
  const t = (t, e = {}, s, n) => {
    const a = {};
    return (
      e.blur ||
        (a.blur = function() {
          (function(t, e) {
            if (!t.attrs.value || !t.attrs.value.trim()) {
              const s = getElement(t, e);
              s.attrs.class.delete("moveup"),
                s.attrs.class.add("movedown"),
                s.update(),
                setTimeout(
                  () => (s.attrs.class.delete("movedown"), s.update()),
                  110
                );
            }
          })(this, n),
            this.update();
        }),
      e.focus ||
        ((a.focus = function() {
          (this.attrs.untouched = !1),
            (function(t, e) {
              const s = getElement(t, e);
              s.attrs.class.add("moveup"),
                s.attrs.class.delete("movedown"),
                s.update();
            })(this, n);
        }),
        !e.keydown &&
          (a.keydown = function(t) {
            85 === t.keyCode &&
              t.ctrlKey &&
              (t.preventDefault(),
              (this.$$element.value = this.$$element.value.slice(
                this.$$element.selectionStart,
                this.$$element.value.length
              )),
              this.$$element.setSelectionRange(0, 0));
          }),
        !e.keyup &&
          (a.keyup = function() {
            return (this.attrs.value = this.$$element.value);
          })),
      {
        idx: t,
        element: "input",
        attrs: {
          type: s ? "password" : "text",
          spellcheck: !1,
          class: "paper-input"
        },
        onrender() {
          this.attrs.value
            ? this.$$element.focus()
            : ((this.attrs.untouched = !0), (this.attrs.clean = !0));
        },
        events: { ...e, ...a }
      }
    );
  };
  return (
    placeHolderID,
    placeHolderText,
    inputID,
    inputEvents,
    isPassWord = !1
  ) => ({
    element: "div",
    children: [
      {
        idx: placeHolderID,
        onrender() {
          const t = getElement(this, inputID);
          t &&
            t.$$element &&
            t.$$element.value.trim() &&
            (this.attrs.class = new Set(["_animate", "moveup"]));
        },
        element: "div",
        textContent: placeHolderText,
        attrs: { class: "_animate" }
      },
      t(inputID, inputEvents, isPassWord, placeHolderID)
    ]
  });
};
export const matInput = getMatInput();
