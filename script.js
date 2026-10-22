
/* =========================================================
   ChatNova AI - Chat Application
   File: script.js
   ========================================================= */

"use strict";

// -------------------- CONFIGURATION --------------------

const CONFIG = {
    appName: "ChatNova AI",
    typingSpeed: 18,
    responseDelay: 700,
    maxHistory: 50,
    storageKey: "chatnova_history",
    themeKey: "chatnova_theme"
};

// -------------------- DOM ELEMENTS --------------------

const elements = {
    chatForm: document.querySelector("#chat-form"),
    chatInput: document.querySelector("#chat-input"),
    sendButton: document.querySelector("#send-btn"),
    messages: document.querySelector("#messages"),
    welcomeScreen: document.querySelector("#welcome-screen"),
    newChatButton: document.querySelector("#new-chat-btn"),
    clearChatButton: document.querySelector("#clear-chat-btn"),
    sidebar: document.querySelector("#sidebar"),
    menuButton: document.querySelector("#menu-btn"),
    themeButton: document.querySelector("#theme-btn"),
    historyList: document.querySelector("#history-list"),
    characterCount: document.querySelector("#character-count"),
    stopButton: document.querySelector("#stop-btn"),
    toastContainer: document.querySelector("#toast-container"),
    modelSelect: document.querySelector("#model-select"),
    promptCards: document.querySelectorAll(".prompt-card"),
    attachButton: document.querySelector("#attach-btn"),
    fileInput: document.querySelector("#file-input"),
    chatTitle: document.querySelector("#chat-title")
};

// -------------------- APPLICATION STATE --------------------

const state = {
    conversations: [],
    activeConversationId: null,
    isGenerating: false,
    shouldStop: false,
    selectedFile: null,
    messageCounter: 0,
    theme: "dark"
};

// -------------------- INITIALIZATION --------------------

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    loadTheme();
    loadConversations();
    createConversationIfNeeded();
    bindEvents();
    updateCharacterCount();
    autoResizeInput();
    renderHistory();

    console.log(`${CONFIG.appName} initialized successfully.`);
}

// -------------------- EVENT LISTENERS --------------------

function bindEvents() {
    if (elements.chatForm) {
        elements.chatForm.addEventListener("submit", handleSubmit);
    }

    if (elements.chatInput) {
        elements.chatInput.addEventListener("input", () => {
            updateCharacterCount();
            autoResizeInput();
        });

        elements.chatInput.addEventListener("keydown", handleInputKeydown);
    }

    if (elements.newChatButton) {
        elements.newChatButton.addEventListener("click", startNewChat);
    }

    if (elements.clearChatButton) {
        elements.clearChatButton.addEventListener("click", clearCurrentChat);
    }

    if (elements.menuButton) {
        elements.menuButton.addEventListener("click", toggleSidebar);
    }

    if (elements.themeButton) {
        elements.themeButton.addEventListener("click", toggleTheme);
    }

    if (elements.stopButton) {
        elements.stopButton.addEventListener("click", stopGeneration);
    }

    if (elements.promptCards) {
        elements.promptCards.forEach(card => {
            card.addEventListener("click", () => {
                const prompt =
                    card.dataset.prompt ||
                    card.querySelector("p, span, h3")?.textContent ||
                    "";

                if (prompt.trim()) {
                    sendMessage(prompt.trim());
                }
            });
        });
    }

    if (elements.attachButton && elements.fileInput) {
        elements.attachButton.addEventListener("click", () => {
            elements.fileInput.click();
        });

        elements.fileInput.addEventListener("change", handleFileSelection);
    }

    document.addEventListener("click", handleDocumentClick);
}

// -------------------- MESSAGE INPUT --------------------

function handleSubmit(event) {
    event.preventDefault();

    if (!elements.chatInput) return;

    const message = elements.chatInput.value.trim();

    if (!message && !state.selectedFile) {
        showToast("Please enter a message.", "warning");
        return;
    }

    sendMessage(message);
}

function handleInputKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        if (elements.chatForm) {
            elements.chatForm.requestSubmit();
        }
    }
}

