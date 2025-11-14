import React from 'react';
import Lottie from 'lottie-react';
import { AgentIcon, AgentKey } from './AgentIcon';
import pulseAnim from '../lottie/pulse.json';
import blinkAnim from '../lottie/blink.json';

type AgentLottieProps = {
  id: AgentKey;
  size?: number;
  pulse?: boolean;
  blink?: boolean;
};

export const AgentLottie: React.FC<AgentLottieProps> = ({
  id,
  size = 64,
  pulse = true,
  blink = false,
}) => {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <AgentIcon id={id} size={size} />
      {pulse ? (
        <Lottie
          animationData={pulseAnim}
          loop
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen' }}
        />
      ) : null}
      {blink ? (
        <Lottie
          animationData={blinkAnim}
          loop
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'multiply' }}
        />
      ) : null}
    </div>
  );
};
