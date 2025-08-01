import React, { useState } from 'react';
import '../styles/retro-comic-theme.css';

const RiddlerAnimationTest: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Add typing animation
    e.target.classList.add('typing');
    setTimeout(() => e.target.classList.remove('typing'), 1500);
    
    // Update wrapper class based on content
    const wrapper = e.target.closest('.riddler-input-wrapper');
    if (wrapper) {
      if (e.target.value.trim()) {
        wrapper.classList.add('has-content');
      } else {
        wrapper.classList.remove('has-content');
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaValue(e.target.value);
    // Add typing animation
    e.target.classList.add('typing');
    setTimeout(() => e.target.classList.remove('typing'), 1500);
    
    // Update wrapper class based on content
    const wrapper = e.target.closest('.riddler-input-wrapper');
    if (wrapper) {
      if (e.target.value.trim()) {
        wrapper.classList.add('has-content');
      } else {
        wrapper.classList.remove('has-content');
      }
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#8A2BE2', textAlign: 'center', marginBottom: '40px' }}>
        🎭 Riddler Animation Test Page
      </h1>
      
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#333', marginBottom: '20px' }}>Test Riddler Form Animations</h2>
        
        {/* Test Input with Riddler Classes */}
        <div className="riddler-form-group" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Test Input (should have purple glow and question mark):
          </label>
          <div className="riddler-input-wrapper">
            <input
              type="text"
              className="riddler-input"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={(e) => e.target.classList.add('typing')}
              onBlur={(e) => e.target.classList.remove('typing')}
              placeholder="Type here to test animations..."
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Test Textarea with Riddler Classes */}
        <div className="riddler-form-group" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Test Textarea (should have purple glow and question mark):
          </label>
          <div className="riddler-input-wrapper">
            <textarea
              className="riddler-input riddler-textarea"
              value={textareaValue}
              onChange={handleTextareaChange}
              onFocus={(e) => e.target.classList.add('typing')}
              onBlur={(e) => e.target.classList.remove('typing')}
              placeholder="Type here to test textarea animations..."
              rows={4}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Test Select with Riddler Classes */}
        <div className="riddler-form-group" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Test Select (should have purple hover effects):
          </label>
          <select
            className="riddler-select"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Choose an option...</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </select>
        </div>

        {/* Test Button with Riddler Classes */}
        <div className="riddler-form-group" style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
            Test Button (should have purple hover effects):
          </label>
          <button
            className="riddler-button"
            onClick={() => alert('Riddler button clicked!')}
            style={{ padding: '12px 24px', fontSize: '16px' }}
          >
            🎭 Riddler Button
          </button>
        </div>

        {/* Debug Information */}
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>🔍 Debug Information</h3>
          <p><strong>Input Value:</strong> "{inputValue}"</p>
          <p><strong>Textarea Value:</strong> "{textareaValue}"</p>
          <p><strong>Select Value:</strong> "{selectValue}"</p>
          <p><strong>Expected Animations:</strong></p>
          <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Purple glowing borders on focus (#8A2BE2)</li>
            <li>Question mark (?) appears on right side of inputs</li>
            <li>Question mark transforms to checkmark (✓) when content is added</li>
            <li>Typing pulse animation with purple glow while typing</li>
            <li>Button hover effects with purple gradients</li>
            <li>Select dropdown hover effects</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RiddlerAnimationTest;
