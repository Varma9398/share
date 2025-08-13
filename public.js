// DOM Elements
const fontSizeInput = document.getElementById('fontSize');
const cardWidthInput = document.getElementById('cardWidth');
const fontFamilySelect = document.getElementById('fontFamily');
const promptList = document.getElementById('promptList');
const headerTitle = document.getElementById('headerTitle');
const backButton = document.getElementById('backButton');

// App State
let settings = JSON.parse(localStorage.getItem('promptAppSettings') || '{}');
let users = JSON.parse(localStorage.getItem('promptAppUsers') || '[]');
let prompts = [];

// Apply saved settings
if (settings.fontSize) fontSizeInput.value = settings.fontSize;
if (settings.cardWidth) cardWidthInput.value = settings.cardWidth;
if (settings.fontFamily) fontFamilySelect.value = settings.fontFamily;

function updateStyles() {
  let fontSize = Math.max(8, Math.min(72, parseInt(fontSizeInput.value, 10) || 16));
  let cardWidth = Math.max(200, Math.min(1200, parseInt(cardWidthInput.value, 10) || 500));
  
  fontSizeInput.value = fontSize;
  cardWidthInput.value = cardWidth;

  document.documentElement.style.setProperty('--font-size', fontSize + 'px');
  document.documentElement.style.setProperty('--card-width', cardWidth + 'px');
  document.documentElement.style.setProperty('--font-family', fontFamilySelect.value);

  // Save settings
  settings = {
    fontSize: fontSize,
    cardWidth: cardWidth,
    fontFamily: fontFamilySelect.value
  };
  localStorage.setItem('promptAppSettings', JSON.stringify(settings));
}

fontSizeInput.addEventListener('input', updateStyles);
cardWidthInput.addEventListener('input', updateStyles);
fontFamilySelect.addEventListener('change', updateStyles);

// Get URL parameter function
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Handle shared view
function handleSharedView() {
  const userId = getUrlParameter('user');
  if (!userId) {
    // No user parameter, redirect to owner view
    window.location.href = 'owner.html';
    return;
  }
  
  // Find the shared user
  const sharedUser = users.find(u => u.id === userId);
  
  if (sharedUser) {
    // User found, display their public prompts
    headerTitle.textContent = `${sharedUser.username}'s Shared Prompts`;
    prompts = sharedUser.prompts.filter(p => p.isPublic);
  } else {
    // User not found (e.g., in incognito mode), show sample prompts
    headerTitle.textContent = 'Sample Shared Prompts';
    
    // Sample prompts with properly escaped HTML
    prompts = [
      {
        prompt: "What makes an effective leader?",
        aiName: "ChatGPT",
        modelName: "GPT-4",
        result: "<p>Effective leadership combines several key qualities:</p><ul><li><strong>Vision:</strong> The ability to see possibilities and inspire others toward a common goal</li><li><strong>Empathy:</strong> Understanding team members' perspectives and needs</li><li><strong>Integrity:</strong> Maintaining consistent ethical standards</li><li><strong>Adaptability:</strong> Flexibility in changing circumstances</li><li><strong>Communication:</strong> Clear articulation of ideas and active listening</li><li><strong>Decision-making:</strong> Making timely, informed choices</li><li><strong>Accountability:</strong> Taking responsibility for outcomes</li><li><strong>Development:</strong> Investing in others' growth and potential</li></ul><p>Great leaders balance these qualities while adapting their approach to specific situations and team dynamics.</p>",
        timestamp: new Date().toLocaleString(),
        isPublic: true,
        id: "sample1"
      },
      {
        prompt: "Explain quantum computing to a high school student",
        aiName: "Claude",
        modelName: "Claude 2",
        result: "<p>Quantum computing is like having a super-powered calculator that works in a completely different way than regular computers.</p><p>Regular computers use bits (0s and 1s) to process information - like light switches that are either OFF or ON. They solve problems by checking possibilities one after another.</p><p>Quantum computers use quantum bits or 'qubits' that can exist in multiple states at once thanks to weird quantum physics properties. This is like having switches that can be OFF, ON, or somehow both at the same time!</p><p>This special property lets quantum computers consider many possibilities simultaneously, making them potentially much faster at solving certain complex problems like:</p><ul><li>Breaking encryption codes</li><li>Modeling molecules for new medicines</li><li>Optimizing complex systems like traffic flow</li></ul><p>While regular computers might take billions of years to solve some of these problems, quantum computers might solve them in minutes or seconds. Scientists are still working on building reliable quantum computers, but they could revolutionize fields from medicine to artificial intelligence!</p>",
        timestamp: new Date().toLocaleString(),
        isPublic: true,
        id: "sample2"
      }
    ];
  }
  
  renderPrompts();
}