function updateCharacterCount() {
    if (!elements.chatInput || !elements.characterCount) return;

    const count = elements.chatInput.value.length;
    elements.characterCount.textContent = `${count} / 4000`;

    if (count > 4000) {
        elements.characterCount.classList.add("limit-reached");
    } else {
        elements.characterCount.classList.remove("limit-reached");
    }
}

function autoResizeInput() {
    if (!elements.chatInput) return;

    elements.chatInput.style.height = "auto";
    elements.chatInput.style.height =
        Math.min(elements.chatInput.scrollHeight, 180) + "px";
}

// -------------------- SEND MESSAGE --------------------

async function sendMessage(text) {
    const messageText = String(text || "").trim();

    if (!messageText && !state.selectedFile) return;

    if (state.isGenerating) {
        showToast("Please wait for the current response.", "info");
        return;
    }

    const conversation = getActiveConversation();

    if (!conversation) return;

    const userMessage = {
        id: generateId(),
        role: "user",
        content: messageText,
        timestamp: Date.now(),
        fileName: state.selectedFile?.name || null
    };

    conversation.messages.push(userMessage);
    conversation.updatedAt = Date.now();

    if (!conversation.title || conversation.title === "New Chat") {
        conversation.title = createTitle(messageText || "Attached file");
    }

    if (elements.chatInput) {
        elements.chatInput.value = "";
        elements.chatInput.focus();
    }

    updateCharacterCount();
    autoResizeInput();

    renderMessages();
    renderHistory();
    saveConversations();

    const selectedFile = state.selectedFile;
    state.selectedFile = null;

    if (elements.fileInput) {
        elements.fileInput.value = "";
    }

    await generateAssistantResponse(conversation, messageText, selectedFile);
}

// -------------------- DEMO AI RESPONSE --------------------

async function generateAssistantResponse(conversation, userText, file) {
    state.isGenerating = true;
    state.shouldStop = false;
    updateControls();

    const typingElement = showTypingIndicator();

    try {
        await delay(CONFIG.responseDelay);

        if (state.shouldStop) return;

        const response = getDemoResponse(userText, file);

        if (typingElement) typingElement.remove();

        const assistantMessage = {
            id: generateId(),
            role: "assistant",
            content: response,
            timestamp: Date.now()
        };

        conversation.messages.push(assistantMessage);
        conversation.updatedAt = Date.now();

        saveConversations();
        renderMessages();
        renderHistory();
    } catch (error) {
        console.error("Response error:", error);
        showToast("Something went wrong. Please try again.", "error");
    } finally {
        if (typingElement) typingElement.remove();

        state.isGenerating = false;
        updateControls();
        scrollToBottom();
    }
}

/*
 * IMPORTANT:
 * This is a local demo response generator, not a real AI model.
 * Connect a secure backend API to get real AI-generated answers.
 */

function getDemoResponse(input, file) {
    const text = String(input || "").toLowerCase().trim();

    if (file && !text) {
        return `I've received the file "${file.name}". This frontend demo cannot read or analyze file contents yet. A backend with file-processing support is needed for that feature.`;
    }

    if (/\b(hi|hello|hey|vanakkam)\b/.test(text)) {
        return "Hello! 👋 Welcome to ChatNova AI. I'm your demo assistant. What would you like to explore today?";
    }

    if (/\b(your name|who are you)\b/.test(text)) {
        return "I'm ChatNova AI, a chatbot interface project. This version uses sample responses. You can connect it to an AI API through a backend to make it a real AI assistant.";
    }

    if (/\b(javascript|js)\b/.test(text)) {
        return [
            "JavaScript makes websites interactive.",
            "",
            "For example:",
            "",
            "```javascript",
            "function greet(name) {",
            '    return `Hello, ${name}!`;',
            "}",
            "",
            'console.log(greet("Student"));',
            "```",
            "",
            "You can use JavaScript to handle buttons, forms, messages, animations, and API requests."
        ].join("\n");
    }

    if (/\b(html|css|frontend|website)\b/.test(text)) {
        return "A website's frontend usually has three main parts:\n\n1. HTML — creates the structure.\n2. CSS — controls the design and layout.\n3. JavaScript — adds interactivity.\n\nChatNova AI uses these technologies to build its chatbot interface.";
    }

    if (/\b(python|programming|coding)\b/.test(text)) {
        return "A good way to learn programming is to start with variables, conditions, loops, functions, arrays, and small projects. Practise one concept at a time and test your code with simple examples.";
    }

    if (/\b(project|ideas)\b/.test(text)) {
        return "Here are some project ideas:\n\n- AI chatbot interface\n- Text summarizer\n- Speech-to-text application\n- Sentiment analysis dashboard\n- Personal study planner\n- Weather dashboard\n\nStart with a frontend prototype, then add a backend and database when you're ready.";
    }

    if (/\b(thank you|thanks)\b/.test(text)) {
        return "You're welcome! 😊 Feel free to ask another question.";
    }

    if (text.endsWith("?")) {
        return "That's a good question! This ChatNova demo currently returns sample answers rather than using a real AI model.\n\nTo get a proper answer to your question, the next step is connecting the frontend to a backend that calls an AI service securely.";
    }

    return "Thanks for your message! 💬\n\nI'm currently running in demo mode, so I don't have a real AI model connected yet. I can demonstrate the chat interface, but my responses are predefined.\n\nTo make ChatNova AI generate intelligent answers, connect it to an AI API through a backend server.";
}

