
/* =========================================================
   ChatNova AI - Application Configuration
   File: config.js
   ========================================================= */

"use strict";

const ChatNovaConfig = Object.freeze({

    // Application information
    app: {
        name: "ChatNova AI",
        version: "1.0.0",
        description: "Your intelligent AI chat companion",
        author: "ChatNova Team",
        tagline: "Ask anything. Explore everything."
    },

    // Chat settings
    chat: {
        maxMessageLength: 4000,
        maxHistory: 50,
        defaultTitle: "New Chat",
        userName: "You",
        assistantName: "ChatNova AI",
        welcomeMessage: "Hello! 👋 Welcome to ChatNova AI.",
        placeholder: "Message ChatNova AI...",
        enterToSend: true,
        enableShiftEnter: true
    },

    // Demo response settings
    response: {
        typingDelay: 700,
        typingSpeed: 18,
        showTypingIndicator: true,
        enableDemoResponses: true,
        demoMode: true
    },

    // Appearance settings
    appearance: {
        defaultTheme: "dark",
        enableThemeSwitch: true,
        enableAnimations: true,
        sidebarBreakpoint: 768,
        messageAnimation: true,
        roundedCorners: true
    },

    // File upload settings
    uploads: {
        enabled: true,
        maxFileSizeMB: 10,
        maxFiles: 1,
        allowedExtensions: [
            ".txt",
            ".pdf",
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".doc",
            ".docx"
        ]
    },

    // Local storage keys
    storage: {
        historyKey: "chatnova_history",
        themeKey: "chatnova_theme",
        settingsKey: "chatnova_settings"
    },

    // Feature toggles
    features: {
        chatHistory: true,
        newChat: true,
        clearChat: true,
        copyMessage: true,
        regenerateResponse: true,
        fileAttachments: true,
        darkMode: true,
        lightMode: true,
        mobileSidebar: true,
        keyboardShortcuts: true,
        exportChat: false,
        voiceInput: false,
        imageGeneration: false
    },

    // Keyboard shortcuts
    shortcuts: {
        newChat: {
            key: "k",
            ctrl: true,
            description: "Start a new chat"
        },
        closeSidebar: {
            key: "Escape",
            description: "Close the sidebar"
        },
        sendMessage: {
            key: "Enter",
            description: "Send a message"
        }
    },

    // Notification settings
    notifications: {
        enabled: true,
        duration: 3000,
        success: true,
        error: true,
        warning: true,
        info: true
    },

    // API configuration
    // Keep private API keys on your backend server.
    api: {
        enabled: false,
        baseURL: "http://localhost:5000/api",
        chatEndpoint: "/chat",
        timeout: 30000,
        useBackend: false
    },

    // Debug configuration
    debug: {
        enabled: true,
        logErrors: true,
        logInitialization: true
    }

});

// Freeze nested configuration objects too.
Object.values(ChatNovaConfig).forEach(section => {
    if (section && typeof section === "object") {
        Object.freeze(section);

        Object.values(section).forEach(value => {
            if (value && typeof value === "object") {
                Object.freeze(value);

                if (Array.isArray(value.allowedExtensions)) {
                    Object.freeze(value.allowedExtensions);
                }
            }
        });
    }
});

// Export configuration for use by script.js.
if (typeof window !== "undefined") {
    window.ChatNovaConfig = ChatNovaConfig;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ChatNovaConfig;
}
