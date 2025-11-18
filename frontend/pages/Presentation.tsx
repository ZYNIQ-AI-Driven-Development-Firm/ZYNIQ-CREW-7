import React, { useEffect } from 'react';

export const Presentation: React.FC = () => {
  useEffect(() => {
    // Load the presentation HTML file in an iframe
    const iframe = document.getElementById('presentation-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = '/presentation.html';
    }
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      background: '#0a0a0a'
    }}>
      <iframe
        id="presentation-iframe"
        title="Crew-7 Presentation"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
      />
    </div>
  );
};
