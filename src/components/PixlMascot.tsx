import { motion, useReducedMotion, useTransform, useMotionValue, type MotionValue } from 'motion/react';

/* ------------------------------------------------------------------
 * "Pixl" — the original Rare People mascot.
 * Chunky pixel construction, lime beanie, dark hoodie, big expressive
 * eyes. Built from grouped rects so parts animate independently:
 * idle bob + breathe, auto-blink, cursor-tracked eyes/head, a wave.
 * Every trait here (beanie, mask-less face, drawstrings, arc chest mark,
 * blush) is a hook for future on-chain traits.
 * ------------------------------------------------------------------ */

const C = {
  ink: '#17140b',
  skin: '#f0c088',
  skinSh: '#d99a58',
  beanie: '#c7f23f',
  beanieSh: '#a6cf2c',
  band: '#3c5f12',
  hoodie: '#221d12',
  hoodieLt: '#342c1a',
  pocket: '#181409',
  eye: '#fbf7ee',
  amber: '#f79a3c',
  lime: '#c7f23f',
  white: '#fffdf7',
  pants: '#2b2417',
};

interface Props {
  pointer?: { x: MotionValue<number>; y: MotionValue<number> };
  className?: string;
  cheer?: boolean; // play a bigger, happier motion (e.g. final CTA)
}

