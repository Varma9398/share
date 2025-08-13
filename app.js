// DOM Elements
const fontSizeInput = document.getElementById('fontSize');
const cardWidthInput = document.getElementById('cardWidth');
const fontFamilySelect = document.getElementById('fontFamily');
const promptList = document.getElementById('promptList');
const addPromptBtn = document.getElementById('addPromptBtn');

// Auth Elements
const authContainer = document.getElementById('authContainer');
const authButton = document.getElementById('authButton');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const usernameDisplay = document.getElementById('username');
const userDropdown = document.getElementById('userDropdown');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const signupSuccess = document.getElementById('signupSuccess');
const profileMenuItem = document.getElementById('profileMenuItem');
const logoutMenuItem = document.getElementById('logoutMenuItem');
const viewToggle = document.getElementById('viewToggle');
const ownerView = document.getElementById('ownerView');
const publicView = document.getElementById('publicView');

// App State
let currentUser = null;
let currentView = 'owner'; // 'owner' or 'public'
let sharedUserId = null; // For public sharing link

// Load settings and prompts
let settings = JSON.parse(localStorage.getItem('promptAppSettings') || '{}');

// User data structure
let users = JSON.parse(localStorage.getItem('promptAppUsers') || '[]');

// Initialize prompts based on user login status
let prompts = [];

// Check if user is logged in from previous session
const savedSession = JSON.parse(localStorage.getItem('promptAppCurrentSession') || 'null');
if (savedSession) {
  const user = users.find(u => u.id === savedSession.userId);
  if (user) {
    currentUser = user;
    prompts = user.prompts || [];
    updateAuthUI();
  }
} else {
  // If no user is logged in, load the global prompts for backward compatibility
  prompts = JSON.parse(localStorage.getItem('prompts') || '[]');
}

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

// Auth UI Functions
function updateAuthUI() {
  if (currentUser) {
    // User is logged in
    authButton.style.display = 'none';
    userProfile.style.display = 'flex';
    viewToggle.style.display = 'flex';
    
    // Update user info
    usernameDisplay.textContent = currentUser.username;
    userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    
    // Show form section for owner view, hide for public view
    document.querySelector('.form-section').style.display = currentView === 'owner' ? 'block' : 'none';
  } else {
    // User is not logged in
    authButton.style.display = 'block';
    userProfile.style.display = 'none';
    viewToggle.style.display = 'none';
    
    // Always show form section when not logged in (backward compatibility)
    document.querySelector('.form-section').style.display = 'block';
  }
}

// User Management Functions
function saveUsers() {
  localStorage.setItem('promptAppUsers', JSON.stringify(users));
}

function saveCurrentSession() {
  if (currentUser) {
    localStorage.setItem('promptAppCurrentSession', JSON.stringify({
      userId: currentUser.id,
      timestamp: new Date().toISOString()
    }));
  } else {
    localStorage.removeItem('promptAppCurrentSession');
  }
}

function savePrompts() {
  if (currentUser) {
    // Save to user's prompts
    currentUser.prompts = prompts;
    saveUsers();
  } else {
    // Backward compatibility - save to global prompts
    localStorage.setItem('prompts', JSON.stringify(prompts));
  }
}

