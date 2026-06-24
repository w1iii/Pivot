"use client"

import { useState } from 'react';

const FAQS = [
  {
    q: 'How do I add a stock to my watchlist?',
    a: 'Navigate to the Market page and use the search bar to find a symbol. Click "Add" to include it in your watchlist. You can also add symbols directly from the dashboard sidebar widget.',
  },
  {
    q: 'How do I remove a stock from my watchlist?',
    a: 'Hover over any stock in your watchlist and click the remove icon (circle with minus) that appears on the right side.',
  },
  {
    q: 'What data sources does Pivot use?',
    a: 'Pivot uses Alpha Vantage for real-time and historical stock data. AI analysis is powered by Groq\'s LLM for natural language insights.',
  },
  {
    q: 'How often is stock data updated?',
    a: 'Stock data is fetched on-demand and cached for one hour. You can manually refresh by navigating away and back to a stock detail page.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All connections use HTTPS. Authentication is handled via JWT tokens stored in httpOnly cookies. Passwords are hashed using bcrypt.',
  },
];

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 md:px-16 py-12">
      <div className="max-w-[1280px] w-full space-y-12">
        <section>
          <div className="mb-12">
            <h2 className="text-headline-xl font-headline-xl text-on-surface mb-2">Support</h2>
            <p className="text-body-lg text-body-lg text-on-surface-variant max-w-2xl opacity-80">
              Frequently asked questions and contact information.
            </p>
          </div>

          {/* FAQ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-surface-container border border-outline-variant rounded overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex justify-between items-center px-6 py-4 text-left text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {openIndex === i && (
                    <div className="px-6 pb-4">
                      <p className="text-body-md text-body-md text-on-surface-variant">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="bg-surface-container border border-outline-variant p-8 rounded">
              <h3 className="text-headline-md font-headline-md text-on-surface mb-6">Contact Us</h3>
              {submitted ? (
                <div className="p-4 bg-primary/10 border border-primary/20 rounded">
                  <p className="text-body-md text-primary">Thank you for your message. We&apos;ll respond within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant rounded px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant rounded px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm uppercase tracking-widest text-on-surface-variant mb-2">Message</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full bg-surface border border-outline-variant rounded px-4 py-3 text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all resize-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-on-primary text-label-md uppercase tracking-widest hover:brightness-110 transition-all rounded"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