// -------------------- RENDER MESSAGES --------------------

function renderMessages() {
    if (!elements.messages) return;

    const conversation = getActiveConversation();
    if (!conversation) return;

    elements.messages.replaceChildren();

    const hasMessages = conversation.messages.length > 0;

    if (elements.welcomeScreen) {
        elements.welcomeScreen.hidden = hasMessages;
    }

    conversation.messages.forEach(message => {
        const messageElement = createMessageElement(message);
        elements.messages.appendChild(messageElement);
    });

    scrollToBottom();
}

function createMessageElement(message) {
    const article = document.createElement("article");
    article.className = `message ${message.role}-message`;
    article.dataset.messageId = message.id;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = message.role === "user" ? "You" : "✦";
    avatar.setAttribute("aria-hidden", "true");

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "message-content";

    const header = document.createElement("div");
    header.className = "message-header";

    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = message.role === "user" ? "You" : "ChatNova AI";

    const time = document.createElement("time");
    time.className = "message-time";
    time.dateTime = new Date(message.timestamp).toISOString();
    time.textContent = formatTime(message.timestamp);

    header.append(author, time);

    const body = document.createElement("div");
    body.className = "message-text";

    // Use textContent for safe display of user-provided text.
    body.textContent = message.content || "";

    if (message.fileName) {
        const fileLabel = document.createElement("p");
        fileLabel.className = "message-file";
        fileLabel.textContent = `📎 ${message.fileName}`;
        body.prepend(fileLabel);
    }

    contentWrapper.append(header, body);

    const actions = createMessageActions(message);
    contentWrapper.appendChild(actions);

    article.append(avatar, contentWrapper);

    return article;
}

function createMessageActions(message) {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "message-action-btn";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", "Copy message");

    copyButton.addEventListener("click", async () => {
        try {
            await copyText(message.content || "");
            showToast("Message copied.", "success");
        } catch {
            showToast("Unable to copy message.", "error");
        }
    });

    actions.appendChild(copyButton);

    if (message.role === "assistant") {
        const retryButton = document.createElement("button");
        retryButton.type = "button";
        retryButton.className = "message-action-btn";
        retryButton.textContent = "Regenerate";

        retryButton.addEventListener("click", () => {
            regenerateResponse(message.id);
        });

        actions.appendChild(retryButton);
    }

    return actions;
}

// -------------------- REGENERATE RESPONSE --------------------

async function regenerateResponse(messageId) {
    if (state.isGenerating) return;

    const conversation = getActiveConversation();
    if (!conversation) return;

    const index = conversation.messages.findIndex(
        message => message.id === messageId
    );

    if (index < 0) return;

    const message = conversation.messages[index];

    if (message.role !== "assistant") return;

    const previousUserMessage = conversation.messages
        .slice(0, index)
        .reverse()
        .find(item => item.role === "user");

    if (!previousUserMessage) return;

    conversation.messages.splice(index);
    renderMessages();
    saveConversations();

    await generateAssistantResponse(
        conversation,
        previousUserMessage.content,
        null
    );
}

