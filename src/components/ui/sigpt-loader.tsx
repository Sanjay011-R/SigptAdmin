import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// ---------- exact geometry, sampled from the source logo ----------
interface RowSpec {
  n: number;   // dots in this row
  y: number;   // row's vertical center, in the 128x70 viewBox
  r: number;   // dot radius
  op: number;  // dot's fully-revealed opacity
}

const ROWS: RowSpec[] = [
  { n: 9, y: 6.1, r: 1.8, op: 0.65 },
  { n: 8, y: 10.05, r: 2.35, op: 0.68 },
  { n: 7, y: 12.95, r: 2.35, op: 0.7 },
  { n: 6, y: 17.55, r: 3.15, op: 0.75 },
  { n: 5, y: 23.2, r: 3.5, op: 0.78 },
  { n: 4, y: 30.2, r: 4.0, op: 0.81 },
  { n: 3, y: 38.5, r: 5.15, op: 0.85 },
  { n: 2, y: 49.8, r: 5.75, op: 0.84 },
  { n: 1, y: 62.5, r: 6.98, op: 0.86 },
];

const CENTER_X = 64;
const SPACING = 13.5;

// ---------- animation timing ----------
const ROW_DELAY = 90;   // ms between each row starting to appear
const ROW_ANIM = 380;   // ms for one row's reveal transition
const HOLD_TIME = 650;  // ms fully-revealed hold before fading out
const FADE_TIME = 380;  // ms fade-out transition
const LOOP_PAUSE = 500; // ms blank pause between loop cycles

export interface SigptLoaderHandle {
  /** Start (or resume) the reveal → hold → fade → repeat loop. */
  start: () => void;
  /** Stop the loop and reset all dots to hidden. */
  stop: () => void;
}

export interface SigptLoaderProps {
  /** Width in px; height follows the logo's aspect ratio automatically. */
  size?: number;
  /** Dot color. */
  color?: string;
  /** Start looping as soon as the component mounts. */
  autoPlay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const SigptLoader = forwardRef<SigptLoaderHandle, SigptLoaderProps>(
  ({ size = 110, color = "#F5820C", autoPlay = true, className, style }, ref) => {
    const [visibleRows, setVisibleRows] = useState(0); // how many rows (top-down) are revealed
    const [pulse, setPulse] = useState(false);
    const timers = useRef<number[]>([]);
    const runningRef = useRef(false);

    const clearTimers = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };

    const cycle = useCallback(() => {
      if (!runningRef.current) return;

      ROWS.forEach((_, i) => {
        const t = window.setTimeout(() => {
          if (runningRef.current) setVisibleRows(i + 1);
        }, i * ROW_DELAY);
        timers.current.push(t);
      });

      const revealDone = (ROWS.length - 1) * ROW_DELAY + ROW_ANIM;

      timers.current.push(
        window.setTimeout(() => {
          if (!runningRef.current) return;
          setPulse(true);
          timers.current.push(window.setTimeout(() => setPulse(false), 1100));
        }, revealDone)
      );

      timers.current.push(
        window.setTimeout(() => {
          if (!runningRef.current) return;
          setVisibleRows(0); // triggers fade-out on every dot
          timers.current.push(
            window.setTimeout(() => {
              if (runningRef.current) cycle();
            }, FADE_TIME + LOOP_PAUSE)
          );
        }, revealDone + HOLD_TIME)
      );
    }, []);

    const start = useCallback(() => {
      if (runningRef.current) return;
      runningRef.current = true;
      cycle();
    }, [cycle]);

    const stop = useCallback(() => {
      runningRef.current = false;
      clearTimers();
      setVisibleRows(0);
      setPulse(false);
    }, []);

    useImperativeHandle(ref, () => ({ start, stop }), [start, stop]);

    useEffect(() => {
      if (autoPlay) start();
      return () => stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const width = size;
    const height = (size * 70) / 128;
    const reduceMotion = prefersReducedMotion();

    return (
      <svg
        viewBox="0 0 128 70"
        width={width}
        height={height}
        className={className}
        style={{ overflow: "visible", ...style }}
        aria-hidden="true"
      >
        {ROWS.map((row, rowIndex) => {
          const rowStartX = CENTER_X - ((row.n - 1) * SPACING) / 2;
          const isVisible = rowIndex < visibleRows;
          const isTip = rowIndex === ROWS.length - 1;

          return (
            <g key={rowIndex}>
              {Array.from({ length: row.n }).map((_, j) => {
                const cx = rowStartX + j * SPACING;
                return (
                  <circle
                    key={j}
                    cx={cx}
                    cy={row.y}
                    r={row.r}
                    fill={color}
                    style={{
                      opacity: isVisible ? row.op : 0,
                      transform: isVisible ? "scale(1)" : "scale(0.25)",
                      transformBox: "fill-box",
                      transformOrigin: "center",
                      transition: reduceMotion
                        ? "none"
                        : "opacity 0.38s cubic-bezier(.34,1.56,.64,1), transform 0.38s cubic-bezier(.34,1.56,.64,1)",
                      filter:
                        isTip && pulse && !reduceMotion
                          ? "drop-shadow(0 0 6px rgba(245,130,12,0.55))"
                          : "none",
                    }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    );
  }
);

SigptLoader.displayName = "SigptLoader";

export default SigptLoader;

// ---------------------------------------------------------------------
// Optional: full-page overlay wrapper around the same loader.
// ---------------------------------------------------------------------

export interface SigptLoaderOverlayProps {
  active: boolean;
  /** Backdrop color. */
  backdrop?: string;
  size?: number;
  color?: string;
}

export function SigptLoaderOverlay({
  active,
  backdrop = "rgba(251, 250, 248, 0.97)",
  size = 120,
  color = "#F5820C",
}: SigptLoaderOverlayProps) {
  const loaderRef = useRef<SigptLoaderHandle>(null);

  useEffect(() => {
    if (active) loaderRef.current?.start();
    else loaderRef.current?.stop();
  }, [active]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: backdrop,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "all" : "none",
        transition: "opacity 0.3s ease",
        zIndex: 9999,
      }}
    >
      <SigptLoader ref={loaderRef} autoPlay={false} size={size} color={color} />
    </div>
  );
}
