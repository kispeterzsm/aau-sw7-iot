// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'highlight') {
    highlightSentences(request.data);
    sendResponse({ status: 'success' });
  }
  return true;
});

function highlightSentences(results) {
  // Remove any existing highlights
  removeHighlights();

  results.forEach((item, index) => {
    const sentence = item.sentence;
    const oldest = item.oldest;
    
    if (!sentence || !oldest) return;

    // Find and highlight all occurrences
    highlightText(sentence, oldest, index);
  });
}

function highlightText(sentence, oldest, index) {
  // Normalize the sentence for matching
  const normalizedSentence = sentence.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Get all text content with positions
  const textPositions = getTextPositions(document.body);
  const fullText = textPositions.map(tp => tp.text).join('');
  const normalizedFullText = fullText.replace(/\s+/g, ' ').toLowerCase();
  
  // Find all occurrences of the sentence in the full text
  let searchPos = 0;
  while (true) {
    const matchIndex = normalizedFullText.indexOf(normalizedSentence, searchPos);
    if (matchIndex === -1) break;
    
    const matchEnd = matchIndex + normalizedSentence.length;
    
    // Convert normalized position back to original text position
    const actualStart = denormalizePosition(fullText, matchIndex);
    const actualEnd = denormalizePosition(fullText, matchEnd);
    
    // Find which text nodes contain this range
    highlightRange(textPositions, actualStart, actualEnd, oldest, index);
    
    searchPos = matchEnd;
  }
}

function getTextPositions(root) {
  const positions = [];
  let currentPos = 0;
  
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        if (parent.classList.contains('factcheck-highlight')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent;
    positions.push({
      node: node,
      start: currentPos,
      end: currentPos + text.length,
      text: text
    });
    currentPos += text.length;
  }
  
  return positions;
}

function denormalizePosition(text, normalizedPos) {
  let actualPos = 0;
  let normalizedCount = 0;
  let inWhitespace = false;
  
  while (normalizedCount < normalizedPos && actualPos < text.length) {
    const isWhitespace = /\s/.test(text[actualPos]);
    
    if (isWhitespace) {
      if (!inWhitespace) {
        normalizedCount++;
        inWhitespace = true;
      }
      actualPos++;
    } else {
      normalizedCount++;
      inWhitespace = false;
      actualPos++;
    }
  }
  
  return actualPos;
}

function highlightRange(textPositions, startPos, endPos, oldest, index) {
  // Find all text nodes that overlap with this range
  const affectedNodes = textPositions.filter(tp => 
    tp.start < endPos && tp.end > startPos
  );
  
  affectedNodes.forEach(tp => {
    const nodeStartInRange = Math.max(0, startPos - tp.start);
    const nodeEndInRange = Math.min(tp.text.length, endPos - tp.start);
    
    if (nodeStartInRange >= nodeEndInRange) return;
    
    const beforeText = tp.text.substring(0, nodeStartInRange);
    const highlightText = tp.text.substring(nodeStartInRange, nodeEndInRange);
    const afterText = tp.text.substring(nodeEndInRange);
    
    // Create highlight span
    const highlight = document.createElement('span');
    highlight.className = 'factcheck-highlight';
    highlight.setAttribute('data-factcheck-id', index);
    highlight.setAttribute('data-title', oldest.title || '');
    highlight.setAttribute('data-url', oldest.url || '');
    highlight.textContent = highlightText;
    
    // Replace the text node
    const parent = tp.node.parentNode;
    const fragment = document.createDocumentFragment();
    
    if (beforeText) {
      fragment.appendChild(document.createTextNode(beforeText));
    }
    fragment.appendChild(highlight);
    if (afterText) {
      fragment.appendChild(document.createTextNode(afterText));
    }
    
    parent.replaceChild(fragment, tp.node);
  });
}

function removeHighlights() {
  // Remove tooltip if exists
  const tooltip = document.getElementById('factcheck-tooltip');
  if (tooltip) {
    tooltip.remove();
  }

  // Remove all highlights
  const highlights = document.querySelectorAll('.factcheck-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize(); // Merge adjacent text nodes
  });
}

// Handle hover events for showing tooltip
document.addEventListener('mouseover', (e) => {
  if (e.target.classList.contains('factcheck-highlight')) {
    showTooltip(e.target, e);
  }
});

document.addEventListener('mouseout', (e) => {
  if (e.target.classList.contains('factcheck-highlight')) {
    hideTooltip();
  }
});

function showTooltip(element, event) {
  // Remove existing tooltip
  hideTooltip();
  
  const title = element.getAttribute('data-title');
  const url = element.getAttribute('data-url');
  
  if (!title && !url) return;
  
  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'factcheck-tooltip';
  tooltip.className = 'factcheck-tooltip';
  
  if (title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'factcheck-tooltip-title';
    titleEl.textContent = title;
    tooltip.appendChild(titleEl);
  }
  
  if (url) {
    const urlEl = document.createElement('a');
    urlEl.className = 'factcheck-tooltip-url';
    urlEl.href = url;
    urlEl.target = '_blank';
    urlEl.textContent = url;
    tooltip.appendChild(urlEl);
  }
  
  document.body.appendChild(tooltip);
  
  // Position tooltip
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX;
  
  // Adjust if tooltip goes off screen
  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - 10;
  }
  
  if (top + tooltipRect.height > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - tooltipRect.height - 5;
  }
  
  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';
}

function hideTooltip() {
  const tooltip = document.getElementById('factcheck-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}