// -------------------- TYPING INDICATOR --------------------

function showTypingIndicator() {
    if (!elements.messages) return null;

    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.setAttribute("role", "status");
    indicator.setAttribute("aria-label", "ChatNova AI is typing");

    const label = document.createElement("span");
    label.textContent = "ChatNova AI is thinking";

    const dots = document.createElement("span");
    dots.className = "typing-dots";
    dots.textContent = "•••";

    indicator.append(label, dots);
    elements.messages.appendChild(indicator);

    scrollToBottom();

    return indicator;
}

// -------------------- CONVERSATION MANAGEMENT --------------------

function createConversationIfNeeded() {
    if (state.conversations.length === 0) {
        createConversation();
    } else {
        const mostRecent = [...state.conversations].sort(
            (a, b) => b.updatedAt - a.updatedAt
        )[0];

        state.activeConversationId = mostRecent.id;
    }

    renderMessages();
}

function createConversation() {
    const conversation = {
        id: generateId(),
        title: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
    };

    state.conversations.unshift(conversation);
    state.activeConversationId = conversation.id;

    saveConversations();
    renderHistory();
    renderMessages();

    if (elements.chatTitle) {
        elements.chatTitle.textContent = conversation.title;
    }

    return conversation;
}

function startNewChat() {
    state.shouldStop = true;
    state.isGenerating = false;

    createConversation();
    updateControls();

    if (elements.chatInput) {
        elements.chatInput.value = "";
        elements.chatInput.focus();
    }

    updateCharacterCount();
    autoResizeInput();

    if (window.innerWidth <= 768 && elements.sidebar) {
        elements.sidebar.classList.remove("sidebar-open");
    }
}

function clearCurrentChat() {
    const conversation = getActiveConversation();
    if (!conversation) return;

    const confirmed = window.confirm(
        "Delete all messages in this conversation?"
    );

    if (!confirmed) return;

    conversation.messages = [];
    conversation.title = "New Chat";
    conversation.updatedAt = Date.now();

    saveConversations();
    renderMessages();
    renderHistory();

    showToast("Conversation cleared.", "success");
}

function switchConversation(conversationId) {
    const conversation = state.conversations.find(
        item => item.id === conversationId
    );

    if (!conversation) return;

    state.shouldStop = true;
    state.isGenerating = false;
    state.activeConversationId = conversation.id;

    renderMessages();
    renderHistory();
    updateControls();

    if (elements.chatTitle) {
        elements.chatTitle.textContent = conversation.title;
    }

    if (window.innerWidth <= 768 && elements.sidebar) {
        elements.sidebar.classList.remove("sidebar-open");
    }
}

function getActiveConversation() {
    return state.conversations.find(
        conversation => conversation.id === state.activeConversationId
    ) || null;
}

// -------------------- CHAT HISTORY --------------------

function renderHistory() {
    if (!elements.historyList) return;

    elements.historyList.replaceChildren();

    const sorted = [...state.conversations].sort(
        (a, b) => b.updatedAt - a.updatedAt
    );

    sorted.slice(0, CONFIG.maxHistory).forEach(conversation => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";

        if (conversation.id === state.activeConversationId) {
            button.classList.add("active");
        }

        button.dataset.conversationId = conversation.id;

        const icon = document.createElement("span");
        icon.className = "history-icon";
        icon.textContent = "◷";

        const title = document.createElement("span");
        title.className = "history-title";
        title.textContent = conversation.title || "New Chat";

        button.append(icon, title);

        button.addEventListener("click", () => {
            switchConversation(conversation.id);
        });

        elements.historyList.appendChild(button);
    });
}

// -------------------- LOCAL STORAGE --------------------

function saveConversations() {
    try {
        localStorage.setItem(
            CONFIG.storageKey,
            JSON.stringify(state.conversations)
        );
    } catch (error) {
        console.error("Unable to save conversations:", error);
        showToast("Chat history could not be saved.", "warning");
    }
}

