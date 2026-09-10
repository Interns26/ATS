// /**
//  * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
//  */

// import { useState } from "react";

// type Message = {
//   id: number;
//   role: "user" | "assistant";
//   content: string;
// };

// function AIAssistant() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [message, setMessage] = useState("");

//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: 1,
//       role: "assistant",
//       content: "Hello! I'm your AI Assistant. How can I help you?",
//     },
//   ]);

//   function handleSend() {
//     const trimmedMessage = message.trim();

//     if (!trimmedMessage) {
//       return;
//     }

//     const userMessage: Message = {
//       id: Date.now(),
//       role: "user",
//       content: trimmedMessage,
//     };

//     setMessages((previousMessages) => [
//       ...previousMessages,
//       userMessage,
//     ]);

//     setMessage("");

//     // Temporary response.
//     // Mistral/FastAPI will be connected in Step 3.
//     setTimeout(() => {
//       setMessages((previousMessages) => [
//         ...previousMessages,
//         {
//           id: Date.now() + 1,
//           role: "assistant",
//           content:
//             "I'm currently being connected to the ATS AI service. I'll be able to answer your recruitment questions soon.",
//         },
//       ]);
//     }, 500);
//   }

//   function handleKeyDown(
//     event: React.KeyboardEvent<HTMLInputElement>
//   ) {
//     if (event.key === "Enter") {
//       handleSend();
//     }
//   }

//   return (
//     <>
//       {/* Floating AI button */}
//       {!isOpen && (
//         <button
//           type="button"
//           onClick={() => setIsOpen(true)}
//           className="fixed bottom-6 right-6 z-50 flex h-18 w-18 items-center justify-center rounded-full app-btn text-3xl transition hover:scale-105"
//           aria-label="Open AI Assistant"
//           title="AI Assistant"
//         >
//           {/* 🤖 */}   
//           💬
//         </button>
//       )}

//       {/* AI Assistant chat window */}
//       {isOpen && (
//         <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl">
//           {/* Header */}
//           <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--panel)] px-4 py-3">
//             <div className="flex items-center gap-3">
//               <div className="flex h-10 w-10 items-center justify-center rounded-full app-btn text-lg">
//                 {/* 🤖 */}  
//                 💬 
//               </div>

//               <div>
//                 <h2 className="text-sm font-bold">
//                   AI Assistant
//                 </h2>

//                 <p className="text-xs muted">
//                   ATS Recruitment Assistant
//                 </p>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={() => setIsOpen(false)}
//               className="rounded-lg px-2 py-1 text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
//               aria-label="Close AI Assistant"
//             >
//               ×
//             </button>
//           </div>

//           {/* Messages */}
//           <div className="flex-1 space-y-4 overflow-y-auto p-4">
//             {messages.map((item) => (
//               <div
//                 key={item.id}
//                 className={`flex ${
//                   item.role === "user"
//                     ? "justify-end"
//                     : "justify-start"
//                 }`}
//               >
//                 <div
//                   className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
//                     item.role === "user"
//                       ? "app-btn rounded-br-md"
//                       : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-bl-md"
//                   }`}
//                 >
//                   {item.content}
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Input */}
//           <div className="border-t border-[var(--card-border)] bg-[var(--panel)] p-3">
//             <div className="flex items-center gap-2">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(event) => setMessage(event.target.value)}
//                 onKeyDown={handleKeyDown}
//                 placeholder="Ask something..."
//                 className="app-input min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm"
//               />

//               <button
//                 type="button"
//                 onClick={handleSend}
//                 disabled={!message.trim()}
//                 className="app-btn rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
//               >
//                 ➤
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default AIAssistant;

/**
 * Copyright (c) UWorx Services 2026. All Rights Reserved. The information contained herein is proprietary and confidential. This proprietary and confidential information, either in whole or in part, shall not be used for any purpose unless permitted by the terms of a valid license agreement.
 */