function renderPrompts() {
  promptList.innerHTML = '';
  
  prompts.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const promptDiv = document.createElement('div');
    promptDiv.className = 'prompt';
    promptDiv.textContent = `"${item.prompt}"`;

    const aiInfoDiv = document.createElement('div');
    aiInfoDiv.className = 'ai-info';
    aiInfoDiv.textContent = `AI: ${item.aiName} | Model: ${item.modelName}`;

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.textContent = `Created: ${item.timestamp}`;

    const resultDiv = document.createElement('div');
    resultDiv.className = 'result';
    resultDiv.innerHTML = item.result;
    
    // Apply any custom styles from the pasted content
    Array.from(resultDiv.querySelectorAll('[style]')).forEach(el => {
      // Keep the inline styles
    });

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'card-actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Save';
    saveBtn.addEventListener('click', () => saveCard(index));
    actionsDiv.appendChild(saveBtn);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy';
    copyBtn.addEventListener('click', () => copyCard(index));
    actionsDiv.appendChild(copyBtn);

    card.appendChild(promptDiv);
    card.appendChild(aiInfoDiv);
    card.appendChild(timestampDiv);
    card.appendChild(resultDiv);
    card.appendChild(actionsDiv);

    promptList.prepend(card);
  });
}

function saveCard(index) {
  const item = prompts[index];
  // Create a temporary element to get the formatted HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = item.result;
  
  // Option 1: Save as HTML file
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Saved Prompt</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .prompt-info { margin-bottom: 20px; }
    .result { border: 1px solid #ccc; padding: 15px; }
  </style>
</head>
<body>
  <div class="prompt-info">
    <h2>"${item.prompt}"</h2>
    <p><strong>AI:</strong> ${item.aiName} | <strong>Model:</strong> ${item.modelName}</p>
    <p><strong>Created:</strong> ${item.timestamp}</p>
  </div>
  <div class="result">${item.result}</div>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function copyCard(index) {
  const item = prompts[index];
  // For clipboard, we'll still use plain text but preserve formatting as much as possible
  const content = `Prompt: ${item.prompt}\nAI: ${item.aiName}\nModel: ${item.modelName}\nCreated: ${item.timestamp}\n\nResult:\n${item.result}`;
  
  // Try to copy as HTML if supported by the browser
  try {
    const htmlContent = `<div><strong>Prompt:</strong> ${item.prompt}<br>
<strong>AI:</strong> ${item.aiName} | <strong>Model:</strong> ${item.modelName}<br>
<strong>Created:</strong> ${item.timestamp}<br><br>
<strong>Result:</strong><br>${item.result}</div>`;
    
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlContent], { type: 'text/html' }),
      'text/plain': new Blob([content], { type: 'text/plain' })
    });
    
    navigator.clipboard.write([clipboardItem]).then(() => {
      showCopyFeedback(index);
    }).catch(err => {
      // Fallback to plain text
      navigator.clipboard.writeText(content).then(() => {
        showCopyFeedback(index);
      });
    });
  } catch (e) {
    // Fallback for browsers that don't support ClipboardItem
    navigator.clipboard.writeText(content).then(() => {
      showCopyFeedback(index);
    });
  }
}

function showCopyFeedback(index) {
  // Temporary feedback
  const cards = document.querySelectorAll('.prompt-card');
  const card = cards[prompts.length - 1 - index];
  const originalBg = card.style.background;
  card.style.background = 'var(--accent-color)';
  card.style.color = 'white';
  setTimeout(() => {
    card.style.background = originalBg;
    card.style.color = '';
  }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Back button
  backButton.addEventListener('click', () => {
    window.location.href = 'owner.html';
  });
  
  // Initialize
  updateStyles();
  handleSharedView();
});