document.getElementById('factCheckBtn').addEventListener('click', async () => {
  const btn = document.getElementById('factCheckBtn');
  const loading = document.getElementById('loading');
  const debugDiv = document.getElementById('debug');
  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');

  // Reset UI
  btn.disabled = true;
  loading.style.display = 'block';
  debugDiv.style.display = 'none';
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  try {
    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) {
      throw new Error('Cannot access this page');
    }

    // Send request to backend
    const response = await fetch('https://retaliatory-bruna-unofficious.ngrok-free.dev/link/all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': ''
      },
      body: JSON.stringify({
        input: tab.url,
        search_depth: 2
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Display debug info
    debugDiv.textContent = JSON.stringify(data, null, 2);
    debugDiv.style.display = 'block';

    // Send data to content script for highlighting
    await chrome.tabs.sendMessage(tab.id, {
      action: 'highlight',
      data: data.result
    });

    successDiv.textContent = `Successfully highlighted ${data.result.length} sentence(s)`;
    successDiv.style.display = 'block';

  } catch (error) {
    console.error('Error:', error);
    errorDiv.textContent = `Error: ${error.message}`;
    errorDiv.style.display = 'block';
  } finally {
    loading.style.display = 'none';
    btn.disabled = false;
  }
});