import React from 'react';
import '../styles/retro-comic-theme.css';

const ActionBubbleDebugTest: React.FC = () => {
  const triggerActionBubble = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    
    // Get button position for fixed positioning
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Update CSS custom properties for positioning
    button.style.setProperty('--bubble-x', `${centerX}px`);
    button.style.setProperty('--bubble-y', `${centerY}px`);
    
    console.log('Triggering action bubble at:', centerX, centerY);
    console.log('Button classes before:', button.className);
    
    button.classList.add('triggered');
    console.log('Button classes after adding triggered:', button.className);
    
    setTimeout(() => {
      button.classList.remove('triggered');
      console.log('Removed triggered class');
    }, 600);
  };

  const getRandomActionBubble = () => {
    const bubbles = ['pow', 'bam', 'zoom', 'wham', 'kapow', 'zap'];
    return bubbles[Math.floor(Math.random() * bubbles.length)];
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f0f0f0', minHeight: '100vh', position: 'relative' }}>
      <h1>Action Bubble Debug Test</h1>
      <p>Click the buttons below to test action bubble animations:</p>
      <p><strong>Look for RED boxes that should appear over the buttons!</strong></p>
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem', position: 'relative' }}>
        <button
          onClick={(e) => {
            console.log('Simple test clicked');
            const button = e.currentTarget;
            button.setAttribute('data-action', 'TEST!');
            button.classList.add('triggered');
            setTimeout(() => {
              if (button) {
                button.classList.remove('triggered');
              }
            }, 2000); // Longer timeout to see it
          }}
          className="action-bubble action-bubble-pow"
          data-action="TEST!"
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          Simple Test
        </button>

        <button
          onClick={(e) => {
            const randomBubble = getRandomActionBubble();
            const randomAction = ['BAM!', 'KAPOW!', 'ZOOM!', 'WHAM!'][Math.floor(Math.random() * 4)];
            e.currentTarget.className = `action-bubble action-bubble-${randomBubble}`;
            e.currentTarget.setAttribute('data-action', randomAction);
            triggerActionBubble(e);
          }}
          className="action-bubble action-bubble-bam"
          data-action="BAM!"
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Another Test
        </button>

        <button
          onClick={(e) => {
            console.log('Fixed position test');
            const button = e.currentTarget;
            button.setAttribute('data-action', 'FIXED!');
            button.style.setProperty('--bubble-x', '200px');
            button.style.setProperty('--bubble-y', '200px');
            button.classList.add('triggered');
            setTimeout(() => {
              if (button) {
                button.classList.remove('triggered');
              }
            }, 600);
          }}
          className="action-bubble action-bubble-zoom"
          data-action="ZOOM!"
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Fixed Position Test
        </button>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
        <h3>Debug Info:</h3>
        <p>Check the browser console for debugging information.</p>
        <p>The action bubbles should appear as fixed-positioned popups over the buttons.</p>
        <p>If they don't appear, check:</p>
        <ul>
          <li>CSS is loaded (retro-comic-theme.css)</li>
          <li>Console shows button position coordinates</li>
          <li>Console shows class changes</li>
          <li>Browser dev tools show CSS custom properties being set</li>
        </ul>
      </div>
    </div>
  );
};

export default ActionBubbleDebugTest;