function loadConversations() {
    try {
        const stored = localStorage.getItem(CONFIG.storageKey);

        if (!stored) {
            state.conversations = [];
            return;
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            state.conversations = [];
            return;
        }

        state.conversations = parsed.filter(conversation =>
            conversation &&
            typeof conversation.id === "string" &&
            Array.isArray(conversation.messages)
        );
    } catch (error) {
        console.error("Unable to load conversations:", error);
        state.conversations = [];
    }
}

// -------------------- THEME MANAGEMENT --------------------

function loadTheme() {
    try {
        const savedTheme = localStorage.getItem(CONFIG.themeKey);

        if (savedTheme === "light" || savedTheme === "dark") {
            state.theme = savedTheme;
        }
    } catch (error) {
        console.warn("Theme preference could not be loaded.", error);
    }

    applyTheme();
}

function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";

    applyTheme();

    try {
        localStorage.setItem(CONFIG.themeKey, state.theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.", error);
    }
}

function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.body.dataset.theme = state.theme;

    if (elements.themeButton) {
        elements.themeButton.textContent =
            state.theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode";

        elements.themeButton.setAttribute(
            "aria-label",
            `Switch to ${state.theme === "dark" ? "light" : "dark"} mode`
        );
    }
}

// -------------------- SIDEBAR --------------------

function toggleSidebar() {
    if (!elements.sidebar) return;

    elements.sidebar.classList.toggle("sidebar-open");
}

function handleDocumentClick(event) {
    if (
        window.innerWidth <= 768 &&
        elements.sidebar &&
        elements.sidebar.classList.contains("sidebar-open") &&
        elements.menuButton &&
        !elements.sidebar.contains(event.target) &&
        !elements.menuButton.contains(event.target)
    ) {
        elements.sidebar.classList.remove("sidebar-open");
    }
}

// -------------------- FILE ATTACHMENTS --------------------

function handleFileSelection(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
        showToast("Please choose a file smaller than 10 MB.", "warning");
        event.target.value = "";
        return;
    }

    state.selectedFile = file;

    showToast(`Attached: ${file.name}`, "success");

    if (elements.chatInput && !elements.chatInput.value.trim()) {
        elements.chatInput.focus();
    }
}

// -------------------- STOP GENERATION --------------------

function stopGeneration() {
    state.shouldStop = true;
    state.isGenerating = false;

    updateControls();
    showToast("Response generation stopped.", "info");
}

function updateControls() {
    if (elements.sendButton) {
        elements.sendButton.disabled = state.isGenerating;
    }

    if (elements.stopButton) {
        elements.stopButton.hidden = !state.isGenerating;
    }

    if (elements.chatInput) {
        elements.chatInput.disabled = state.isGenerating;
    }
}

// -------------------- TOAST NOTIFICATIONS --------------------

function showToast(message, type = "info") {
    let container = elements.toastContainer;

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
        elements.toastContainer = container;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("toast-hide");

        window.setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// -------------------- UTILITIES --------------------

function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    state.messageCounter += 1;

    return `chatnova-${Date.now()}-${state.messageCounter}`;
}

function createTitle(text) {
    const cleanText = String(text || "New Chat")
        .replace(/\s+/g, " ")
        .trim();

    if (!cleanText) return "New Chat";

    return cleanText.length > 35
        ? cleanText.slice(0, 32) + "..."
        : cleanText;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function delay(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const successful = document.execCommand("copy");
    textarea.remove();

    if (!successful) {
        throw new Error("Copy operation failed.");
    }
}

function scrollToBottom() {
    if (!elements.messages) return;

    elements.messages.scrollTop = elements.messages.scrollHeight;
}

// -------------------- KEYBOARD SHORTCUTS --------------------

document.addEventListener("keydown", event => {
    const isMac = navigator.platform.toLowerCase().includes("mac");
    const modifier = isMac ? event.metaKey : event.ctrlKey;

    if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startNewChat();
    }

    if (event.key === "Escape" && elements.sidebar) {
        elements.sidebar.classList.remove("sidebar-open");
    }
});

// -------------------- DEBUGGING --------------------

window.ChatNova = {
    newChat: startNewChat,
    clearChat: clearCurrentChat,
    toggleTheme,
    getConversations: () => state.conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        messageCount: conversation.messages.length
    }))
};