import { useState } from "react";
import { askAI } from "../../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your AI Assistant. How can I help you?",
    },
  ]);

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: trimmedMessage,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setMessage("");
    setIsLoading(true);

    try {
      const response = await askAI(trimmedMessage);

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response,
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          error instanceof Error
            ? error.message
            : "Sorry, I could not get a response from the AI Assistant.",
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Floating AI button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full app-btn text-2xl transition hover:scale-105"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          💬
        </button>
      )}

      {/* AI Assistant window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--card-border)] bg-[var(--panel)] px-4 py-3">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full app-btn text-lg">
                💬
              </div>

              <div>
                <h2 className="text-sm font-bold">
                  AI Assistant
                </h2>

                <p className="text-xs muted">
                  ATS Recruitment Assistant
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-2 py-1 text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close AI Assistant"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">

            {messages.map((item) => (
              <div
                key={item.id}
                className={`flex ${
                  item.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "app-btn rounded-br-md"
                      : "rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >

                  {/* User message */}
                  {item.role === "user" ? (
                    <div className="whitespace-pre-wrap">
                      {item.content}
                    </div>
                  ) : (

                    /* Assistant message with Markdown support */
                    <div className="ai-message-content">

                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{

                          /* Headings */
                          h1: ({ children }) => (
                            <h1 className="mb-2 text-base font-bold">
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2 className="mb-2 text-sm font-bold">
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3 className="mb-2 text-sm font-bold">
                              {children}
                            </h3>
                          ),

                          /* Paragraph */
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">
                              {children}
                            </p>
                          ),

                          /* Unordered list */
                          ul: ({ children }) => (
                            <ul className="mb-2 list-disc space-y-1 pl-5">
                              {children}
                            </ul>
                          ),

                          /* Ordered list */
                          ol: ({ children }) => (
                            <ol className="mb-2 list-decimal space-y-1 pl-5">
                              {children}
                            </ol>
                          ),

                          /* List item */
                          li: ({ children }) => (
                            <li className="pl-1">
                              {children}
                            </li>
                          ),

                          /* Bold */
                          strong: ({ children }) => (
                            <strong className="font-semibold">
                              {children}
                            </strong>
                          ),

                          /* Italic */
                          em: ({ children }) => (
                            <em className="italic">
                              {children}
                            </em>
                          ),

                          /* Links */
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              {children}
                            </a>
                          ),

                          /* Code */
                          code: ({ children }) => (
                            <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700">
                              {children}
                            </code>
                          ),

                          /* Blockquote */
                          blockquote: ({ children }) => (
                            <blockquote className="my-2 border-l-4 border-slate-300 pl-3 italic dark:border-slate-600">
                              {children}
                            </blockquote>
                          ),

                          /* Table wrapper */
                          table: ({ children }) => (
                            <div className="my-3 w-full overflow-x-auto">
                              <table className="w-full border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          ),

                          /* Table header */
                          thead: ({ children }) => (
                            <thead>
                              {children}
                            </thead>
                          ),

                          /* Table row */
                          tr: ({ children }) => (
                            <tr>
                              {children}
                            </tr>
                          ),

                          /* Table heading */
                          th: ({ children }) => (
                            <th className="border border-slate-300 bg-slate-200 px-2 py-2 text-left font-semibold dark:border-slate-600 dark:bg-slate-700">
                              {children}
                            </th>
                          ),

                          /* Table cell */
                          td: ({ children }) => (
                            <td className="border border-slate-300 px-2 py-2 align-top dark:border-slate-600">
                              {children}
                            </td>
                          ),

                          /* Horizontal line */
                          hr: () => (
                            <hr className="my-3 border-slate-300 dark:border-slate-600" />
                          ),
                        }}
                      >
                        {item.content}
                      </ReactMarkdown>

                    </div>
                  )}

                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Thinking...
                </div>
              </div>
            )}

          </div>

          {/* Input */}
          <div className="border-t border-[var(--card-border)] bg-[var(--panel)] p-3">

            <div className="flex items-center gap-2">

              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask something..."
                disabled={isLoading}
                className="app-input min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="app-btn rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "..." : "➤"}
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default AIAssistant;