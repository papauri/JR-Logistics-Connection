import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { SiteSettings } from '../types';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

export default function PublicContact() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SiteSettings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await addDoc(collection(db, 'contact_messages'), {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        subject: formData.get('subject'),
        message: formData.get('message'),
        status: 'New',
        createdAt: Date.now()
      });
      
      toast.success('Message sent successfully! We will get back to you soon.');
      form.reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again or use direct contact methods.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-dark" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header section */}
      <div className="bg-editorial-dark text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-sans font-bold mb-4 tracking-tight">Contact Us</h1>
          <p className="text-zinc-300 max-w-2xl mx-auto font-sans text-lg leading-relaxed">
            Have questions about our shipping services? Get in touch with our team for personalized logistics solutions.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-sans font-bold text-zinc-900 mb-6">Get In Touch</h2>
              <p className="text-zinc-600 mb-8 leading-relaxed">
                Whether you need a custom quote, have a question about an existing shipment, or want to learn more about our services, we're here to help. Our logistics experts aim to respond to all inquiries within 24 hours.
              </p>
            </div>

            <div className="space-y-6">
              {settings?.address && (
                <div className="flex items-start gap-4 p-5 bg-white border border-zinc-200 shadow-sm">
                  <div className="w-10 h-10 bg-editorial-bg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-editorial-dark" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 mb-1">Office Location</h3>
                    <p className="text-zinc-600 text-sm whitespace-pre-line">{settings.address}</p>
                  </div>
                </div>
              )}

              {settings?.email && (
                <div className="flex items-start gap-4 p-5 bg-white border border-zinc-200 shadow-sm">
                  <div className="w-10 h-10 bg-editorial-bg flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-editorial-dark" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 mb-1">Email Us</h3>
                    <a href={`mailto:${settings.email}`} className="text-editorial-accent hover:underline font-medium">
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}

              {settings?.phone && (
                <div className="flex items-start gap-4 p-5 bg-white border border-zinc-200 shadow-sm">
                  <div className="w-10 h-10 bg-editorial-bg flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-editorial-dark" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 mb-1">Call Us</h3>
                    <a href={`tel:${settings.phone}`} className="text-zinc-600 text-sm font-medium hover:text-editorial-accent transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white border border-editorial-dark p-8 shadow-md">
            <h3 className="text-xl font-sans font-bold text-zinc-900 mb-6">Send a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Your Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Phone Number (Optional)</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Subject</label>
                  <select
                    name="subject"
                    required
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                  >
                    <option value="">Select a topic...</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Quote Request">Custom Quote Request</option>
                    <option value="Shipment Support">Shipment Support</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                  placeholder="How can we help you today?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-editorial-dark text-white py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
