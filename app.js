import inquirer from "inquirer";
import chalkAnimation from "chalk-animation";
import axios from "axios";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();
const apiKey = process.env.OPENAI_API_KEY;
const gmailPass = process.env.gmailPass;

// String to keep track of chatbot responses
let emailSummaryString = ``;

const resolveAnimations = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));


async function startChat() {
    //welcome msg
    const welcomeMsg = chalkAnimation.rainbow(`Welcome to your Capital One MiniMester Assistant! \n`);
    
    await resolveAnimations();
    //stop the animation
    welcomeMsg.stop();
    await getQuestion()
}


// Get Question from user function
async function getQuestion() {
    const getQuestionFromCLI = await inquirer.prompt({
        name: 'questionOutput',
        type: 'input',
        message: 'Whenever ready, ask a question! Enter (q)uit to stop asking questions',
    });

    let question = getQuestionFromCLI.questionOutput;

    if (question === 'q' || question === 'quit') {
        await getEmail();
    } else {
        await GPTResponse(question);
    }
}

// Get answer from OpenAI API
async function GPTResponse(q) {
    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };
    const data = {
        model: "gpt-4o-mini-2024-07-18", // Mini model for lower computation cost and quicker results
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: q },
        ],
    };

    try {
        const response = await axios.post(url, data, { headers });
        const result = response.data.choices[0].message.content;
        console.log(result);
        emailSummaryString += q + `:\n` + result + `\n\n`; // Add question and answer to email summary
        await getQuestion();
    } catch (error) {
        console.error("Error calling ChatGPT API:", error.response ? error.response.data : error.message);
    }
}

// Get the email of the user
async function getEmail() {
    const getEmailFromCLI = await inquirer.prompt({
        name: 'emailOutput',
        type: 'input',
        message: `Enter your email to get a summary of this chat. Enter (q)uit if you don't want this.`,
    });

    let email = getEmailFromCLI.emailOutput;

    if (email === 'q' || email === 'quit') {
        process.exit();
    } else {
        await emailSummary(email);
    }
}

// Provide email summary to user
async function emailSummary(email) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'adviks15@gmail.com',
            pass: gmailPass,
        },
    });

    let mailOptions = {
        from: 'adviks15@gmail.com',
        to: email,
        subject: "Summary of chat with Minimester Assistant",
        text: emailSummaryString,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent!');
        }
    });
}

// Start the chat
await startChat();



