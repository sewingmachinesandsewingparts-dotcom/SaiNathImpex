"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/src/components/site-shell";
import { toast } from "sonner";
import {
  MessageCircle,
  Send,
  Phone,
  MapPin,
  Image as ImageIcon,
  Wrench,
  Globe,
  HelpCircle,
} from "lucide-react";
import axios from "axios";

const presets = [
  { id: "machine", label: "Machine", Icon: Wrench, disabled: true },
  { id: "machine_part", label: "Machine part", Icon: Wrench },
  { id: "website", label: "Website", Icon: Globe },
  { id: "other", label: "Other", Icon: HelpCircle },
];

export default function Support() {
  const [subject, setSubject] = useState("machine_part");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageGroups, setImageGroups] = useState([[]]);
  const [chatMessages, setChatMessages] = useState([
    {
      from: "agent",
      name: "Priya · Support",
      text: "Hi! Tell me which part or model you need help with.",
    },
    { from: "me", name: "You", text: "Hi, I'm looking for the upper knife for MO-6716S." },
    {
      from: "agent",
      name: "Priya · Support",
      text: "That's SKU-JUKI-MO6716-KNF — ₹1,180, 24 in stock. Want me to add it to your cart?",
    },
    { from: "me", name: "You", text: "Yes please, 2 units." },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !description) {
      toast.error("Please fill in contact number and describe the issue.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("user", "Guest Workshop");
    formData.append("phone", phone);
    formData.append("location", location || "India");
    formData.append("description", description || "no description");
    imageGroups.flat().forEach((file) => {
      if (file instanceof File) {
        formData.append("images", file);
      }
    });
    console.log('[support] submitting files:', imageGroups.flat().map(f => f && f.name));

    try {
      await axios.post("/api/issues", formData);

      const userMsg = {
        from: "me",
        name: "You",
        text: `[Ticket Submitted] Subject: ${subject}. Details: ${description}`,
      };
      const agentReply = {
        from: "agent",
        name: "Priya · Support",
        text: "Ticket received! An agent is reviewing your request and will connect here in a few moments.",
      };
      setChatMessages((prev) => [...prev, userMsg, agentReply]);
      setPhone("");
      setLocation("");
      setDescription("");
      setImageGroups([[]]);
      toast.success("Support ticket created! Live chat initiated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit support ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (event, index) => {
    const files = Array.from(event.target.files || []);
    setImageGroups((prev) => {
      const next = [...prev];
      next[index] = files;
      return next;
    });
  };

  const addImageGroup = () => {
    setImageGroups((prev) => [...prev, []]);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = { from: "me", name: "You", text: newMessage };
    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage("");

    // Simulate agent reply
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "agent",
          name: "Priya · Support",
          text: "Got it, looking into this for you. Give me a minute.",
        },
      ]);
    }, 1000);
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="font-mono text-[11px] tracking-[0.15em] uppercase text-muted-foreground mb-3">
          <Link href="/" className="hover:text-copper">
            Home
          </Link>{" "}
          / Support
        </nav>
        <h1 className="font-display text-6xl">Live tech support</h1>
        <p className="text-muted-foreground mt-2">Open a ticket — average first reply 2 minutes.</p>

        <div className="mt-10 grid lg:grid-cols-12 gap-6">
          <form onSubmit={handleSubmit} className="lg:col-span-7 hairline bg-card p-6 space-y-5">
            <div>
              <div className="font-mono text-[11px] tracking-widest uppercase text-muted-foreground mb-2">
                Subject
              </div>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => !p.disabled && setSubject(p.id)}
                    disabled={p.disabled}
                    className={`hairline p-3 flex flex-col items-center gap-1.5 transition-colors ${
                      p.disabled
                        ? "cursor-not-allowed opacity-50"
                        : subject === p.id
                        ? "bg-ink text-bone border-ink"
                        : "cursor-pointer hover:bg-secondary"
                    }`}
                  >
                    <p.Icon className="h-4 w-4" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Contact number
                </span>
                <div className="mt-1 hairline bg-background flex items-center focus-within:border-copper">
                  <Phone className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
                  <input
                    placeholder="+91 98xxxxxxxx"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Location
                </span>
                <div className="mt-1 hairline bg-background flex items-center focus-within:border-copper">
                  <MapPin className="h-4 w-4 ml-3 text-muted-foreground shrink-0" />
                  <input
                    placeholder="Ludhiana, Punjab"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Describe the issue
              </span>
              <div className="mt-1 hairline bg-background flex items-start focus-within:border-copper">
                <textarea
                  rows={4}
                  required
                  placeholder="What went wrong? Include SKU if applicable."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none resize-none"
                />
              </div>
            </label>

            <div className="space-y-3">
              {imageGroups.map((group, index) => (
                <label key={index} className="hairline border-dashed bg-secondary/30 p-4 flex flex-col gap-3 cursor-pointer hover:border-ink block rounded-3xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-[11px] uppercase tracking-widest">
                      {group.length > 0 ? `Image ${index + 1}` : `Upload image ${index + 1}`}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {group.length > 0 ? `${group.length} file${group.length > 1 ? "s" : ""}` : "No file"}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {group.length > 0 ? group.map((file) => file.name).join(", ") : "Click to select one or more images."}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => handleImageChange(e, index)}
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={addImageGroup}
                className="inline-flex items-center justify-center rounded-3xl border border-border bg-card px-4 py-3 text-sm uppercase tracking-[0.18em] text-muted-foreground hover:bg-secondary"
              >
                Add more images
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-ink text-bone hover:bg-copper transition-colors font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />{" "}
              {isSubmitting ? "Submitting..." : "Send & start live chat"}
            </button>
          </form>

          <aside className="lg:col-span-5">
            <div className="hairline bg-card flex flex-col h-[500px]">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-copper" />
                <div className="font-mono text-[11px] uppercase tracking-widest">
                  Live chat preview
                </div>
                <span className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-[10px] text-muted-foreground">Online</span>
              </div>
              <div className="flex-1 p-5 space-y-3 overflow-auto bg-secondary/30">
                {chatMessages.map((msg, index) => (
                  <Msg key={index} from={msg.from} name={msg.name} text={msg.text} />
                ))}
              </div>
              <form
                onSubmit={handleSendChat}
                className="border-t border-border p-3 flex items-center gap-2"
              >
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Type a message…"
                />
                <button
                  type="submit"
                  className="h-9 w-9 grid place-items-center bg-ink text-bone hover:bg-copper cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function Msg({ from, name, text }) {
  return (
    <div className={`flex flex-col ${from === "me" ? "items-end" : "items-start"}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {name}
      </div>
      <div
        className={`max-w-[80%] px-3 py-2 text-sm ${from === "me" ? "bg-ink text-bone" : "bg-card hairline"}`}
      >
        {text}
      </div>
    </div>
  );
}
