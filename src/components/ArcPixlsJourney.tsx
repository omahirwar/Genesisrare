import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Zap,
  Palette,
  Users,
  Gem,
  Crosshair,
  Award,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import Logo from './Logo';
import PixelButton from './ui/PixelButton';
import { useWhitelist } from './whitelist-context';
import { playPixelBlip, playPixelSuccess } from '../lib/sound';

interface RarePeopleJourneyProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuestionOption {
  id: string;
  icon: typeof Layers;
  title: string;
  desc: string;
}

export default function RarePeopleJourney({ isOpen, onClose }: RarePeopleJourneyProps) {
  const { open: openWhitelist, openChecker } = useWhitelist();
  const [currentStep, setCurrentStep] = useState(0);

  // User responses
  const [selectedRole, setSelectedRole] = useState<string>('collector');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('diamond');

  const totalSteps = 5;

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && currentStep < totalSteps - 1) {
        playPixelBlip(480);
        setCurrentStep((s) => s + 1);
      }
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        playPixelBlip(380);
        setCurrentStep((s) => s - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, currentStep, totalSteps, onClose]);

  if (!isOpen) return null;

  const roleOptions: QuestionOption[] = [
    {
      id: 'collector',
      icon: Layers,
      title: 'Collector & Holder',
      desc: 'Hunting rare 1/1 traits and vaulting avatars for the long term.',
    },
    {
      id: 'builder',
      icon: Zap,
      title: 'Robinhood Chain Builder',
      desc: 'Developing decentralized apps on high-speed Robinhood EVM infrastructure.',
    },
    {
      id: 'purist',
      icon: Palette,
      title: 'Pixel Art Purist',
      desc: 'Appreciating handcrafted 32×32 sprites and retro cyber culture.',
    },
    {
      id: 'vibe',
      icon: Users,
      title: 'Syndicate Raider',
      desc: 'Connecting on X (@RarePeoplesNFT) spaces and community governance.',
    },
  ];

  const strategyOptions: QuestionOption[] = [
    {
      id: 'diamond',
      icon: Gem,
      title: 'Diamond Hands',
      desc: 'Mint on 21 Sep and hold through every market cycle.',
    },
    {
      id: 'sniper',
      icon: Crosshair,
      title: 'Rarity Sniper',
      desc: 'Scanning for Mythic visors, cyber masks, and golden hoodies.',
    },
    {
      id: 'governor',
      icon: Award,
      title: 'Community Leader',
      desc: 'Voting on Robinhood ecosystem proposals and steering collective drops.',
    },
  ];

  const handleNext = () => {
    playPixelBlip(520);
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      playPixelSuccess();
      onClose();
    }
  };

  const handleBack = () => {
    playPixelBlip(360);
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[200] flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none"
        style={{
          backgroundColor: 'var(--color-cream)',
          backgroundImage: `
            linear-gradient(to right, rgba(23, 20, 11, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(23, 20, 11, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          color: 'var(--color-ink)',
        }}
      >
        {/* Soft atmospheric ambient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-multiply"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(199, 242, 63, 0.35) 0%, rgba(219, 227, 246, 0.25) 40%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />

        {/* Top Navigation Bar */}
        <header className="relative z-10 mx-auto flex w-full max-w-[1100px] items-center justify-between px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <Logo size={36} showBorder={true} />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl leading-none">
                Rare People
              </span>
              <span className="font-display text-[9px] text-lime-700 tracking-wider">
                ROBINHOOD CHAIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playPixelBlip(320);
                onClose();
              }}
              className="group flex items-center gap-1.5 rounded-chip px-3.5 py-1.5 font-display text-xs font-bold text-ink transition-all hover:bg-cream-2 active:scale-95 cursor-pointer"
              style={{
                border: '2px solid var(--color-ink)',
                boxShadow: '2px 2px 0 var(--color-ink)',
                background: 'var(--color-paper)',
              }}
            >
              <span>Skip to website</span>
              <X className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            </button>
          </div>
        </header>

        {/* Main Interactive Stage */}
        <main className="relative z-10 mx-auto my-auto flex w-full max-w-[700px] flex-col items-center px-4 py-6 text-center sm:px-6">
          <div
            className="relative w-full rounded-art p-6 sm:p-10 transition-all"
            style={{
              background: 'var(--color-paper)',
              border: '3px solid var(--color-ink)',
              boxShadow: '6px 8px 0 var(--color-ink)',
            }}
          >
            <AnimatePresence mode="wait">
              {/* STEP 0: WELCOME INTRO */}
              {currentStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-5">
                    <div
                      className="rounded-panel p-3"
                      style={{
                        background: 'var(--color-cream-2)',
                        border: '3px solid var(--color-ink)',
                        boxShadow: '4px 4px 0 var(--color-ink)',
                      }}
                    >
                      <Logo size={64} showBorder={false} />
                    </div>
                  </div>

                  <span
                    className="rounded-chip px-3 py-1 font-display text-[11px] font-bold text-ink uppercase tracking-wider"
                    style={{
                      background: 'var(--color-lime)',
                      border: '2px solid var(--color-ink)',
                      boxShadow: '2px 2px 0 var(--color-ink)',
                    }}
                  >
                    THE RARE PEOPLE ONCHAIN JOURNEY
                  </span>

                  <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
                    Rare People.
                  </h1>

                  <p className="mt-3 max-w-[44ch] font-sans text-base leading-relaxed text-ink-soft sm:text-lg">
                    4,444 hand-placed characters engineered natively for Robinhood chain. Mint date: <strong>21 September 2026</strong>.
                  </p>

                  <div className="mt-8 flex flex-col items-center gap-3">
                    <PixelButton
                      variant="primary"
                      size="lg"
                      onClick={handleNext}
                      className="cursor-pointer"
                    >
                      <span>START JOURNEY</span>
                      <ArrowRight className="h-4 w-4" />
                    </PixelButton>

                    <button
                      onClick={() => {
                        playPixelBlip(320);
                        onClose();
                      }}
                      className="mt-2 text-xs font-sans text-ink-soft hover:text-ink cursor-pointer transition-colors underline-offset-4 hover:underline"
                    >
                      Skip straight to the collection
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: QUESTION 1 - ARCHETYPE */}
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-full flex-col items-center"
                >
                  <span
                    className="rounded-chip px-3 py-1 font-display text-[11px] font-bold text-ink uppercase tracking-wider"
                    style={{
                      background: 'var(--color-lime)',
                      border: '2px solid var(--color-ink)',
                      boxShadow: '2px 2px 0 var(--color-ink)',
                    }}
                  >
                    QUESTION 01 • IDENTITY ALIGNMENT
                  </span>

                  <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    Choose Your Archetype
                  </h2>

                  <p className="mt-2 max-w-[46ch] font-sans text-sm text-ink-soft sm:text-base">
                    Which role best describes your mission inside the Robinhood ecosystem?
                  </p>

                  <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                    {roleOptions.map((opt) => {
                      const active = selectedRole === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playPixelBlip(440);
                            setSelectedRole(opt.id);
                          }}
                          className={`flex items-start gap-3 rounded-panel p-4 text-left transition-all cursor-pointer ${
                            active ? 'scale-[1.02]' : 'hover:bg-cream-2'
                          }`}
                          style={{
                            background: active ? 'var(--color-lime)' : 'var(--color-paper)',
                            border: active ? '3px solid var(--color-ink)' : '2px solid var(--color-ink)',
                            boxShadow: active ? '4px 4px 0 var(--color-ink)' : '2px 2px 0 var(--color-ink)',
                          }}
                        >
                          <div
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-chip"
                            style={{
                              background: active ? 'var(--color-paper)' : 'var(--color-cream-2)',
                              border: '2px solid var(--color-ink)',
                            }}
                          >
                            <Icon className="h-5 w-5 text-ink" />
                          </div>
                          <div>
                            <div className="font-display text-sm font-bold text-ink">
                              {opt.title}
                            </div>
                            <div className="mt-0.5 font-sans text-xs text-ink-soft leading-snug">
                              {opt.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-7">
                    <PixelButton
                      variant="primary"
                      size="md"
                      onClick={handleNext}
                      className="cursor-pointer"
                    >
                      <span>NEXT</span>
                      <ArrowRight className="h-4 w-4" />
                    </PixelButton>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: QUESTION 2 - STRATEGY */}
              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-full flex-col items-center"
                >
                  <span
                    className="rounded-chip px-3 py-1 font-display text-[11px] font-bold text-ink uppercase tracking-wider"
                    style={{
                      background: 'var(--color-amber)',
                      border: '2px solid var(--color-ink)',
                      boxShadow: '2px 2px 0 var(--color-ink)',
                    }}
                  >
                    QUESTION 02 • MINT STRATEGY
                  </span>

                  <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                    What Drives Your Avatar?
                  </h2>

                  <p className="mt-2 max-w-[46ch] font-sans text-sm text-ink-soft sm:text-base">
                    Fixed supply of 4,444 unique on-chain avatars on Robinhood. Mint: 21 Sep.
                  </p>

                  <div className="mt-6 flex w-full flex-col gap-2.5">
                    {strategyOptions.map((opt) => {
                      const active = selectedStrategy === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            playPixelBlip(460);
                            setSelectedStrategy(opt.id);
                          }}
                          className={`flex items-center gap-3.5 rounded-panel p-3.5 text-left transition-all cursor-pointer ${
                            active ? 'scale-[1.01]' : 'hover:bg-cream-2'
                          }`}
                          style={{
                            background: active ? 'var(--color-lime)' : 'var(--color-paper)',
                            border: active ? '3px solid var(--color-ink)' : '2px solid var(--color-ink)',
                            boxShadow: active ? '4px 4px 0 var(--color-ink)' : '2px 2px 0 var(--color-ink)',
                          }}
                        >
                          <div
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-chip"
                            style={{
                              background: active ? 'var(--color-paper)' : 'var(--color-cream-2)',
                              border: '2px solid var(--color-ink)',
                            }}
                          >
                            <Icon className="h-5 w-5 text-ink" />
                          </div>
                          <div className="flex-1">
                            <div className="font-display text-sm font-bold text-ink">
                              {opt.title}
                            </div>
                            <div className="mt-0.5 font-sans text-xs text-ink-soft">
                              {opt.desc}
                            </div>
                          </div>
                          {active && (
                            <span
                              className="shrink-0 flex items-center gap-1 rounded-chip px-2.5 py-1 font-display text-[11px] font-bold text-ink"
                              style={{
                                background: 'var(--color-paper)',
                                border: '2px solid var(--color-ink)',
                              }}
                            >
                              <Check className="h-3.5 w-3.5 text-ink" /> Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-7">
                    <PixelButton
                      variant="primary"
                      size="md"
                      onClick={handleNext}
                      className="cursor-pointer"
                    >
                      <span>NEXT</span>
                      <ArrowRight className="h-4 w-4" />
                    </PixelButton>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: THE RARE PEOPLE VISION */}
              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="rounded-chip px-3 py-1 font-display text-[11px] font-bold text-ink uppercase tracking-wider"
                    style={{
                      background: 'var(--color-lime)',
                      border: '2px solid var(--color-ink)',
                      boxShadow: '2px 2px 0 var(--color-ink)',
                    }}
                  >
                    THE RARE PEOPLE VISION
                  </span>

                  <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
                    Robinhood Culture
                  </h2>

                  <p className="mt-4 max-w-[48ch] font-sans text-base leading-relaxed text-ink-soft sm:text-lg">
                    Thoughtful pixel interactions, hand-placed 32×32 art, and genuine decentralized ownership on Robinhood chain. Mint: 21 Sep.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                    <span
                      className="rounded-chip px-3.5 py-1.5 font-display text-xs font-bold text-ink"
                      style={{
                        background: 'var(--color-cream-2)',
                        border: '2px solid var(--color-ink)',
                        boxShadow: '2px 2px 0 var(--color-ink)',
                      }}
                    >
                      4,444 Total Supply
                    </span>
                    <span
                      className="rounded-chip px-3.5 py-1.5 font-display text-xs font-bold text-ink"
                      style={{
                        background: 'var(--color-blue-soft)',
                        border: '2px solid var(--color-ink)',
                        boxShadow: '2px 2px 0 var(--color-ink)',
                      }}
                    >
                      Robinhood EVM Chain
                    </span>
                    <span
                      className="rounded-chip px-3.5 py-1.5 font-display text-xs font-bold text-ink"
                      style={{
                        background: 'var(--color-cream-2)',
                        border: '2px solid var(--color-ink)',
                        boxShadow: '2px 2px 0 var(--color-ink)',
                      }}
                    >
                      Mint: 21 Sep 2026
                    </span>
                  </div>

                  <div className="mt-8">
                    <PixelButton
                      variant="primary"
                      size="md"
                      onClick={handleNext}
                      className="cursor-pointer"
                    >
                      <span>NEXT</span>
                      <ArrowRight className="h-4 w-4" />
                    </PixelButton>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: PROTOCOL ACCESS GRANTED / FINISH */}
              {currentStep === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center"
                >
                  <span
                    className="rounded-chip px-3 py-1 font-display text-[11px] font-bold text-ink uppercase tracking-wider"
                    style={{
                      background: 'var(--color-lime)',
                      border: '2px solid var(--color-ink)',
                      boxShadow: '2px 2px 0 var(--color-ink)',
                    }}
                  >
                    ACCESS VERIFIED • MINT 21 SEP
                  </span>

                  <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
                    Welcome to Rare People
                  </h2>

                  <p className="mt-3 max-w-[46ch] font-sans text-base leading-relaxed text-ink-soft sm:text-lg">
                    Your archetype has been recorded. The 4,444 Rare People drop goes live on Robinhood on <strong>21 September</strong>. Join the whitelist or verify your spot.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <PixelButton
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        playPixelSuccess();
                        onClose();
                      }}
                      className="cursor-pointer"
                    >
                      <span>ENTER WEBSITE</span>
                      <ArrowRight className="h-4 w-4" />
                    </PixelButton>

                    <button
                      type="button"
                      onClick={() => {
                        playPixelSuccess();
                        onClose();
                        openChecker();
                      }}
                      className="flex items-center gap-2 rounded-chip px-5 py-3.5 font-display text-[14px] font-bold text-ink bg-cream-2 hover:bg-cream border-2 border-ink"
                    >
                      <Sparkles className="h-4 w-4 text-lime-600" />
                      <span>CHECK WL SPOT</span>
                    </button>

                    <PixelButton
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        playPixelSuccess();
                        onClose();
                        openWhitelist();
                      }}
                      className="cursor-pointer"
                    >
                      <span>JOIN WHITELIST</span>
                    </PixelButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Bottom Navigation & Progress Bar */}
        <footer className="relative z-10 mx-auto w-full max-w-[800px] px-6 py-5 sm:px-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between text-xs sm:text-sm font-display text-ink">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentStep > 0 ? 'text-ink hover:underline' : 'invisible opacity-0'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>BACK</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-ink-soft">
                  {String(currentStep + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}
                </span>
                <div
                  className="h-2.5 w-24 sm:w-36 overflow-hidden rounded-full"
                  style={{
                    background: 'var(--color-cream-2)',
                    border: '2px solid var(--color-ink)',
                  }}
                >
                  <motion.div
                    className="h-full"
                    style={{
                      background: 'var(--color-lime)',
                      borderRight: '2px solid var(--color-ink)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.25 }}
                  />
                </div>
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-ink hover:underline cursor-pointer"
              >
                <span>{currentStep < totalSteps - 1 ? 'SKIP' : 'FINISH'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div
              className="flex items-center justify-between w-full pt-2 font-display text-[11px] text-ink-soft"
              style={{ borderTop: '2px solid var(--color-sand)' }}
            >
              <span>Robinhood EVM Chain</span>
              <span>© 2026 Rare People (4,444 Supply)</span>
            </div>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
