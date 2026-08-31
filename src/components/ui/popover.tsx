"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

/**
 * FIX (the "menu opens in the top-left corner" bug):
 *
 * Base UI's <Popover.Popup> has NO idea where the trigger button is unless
 * it's wrapped in <Popover.Positioner>. The Positioner is what actually runs
 * the floating-ui anchor calculation (measures the trigger's
 * getBoundingClientRect, picks a side, flips/shifts to stay in the
 * viewport, etc).
 *
 * If PopoverContent previously rendered <Popover.Popup> directly inside
 * <Popover.Portal> with no <Popover.Positioner> in between, the Popup has
 * no positioning styles applied to it at all. Portaled content with no
 * position styling just renders in normal document flow at the top of
 * whatever it's appended to (<body>, effectively) — which visually is the
 * top-left of the page. That matches the screen recording exactly: the
 * menu appeared pinned near the sidebar logo, not under the clicked ⋮
 * button, regardless of which row was clicked.
 *
 * The fix is simply to make sure Positioner is always in the tree between
 * Portal and Popup, and to forward side/align/sideOffset/alignOffset to it
 * (not to Popup).
 */

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Positioner;

type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Popup> &
  Pick<
    React.ComponentProps<typeof PopoverPrimitive.Positioner>,
    "side" | "align" | "sideOffset" | "alignOffset" | "collisionPadding" | "anchor"
  >;

function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = 8,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      {/* This Positioner is the piece that was missing / broken.
          It must sit between Portal and Popup for anchoring to work. */}
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        collisionPadding={collisionPadding}
        className="z-50 outline-none"
      >
        <PopoverPrimitive.Popup
          className={cn(
            "w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none",
            "origin-[var(--transform-origin)]",
            "transition-[transform,opacity] duration-150",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };