/**
 *
 * @param dragItem {HTMLElement}
 * @param container {HTMLElement}
 */

export default function makeDraggable(
  dragItem,
  container,
  isSwipableCardLike,
  options
) {
  options = options || {};
  const remove = options.remove;
  const SWIPE_THRESHOLD = 100;
  container = container || document.body;
  let active = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.path.includes(dragItem)) {
      active = true;
    }
  }
  function reset() {
    currentX = 0;
    currentY = 0;
    initialX = 0;
    initialY = 0;
    xOffset = 0;
    yOffset = 0;
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    active = false;
    if (isSwipableCardLike) {
      if ([initialX, initialY].some(x => Math.abs(x) > SWIPE_THRESHOLD)) {
        reset();

        if (remove) {
          remove.remove();
        } else {
          dragItem.remove();
        }
      } else {
        reset();
        translate(0, 0, dragItem);
      }
    }
  }

  function drag(e) {
    if (active) {
      e.preventDefault();

      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      translate(currentX, currentY, dragItem);
    }
  }

  container.addEventListener("touchstart", dragStart, false);
  container.addEventListener("touchend", dragEnd, false);
  container.addEventListener("touchmove", drag, false);

  container.addEventListener("mousedown", dragStart, false);
  container.addEventListener("mouseup", dragEnd, false);
  container.addEventListener("mousemove", drag, false);

  function translate(x, px, el) {
    el.style.transform = `translate3d(${x}px, ${px}px, 0)`;
  }
}
