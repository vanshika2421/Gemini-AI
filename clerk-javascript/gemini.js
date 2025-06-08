const typingForm = document.querySelector(".typing-form"); 
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector('#delete-chat-button');
const toneDropdown = document.querySelector("#tone");

let userMessage = null;

// API CONFIGURATION
const API_KEY = "AIzaSyBsEci-RZBfvxHrqZIhQgA6NRHEu5eP4eI";
const  API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    document.body.classList.toggle("light_mode", isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header", savedChats);
    chatList.scrollTo(0, chatList.scrollHeight); 
}

loadLocalStorageData(); 

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div"); 
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordindex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordindex === 0 ? '' : ' ') + words[currentWordindex++]; 
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currentWordindex === words.length) {
            clearInterval(typingInterval);
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
            chatList.scrollTo(0, chatList.scrollHeight); 
        }
    }, 75);
}

const getToneInstruction = () => {
    const tone = toneDropdown?.value || "default";
    switch (tone) {
        case "formal":
            return "Respond in a formal tone: ";
        case "friendly":
            return "Respond in a friendly and conversational tone: ";
        case "concise":
            return "Give a concise and to-the-point answer: ";
        case "humorous":
            return "Respond with a humorous and light-hearted tone: ";
        default:
            return "";
    }
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `${getToneInstruction()}${userMessage}` }]
                }]
            })
        });
        const data = await response.json();
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\\(.?)\\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        console.log(error);
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}

const showLoadingAnimation = () => {
    const html = `<div class="message-content">
                <img src="gemini.svg" alt="Gemini Image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div> 
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">
                content_copy
            </span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatList.appendChild(incomingMessageDiv);
    chatList.scrollTo(0, chatList.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyIcon) => {
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => copyIcon.innerText = "content_copy", 1000);
} 

const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim();
    if (!userMessage) return;

    const html = `<div class="message-content">
                    <img src="user.jpg" alt="User Image" class="avatar">
                    <p class="text"></p> 
                </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    const sentiment = new Sentiment();
    const result = sentiment.analyze(userMessage);
    let sentimentLabel = "Neutral";
    if (result.score > 0) sentimentLabel = "Positive";
    else if (result.score < 0) sentimentLabel = "Negative";

    const sentimentTag = document.createElement("div");
    sentimentTag.innerText = `Sentiment: ${sentimentLabel} (Score: ${result.score})`;
    sentimentTag.style.fontSize = "12px";
    sentimentTag.style.marginTop = "2px";
    sentimentTag.style.color = result.score > 0 ? "green" : result.score < 0 ? "red" : "gray";
    outgoingMessageDiv.appendChild(sentimentTag);

    typingForm.reset();
    chatList.scrollTo(0, chatList.scrollHeight);
    document.body.classList.add("hide-header");
    setTimeout(showLoadingAnimation, 500);
}

toggleThemeButton.addEventListener("click", () => {
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode"
});

deleteChatButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all messages?")) {
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
});

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