function renderPrompts() {
  promptList.innerHTML = '';
  
  // Filter prompts based on view mode
  let displayPrompts = [];
  
  if (sharedUserId) {
    // In shared view, we already filtered to only public prompts
    displayPrompts = prompts;
  } else if (currentUser && currentView === 'public') {
    // User viewing their own public prompts
    displayPrompts = currentUser.prompts.filter(p => p.isPublic);
  } else {
    // Normal view - all prompts for the current user or global prompts
    displayPrompts = prompts;
  }
  
  displayPrompts.forEach((item, index) => {
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
    
    // Add public/private indicator if user is logged in
    if (currentUser) {
      const visibilitySpan = document.createElement('span');
      visibilitySpan.style.marginLeft = '10px';
      visibilitySpan.style.padding = '2px 6px';
      visibilitySpan.style.borderRadius = '4px';
      visibilitySpan.style.fontSize = '12px';
      
      if (item.isPublic) {
        visibilitySpan.textContent = 'Public';
        visibilitySpan.style.background = 'var(--success-color)';
        visibilitySpan.style.color = 'white';
      } else {
        visibilitySpan.textContent = 'Private';
        visibilitySpan.style.background = 'var(--bg-secondary)';
        visibilitySpan.style.color = 'var(--text-secondary)';
      }
      
      timestampDiv.appendChild(visibilitySpan);
    }

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
    
    // Only show edit/delete/visibility buttons in owner view
    if (!currentUser || currentView === 'owner') {
      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️ Edit';
      editBtn.addEventListener('click', () => editCard(index));
      actionsDiv.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️ Delete';
      delBtn.addEventListener('click', () => deleteCard(index));
      actionsDiv.appendChild(delBtn);
      
      // Add visibility toggle button for logged in users
      if (currentUser) {
        const visibilityBtn = document.createElement('button');
        visibilityBtn.textContent = item.isPublic ? '🔒 Make Private' : '🌐 Make Public';
        visibilityBtn.addEventListener('click', () => toggleVisibility(index));
        actionsDiv.appendChild(visibilityBtn);
        
        // Add share button for public prompts
        if (item.isPublic) {
          const shareBtn = document.createElement('button');
          shareBtn.textContent = '🔗 Share';
          shareBtn.addEventListener('click', () => sharePrompt(currentUser.id));
          actionsDiv.appendChild(shareBtn);
        }
      }
    }
    
    // Add share button in public view as well
    if (currentUser && currentView === 'public' && item.isPublic) {
      const shareBtn = document.createElement('button');
      shareBtn.textContent = '🔗 Share';
      shareBtn.addEventListener('click', () => sharePrompt(currentUser.id));
      actionsDiv.appendChild(shareBtn);
    }

    card.appendChild(promptDiv);
    card.appendChild(aiInfoDiv);
    card.appendChild(timestampDiv);
    card.appendChild(resultDiv);
    card.appendChild(actionsDiv);

    promptList.prepend(card);
  });
}

function toggleVisibility(index) {
  if (!currentUser) return;
  
  prompts[index].isPublic = !prompts[index].isPublic;
  savePrompts();
  renderPrompts();
}