export default function PixlMascot({ pointer, className, cheer = false }: Props) {
  const reduced = useReducedMotion();
  const idle = !reduced;

  // fallbacks so hooks always run in the same order
  const zx = useMotionValue(0);
  const zy = useMotionValue(0);
  const px = pointer?.x ?? zx;
  const py = pointer?.y ?? zy;

  const parX = useTransform(px, [-1, 1], [7, -7]);
  const parY = useTransform(py, [-1, 1], [5, -5]);
  const headRot = useTransform(px, [-1, 1], [4, -4]);
  const headX = useTransform(px, [-1, 1], [2, -2]);
  const headY = useTransform(py, [-1, 1], [-1.5, 1.5]);
  const pupX = useTransform(px, [-1, 1], [-2.2, 2.2]);
  const pupY = useTransform(py, [-1, 1], [-1.6, 1.6]);

  return (
    <motion.svg
      viewBox="0 0 44 52"
      className={className}
      shapeRendering="crispEdges"
      aria-label="Pixl, the Rare People mascot"
      role="img"
      style={{ x: reduced ? 0 : parX, y: reduced ? 0 : parY, overflow: 'visible' }}
    >
      {/* soft ground shadow */}
      <motion.ellipse
        cx="22"
        cy="51"
        rx="13"
        ry="1.6"
        fill="rgba(23,20,11,0.16)"
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        animate={idle ? { scaleX: [1, 0.84, 1], opacity: [0.16, 0.1, 0.16] } : undefined}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* float: idle vertical bob */}
      <motion.g
        animate={idle ? { y: cheer ? [0, -6, 0] : [0, -3, 0] } : undefined}
        transition={{ duration: cheer ? 1.6 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* breathe + subtle life-rotation */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
          animate={idle ? { scaleY: [1, 1.018, 1], rotate: [-0.6, 0.6, -0.6] } : undefined}
          transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* ---------- BODY (behind head) ---------- */}
          {/* left arm (resting) */}
          <rect x="6" y="33" width="4" height="9" fill={C.hoodie} />
          <rect x="6" y="41" width="4" height="1" fill={C.hoodieLt} />
          <rect x="6" y="42" width="4" height="3" fill={C.skin} />

          {/* torso / hoodie */}
          <rect x="9" y="32" width="26" height="13" fill={C.hoodie} />
          <rect x="12" y="31" width="20" height="2" fill={C.ink} />
          <rect x="15" y="33" width="14" height="11" fill={C.hoodieLt} />
          {/* drawstrings (hang straight — no cross bar) */}
          <rect x="19" y="32" width="1" height="5" fill={C.lime} />
          <rect x="24" y="32" width="1" height="5" fill={C.lime} />
          <rect x="19" y="37" width="1" height="1" fill={C.amber} />
          <rect x="24" y="37" width="1" height="1" fill={C.amber} />
          {/* arc emblem — a little pixel rainbow on the chest */}
          <rect x="26" y="35" width="3" height="1" fill={C.lime} />
          <rect x="25" y="36" width="1" height="1" fill={C.lime} />
          <rect x="29" y="36" width="1" height="1" fill={C.lime} />
          {/* pocket */}
          <rect x="14" y="40" width="16" height="4" fill={C.pocket} />
          <rect x="14" y="40" width="16" height="1" fill={C.ink} />

          {/* legs + shoes */}
          <rect x="13" y="45" width="6" height="5" fill={C.pants} />
          <rect x="25" y="45" width="6" height="5" fill={C.pants} />
          <rect x="12" y="50" width="7" height="2" fill={C.ink} />
          <rect x="25" y="50" width="7" height="2" fill={C.ink} />

          {/* ---------- HEAD + FACE (tracks cursor) ---------- */}
          <motion.g
            style={{
              transformBox: 'fill-box',
              transformOrigin: '50% 100%',
              rotate: reduced ? 0 : headRot,
              x: reduced ? 0 : headX,
              y: reduced ? 0 : headY,
            }}
          >
            {/* beanie */}
            <rect x="19" y="1" width="6" height="3" fill={C.beanie} />
            <rect x="22" y="1" width="3" height="3" fill={C.beanieSh} />
            <rect x="12" y="4" width="20" height="3" fill={C.beanie} />
            <rect x="11" y="6" width="22" height="4" fill={C.beanie} />
            <rect x="11" y="9" width="22" height="2" fill={C.beanieSh} />
            <rect x="10" y="11" width="24" height="3" fill={C.band} />

            {/* head / skin */}
            <rect x="12" y="14" width="20" height="2" fill={C.skinSh} />
            <rect x="10" y="16" width="24" height="10" fill={C.skin} />
            <rect x="11" y="26" width="22" height="3" fill={C.skin} />
            <rect x="30" y="16" width="4" height="13" fill={C.skinSh} />
            {/* ears */}
            <rect x="9" y="20" width="1" height="4" fill={C.skinSh} />
            <rect x="34" y="20" width="1" height="4" fill={C.skinSh} />

            {/* eyes: ink frame + white */}
            <rect x="13" y="17" width="8" height="9" fill={C.ink} />
            <rect x="23" y="17" width="8" height="9" fill={C.ink} />
            <rect x="14" y="18" width="6" height="7" fill={C.eye} />
            <rect x="24" y="18" width="6" height="7" fill={C.eye} />

            {/* pupils (track cursor) */}
            <motion.g style={{ x: reduced ? 0 : pupX, y: reduced ? 0 : pupY }}>
              <rect x="16" y="20" width="3" height="3" fill={C.ink} />
              <rect x="26" y="20" width="3" height="3" fill={C.ink} />
              <rect x="16" y="20" width="1" height="1" fill={C.white} />
              <rect x="26" y="20" width="1" height="1" fill={C.white} />
            </motion.g>

            {/* eyelids (auto-blink) */}
            <motion.g
              style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
              animate={idle ? { scaleY: [0, 0, 1, 0, 0, 0, 1, 0] } : { scaleY: 0 }}
              transition={{ duration: 5.6, repeat: Infinity, times: [0, 0.42, 0.45, 0.48, 0.9, 0.93, 0.95, 0.98], ease: 'easeInOut' }}
            >
              <rect x="14" y="18" width="6" height="7" fill={C.skin} />
              <rect x="24" y="18" width="6" height="7" fill={C.skin} />
              <rect x="14" y="18" width="6" height="1" fill={C.skinSh} />
              <rect x="24" y="18" width="6" height="1" fill={C.skinSh} />
            </motion.g>

            {/* blush */}
            <rect x="12" y="23" width="2" height="2" fill={C.amber} opacity="0.85" />
            <rect x="30" y="23" width="2" height="2" fill={C.amber} opacity="0.85" />

            {/* mouth */}
            <rect x="18" y="27" width="7" height="1" fill={C.ink} />
            <rect x="19" y="28" width="5" height="1" fill={C.ink} />
            <rect x="20" y="28" width="3" height="1" fill={C.white} />

            {/* neck */}
            <rect x="18" y="29" width="8" height="2" fill={C.skinSh} />
          </motion.g>

          {/* ---------- WAVING ARM ---------- */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '15% 100%' }}
            animate={idle ? { rotate: cheer ? [0, -14, 16, -10, 16, 0] : [0, 0, -8, 14, -6, 12, 0, 0] } : undefined}
            transition={{ duration: cheer ? 1.8 : 6, repeat: Infinity, ease: 'easeInOut', times: cheer ? undefined : [0, 0.45, 0.55, 0.66, 0.77, 0.88, 0.95, 1] }}
          >
            <rect x="33" y="31" width="4" height="7" fill={C.hoodie} />
            <rect x="35" y="25" width="4" height="7" fill={C.hoodie} />
            <rect x="34" y="21" width="5" height="5" fill={C.skin} />
            <rect x="34" y="20" width="3" height="1" fill={C.skin} />
          </motion.g>
        </motion.g>
      </motion.g>
    </motion.svg>
  );
}
