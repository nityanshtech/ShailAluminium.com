import { askShail } from "./api-config.js";

const $ = selector => document.querySelector(selector);
const openButton = $("#aiChatOpen");
const backdrop = $("#aiChatBackdrop");
const closeButton = $("#aiChatClose");
const form = $("#aiChatForm");
const input = $("#aiChatInput");
const sendButton = $("#aiChatSend");
const messagesElement = $("#aiChatMessages");
const status = $("#aiChatStatus");
const conversation = [];

if (!openButton || !backdrop || !closeButton || !form || !input || !sendButton || !messagesElement || !status) {
    console.error("The SHAIL AI chat could not start because its page elements are missing.");
} else {
    const closeChat = () => {
        backdrop.classList.remove("active");
        backdrop.setAttribute("aria-hidden", "true");
        openButton.focus();
    };

    const addMessage = (role, text) => {
        const message = document.createElement("article");
        message.className = `ai-chat-message ${role}`;

        const label = document.createElement("span");
        label.className = "ai-chat-message-label";
        label.textContent = role === "user" ? "You" : "SHAIL AI";

        const content = document.createElement("p");
        content.textContent = text;

        message.append(label, content);
        messagesElement.appendChild(message);
        messagesElement.scrollTop = messagesElement.scrollHeight;
    };

    openButton.addEventListener("click", () => {
        backdrop.classList.add("active");
        backdrop.setAttribute("aria-hidden", "false");
        input.focus();
    });

    closeButton.addEventListener("click", closeChat);
    backdrop.addEventListener("click", event => {
        if (event.target === backdrop) closeChat();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && backdrop.classList.contains("active")) {
            closeChat();
        }
    });

    form.addEventListener("submit", async event => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question || sendButton.disabled) return;

        const nextConversation = [...conversation.slice(-8), { role: "user", text: question }];
        addMessage("user", question);
        input.value = "";
        sendButton.disabled = true;
        input.disabled = true;
        status.textContent = "SHAIL AI is thinking...";

        try {
            const result = await askShail(nextConversation);
            if (typeof result.answer !== "string" || !result.answer.trim()) {
                throw new Error("SHAIL AI returned an empty answer. Please try again.");
            }
            addMessage("model", result.answer);
            conversation.splice(0, conversation.length, ...nextConversation, {
                role: "model",
                text: result.answer
            });
        } catch (error) {
            console.error("Unable to get a response from SHAIL AI.", error);
            addMessage("model", error.message || "I couldn't connect just now. Please try again or contact SHAIL on WhatsApp.");
        } finally {
            sendButton.disabled = false;
            input.disabled = false;
            status.textContent = "";
            input.focus();
        }
    });
}
