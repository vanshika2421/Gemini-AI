const typingForm = document.querySelector(".typing-form"); 
const chatList = document.querySelector(".chat-list");
const toggleThemeButton = document.querySelector("#toggle-theme-button");

let userMessage = null;

// API CONFIGURATION
const API_KEY = "AIzaSyBsEci-RZBfvxHrqZIhQgA6NRHEu5eP4eI";
const  API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //apply the stored theme
    document.body.classList.toggle("light_mode" , isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats|| "";
    chatList.scrollTo(0,chatList.scrollHeight); 
}

loadLocalStorageData(); 

// create a new message element and return it.
const createMessageElement =(content, ...classes) =>{
    const div = document.createElement("div"); 
    div.classList.add("message", ...classes); // div ki class list mai add krdooo message with className
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    const words = text.split(' ');
    let currentWordindex = 0;

    const typingInterval = setInterval(() => {
        textElement.innerText += (currentWordindex === 0 ? '' : ' ') + words[currentWordindex++]; 
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        // if all the words are displayed
        if(currentWordindex === words.length) {
            clearInterval(typingInterval);
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats", chatList.innerHTML);
            chatList.scrollTo(0,chatList.scrollHeight); // scroll to button
        }
    },75);
}

// Fetch response from the API based on user message
const generateAPIResponse = async(incomingMessageDiv) => {

    const textElement = incomingMessageDiv.querySelector(".text");
    
    try {
        const response = await fetch(API_URL, {
            method : "POST" ,
            headers : { "Content-Type" : "application/json"},
            body : JSON.stringify({
                contents : [{
                    role:"user",
                    parts : [{ text : userMessage}]
                }]
            })
        });
        const data = await response.json();

        // console.log(data);
        //GET an api response and remove asterstics from it.
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
        // textElement.innerText = apiResponse;
    } catch (error) {
        console.log(error);
    }
    finally {
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

        const incomingMessageDiv = createMessageElement(html,"incoming", "loading");
       
        chatList.appendChild(incomingMessageDiv);
        chatList.scrollTo(0,chatList.scrollHeight);

        generateAPIResponse(incomingMessageDiv);
}

// copy message text to clipboard
const copyMessage = (copyIcon) =>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;

    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => copyIcon.innerText = "content_copy", 1000);
} 

const handleOutgoingChat = () =>{
    userMessage = typingForm.querySelector(".typing-input").value.trim();
    if(!userMessage) return;  // exit if there is no message

    // console.log(userMessage);
    const html = `<div
    class="message-content">
                <img src="user.jpg" alt="User Image" class="avatar">
                <p class="text"></p> 
            </div>`;

        const outgoingMessageDiv = createMessageElement(html, "outgoing");
        outgoingMessageDiv.querySelector(".text").innerText = userMessage;
        chatList.appendChild(outgoingMessageDiv);

        typingForm.reset();
        chatList.scrollTo(0,chatList.scrollHeight);
        setTimeout(showLoadingAnimation,500); //show loading animation after a delay
    }
// toggle between light and dark themes
toggleThemeButton.addEventListener("click" , () => {
   const isLightMode = document.body.classList.toggle("light_mode");
   localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode")
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode"
});


//Prevent default form submission and handle outgoingchat
typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat(); // 1
})