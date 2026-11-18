/* Bingemind chat assistant: a small, free, rule-based website chat widget.
   Install with ONE line before </body> on bingemind.com/services/ :
   <script src="/js/bm-widget.js" defer></script>
   It answers only from what the Services page already says, never invents prices,
   timelines or client names, and hands the visitor to WhatsApp or email to book
   the free audit. Nothing is stored or sent anywhere by this script. */
(function () {
  if (window.__bmChat) return; window.__bmChat = true;
  var C = Object.assign({
    name: "Bingemind",
    whatsapp: "916376068337",
    phone: "+916376068337",
    phoneShow: "+91 63760 68337",
    email: "hello@bingemind.com",
    toolsUrl: "/tools/",
    servicesList: ["AI voice agents", "AI receptionist", "Chat and WhatsApp assistants", "Workflow automation", "Document and data automation", "Private AI knowledge assistant", "Websites and landing pages"]
  }, window.BMCHAT_CONFIG || {});

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ink = "var(--ink,#121722)", surf = "var(--surface,#fff)", surf2 = "var(--surface-2,#eef0f4)", line = "var(--line,#dde1e8)",
      acc = "var(--accent,#f2b705)", onacc = "var(--on-accent,#121722)", navy = "var(--navy,#121826)", navyInk = "var(--navy-ink,#eef1f6)", muted = "var(--muted,#4a5262)";
  var css = "\
.bm-b{position:fixed;right:16px;bottom:16px;z-index:9990;width:56px;height:56px;border-radius:50%;background:" + navy + ";color:" + navyInk + ";border:2px solid " + acc + ";cursor:pointer;box-shadow:0 12px 30px -8px rgba(18,23,34,.5);display:grid;place-items:center;transition:transform .25s}\
.bm-b:hover{transform:scale(1.07)}.bm-b:focus-visible{outline:3px solid " + acc + ";outline-offset:3px}.bm-b svg{width:26px;height:26px}\
.bm-b i{position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:" + acc + ";border:2px solid " + surf + ";" + (reduce ? "" : "animation:bmp 2.2s infinite") + "}\
@keyframes bmp{0%{box-shadow:0 0 0 0 rgba(242,183,5,.55)}100%{box-shadow:0 0 0 12px rgba(242,183,5,0)}}\
.bm-p{position:fixed;right:16px;bottom:84px;z-index:9990;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 110px));background:" + surf + ";color:" + ink + ";border:1px solid " + line + ";border-radius:18px;box-shadow:0 30px 70px -20px rgba(18,23,34,.5);display:flex;flex-direction:column;overflow:hidden;font:15px/1.5 var(--body,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif);opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transition:opacity .25s,transform .3s,visibility 0s .3s}\
.bm-p.o{opacity:1;visibility:visible;transform:none;transition:opacity .25s,transform .3s}\
.bm-h{background:" + navy + ";color:" + navyInk + ";padding:14px 16px;display:flex;align-items:center;gap:10px}\
.bm-h b{display:block;font-size:15px}.bm-h small{opacity:.75;font-size:12px}\
.bm-h .x{margin-left:auto;background:rgba(255,255,255,.12);border:0;color:inherit;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:15px}\
.bm-m{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:" + surf + "}\
.bm-r{max-width:88%;padding:10px 13px;border-radius:14px;white-space:pre-line;word-wrap:break-word;" + (reduce ? "" : "animation:bmin .25s both") + "}\
@keyframes bmin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\
.bm-r.bot{background:" + surf2 + ";border-bottom-left-radius:4px;align-self:flex-start}\
.bm-r.me{background:" + acc + ";color:" + onacc + ";border-bottom-right-radius:4px;align-self:flex-end}\
.bm-c{display:flex;flex-wrap:wrap;gap:7px;align-self:flex-start}\
.bm-c button,.bm-a{border:1.5px solid " + line + ";background:" + surf + ";color:" + ink + ";border-radius:999px;padding:6px 12px;font:600 13px var(--body,system-ui,sans-serif);cursor:pointer;text-decoration:none;transition:background .2s,border-color .2s}\
.bm-c button:hover,.bm-a:hover{border-color:" + acc + ";background:" + surf2 + "}\
.bm-a.go{background:" + acc + ";border-color:" + acc + ";color:" + onacc + ";align-self:flex-start;display:inline-block}\
.bm-f{display:flex;gap:8px;padding:10px;border-top:1px solid " + line + ";background:" + surf + "}\
.bm-f input{flex:1;border:1.5px solid " + line + ";border-radius:999px;padding:9px 14px;font:15px var(--body,system-ui,sans-serif);background:" + surf2 + ";color:" + ink + ";min-width:0}\
.bm-f input:focus{outline:0;border-color:" + acc + "}\
.bm-f button{border:0;background:" + navy + ";color:" + navyInk + ";border-radius:999px;padding:0 16px;font:700 14px var(--body,system-ui,sans-serif);cursor:pointer}\
.bm-t{font-size:11px;color:" + muted + ";text-align:center;padding:0 10px 8px;background:" + surf + "}\
@media (min-width:1024px){.bm-b{right:20px;bottom:90px}.bm-p{right:20px;bottom:158px;height:min(560px,calc(100vh - 180px))}}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var btn = document.createElement("button");
  btn.className = "bm-b"; btn.type = "button"; btn.setAttribute("aria-label", "Chat with " + C.name); btn.setAttribute("aria-expanded", "false");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.7A8 8 0 1 1 21 12z"/></svg><i></i>';
  var panel = document.createElement("div");
  panel.className = "bm-p"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", C.name + " chat assistant");
  panel.innerHTML = '<div class="bm-h"><div><b>' + esc(C.name) + ' assistant</b><small>Ask about our services or book a free audit</small></div><button class="x" type="button" aria-label="Close chat">✕</button></div><div class="bm-m" aria-live="polite"></div><form class="bm-f"><input aria-label="Type your question" placeholder="Ask a question…" autocomplete="off" maxlength="300"><button type="submit">Send</button></form><div class="bm-t">Automated assistant. Answers come from this page. Nothing is stored.</div>';
  document.body.appendChild(panel); document.body.appendChild(btn);

  var box = panel.querySelector(".bm-m"), form = panel.querySelector("form"), input = form.querySelector("input");
  var flow = null, lead = {}, started = false;

  function scroll() { box.scrollTop = box.scrollHeight; }
  function say(text, who) { var d = document.createElement("div"); d.className = "bm-r " + (who || "bot"); d.textContent = text; box.appendChild(d); scroll(); }
  function chips(list) {
    var w = document.createElement("div"); w.className = "bm-c";
    list.forEach(function (t) { var b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = function () { w.remove(); handle(t); }; w.appendChild(b); });
    box.appendChild(w); scroll();
  }
  function link(text, href, go) { var a = document.createElement("a"); a.className = "bm-a" + (go ? " go" : ""); a.textContent = text; a.href = href; if (/^http/.test(href)) { a.target = "_blank"; a.rel = "noopener"; } box.appendChild(a); scroll(); }
  var MAIN = ["Book a free audit", "What you build", "How it works", "Who it's for", "Talk to the team"];

  function open(v) {
    panel.classList.toggle("o", v); btn.setAttribute("aria-expanded", v);
    if (v) { if (!started) { started = true; say("Hi! I'm the " + C.name + " assistant. We set up AI voice agents, receptionists and automation for clinics, estate agents, online shops and busy teams. How can I help?"); chips(MAIN); } setTimeout(function () { input.focus(); }, 250); }
    else btn.focus();
  }
  btn.onclick = function () { open(!panel.classList.contains("o")); };
  panel.querySelector(".x").onclick = function () { open(false); };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("o")) open(false); });

  function wa(text) { return "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(text); }
  function mail(sub, body) { return "mailto:" + C.email + "?subject=" + encodeURIComponent(sub) + (body ? "&body=" + encodeURIComponent(body) : ""); }
  function contact() {
    say("You can reach the founders on WhatsApp, by email or by phone: " + C.phoneShow + " or " + C.email + ". We set call times that suit your time zone.");
    link("Open WhatsApp", wa("Hi Bingemind, I have a question."), true); link("Email us", mail("Question for Bingemind")); link("Call " + C.phoneShow, "tel:" + C.phone);
  }
  function more() { chips(["Book a free audit", "How it works", "Talk to the team"]); }

  var intents = [
    { k: ["demo", "show me", "example"], f: function () { say("Yes. Ask on WhatsApp and we will show you a working demo that fits your use case."); link("Ask for a demo", wa("Hi Bingemind, I'd like to see a demo."), true); chips(["Book a free audit"]); } },
    { k: ["book", "audit", "start", "get started", "begin", "consultation", "appointment", "schedule", "sign up"], f: function () { startLead(); } },
    { k: ["voice", "phone agent", "phone call", "calls", "missed call", "after hours", "outbound", "inbound"], f: function () { say("AI voice agents take and make phone calls. They answer questions, book appointments and call leads back, day or night. Use cases: inbound calls, outbound calls, bookings and follow-ups."); more(); } },
    { k: ["receptionist", "front desk", "reception"], f: function () { say("The AI receptionist answers calls, web chat and WhatsApp 24/7. It books appointments and hands off to a person when needed."); more(); } },
    { k: ["whatsapp assistant", "whatsapp bot", "whatsapp business", "chatbot", "chat bot", "chat assistant", "web chat", "support assistant", "sales assistant"], f: function () { say("Chat and WhatsApp assistants reply in seconds, qualify leads and answer from your own information. They are used for sales and support."); more(); } },
    { k: ["knowledge", "private ai", "my documents", "ask questions about", "internal", "sources"], f: function () { say("A private AI knowledge assistant lets you ask questions about your own documents and get answers with sources. It can run on your own servers, so your data stays with you. It supports access control."); more(); } },
    { k: ["document", "pdf", "form", "extract", "data entry", "spreadsheet", "sheet"], f: function () { say("Document and data automation reads PDFs, forms and emails, pulls out the data and puts it into your sheets or CRM, with checks along the way."); more(); } },
    { k: ["workflow", "n8n", "crm", "invoice", "integrat", "connect my", "zapier", "lead follow"], f: function () { say("Workflow automation connects your CRM, email, invoices and lead follow-up so work moves on its own. We build it with n8n or custom code."); more(); } },
    { k: ["website", "landing page", "web design", "web page"], f: function () { say("We also build fast, simple websites and landing pages that connect to your automations."); more(); } },
    { k: ["service", "what do you", "what you build", "what can you", "offer", "build", "automat"], f: function () { say("What we build:\n• " + C.servicesList.join("\n• ") + "\n\nEach system is set up for your business, connected to the tools you already use, and handed over working."); chips(["Book a free audit", "How it works", "Who it's for"]); } },
    { k: ["price", "pricing", "cost", "fee", "charge", "rate", "budget", "how much", "kitna", "paisa", "rupee", "quote"], f: function () { say("The free audit call is free. After it you get a written plan with what to build, which tools, the timeline and the cost, and you decide if you want to go ahead. I can't give a number here without knowing what you need."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["how long", "timeline", "duration", "weeks", "how fast", "turnaround", "deadline"], f: function () { say("It depends on the size of the system. You get a clear timeline in the written plan before we start."); chips(["Book a free audit", "How it works"]); } },
    { k: ["how it work", "how does it work", "how do you work", "process", "steps", "stages", "what happens"], f: function () { say("Four steps:\n1. Free audit call: a short call about how work flows today and where AI can save time.\n2. Plan: a written plan with what to build, which tools, the timeline and the cost.\n3. Build and launch: we set up the tools, build the custom parts, test with real cases and go live.\n4. Support: we watch it, fix issues and improve it as your business changes."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["privacy", "private", "secure", "security", "safe", "gdpr", "confidential", "llama", "on my server", "own server", "data stay", "my data"], f: function () { say("We give each system only the access it needs. For sensitive work we can run open-source models such as Llama on your own servers or private cloud, so your data stays under your control. You own the code, the setup and the data."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["free tool", "calculator", "browser tool", "tools page"], f: function () { say("We made and keep running our own free browser tools. They are fast, private and work without sign-up."); link("See our free tools", C.toolsUrl, true); } },
    { k: ["open source or custom", "custom or"], f: function () { say("Usually both. Open source covers the common parts such as speech, models and workflow engines. Custom code covers your rules, your systems and the edge cases. The audit shows you the split."); more(); } },
    { k: ["tool", "stack", "tech", "open source", "open-source", "ollama", "whisper", "langchain", "mistral", "which model", "what model", "gpt", "openai"], f: function () { say("We pick tools per project. Common choices are n8n for workflows, Whisper for speech to text, open-source or hosted language models, and LangChain or LlamaIndex for search over your documents. We connect to the tools you already use, such as your CRM, email and WhatsApp Business."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["who is it for", "who it", "who do you", "clinic", "dentist", "dental", "doctor", "hospital", "salon", "estate", "broker", "agent for", "shop", "ecommerce", "e-commerce", "d2c", "operations", "industr", "business type", "my business"], f: function () { say("We work with businesses where calls, messages and paperwork take up the team's day:\n• Clinics and dental practices\n• Estate agents, letting agents and brokers\n• D2C and ecommerce brands\n• Operations teams"); chips(["Book a free audit", "What you build"]); } },
    { k: ["outside india", "abroad", "worldwide", "countries", "country", "time zone", "timezone", "international", "global", "usa", "america", "europe", "uk", "dubai", "remote"], f: function () { say("Yes. We work with clients worldwide, remotely. We set call times that suit your time zone, and most of the work happens over email, WhatsApp and shared documents."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["founder", "team", "who are you", "who runs", "abhishek", "prashant", "about you", "company"], f: function () { say("Two founders, one technical and one business: Abhishek Mishra (technical co-founder) and Prashant Jindal (business co-founder). You talk to the founders, not a sales team."); chips(["Book a free audit", "Talk to the team"]); } },
    { k: ["talk", "speak", "human", "contact", "phone number", "your number", "email", "mail", "reach", "call you", "call back", "whatsapp", "message you"], f: contact },
    { k: ["thank", "thanks", "shukriya", "dhanyavad"], f: function () { say("You're welcome! Anything else I can help with?"); chips(MAIN); } },
    { k: ["hello", "hi\\b", "hey\\b", "namaste", "hii\\b", "good morning", "good evening"], f: function () { say("Hello! How can I help you today?"); chips(MAIN); } }
  ];

  var TYPES = ["Clinic or dental practice", "Estate agent, letting agent or broker", "D2C or ecommerce brand", "Operations team", "Something else"];
  function startLead() { flow = "name"; lead = {}; say("Happy to set up your free automation audit. What is your name?"); }
  function summary() { return "Hi Bingemind, I'd like a free automation audit.\nName: " + lead.name + "\nType of business: " + lead.type + "\nWhat takes my team's time: " + lead.need; }
  function leadStep(t) {
    if (flow === "name") { lead.name = t.slice(0, 60); flow = "type"; say("Thanks, " + lead.name + ". What type of business is it?"); chips(TYPES); return; }
    if (flow === "type") { lead.type = t.slice(0, 80); flow = "need"; say("What takes your team's time? For example: missed calls, booking appointments, copying data from emails."); return; }
    if (flow === "need") {
      lead.need = t.slice(0, 400); flow = null;
      say("Thank you! Here is your request:\n" + summary() + "\n\nChoose how to send it. Nothing is sent until you press send in WhatsApp or your email app.");
      link("Send on WhatsApp", wa(summary()), true); link("Send by email", mail("Free automation audit", summary()));
    }
  }

  function handle(text) {
    text = text.trim(); if (!text) return;
    say(text, "me");
    if (flow) { leadStep(text); return; }
    for (var i = 0; i < intents.length; i++) {
      for (var j = 0; j < intents[i].k.length; j++) { if (new RegExp("\\b" + intents[i].k[j], "i").test(text)) { intents[i].f(); return; } }
    }
    say("I'm not sure about that one, and I don't want to guess. The founders can answer it directly.");
    chips(["Talk to the team", "Book a free audit", "What you build"]);
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; handle(v); });
})();
