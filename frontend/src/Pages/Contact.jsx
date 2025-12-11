import React, { useState } from 'react';

function Contact() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const instagramUrl = 'https://instagram.com/linkivo_ai';
  const linkedinUrl = 'https://www.linkedin.com/company/linkivo-ai';
  const supportEmail = 'linkivo.ai@gmail.com';

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(`[${category}] ${subject || 'Contact from ' + fullName}`)}&body=${encodeURIComponent(`Name: ${fullName}\nEmail: ${email}\nCategory: ${category}\n\n${message}`)}`;
    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Get in Touch</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Have questions about Linkivo AI? We're here to help.</p>
          <div className="mt-3 inline-flex items-center text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">Average response time: 2 hours</div>
        </div>

        <h2 className="text-center text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">How to Reach Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center">
            <div className="text-2xl mb-2">📧</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">Email Support</div>
            <a href={`mailto:${supportEmail}`} className="text-sm text-purple-600 dark:text-purple-400 break-all">{supportEmail}</a>
            <div className="text-xs text-gray-500 mt-1">Response within 2 hours</div>
          </div>
          <a href={instagramUrl} target="_blank" rel="noreferrer" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center hover:shadow-md transition">
            <div className="text-2xl mb-2">📷</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">Instagram</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">@linkivo_ai</div>
            <div className="text-xs text-gray-500 mt-1">DMs open</div>
          </a>
          <a href={linkedinUrl} target="_blank" rel="noreferrer" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center hover:shadow-md transition">
            <div className="text-2xl mb-2">💼</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">LinkedIn</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Linkivo AI</div>
            <div className="text-xs text-gray-500 mt-1">Follow for updates</div>
          </a>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center">
            <div className="text-2xl mb-2">🕘</div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">Business Hours</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Mon - Fri, 9:00 AM - 6:00 PM</div>
            <div className="text-xs text-gray-500 mt-1">Weekend support via email</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 text-center">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Send us a Message</h3>
            <p className="text-xs text-gray-500 mt-1">We aim to respond within 2 hours during business hours.</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">First Name *</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={firstName} onChange={(e)=>setFirstName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300">Last Name *</label>
                <input className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={lastName} onChange={(e)=>setLastName(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Email Address *</label>
              <input type="email" className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Category</label>
              <select className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={category} onChange={(e)=>setCategory(e.target.value)}>
                <option>General</option>
                <option>Technical Support</option>
                <option>Partnership</option>
                <option>Billing</option>
                <option>Feedback</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Subject</label>
              <input className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300">Message *</label>
              <textarea className="mt-1 w-full min-h-[140px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2.5" value={message} onChange={(e)=>setMessage(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              Typically responds within 2 hours during business hours
            </div>
            <div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg">Send Message</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;


