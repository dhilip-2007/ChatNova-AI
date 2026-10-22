
/* =========================================================
   ChatNova AI - AI Response Engine
   File: ai.js
   ========================================================= */

"use strict";

const ChatNovaAI = (() => {

    // ---------------- CONFIGURATION ----------------

    const config = {
        appName: "ChatNova AI",
        maxContextMessages: 12,
        requestTimeout: 30000,
        maxInputLength: 4000,
        demoMode: true,
        apiEndpoint: "http://localhost:5000/api/chat"
    };

    let activeRequest = null;

    // ---------------- MAIN RESPONSE FUNCTION ----------------

    async function generateResponse(message, conversation = []) {
        const text = String(message || "").trim();

        if (!text) {
            throw new Error("Please enter a message.");
        }

        if (text.length > config.maxInputLength) {
            throw new Error("Your message is too long.");
        }

        const context = Array.isArray(conversation)
            ? conversation.slice(-config.maxContextMessages)
            : [];

        if (config.demoMode) {
            return generateDemoResponse(text, context);
        }

        return requestBackend(text, context);
    }

    // ---------------- DEMO RESPONSE ENGINE ----------------

    async function generateDemoResponse(message, conversation) {
        const text = message.toLowerCase().trim();

        await wait(600);

        if (/\b(hi|hello|hey|vanakkam)\b/.test(text)) {
            return "Hello! 👋 Welcome to ChatNova AI. How can I help you today?";
        }

        if (/\b(who are you|your name|introduce yourself)\b/.test(text)) {
            return "I'm ChatNova AI, a chatbot application built to demonstrate a modern chat experience. I'm currently running in demo mode, so I use predefined responses rather than a real AI model.";
        }

        if (/\b(time management|study plan|study schedule)\b/.test(text)) {
            return "Here's a simple study plan:\n\n1. Set one clear goal for each session.\n2. Study for 25 minutes.\n3. Take a 5-minute break.\n4. Practise what you learned.\n5. Review your mistakes at the end.\n\nConsistency is more important than studying for long hours without breaks.";
        }

        if (/\b(javascript|js)\b/.test(text)) {
            return "JavaScript is a programming language used to make websites interactive.\n\nExample:\n\n```javascript\nfunction greet(name) {\n    return `Hello, ${name}!`;\n}\n\nconsole.log(greet('Student'));\n```\n\nThis function accepts a name and returns a greeting.";
        }

        if (/\b(html|css|frontend)\b/.test(text)) {
            return "Frontend development is the part of a website users see and interact with.\n\n- HTML creates the page structure.\n- CSS controls colours, spacing, and layout.\n- JavaScript handles interactions and application logic.\n\nTogether, these technologies can build a complete chatbot interface.";
        }

        if (/\b(python|programming|coding)\b/.test(text)) {
            return "A beginner-friendly programming roadmap:\n\n1. Variables and data types\n2. Operators and conditions\n3. Loops\n4. Functions\n5. Arrays and objects\n6. Small projects\n7. Problem-solving practice\n\nWrite and run small programs daily to build confidence.";
        }

        if (/\b(artificial intelligence|machine learning| ai )\b/.test(` ${text} `)) {
            return "Artificial Intelligence (AI) is the field of building computer systems that perform tasks associated with human intelligence.\n\nMachine learning is a part of AI that learns patterns from data. Large language models are trained on large collections of data and can generate text based on the input they receive.\n\nThis demo chatbot does not run a trained AI model yet.";
        }

        if (/\b(project ideas|project suggestions)\b/.test(text)) {
            return "Here are six project ideas:\n\n1. AI chatbot\n2. Text summarizer\n3. Speech-to-text converter\n4. Sentiment analysis dashboard\n5. Student task planner\n6. Question-answering system\n\nStart with a frontend version and add a backend when you're ready.";
        }

        if (/\b(thank you|thanks)\b/.test(text)) {
            return "You're welcome! 😊 I'm happy to help. What would you like to explore next?";
        }

        if (/\b(bye|goodbye|see you)\b/.test(text)) {
            return "Goodbye! 👋 Thanks for chatting with ChatNova AI. Come back whenever you want to continue.";
        }

        if (text.endsWith("?")) {
            return "That's an interesting question!\n\nI'm currently running in demo mode, so I can't reliably answer every question. Connect ChatNova AI to a real AI model through your backend to receive intelligent, context-aware answers.";
        }

        if (conversation.length > 0) {
            return "I can see that this conversation has previous messages, but demo mode does not truly understand conversation context.\n\nYou said: " + message + "\n\nConnect a language model through the backend to enable genuine contextual conversations.";
        }

        return "Thanks for your message! 💬\n\nYou said: " + message + "\n\nI'm currently using sample responses. To make ChatNova AI answer a wider range of questions, connect it to a real AI model through a secure backend.";
    }

    // ---------------- BACKEND CONNECTION ----------------

    async function requestBackend(message, conversation) {
        const controller = new AbortController();
        activeRequest = controller;

        const timeoutId = setTimeout(
            () => controller.abort(),
            config.requestTimeout
        );

        try {
            const response = await fetch(config.apiEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message,
                    conversation
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(
                    `The AI server returned an error (${response.status}).`
                );
            }

            const data = await response.json();

            if (typeof data.reply !== "string" || !data.reply.trim()) {
                throw new Error("The AI server returned an invalid response.");
            }

            return data.reply;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("The request timed out or was cancelled.");
            }

            throw new Error(
                error.message || "Unable to connect to the AI server."
            );
        } finally {
            clearTimeout(timeoutId);
            activeRequest = null;
        }
    }

    // ---------------- CANCEL REQUEST ----------------

    function cancelRequest() {
        if (activeRequest) {
            activeRequest.abort();
            activeRequest = null;
        }
    }

    // ---------------- HELPERS ----------------

    function wait(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    function setDemoMode(enabled) {
        config.demoMode = Boolean(enabled);
    }

    function getStatus() {
        return {
            appName: config.appName,
            mode: config.demoMode ? "demo" : "backend",
            endpoint: config.demoMode ? null : config.apiEndpoint,
            maxContextMessages: config.maxContextMessages
        };
    }

    // ---------------- PUBLIC API ----------------

    return Object.freeze({
        generateResponse,
        cancelRequest,
        setDemoMode,
        getStatus
    });

})();

// Make the engine available to script.js.
if (typeof window !== "undefined") {
    window.ChatNovaAI = ChatNovaAI;
}

