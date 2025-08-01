import React from 'react';
import '../styles/retro-comic-theme.css';

const ActionBubbleTest: React.FC = () => {
  // Action bubble animation trigger function
  const triggerActionBubble = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.classList.remove('triggered');
    // Force reflow to ensure the class is removed before adding it back
    element.offsetHeight;
    element.classList.add('triggered');
    
    // Remove the class after animation completes
    setTimeout(() => {
      element.classList.remove('triggered');
    }, 600);
  };
  
  // Random action bubble generator
  const getRandomActionBubble = () => {
    const bubbles = ['pow', 'bam', 'zoom', 'wham', 'kapow', 'zap'];
    return bubbles[Math.floor(Math.random() * bubbles.length)];
  };

  return (
    <div style={{ padding: '50px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', marginBottom: '30px' }}>Action Bubble Test Page</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
        
        {/* Test Button 1 - POW */}
        <button
          onClick={triggerActionBubble}
          className="action-bubble action-bubble-pow"
          style={{ 
            padding: '15px 30px', 
            fontSize: '16px',
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          Click for POW!
        </button>

        {/* Test Button 2 - BAM */}
        <button
          onClick={triggerActionBubble}
          className="action-bubble action-bubble-bam"
          style={{ 
            padding: '15px 30px', 
            fontSize: '16px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          Click for BAM!
        </button>

        {/* Test Button 3 - ZAP */}
        <button
          onClick={triggerActionBubble}
          className="action-bubble action-bubble-zap"
          style={{ 
            padding: '15px 30px', 
            fontSize: '16px',
            backgroundColor: '#f1c40f',
            color: 'black',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          Click for ZAP!
        </button>

        {/* Test Button 4 - Random */}
        <button
          onClick={triggerActionBubble}
          className={`action-bubble action-bubble-${getRandomActionBubble()}`}
          style={{ 
            padding: '15px 30px', 
            fontSize: '16px',
            backgroundColor: '#9b59b6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          Click for Random Action!
        </button>

        {/* Debug Info */}
        <div style={{ marginTop: '30px', color: 'white', fontSize: '14px' }}>
          <h3>Debug Info:</h3>
          <p>• Action bubble CSS should be loaded from retro-comic-theme.css</p>
          <p>• Check browser dev tools for CSS classes being applied</p>
          <p>• Look for .action-bubble and .action-bubble-* classes</p>
          <p>• Verify ::before pseudo-elements are working</p>
          <p>• Check for animation keyframes in CSS</p>
        </div>
      </div>
    </div>
  );
};

export default ActionBubbleTest;
