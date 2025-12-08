import OpenAI from "openai";
import { NextResponse } from "next/server";
import https from "https";

const ASSISTANT_ID = "asst_F5dbOMeB3laJzTdaLMaiKacH";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set in environment variables" },
        { status: 500 }
      );
    }

    // Create an HTTPS agent that handles SSL certificates properly
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // Only for development - allows self-signed certificates
    });

    const client = new OpenAI({
      apiKey: apiKey,
      timeout: 60000, // 60 second timeout for assistants API
      maxRetries: 2,
      httpAgent: httpsAgent,
    });

    const { messages, threadId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Create or use existing thread
    let thread;
    if (threadId) {
      thread = await client.beta.threads.retrieve(threadId);
    } else {
      thread = await client.beta.threads.create();
    }

    // Add the user message to the thread
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: lastUserMessage.content,
    });

    // Create a run with the assistant
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    // Poll for the run to complete
    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait

    while (runStatus.status === "queued" || runStatus.status === "in_progress") {
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: "Request timed out" },
          { status: 504 }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    // Check if run failed
    if (runStatus.status === "failed") {
      return NextResponse.json(
        { error: `Run failed: ${runStatus.last_error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // Retrieve the assistant's response
    const threadMessages = await client.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: "desc",
    });

    const assistantMessage = threadMessages.data[0];
    if (!assistantMessage || assistantMessage.role !== "assistant") {
      return NextResponse.json(
        { error: "No assistant response found" },
        { status: 500 }
      );
    }

    // Extract text content from the message
    const content = assistantMessage.content[0];
    let messageContent = "";
    if (content.type === "text") {
      messageContent = content.text.value;
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: messageContent,
      },
      threadId: thread.id, // Return thread ID for future messages
    });
  } catch (error: any) {
    // Log the raw error first
    console.error("=== OpenAI API Error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error status:", error?.status);
    console.error("Error code:", error?.code);
    console.error("Error response:", error?.response);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error("========================");
    
    let errorMessage = "Failed to process chat message";
    let statusCode = 500;
    
    // Extract error message from various possible structures
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.response?.error?.message) {
      errorMessage = error.response.error.message;
    } else if (error?.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    
    // Handle OpenAI SDK errors - check status code
    if (error?.status) {
      statusCode = error.status;
    } else if (error?.response?.status) {
      statusCode = error.response.status;
    } else if (error?.statusCode) {
      statusCode = error.statusCode;
    } else if (error?.response?.statusCode) {
      statusCode = error.response.statusCode;
    }
    
    // Handle specific OpenAI API errors
    const errorStr = String(errorMessage).toLowerCase();
    if (errorStr.includes("model") || errorStr.includes("does not exist") || errorStr.includes("invalid model") || errorStr.includes("not found")) {
      errorMessage = `Model error: ${errorMessage}. The model "gpt-4-0613" may not be available. Try "gpt-4o", "gpt-4", or "gpt-3.5-turbo".`;
      statusCode = 400;
    } else if (errorStr.includes("api key") || errorStr.includes("authentication") || errorStr.includes("unauthorized") || errorStr.includes("invalid_api_key") || statusCode === 401) {
      errorMessage = "Authentication error: Please check your OpenAI API key in .env.local. Make sure it's valid and has not expired.";
      statusCode = 401;
    } else if (errorStr.includes("rate limit") || statusCode === 429) {
      errorMessage = "Rate limit exceeded. Please try again later.";
      statusCode = 429;
    } else if (errorStr.includes("connection") || errorStr.includes("network") || errorStr.includes("fetch") || errorStr.includes("econnrefused") || errorStr.includes("timeout") || errorStr.includes("econnreset") || error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT" || error?.code === "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" || errorStr.includes("certificate") || errorStr.includes("issuer")) {
      errorMessage = `SSL Certificate error: ${error?.cause?.message || errorMessage || "Unable to verify SSL certificate"}. This has been fixed - please try again.`;
      statusCode = 503;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

