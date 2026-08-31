// Reveals an assistant answer progressively (a "typing" effect) instead of
// popping in all at once, then hands the growing substring to the Markdown
// renderer each frame. Markdown syntax can look briefly odd mid-reveal (an
// unclosed '**' or a half-drawn table row) — that's expected and self-heals
// the instant more text arrives, the same tradeoff every streaming markdown
// chat UI makes; the final frame always renders the complete, correct output.
//
// This animates the reveal of an answer that already arrived in full from
// the backend (a fast, deterministic tool-augmented response), rather than
// streaming raw tokens over the wire — chosen for reliability across the
// Render/Vercel deployment rather than depending on unbuffered chunked
// responses surviving every proxy in between.

import { useEffect, useRef, useState } from 'react';
import Markdown from './Markdown';

export default function TypewriterMarkdown({
  text,
  animate,
  onComplete,
}: {
  text: string;
  animate: boolean;
  onComplete?: () => void;
}) {
  const [visibleLength, setVisibleLength] = useState(animate ? 0 : text.length);
  const frameRef = useRef<number>();

  useEffect(() => {
    let completed = false;
    const finish = () => {
      if (!completed) {
        completed = true;
        onComplete?.();
      }
    };

    if (!animate) {
      setVisibleLength(text.length);
      finish();
      return;
    }

    setVisibleLength(0);
    const totalDurationMs = Math.min(1800, Math.max(350, text.length * 6));
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / totalDurationMs);
      setVisibleLength(Math.max(1, Math.floor(progress * text.length)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        finish();
      }
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // Intentionally keyed only on `text`: this should run once when a new
    // message's content arrives, not on every re-render of the list it sits in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <Markdown>{text.slice(0, visibleLength)}</Markdown>;
}
