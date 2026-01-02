"use client";

import { CSSProperties, useEffect } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

interface RiveDogProps {
  /** When true, play the typing animation; when false, pause/idle */
  typing?: boolean;
  /** Optional inline sizing; otherwise use a wrapper with width/height */
  style?: CSSProperties;
  className?: string;
}

export default function RiveDog({ typing = true, style, className }: RiveDogProps) {
  const { rive, RiveComponent } = useRive({
    src: "/untitled.riv",           // ensure this exists in /public
    artboard: "Main",               // <-- change to your actual artboard
    stateMachines: "State Machine 1", // <-- change to your actual state machine
    autoplay: true,
  });

  // If your state machine exposes a Boolean input named "typing",
  // this will bind it; rename to match your file.
  const typingInput = useStateMachineInput(rive, "State Machine 1", "typing");

  // Optional: if your file uses a Trigger named "Start" for single bursts
  const startTrigger = useStateMachineInput(rive, "State Machine 1", "Start");

  useEffect(() => {
    if (!rive) return;
    // Approach A: Boolean gate
    if (typingInput) {
      typingInput.value = !!typing;
    }
    // Approach B: Trigger once when entering typing mode
    if (typing && startTrigger && startTrigger.fire) {
      startTrigger.fire();
    }
  }, [typing, rive, typingInput, startTrigger]);

  return (
    <div className={className} style={{ width: 256, height: 256, ...style }}>
      {/* The canvas auto-fits its container; set explicit w/h on parent */}
      <RiveComponent />
    </div>
  );
}