function sharePrompt(userId) {
  // Create a shareable link with the user ID
  // Use relative path to ensure it works in any hosting environment
  const shareUrl = `${window.location.origin}${window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'))}/public.html?user=${userId}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert('Shareable link copied to clipboard!');
  }).catch(err => {
    // Fallback for browsers that don't support clipboard API
    const tempInput = document.createElement('input');
    tempInput.value = shareUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Shareable link copied to clipboard!');
  });
}

function addPrompt() {
  const prompt = document.getElementById('promptInput').value.trim();
  const aiName = document.getElementById('aiNameInput').value.trim();
  const modelName = document.getElementById('modelNameInput').value.trim();
  const resultInput = document.getElementById('resultInput');
  const result = resultInput.value.trim();

  if (!prompt || !aiName || !modelName || !result) {
    alert('Please fill in all fields.');
    return;
  }
  
  // Process the result to preserve formatting
  // Simply preserve line breaks and use innerHTML to maintain formatting
  let processedResult = result.replace(/\n/g, '<br>');
  
  // We'll let the browser handle the HTML content as is

  const timestamp = new Date().toLocaleString();
  prompts.push({ 
    prompt, 
    aiName, 
    modelName, 
    result: processedResult, 
    timestamp,
    isPublic: false, // Default to private
    id: Date.now().toString() // Unique ID for each prompt
  });
  savePrompts();
  renderPrompts();

  // Clear inputs
  document.getElementById('promptInput').value = '';
  document.getElementById('aiNameInput').value = '';
  document.getElementById('modelNameInput').value = '';
  document.getElementById('resultInput').value = '';

  // Show success animation
  const addBtn = document.getElementById('addPromptBtn');
  addBtn.style.transform = 'scale(0.95)';
  setTimeout(() => {
    addBtn.style.transform = 'scale(1)';
  }, 150);
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

function editCard(index) {
  const item = prompts[index];
  document.getElementById('promptInput').value = item.prompt;
  document.getElementById('aiNameInput').value = item.aiName;
  document.getElementById('modelNameInput').value = item.modelName;
  
  // Create a temporary div to convert HTML back to plain text for editing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = item.result;
  document.getElementById('resultInput').value = tempDiv.innerText || tempDiv.textContent;
  
  // Delete the original and scroll to form
  deleteCard(index, false);
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function deleteCard(index, confirm = true) {
  if (confirm && !window.confirm('Are you sure you want to delete this card?')) return;
  prompts.splice(index, 1);
  savePrompts();
  renderPrompts();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPrompt();
    }
  }
});

// Auto-save draft
const inputs = ['promptInput', 'aiNameInput', 'modelNameInput', 'resultInput'];
inputs.forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    const draft = {};
    inputs.forEach(inputId => {
      draft[inputId] = document.getElementById(inputId).value;
    });
    localStorage.setItem('promptDraft', JSON.stringify(draft));
  });
});

// Load draft on page load
const draft = JSON.parse(localStorage.getItem('promptDraft') || '{}');
inputs.forEach(id => {
  if (draft[id]) {
    document.getElementById(id).value = draft[id];
  }
});

addPromptBtn.addEventListener('click', addPrompt);

// Auth Functions
function login(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    currentUser = user;
    prompts = user.prompts || [];
    saveCurrentSession();
    updateAuthUI();
    renderPrompts();
    closeAuthModal();
    return true;
  }
  return false;
}

function signup(username, email, password) {
  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return { success: false, message: 'Email already in use' };
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    username,
    email,
    password,
    prompts: [],
    createdAt: new Date().toISOString(),
    settings: { ...settings } // Copy current settings
  };
  
  users.push(newUser);
  saveUsers();
  
  return { success: true, message: 'Account created successfully! You can now login.' };
}

function logout() {
  // If user was logged in, save their prompts before logging out
  if (currentUser) {
    currentUser.prompts = prompts;
    saveUsers();
  }
  
  // Reset to global prompts for backward compatibility
  prompts = JSON.parse(localStorage.getItem('prompts') || '[]');
  currentUser = null;
  currentView = 'owner';
  saveCurrentSession();
  updateAuthUI();
  renderPrompts();
  closeUserDropdown();
}

function showAuthModal() {
  authContainer.style.display = 'flex';
  // Clear previous errors
  loginError.textContent = '';
  signupError.textContent = '';
  signupSuccess.textContent = '';
  // Reset forms
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('signupUsername').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPassword').value = '';
  document.getElementById('signupConfirmPassword').value = '';
}

function closeAuthModal() {
  authContainer.style.display = 'none';
}

function toggleUserDropdown() {
  userDropdown.classList.toggle('active');
}

function closeUserDropdown() {
  userDropdown.classList.remove('active');
}

function switchView(view) {
  currentView = view;
  if (view === 'owner') {
    ownerView.classList.add('active');
    publicView.classList.remove('active');
    document.querySelector('.form-section').style.display = 'block';
  } else {
    ownerView.classList.remove('active');
    publicView.classList.add('active');
    document.querySelector('.form-section').style.display = 'none';
  }
  renderPrompts();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  // Auth related event listeners
  authButton.addEventListener('click', showAuthModal);
  
  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
  });
  
  signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'flex';
    loginForm.style.display = 'none';
  });
  
  loginButton.addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      loginError.textContent = 'Please fill in all fields';
      return;
    }
    
    const success = login(email, password);
    if (!success) {
      loginError.textContent = 'Invalid email or password';
    }
  });
  
  signupButton.addEventListener('click', () => {
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (!username || !email || !password || !confirmPassword) {
      signupError.textContent = 'Please fill in all fields';
      return;
    }
    
    if (password !== confirmPassword) {
      signupError.textContent = 'Passwords do not match';
      return;
    }
    
    const result = signup(username, email, password);
    if (result.success) {
      signupSuccess.textContent = result.message;
      signupError.textContent = '';
      
      // Clear form
      document.getElementById('signupUsername').value = '';
      document.getElementById('signupEmail').value = '';
      document.getElementById('signupPassword').value = '';
      document.getElementById('signupConfirmPassword').value = '';
      
      // Switch to login tab after successful signup
      setTimeout(() => {
        loginTab.click();
        signupSuccess.textContent = '';
      }, 2000);
    } else {
      signupError.textContent = result.message;
    }
  });
  
  // Close auth modal when clicking outside
  authContainer.addEventListener('click', (e) => {
    if (e.target === authContainer) {
      closeAuthModal();
    }
  });
  
  // User dropdown
  userAvatar.addEventListener('click', toggleUserDropdown);
  document.addEventListener('click', (e) => {
    if (!userProfile.contains(e.target)) {
      closeUserDropdown();
    }
  });
  
  // Logout
  logoutMenuItem.addEventListener('click', logout);
  
  // View toggle
  ownerView.addEventListener('click', () => switchView('owner'));
  publicView.addEventListener('click', () => switchView('public'));
  
  // Initial render
  updateStyles();
  renderPrompts();
});