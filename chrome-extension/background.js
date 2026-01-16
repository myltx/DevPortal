// Open side panel on clicking the action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.action.onClicked.addListener((tab) => {
  // Opens the side panel in the current window
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Close side panel when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Disable side panel to force close it
    await chrome.sidePanel.setOptions({ enabled: false });
    // Re-enable it immediately so it can be opened again
    await chrome.sidePanel.setOptions({ enabled: true });
  } catch (error) {
    console.error("Error toggling side panel:", error);
  }
});
